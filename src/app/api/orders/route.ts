import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { generateOrderText } from '@/lib/utils';
import { byId } from '@/lib/products';
import { OrderItemRecord, OrderRecord, OrderStatus } from '@/types';
import { INITIAL_ORDERS } from '@/lib/mockOrders';

import { localOrdersCache } from '@/lib/ordersCache';

export const dynamic = 'force-dynamic';

const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

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

  // Case 1: Fetch single order by ID
  if (id) {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const { data: orderData, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', id)
          .maybeSingle();

        if (!error && orderData) {
          const mappedOrder = mapDbOrderToRecord(orderData);
          localOrdersCache[mappedOrder.id] = mappedOrder;
          return NextResponse.json({ order: mappedOrder });
        }
      } catch (e) {
        console.warn('Supabase fetch order error:', e);
      }
    }

    const cached = localOrdersCache[id] || INITIAL_ORDERS.find((o) => o.id === id);
    if (cached) {
      return NextResponse.json({ order: cached });
    }

    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Case 2: Fetch orders for a specific user ID
  if (userId) {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const { data: userOrders, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && userOrders && userOrders.length > 0) {
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

    // Gracefully fall back to local cache
    const userOrdersList = Object.values(localOrdersCache).filter(
      (ord: any) => ord.userId === userId || ord.user_id === userId
    );

    return NextResponse.json({ orders: userOrdersList });
  }

  // Case 3: No params, return latest orders
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && allOrders && allOrders.length > 0) {
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
    const body = await request.json();
    const id = body.id;
    const orderStatus = (body.orderStatus || body.order_status) as OrderStatus | undefined;
    const paymentStatus = (body.paymentStatus || body.payment_status) as 'pending' | 'paid' | 'failed' | undefined;
    const paymentMethod = body.paymentMethod || body.payment_method;
    const payLabel = body.payLabel || body.pay_label;
    const note = body.note;
    const paystackRef = body.paystackRef || body.paystack_ref;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    let dbUpdated: OrderRecord | null = null;

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

        const { data: updatedData, error } = await supabase
          .from('orders')
          .update(updatePayload)
          .eq('id', id)
          .select('*, order_items(*)')
          .maybeSingle();

        if (!error && updatedData) {
          dbUpdated = mapDbOrderToRecord(updatedData);
          localOrdersCache[id] = dbUpdated;
        } else if (error) {
          console.warn('Supabase update order warning:', error.message);
        }
      } catch (err) {
        console.warn('Supabase update order error:', err);
      }
    }

    // Update in local cache
    let order = localOrdersCache[id];
    if (!order) {
      const found = INITIAL_ORDERS.find((o) => o.id === id);
      if (found) {
        order = { ...found };
        localOrdersCache[id] = order;
      }
    }

    if (dbUpdated) {
      return NextResponse.json({ success: true, order: dbUpdated });
    }

    if (order) {
      if (orderStatus) {
        order.orderStatus = orderStatus;
      }
      if (paymentStatus) {
        order.paymentStatus = paymentStatus;
      }
      if (paymentMethod) {
        order.paymentMethod = paymentMethod;
      }
      if (payLabel) {
        order.payLabel = payLabel;
      }
      if (note !== undefined) {
        order.note = note;
      }
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
