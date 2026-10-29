import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { generateOrderText } from '@/lib/utils';
import { byId } from '@/lib/products';
import { OrderItemRecord, OrderRecord, OrderStatus } from '@/types';

import { localOrdersCache, parseOrderDispatchInfo } from '@/lib/ordersCache';

export const dynamic = 'force-dynamic';

const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

async function resolveSessionUser(request: Request) {
  // 1. Check mc_admin_session cookie (used by admin console & dashboard)
  try {
    const rawCookie = request.headers.get('cookie') || '';
    const match = rawCookie.match(/(?:^|;\s*)mc_admin_session=([^;]+)/);
    if (match && match[1]) {
      try {
        const decoded = decodeURIComponent(match[1]);
        const parsed = JSON.parse(decoded);
        const role = parsed?.role;
        if (role && ['super_admin', 'store_manager', 'dispatcher'].includes(role)) {
          return {
            id: parsed.id || 'admin-user',
            email: parsed.email || 'admin@micollections.com',
            user_metadata: { role, full_name: parsed.name },
            app_metadata: { role },
          };
        }
      } catch {}
    }
  } catch (err) {
    console.warn('Error reading mc_admin_session in orders route:', err);
  }

  // 2. If Supabase is not configured, grant sandbox staff access
  if (!isSupabaseConfigured()) {
    return {
      id: 'sandbox-admin',
      email: 'admin@micollections.com',
      user_metadata: { role: 'super_admin', full_name: 'Mariam Siyaka' },
      app_metadata: { role: 'super_admin' },
    };
  }

  try {
    // 3. Try server cookie session via SSR client
    const serverClient = createClient();
    const {
      data: { user: cookieUser },
    } = await serverClient.auth.getUser();

    if (cookieUser) return cookieUser;

    // 4. Try Authorization Bearer token header
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
    console.warn('Error resolving session in orders route:', err);
  }

  return null;
}

function isStaffUser(user: any): boolean {
  if (!user) return false;
  const role = user.app_metadata?.role || user.user_metadata?.role;
  if (role && ['super_admin', 'store_manager', 'dispatcher'].includes(role)) {
    return true;
  }
  const email = (user.email || '').toLowerCase().trim();
  if (
    email === 'admin@micollections.com' ||
    email === 'manager@micollections.com' ||
    email === 'dispatch@micollections.com'
  ) {
    return true;
  }
  return false;
}

function isInternalOrSigned(request: Request): boolean {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const internalHeader = request.headers.get('x-internal-secret') || request.headers.get('x-service-key');

  if (serviceRoleKey) {
    if (authHeader && (authHeader === `Bearer ${serviceRoleKey}` || authHeader === serviceRoleKey)) {
      return true;
    }
    if (internalHeader && internalHeader === serviceRoleKey) {
      return true;
    }
  }
  if (internalSecret) {
    if (internalHeader && internalHeader === internalSecret) {
      return true;
    }
    if (authHeader && (authHeader === `Bearer ${internalSecret}` || authHeader === internalSecret)) {
      return true;
    }
  }
  return false;
}


