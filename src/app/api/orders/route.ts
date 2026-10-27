import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { generateOrderText } from '@/lib/utils';
import { OrderRecord } from '@/types';

import { INITIAL_ORDERS } from '@/lib/mockOrders';

// In-memory orders cache for local sandbox testing, initialized with 32 orders
const localOrdersCache: Record<string, OrderRecord> = {};
INITIAL_ORDERS.forEach((ord) => {
  localOrdersCache[ord.id] = { ...ord };
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId =
      body.id || 'MC-' + Date.now().toString(36).toUpperCase().slice(-6);

    const waText = generateOrderText({
      id: orderId,
      name: body.name,
      phone: body.phone,
      email: body.email,
      address: body.address,
      state: body.state,
      landmark: body.landmark,
      deliveryLabel: body.deliveryLabel,
      eta: body.eta,
      payLabel: body.paymentMethod === 'link' ? 'Card / USSD' : body.paymentMethod === 'pod' ? 'Pay on Delivery' : 'Bank Transfer',
      paymentMethod: body.paymentMethod,
      fee: body.fee,
      subtotal: body.subtotal,
      discount: body.discount,
      total: body.total,
      items: body.items,
      lines: body.items.map(
        (it: any) => `- ${it.qty} x ${it.name} (${it.opt})`
      ),
      wa: '',
    });

    const newOrder: OrderRecord = {
      id: orderId,
      name: body.name,
      phone: body.phone,
      email: body.email,
      address: body.address,
      state: body.state,
      landmark: body.landmark,
      deliveryLabel: body.deliveryLabel,
      eta: body.eta,
      payLabel:
        body.paymentMethod === 'link'
          ? 'Card / USSD Payment'
          : body.paymentMethod === 'pod'
          ? 'Pay on Delivery'
          : 'Bank Transfer',
      paymentMethod: body.paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'received',
      fee: body.fee,
      subtotal: body.subtotal,
      discount: body.discount,
      total: body.total,
      items: body.items,
      lines: body.items.map(
        (it: any) => `- ${it.qty} x ${it.name} (${it.opt})`
      ),
      wa: waText,
      createdAt: new Date().toISOString(),
    };

    // Store in local cache
    localOrdersCache[orderId] = newOrder;

    // Save to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();

        // Check if authenticated user
        const serverClient = createClient();
        const {
          data: { user },
        } = await serverClient.auth.getUser();

        const { error: orderError } = await supabase.from('orders').insert({
          id: orderId,
          user_id: user?.id || null,
          name: body.name,
          phone: body.phone,
          email: body.email,
          address: body.address,
          state: body.state,
          landmark: body.landmark,
          delivery_label: body.deliveryLabel,
          eta: body.eta,
          pay_label: newOrder.payLabel,
          payment_method: body.paymentMethod,
          payment_status: 'pending',
          order_status: 'received',
          subtotal: body.subtotal,
          fee: body.fee,
          discount: body.discount,
          total: body.total,
          note: body.note,
        });

        if (orderError) {
          console.error('Supabase order insert error:', orderError);
        } else if (body.items && body.items.length > 0) {
          const itemsPayload = body.items.map((it: any) => ({
            order_id: orderId,
            product_id: it.productId,
            name: it.name,
            price: it.price,
            qty: it.qty,
            art: it.art,
            color: it.color,
            opt: it.opt,
          }));

          await supabase.from('order_items').insert(itemsPayload);
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

  if (id) {
    // Check Supabase first
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: orderData, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', id)
          .single();

        if (!error && orderData) {
          const mappedOrder: OrderRecord = {
            id: orderData.id,
            name: orderData.name,
            phone: orderData.phone,
            email: orderData.email,
            address: orderData.address,
            state: orderData.state,
            landmark: orderData.landmark,
            deliveryLabel: orderData.delivery_label,
            eta: orderData.eta,
            payLabel: orderData.pay_label,
            paymentMethod: orderData.payment_method,
            paymentStatus: orderData.payment_status,
            orderStatus: orderData.order_status,
            fee: Number(orderData.fee),
            subtotal: Number(orderData.subtotal),
            discount: Number(orderData.discount || 0),
            total: Number(orderData.total),
            items: orderData.order_items || [],
            lines: (orderData.order_items || []).map(
              (it: any) => `- ${it.qty} x ${it.name} (${it.opt})`
            ),
            wa: '',
            createdAt: orderData.created_at,
          };
          mappedOrder.wa = generateOrderText(mappedOrder);
          return NextResponse.json({ order: mappedOrder });
        }
      } catch (e) {
        console.warn('Supabase fetch order error:', e);
      }
    }

    const cached = localOrdersCache[id];
    if (cached) {
      return NextResponse.json({ order: cached });
    }

    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (userId) {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: userOrders, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && userOrders) {
          const mappedOrders = userOrders.map((ord: any) => ({
            id: ord.id,
            name: ord.name,
            phone: ord.phone,
            email: ord.email,
            address: ord.address,
            state: ord.state,
            deliveryLabel: ord.delivery_label,
            eta: ord.eta,
            payLabel: ord.pay_label,
            paymentMethod: ord.payment_method,
            paymentStatus: ord.payment_status,
            orderStatus: ord.order_status,
            fee: Number(ord.fee),
            subtotal: Number(ord.subtotal),
            discount: Number(ord.discount || 0),
            total: Number(ord.total),
            items: ord.order_items || [],
            lines: (ord.order_items || []).map(
              (it: any) => `- ${it.qty} x ${it.name} (${it.opt})`
            ),
            wa: '',
            createdAt: ord.created_at,
          }));

          return NextResponse.json({ orders: mappedOrders });
        }
      } catch (e) {
        console.warn('Supabase fetch user orders error:', e);
      }
    }

    const userOrdersList = Object.values(localOrdersCache);
    return NextResponse.json({ orders: userOrdersList });
  }

  return NextResponse.json({ orders: Object.values(localOrdersCache) });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, orderStatus, paymentStatus, note } = body;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    let order = localOrdersCache[id];
    if (!order) {
      const found = INITIAL_ORDERS.find((o) => o.id === id);
      if (found) {
        order = { ...found };
        localOrdersCache[id] = order;
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    if (note !== undefined) {
      order.note = note;
    }

    localOrdersCache[id] = order;

    // Update in Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const updatePayload: Record<string, any> = {};
        if (orderStatus) updatePayload.order_status = orderStatus;
        if (paymentStatus) updatePayload.payment_status = paymentStatus;
        if (note !== undefined) updatePayload.note = note;

        await supabase.from('orders').update(updatePayload).eq('id', id);
      } catch (err) {
        console.warn('Supabase update order warning:', err);
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

