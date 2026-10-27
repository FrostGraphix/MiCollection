import { NextResponse } from 'next/server';
import { INITIAL_NOTIFICATIONS } from '@/lib/mockOrders';
import { StoreNotification } from '@/types';

// In-memory notifications state initialized with seeds
let notificationsList: StoreNotification[] = [...INITIAL_NOTIFICATIONS];

export async function GET() {
  try {
    const unreadCount = notificationsList.filter((n) => !n.read).length;
    return NextResponse.json({
      success: true,
      unreadCount,
      notifications: notificationsList,
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

    notificationsList.unshift(newNotif);

    return NextResponse.json({
      success: true,
      notification: newNotif,
      unreadCount: notificationsList.filter((n) => !n.read).length,
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
      notificationsList = notificationsList.map((n) => ({ ...n, read: true }));
    } else if (id) {
      notificationsList = notificationsList.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
    }

    const unreadCount = notificationsList.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications: notificationsList,
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
      notificationsList = notificationsList.filter((n) => n.id !== id);
    } else {
      // Clear all
      notificationsList = [];
    }

    return NextResponse.json({
      success: true,
      unreadCount: 0,
      notifications: notificationsList,
    });
  } catch (err: any) {
    console.error('Delete notification error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