function mapDbOrderToRecord(ord: any): OrderRecord {
  const items: OrderItemRecord[] = (ord.order_items || []).map((it: any) => {
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

  const dispatchInfo = parseOrderDispatchInfo(ord.note);

  const record: OrderRecord = {
    id: ord.id,
    userId: ord.user_id || undefined,
    name: ord.name,
    phone: ord.phone,
    email: ord.email,
    address: ord.address,
    state: ord.state,
    landmark: ord.landmark || undefined,
    deliveryLabel: ord.delivery_label || 'Standard Delivery',
    eta: ord.eta || '1 to 2 working days',
    payLabel:
      ord.pay_label ||
      (ord.payment_method === 'link'
        ? 'Card / USSD Payment'
        : ord.payment_method === 'pod'
        ? 'Pay on Delivery'
        : 'Bank Transfer'),
    paymentMethod: ord.payment_method || 'transfer',
    paymentStatus: ord.payment_status || 'pending',
    orderStatus: ord.order_status || 'received',
    fee: Number(ord.fee || 0),
    subtotal: Number(ord.subtotal || 0),
    discount: Number(ord.discount || 0),
    total: Number(ord.total || 0),
    items,
    lines: items.map((it) => `- ${it.qty} x ${it.name} (${it.opt})`),
    wa: '',
    createdAt: ord.created_at,
    note: ord.note || undefined,
    carrier: ord.carrier || dispatchInfo.carrier,
    trackingNumber: ord.tracking_number || dispatchInfo.trackingNumber,
    riderName: ord.rider_name || dispatchInfo.riderName,
    riderPhone: ord.rider_phone || dispatchInfo.riderPhone,
    dispatchNote: ord.dispatch_note || dispatchInfo.dispatchNote,
  };
  record.wa = generateOrderText(record);
  return record;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId =
      body.id || 'MC-' + Date.now().toString(36).toUpperCase().slice(-6);

    // Determine linked user ID if user is authenticated or passed in body
    let linkedUserId: string | null = body.userId || body.user_id || null;
    if (!linkedUserId) {
      try {
        const serverClient = createClient();
        const {
          data: { user },
        } = await serverClient.auth.getUser();
        if (user?.id) {
          linkedUserId = user.id;
        }
      } catch {
        // No active server cookie session
      }
    }

    const payLabel =
      body.paymentMethod === 'link'
        ? 'Card / USSD Payment'
        : body.paymentMethod === 'pod'
        ? 'Pay on Delivery'
        : 'Bank Transfer';

    const orderItems: OrderItemRecord[] = (body.items || []).map((it: any) => {
      const prod = it.productId || it.product_id ? byId(Number(it.productId || it.product_id)) : null;
      return {
        name: it.name || prod?.name || 'Item',
        price: Number(it.price || prod?.price || 0),
        qty: Number(it.qty || 1),
        art: it.art || prod?.art || 'tote',
        color: it.color || prod?.colors?.[0] || 'violet',
        opt: it.opt || '',
        productId: it.productId || it.product_id ? Number(it.productId || it.product_id) : undefined,
        image: it.image || prod?.images?.[0] || undefined,
      };
    });

    const newOrder: OrderRecord = {
      id: orderId,
      userId: linkedUserId || undefined,
      name: body.name || '',
      phone: body.phone || '',
      email: body.email || '',
      address: body.address || '',
      state: body.state || '',
      landmark: body.landmark || '',
      deliveryLabel: body.deliveryLabel || body.delivery_label || 'Standard Delivery',
      eta: body.eta || '1 to 2 working days',
      payLabel,
      paymentMethod: body.paymentMethod || 'transfer',
      paymentStatus: body.paymentStatus || 'pending',
      orderStatus: body.orderStatus || 'received',
      fee: Number(body.fee || 0),
      subtotal: Number(body.subtotal || 0),
      discount: Number(body.discount || 0),
      total: Number(body.total || 0),
      items: orderItems,
      lines: orderItems.map((it) => `- ${it.qty} x ${it.name} (${it.opt})`),
      wa: '',
      createdAt: new Date().toISOString(),
      note: body.note || '',
    };
    newOrder.wa = generateOrderText(newOrder);

    // Instant offline fallback / in-memory cache
    localOrdersCache[orderId] = newOrder;

    // Save to Supabase using createAdminClient()
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const dbUserId = linkedUserId && isValidUUID(linkedUserId) ? linkedUserId : null;

        const { error: orderError } = await supabase.from('orders').insert({
          id: orderId,
          user_id: dbUserId,
          name: newOrder.name,
          phone: newOrder.phone,
          email: newOrder.email,
          address: newOrder.address,
          state: newOrder.state,
          landmark: newOrder.landmark || null,
          delivery_label: newOrder.deliveryLabel,
          eta: newOrder.eta,
          pay_label: newOrder.payLabel,
          payment_method: newOrder.paymentMethod,
          payment_status: newOrder.paymentStatus || 'pending',
          order_status: newOrder.orderStatus || 'received',
          subtotal: newOrder.subtotal,
          fee: newOrder.fee,
          discount: newOrder.discount,
          total: newOrder.total,
          note: newOrder.note || null,
        });

        if (orderError) {
          console.warn('Supabase order insert warning:', orderError.message);
          // If foreign key constraint on user_id failed, retry as guest order (user_id: null)
          if (dbUserId && (orderError.message?.includes('foreign key') || (orderError as any).code === '23503')) {
            const { error: retryError } = await supabase.from('orders').insert({
              id: orderId,
              user_id: null,
              name: newOrder.name,
              phone: newOrder.phone,
              email: newOrder.email,
              address: newOrder.address,
              state: newOrder.state,
              landmark: newOrder.landmark || null,
              delivery_label: newOrder.deliveryLabel,
              eta: newOrder.eta,
              pay_label: newOrder.payLabel,
              payment_method: newOrder.paymentMethod,
              payment_status: newOrder.paymentStatus || 'pending',
              order_status: newOrder.orderStatus || 'received',
              subtotal: newOrder.subtotal,
              fee: newOrder.fee,
              discount: newOrder.discount,
              total: newOrder.total,
              note: newOrder.note || null,
            });

            if (!retryError && orderItems.length > 0) {
              const itemsPayload = orderItems.map((it) => ({
                order_id: orderId,
                product_id: typeof it.productId === 'number' ? it.productId : null,
                name: it.name,
                price: it.price,
                qty: it.qty,
                art: it.art,
                color: it.color,
                opt: it.opt,
              }));
              await supabase.from('order_items').insert(itemsPayload);
            }
          }
        } else if (orderItems.length > 0) {
          const itemsPayload = orderItems.map((it) => ({
            order_id: orderId,
            product_id: typeof it.productId === 'number' ? it.productId : null,
            name: it.name,
            price: it.price,
            qty: it.qty,
            art: it.art,
            color: it.color,
            opt: it.opt,
          }));

          const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
          if (itemsError) {
            console.warn('Supabase order_items insert warning:', itemsError.message);
          }
        }
      } catch (err) {
        console.warn('Supabase order saving warning:', err);
      }
    }

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  const sessionUser = await resolveSessionUser(request);
  const isStaff = isStaffUser(sessionUser);

  // Case 1: Fetch single order by ID
  if (id) {
    let order: OrderRecord | null = null;

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const { data: orderData, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', id)
          .maybeSingle();

        if (!error && orderData) {
          order = mapDbOrderToRecord(orderData);
          localOrdersCache[order.id] = order;
        }
      } catch (e) {
        console.warn('Supabase fetch order error:', e);
      }
    }

    if (!order && localOrdersCache[id]) {
      order = localOrdersCache[id];
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Single order security check:
    // If order is bound to a registered user_id, ensure session matches owner or staff
    if (order.userId && !isStaff) {
      const isOwner =
        (sessionUser && sessionUser.id === order.userId) ||
        (sessionUser?.email && sessionUser.email.toLowerCase() === order.email?.toLowerCase());

      if (sessionUser && !isOwner) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions to view this order' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ order });
  }

  // Case 2: Fetch orders for a specific user ID or email
  if (userId || email) {
    // If not staff, enforce that requesting session matches the requested userId or email
    if (!isStaff) {
      if (!sessionUser) {
        return NextResponse.json(
          { error: 'Unauthorized: Authentication required to access user orders' },
          { status: 401 }
        );
      }

      const matchesUserId = userId ? sessionUser.id === userId : false;
      const matchesEmail = email
        ? sessionUser.email?.toLowerCase().trim() === email.toLowerCase().trim()
        : false;

      if (!matchesUserId && !matchesEmail) {
        return NextResponse.json(
          { error: 'Forbidden: You can only access your own orders' },
          { status: 403 }
        );
      }
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        let query = supabase.from('orders').select('*, order_items(*)');

        if (userId && email) {
          query = query.or(`user_id.eq.${userId},email.ilike.${email}`);
        } else if (userId) {
          query = query.eq('user_id', userId);
        } else if (email) {
          query = query.ilike('email', email);
        }

        const { data: userOrders, error } = await query.order('created_at', { ascending: false });

        if (!error && userOrders) {
          const mappedOrders = userOrders.map(mapDbOrderToRecord);
          mappedOrders.forEach((ord) => {
            localOrdersCache[ord.id] = ord;
          });
          return NextResponse.json({ orders: mappedOrders });
        }
      } catch (e) {
        console.warn('Supabase fetch user orders error:', e);
      }
    }

    // Gracefully fall back to local cache if Supabase query failed or not configured
    const userOrdersList = Object.values(localOrdersCache).filter(
      (ord: any) =>
        (userId && (ord.userId === userId || ord.user_id === userId)) ||
        (email && ord.email && ord.email.toLowerCase() === email.toLowerCase())
    );

    return NextResponse.json({ orders: userOrdersList });
  }

  // Case 3: No params, all-orders query - STRICT STAFF ONLY
  if (!sessionUser) {
    return NextResponse.json(
      { error: 'Unauthorized: Staff credentials required to view all orders' },
      { status: 401 }
    );
  }

  if (!isStaff) {
    return NextResponse.json(
      { error: 'Forbidden: Staff privileges required' },
      { status: 403 }
    );
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && allOrders) {
        const mappedOrders = allOrders.map(mapDbOrderToRecord);
        mappedOrders.forEach((ord) => {
          localOrdersCache[ord.id] = ord;
        });
        return NextResponse.json({ orders: mappedOrders });
      }
    } catch (e) {
      console.warn('Supabase fetch all orders error:', e);
    }
  }

  const allOrdersList = Object.values(localOrdersCache).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
  return NextResponse.json({ orders: allOrdersList });
}

