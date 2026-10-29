import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { localOrdersCache, parseOrderDispatchInfo } from '@/lib/ordersCache';
import { byId } from '@/lib/products';
import { STAFF_EMAILS } from '@/lib/adminAuthServer';
import { OrderRecord, OrderTrackingInfo, TrackingMilestone, OrderItemRecord } from '@/types';

export const dynamic = 'force-dynamic';

function normalizePhone(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').replace(/^234/, '0');
}

function maskAddress(address: string, state: string, landmark?: string): string {
  if (!address) return state;
  const parts = address.split(',');
  const firstPart = parts[0]?.trim() || address;
  const maskedStreet = firstPart.length > 12 ? `${firstPart.slice(0, 12)}...` : firstPart;
  return `${maskedStreet}, ${state}${landmark ? ` (Near ${landmark})` : ''}`;
}

async function resolveSessionUser(request: Request) {
  if (!isSupabaseConfigured()) return null;

  try {
    // 1. Try server cookie session
    const serverClient = createServerClient();
    const {
      data: { user: cookieUser },
    } = await serverClient.auth.getUser();

    if (cookieUser) return cookieUser;

    // 2. Try Authorization Bearer token header
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const adminClient = createAdminClient();
      const {
        data: { user: tokenUser },
        error,
      } = await adminClient.auth.getUser(token);

      if (!error && tokenUser) return tokenUser;
    }
  } catch (err) {
    console.warn('Error resolving session in track route:', err);
  }

  return null;
}

