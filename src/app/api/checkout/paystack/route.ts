import { NextResponse } from 'next/server';
import { initializePaystackPayment } from '@/lib/paystack';

export async function POST(request: Request) {
  try {
    const { orderId, email, amount } = await request.json();

    if (!orderId || !email || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters (orderId, email, amount)' },
        { status: 400 }
      );
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    const callbackUrl = `${siteUrl}/order-success`;

    const paystackRes = await initializePaystackPayment({
      email,
      amount,
      reference: orderId,
      callbackUrl,
      metadata: {
        orderId,
      },
    });

    return NextResponse.json(paystackRes);
  } catch (error: any) {
    console.error('Paystack initialization API error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