export async function PATCH(request: Request) {
  try {
    const sessionUser = await resolveSessionUser(request);
    const isStaff = isStaffUser(sessionUser);
    const isInternal = isInternalOrSigned(request);

    if (!isStaff && !isInternal) {
      return NextResponse.json(
        { error: 'Unauthorized: Staff credentials or signed authorization required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = body.id;
    const orderStatus = (body.orderStatus || body.order_status) as OrderStatus | undefined;
    const paymentStatus = (body.paymentStatus || body.payment_status) as 'pending' | 'paid' | 'failed' | undefined;
    const paymentMethod = body.paymentMethod || body.payment_method;
    const payLabel = body.payLabel || body.pay_label;
    let note = body.note;
    const carrier = body.carrier;
    const trackingNumber = body.trackingNumber || body.tracking_number;
    const riderName = body.riderName || body.rider_name;
    const riderPhone = body.riderPhone || body.rider_phone;
    const dispatchNote = body.dispatchNote || body.dispatch_note;

    if (carrier || trackingNumber || riderName || riderPhone || dispatchNote) {
      note = JSON.stringify({
        carrier: carrier || undefined,
        trackingNumber: trackingNumber || undefined,
        riderName: riderName || undefined,
        riderPhone: riderPhone || undefined,
        dispatchNote: dispatchNote || (note && !note.startsWith('{') ? note : undefined),
      });
    }

    const paystackRef = body.paystackRef || body.paystack_ref;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Update in Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const updatePayload: Record<string, any> = {};
        if (orderStatus) updatePayload.order_status = orderStatus;
        if (paymentStatus) updatePayload.payment_status = paymentStatus;
        if (paymentMethod) updatePayload.payment_method = paymentMethod;
        if (payLabel) updatePayload.pay_label = payLabel;
        if (note !== undefined) updatePayload.note = note;
        if (paystackRef) updatePayload.paystack_ref = paystackRef;
        if (carrier !== undefined) updatePayload.carrier = carrier;
        if (trackingNumber !== undefined) updatePayload.tracking_number = trackingNumber;
        if (riderName !== undefined) updatePayload.rider_name = riderName;
        if (riderPhone !== undefined) updatePayload.rider_phone = riderPhone;
        if (dispatchNote !== undefined) updatePayload.dispatch_note = dispatchNote;

        let { data: updatedData, error } = await supabase
          .from('orders')
          .update(updatePayload)
          .eq('id', id)
          .select('*, order_items(*)')
          .maybeSingle();

        // If optional columns do not exist in the database, fallback to standard core columns
        if (error && (error.code === 'PGRST204' || error.message.includes('column') || error.message.includes('carrier') || error.message.includes('tracking_number'))) {
          const corePayload: Record<string, any> = {};
          if (orderStatus) corePayload.order_status = orderStatus;
          if (paymentStatus) corePayload.payment_status = paymentStatus;
          if (paymentMethod) corePayload.payment_method = paymentMethod;
          if (payLabel) corePayload.pay_label = payLabel;
          if (note !== undefined) corePayload.note = note;
          if (paystackRef) corePayload.paystack_ref = paystackRef;

          const retryRes = await supabase
            .from('orders')
            .update(corePayload)
            .eq('id', id)
            .select('*, order_items(*)')
            .maybeSingle();

          updatedData = retryRes.data;
          error = retryRes.error;
        }

        if (!error && updatedData) {
          const dbUpdated = mapDbOrderToRecord(updatedData);
          localOrdersCache[id] = dbUpdated;
          return NextResponse.json({ success: true, order: dbUpdated });
        } else if (error) {
          console.warn('Supabase update order warning:', error.message);
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
      } catch (err: any) {
        console.warn('Supabase update order error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }

    // Update in local cache if Supabase not configured
    const order = localOrdersCache[id];
    if (order) {
      if (orderStatus) order.orderStatus = orderStatus;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      if (paymentMethod) order.paymentMethod = paymentMethod;
      if (payLabel) order.payLabel = payLabel;
      if (note !== undefined) order.note = note;
      if (carrier !== undefined) order.carrier = carrier;
      if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
      if (riderName !== undefined) order.riderName = riderName;
      if (riderPhone !== undefined) order.riderPhone = riderPhone;
      if (dispatchNote !== undefined) order.dispatchNote = dispatchNote;
      localOrdersCache[id] = order;
      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
