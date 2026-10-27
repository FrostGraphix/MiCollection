import { NextResponse } from 'next/server';
import {
  generateAdminAlertEmail,
  generateDispatchEmail,
  generateOrderConfirmationEmail,
} from '@/lib/emailTemplates';
import { INITIAL_ORDERS } from '@/lib/mockOrders';
import { OrderRecord } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'order_confirmation';
    const orderId = searchParams.get('orderId');
    const preview = searchParams.get('preview') === 'true';

    // Find requested order or default to first sample order
    let order: OrderRecord | undefined;
    if (orderId) {
      order = INITIAL_ORDERS.find((o) => o.id === orderId);
    }
    if (!order) {
      order = INITIAL_ORDERS[0];
    }

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

    // If client requested direct HTML preview, return text/html
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

    let order: OrderRecord | undefined = customOrder;
    if (!order && orderId) {
      order = INITIAL_ORDERS.find((o) => o.id === orderId);
    }
    if (!order) {
      order = INITIAL_ORDERS[0];
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

    // Simulating transactional delivery pipeline (Resend / SendGrid / NodeMailer)
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