function isStaffUser(user: any): boolean {
  if (!user || !user.email) return false;
  const role = user.app_metadata?.role || user.user_metadata?.role;
  if (role && ['super_admin', 'store_manager', 'dispatcher'].includes(role)) {
    return true;
  }
  const email = user.email.toLowerCase().trim();
  return STAFF_EMAILS.includes(email);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = (searchParams.get('id') || searchParams.get('orderId') || '').trim();
    const queryEmail = (searchParams.get('email') || '').trim().toLowerCase();
    const queryPhone = normalizePhone(searchParams.get('phone'));

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Please provide an Order ID (e.g. MC-XXXXXX).' },
        { status: 400 }
      );
    }

    let order: OrderRecord | null = null;

    // 1. Fetch from Supabase
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient(true);
        const { data: dbOrder, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .maybeSingle();

        if (!error && dbOrder) {
          const items: OrderItemRecord[] = (dbOrder.order_items || []).map((it: any) => {
            const prod = it.product_id ? byId(Number(it.product_id)) : null;
            return {
              name: it.name || prod?.name || 'Item',
              price: Number(it.price || prod?.price || 0),
              qty: Number(it.qty || 1),
              art: it.art || prod?.art || 'tote',
              color: it.color || prod?.colors?.[0] || 'violet',
              opt: it.opt || '',
              productId: it.product_id ? Number(it.product_id) : undefined,
              image: it.image || prod?.images?.[0] || undefined,
            };
          });

          const dispatchInfo = parseOrderDispatchInfo(dbOrder.note);

          order = {
            id: dbOrder.id,
            userId: dbOrder.user_id || undefined,
            name: dbOrder.name,
            phone: dbOrder.phone,
            email: dbOrder.email,
            address: dbOrder.address,
            state: dbOrder.state,
            landmark: dbOrder.landmark || undefined,
            deliveryLabel: dbOrder.delivery_label || 'Standard Delivery',
            eta: dbOrder.eta || '1 to 2 working days',
            payLabel: dbOrder.pay_label || 'Payment',
            paymentMethod: dbOrder.payment_method || 'transfer',
            paymentStatus: dbOrder.payment_status || 'pending',
            orderStatus: dbOrder.order_status || 'received',
            fee: Number(dbOrder.fee || 0),
            subtotal: Number(dbOrder.subtotal || 0),
            discount: Number(dbOrder.discount || 0),
            total: Number(dbOrder.total || 0),
            items,
            lines: items.map((it) => `- ${it.qty} x ${it.name} (${it.opt})`),
            wa: '',
            createdAt: dbOrder.created_at,
            note: dbOrder.note || undefined,
            carrier: dbOrder.carrier || dispatchInfo.carrier,
            trackingNumber: dbOrder.tracking_number || dispatchInfo.trackingNumber,
            riderName: dbOrder.rider_name || dispatchInfo.riderName,
            riderPhone: dbOrder.rider_phone || dispatchInfo.riderPhone,
            dispatchNote: dbOrder.dispatch_note || dispatchInfo.dispatchNote,
          };
        }
      } catch (err) {
        console.warn('Supabase fetch error in track route:', err);
      }
    }

    // 2. Fallback to localOrdersCache
    if (!order && localOrdersCache[orderId]) {
      order = localOrdersCache[orderId];
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: `Order #${orderId} was not found. Please double-check the Order ID and try again.`,
        },
        { status: 404 }
      );
    }

    // 3. Multi-Auth Authorization Check
    const sessionUser = await resolveSessionUser(request);
    let isAuthorized = false;
    let isFullAccess = false;

    if (sessionUser) {
      // Check if session user is order owner or staff
      if (order.userId && order.userId === sessionUser.id) {
        isAuthorized = true;
        isFullAccess = true;
      } else if (
        sessionUser.email &&
        sessionUser.email.toLowerCase().trim() === order.email.toLowerCase().trim()
      ) {
        isAuthorized = true;
        isFullAccess = true;
      } else if (isStaffUser(sessionUser)) {
        isAuthorized = true;
        isFullAccess = true;
      }
    }

    // Guest verification via email or phone
    if (!isAuthorized) {
      const emailMatches =
        queryEmail &&
        order.email &&
        queryEmail === order.email.toLowerCase().trim();

      const phoneMatches =
        queryPhone &&
        order.phone &&
        queryPhone === normalizePhone(order.phone);

      if (emailMatches || phoneMatches) {
        isAuthorized = true;
        isFullAccess = false; // Guest mode with masked sensitive data
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Security Verification Required: Please enter the email address or phone number used during checkout to view tracking details.',
          requiresVerification: true,
          orderId: order.id,
        },
        { status: 403 }
      );
    }

    // 4. Build Milestone Timeline
    const status = order.orderStatus || 'received';
    const isCancelled = status === 'cancelled';

    const milestones: TrackingMilestone[] = [
      {
        step: 'received',
        title: 'Order Placed & Received',
        description: 'Your order has been logged into our fulfillment queue in Abuja.',
        timestamp: order.createdAt,
        completed: true,
        current: status === 'received',
      },
      {
        step: 'confirmed',
        title: 'Payment & Quality Confirmed',
        description:
          order.paymentStatus === 'paid'
            ? 'Payment verified. Items picked and packed in custom MiCollections luxury packaging.'
            : 'Order confirmed. Awaiting payment verification by our billing desk.',
        completed: ['confirmed', 'dispatched', 'shipped', 'delivered'].includes(status),
        current: status === 'confirmed',
      },
      {
        step: 'dispatched',
        title: 'Dispatched & In Transit',
        description: order.carrier
          ? `Package in transit with ${order.carrier}${
              order.trackingNumber ? ` (Waybill: ${order.trackingNumber})` : ''
            }.`
          : 'Package handed over to dispatch courier for expedited delivery.',
        completed: ['dispatched', 'shipped', 'delivered'].includes(status),
        current: status === 'dispatched' || status === 'shipped',
      },
      {
        step: 'delivered',
        title: 'Delivered to Customer',
        description: 'Package successfully delivered and signed for. Thank you for shopping MiCollections!',
        completed: status === 'delivered',
        current: status === 'delivered',
      },
    ];

    if (isCancelled) {
      milestones.push({
        step: 'cancelled',
        title: 'Order Cancelled',
        description: 'This order was cancelled. Please contact customer care for any inquiries.',
        completed: true,
        current: true,
      });
    }

    let progressPercent = 25;
    if (status === 'confirmed') progressPercent = 50;
    else if (status === 'dispatched' || status === 'shipped') progressPercent = 75;
    else if (status === 'delivered') progressPercent = 100;
    else if (isCancelled) progressPercent = 0;

    // 5. Generate WhatsApp Support Link
    const waText = encodeURIComponent(
      `Hello MiCollections, I am tracking my order #${order.id} (${order.deliveryLabel}). Can you provide a live update on delivery status?`
    );
    const waSupportUrl = `https://wa.me/2348149998877?text=${waText}`;

    const tracking: OrderTrackingInfo = {
      orderId: order.id,
      orderStatus: status,
      paymentStatus: order.paymentStatus || 'pending',
      paymentMethod: order.paymentMethod,
      payLabel: order.payLabel,
      createdAt: order.createdAt || new Date().toISOString(),
      eta: order.eta,
      deliveryLabel: order.deliveryLabel,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      riderName: order.riderName,
      riderPhone: order.riderPhone,
      dispatchNote: order.dispatchNote,
      destination: {
        name: isFullAccess ? order.name : order.name.split(' ')[0] + ' ***',
        city: order.state.includes('Abuja') ? 'Abuja' : order.state,
        state: order.state,
        addressMasked: isFullAccess
          ? `${order.address}, ${order.state}${order.landmark ? ` (Near ${order.landmark})` : ''}`
          : maskAddress(order.address, order.state, order.landmark),
      },
      items: order.items,
      subtotal: order.subtotal,
      fee: order.fee,
      discount: order.discount,
      total: order.total,
      milestones,
      progressPercent,
      waSupportUrl,
    };

    return NextResponse.json({
      success: true,
      tracking,
      isFullAccess,
    });
  } catch (err: any) {
    console.error('Track API error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal error retrieving tracking information.' },
      { status: 500 }
    );
  }
}
