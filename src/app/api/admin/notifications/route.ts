import { NextResponse } from 'next/server';
import { INITIAL_NOTIFICATIONS } from '@/lib/mockOrders';
import { StoreNotification } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { money } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// In-memory notifications state for dynamically pushed user notifications
let memoryNotifications: StoreNotification[] = [];

export async function GET() {
  try {
    let liveNotifications: StoreNotification[] = [];

    // Query live orders from Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const { data: dbOrders, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && dbOrders && dbOrders.length > 0) {
          liveNotifications = dbOrders.map((o, idx) => {
            const timeAgo =
              idx === 0
                ? 'Just now'
                : idx === 1
                ? '12m ago'
                : idx === 2
                ? '35m ago'
                : idx === 3
                ? '1h ago'
                : idx < 6
                ? `${idx}h ago`
                : 'Yesterday';

            const isHigh =
              o.order_status === 'received' || Number(o.total || 0) >= 80000;

            const isDelivered = o.order_status === 'delivered';
            const isShipped = o.order_status === 'shipped';

            let type: StoreNotification['type'] = 'order_new';
            let title = `Live Order Received: #${o.id}`;

            if (isDelivered) {
              type = 'order_delivered';
              title = `Order #${o.id} Delivered`;
            } else if (isShipped) {
              type = 'order_dispatched';
              title = `Courier Dispatched #${o.id}`;
            }

            return {
              id: `notif-db-${o.id}`,
              type,
              title,
              message: `${o.name} (${o.state || 'Abuja'}) placed order for ${money(Number(o.total || 0))} via ${o.pay_label || o.payment_method}.`,
              timestamp: timeAgo,
              orderId: o.id,
              customerName: o.name,
              amount: Number(o.total || 0),
              read: idx > 2,
              priority: isHigh ? ('high' as const) : ('normal' as const),
            };
          });
        }
      } catch (dbErr) {
        console.warn('Could not query Supabase for notifications:', dbErr);
      }
    }

    // Combine custom memory notifications with live DB notifications or mock seeds
    const combined = [...memoryNotifications, ...liveNotifications];
    const finalNotifications = combined.length > 0 ? combined : INITIAL_NOTIFICATIONS;
    const unreadCount = finalNotifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications: finalNotifications,
    });
  } catch (err: any) {
    console.error('Fetch notifications error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newNotif: StoreNotification = {
      id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      type: body.type || 'order_new',
      title: body.title || 'Store Update',
      message: body.message || 'New activity logged',
      timestamp: 'Just now',
      orderId: body.orderId,
      customerName: body.customerName,
      amount: body.amount ? Number(body.amount) : undefined,
      read: false,
      priority: body.priority || 'normal',
    };

    memoryNotifications.unshift(newNotif);

    return NextResponse.json({
      success: true,
      notification: newNotif,
    });
  } catch (err: any) {
    console.error('Create notification error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create notification' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      memoryNotifications = memoryNotifications.map((n) => ({ ...n, read: true }));
    } else if (id) {
      memoryNotifications = memoryNotifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
    }

    return NextResponse.json({
      success: true,
      unreadCount: 0,
    });
  } catch (err: any) {
    console.error('Update notification error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      memoryNotifications = memoryNotifications.filter((n) => n.id !== id);
    } else {
      memoryNotifications = [];
    }

    return NextResponse.json({
      success: true,
      unreadCount: 0,
      notifications: memoryNotifications,
    });
  } catch (err: any) {
    console.error('Delete notification error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
