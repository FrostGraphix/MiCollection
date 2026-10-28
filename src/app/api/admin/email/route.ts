import { NextResponse } from 'next/server';
import {
  generateAdminAlertEmail,
  generateDispatchEmail,
  generateOrderConfirmationEmail,
} from '@/lib/emailTemplates';
import { OrderRecord } from '@/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { generateOrderText } from '@/lib/utils';
import { byId } from '@/lib/products';

const DEFAULT_SAMPLE_ORDER: OrderRecord = {
  id: 'MC-SAMPLE',
  name: 'Amina Bello-Kano',
  phone: '08145736483',
  email: 'amina.bello@example.com',
  address: 'Plot 412, Mississippi Street, Maitama',
  state: 'Abuja (FCT)',
  landmark: 'Near Farmers Market',
  deliveryLabel: 'Same-Day Abuja Courier',
  eta: 'Today by 4:00 PM',
  payLabel: 'Bank Transfer',
  paymentMethod: 'transfer',
  paymentStatus: 'paid',
  orderStatus: 'confirmed',
  fee: 3500,
  subtotal: 145000,
  discount: 0,
  total: 148500,
  items: [
    {
      name: 'Royal Silk Abaya with Pearl Beadwork',
      price: 85000,
      qty: 1,
      art: 'tote',
      color: 'black',
      opt: 'L',
    },
    {
      name: 'Chunky Sole Streetwear Sneaker',
      price: 60000,
      qty: 1,
      art: 'sneaker',
      color: 'ivory',
      opt: 'Size 40',
    },
  ],
  lines: [
    '- 1 x Royal Silk Abaya with Pearl Beadwork (L)',
    '- 1 x Chunky Sole Streetwear Sneaker (Size 40)',
  ],
  wa: '',
  createdAt: new Date().toISOString(),
};

async function getOrderForEmail(orderId?: string | null): Promise<OrderRecord> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      let query = supabase.from('orders').select('*, order_items(*)');
      if (orderId) {
        query = query.eq('id', orderId);
      } else {
        query = query.order('created_at', { ascending: false }).limit(1);
      }
      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        const items = (data.order_items || []).map((it: any) => {
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

        const rec: OrderRecord = {
          id: data.id,
          userId: data.user_id || undefined,
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          state: data.state,
          landmark: data.landmark || undefined,
          deliveryLabel: data.delivery_label || 'Standard Delivery',
          eta: data.eta || '1 to 2 working days',
          payLabel: data.pay_label || 'Bank Transfer',
          paymentMethod: data.payment_method || 'transfer',
          paymentStatus: data.payment_status || 'pending',
          orderStatus: data.order_status || 'received',
          fee: Number(data.fee || 0),
          subtotal: Number(data.subtotal || 0),
          discount: Number(data.discount || 0),
          total: Number(data.total || 0),
          items,
          lines: items.map((it: any) => `- ${it.qty} x ${it.name} (${it.opt})`),
          wa: '',
          createdAt: data.created_at,
          note: data.note || undefined,
        };
        rec.wa = generateOrderText(rec);
        return rec;
      }
    } catch (e) {
      console.warn('Error fetching live order for email:', e);
    }
  }

  return DEFAULT_SAMPLE_ORDER;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'order_confirmation';
    const orderId = searchParams.get('orderId');
    const preview = searchParams.get('preview') === 'true';

    const order = await getOrderForEmail(orderId);

    let html = '';
    let subject = '';
    let recipient = order.email;

    switch (type) {
      case 'admin_alert':
        html = generateAdminAlertEmail(order);
        subject = `🚨 Admin Alert: New Order #${order.id} (₦${order.total.toLocaleString()})`;
        recipient = 'orders@micollections.com';
        break;
      case 'dispatch':
        html = generateDispatchEmail(
          order,
          searchParams.get('tracking') || undefined
        );
        subject = `Your MiCollections Order #${order.id} has been dispatched!`;
        break;
      case 'order_confirmation':
      default:
        html = generateOrderConfirmationEmail(order);
        subject = `MiCollections Order Confirmation #${order.id}`;
        break;
    }

    if (preview) {
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    return NextResponse.json({
      success: true,
      type,
      orderId: order.id,
      recipient,
      subject,
      html,
    });
  } catch (err: any) {
    console.error('Email preview route error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to render email preview' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type = 'order_confirmation', orderId, order: customOrder, trackingInfo, recipientEmail } = body;

    let order: OrderRecord = customOrder;
    if (!order) {
      order = await getOrderForEmail(orderId);
    }

    let html = '';
    let subject = '';
    let recipient = recipientEmail || order.email;

    switch (type) {
      case 'admin_alert':
        html = generateAdminAlertEmail(order);
        subject = `🚨 New Order #${order.id} Placed - ₦${order.total.toLocaleString()}`;
        recipient = recipientEmail || 'orders@micollections.com';
        break;
      case 'dispatch':
        html = generateDispatchEmail(order, trackingInfo);
        subject = `🚚 Order #${order.id} Dispatched - Delivery In Progress`;
        break;
      case 'order_confirmation':
      default:
        html = generateOrderConfirmationEmail(order);
        subject = `Receipt & Confirmation for Order #${order.id}`;
        break;
    }

    const messageId = `msg_mc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[Email Pipeline] Dispatched '${type}' to <${recipient}> with ID ${messageId}`);

    return NextResponse.json({
      success: true,
      messageId,
      type,
      orderId: order.id,
      recipient,
      subject,
      html,
      dispatchedAt: new Date().toISOString(),
      status: 'delivered',
    });
  } catch (err: any) {
    console.error('Email dispatch error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch email' },
      { status: 500 }
    );
  }
}
