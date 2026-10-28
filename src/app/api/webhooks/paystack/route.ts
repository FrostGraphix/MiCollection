import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/paystack';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { localOrdersCache } from '@/lib/ordersCache';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature') || '';

    // Verify webhook signature using PAYSTACK_SECRET_KEY
    const isValid = verifyWebhookSignature(signature, rawBody);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data || {};
      const orderId = metadata?.orderId || metadata?.order_id || reference;

      console.log(`[Paystack Webhook] Payment confirmed for Order ${orderId} (Reference: ${reference})`);

      // Update local cache fallback if available
      if (orderId && localOrdersCache[orderId]) {
        localOrdersCache[orderId].paymentStatus = 'paid';
        localOrdersCache[orderId].orderStatus = 'confirmed';
      }

      // Update Supabase orders table
      if (isSupabaseConfigured()) {
        try {
          const supabase = createAdminClient();

          const { error } = await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              order_status: 'confirmed',
              paystack_ref: reference,
            })
            .eq('id', orderId);

          if (error) {
            console.warn('[Paystack Webhook] Supabase order update warning:', error.message);
          }
        } catch (dbErr) {
          console.warn('[Paystack Webhook] Supabase connection warning:', dbErr);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Paystack webhook error:', err);
    return NextResponse.json(
      { error: err.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
