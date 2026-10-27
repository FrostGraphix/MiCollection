import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/paystack';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature') || '';

    // Verify webhook signature
    const isValid = verifyWebhookSignature(signature, rawBody);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      const orderId = metadata?.orderId || reference;

      console.log(`[Paystack Webhook] Payment confirmed for Order ${orderId}`);

      if (isSupabaseConfigured()) {
        const supabase = createAdminClient();

        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            order_status: 'confirmed',
            paystack_ref: reference,
          })
          .eq('id', orderId);
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
