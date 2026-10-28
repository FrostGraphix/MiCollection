import crypto from 'crypto';

interface InitializePaymentParams {
  email: string;
  amount: number; // in Naira (will be multiplied by 100 for Kobo)
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export async function initializePaystackPayment({
  email,
  amount,
  reference,
  callbackUrl,
  metadata = {},
}: InitializePaymentParams) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  // Sandbox fallback when real API key is not configured yet
  if (!secretKey || secretKey.includes('your_paystack') || secretKey.includes('placeholder')) {
    console.log('[Paystack Sandbox] Simulating payment initialization for:', reference);
    return {
      status: true,
      message: 'Sandbox: Payment initialized successfully',
      data: {
        authorization_url: `${callbackUrl}?reference=${reference}&status=success`,
        access_code: `mock_code_${reference}`,
        reference,
      },
    };
  }

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // convert to Kobo
        reference,
        callback_url: callbackUrl,
        metadata,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Paystack initialization error:', error);
    throw error;
  }
}

export async function verifyPaystackPayment(reference: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey || secretKey.includes('your_paystack') || secretKey.includes('placeholder')) {
    console.log('[Paystack Sandbox] Simulating payment verification for:', reference);
    return {
      status: true,
      data: {
        status: 'success',
        reference,
        amount: 0,
        gateway_response: 'Successful (Sandbox)',
      },
    };
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Paystack verification error:', error);
    throw error;
  }
}

export function verifyWebhookSignature(signature: string, rawBody: string): boolean {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || secretKey.includes('your_paystack') || secretKey.includes('placeholder')) {
    return true; // Allow sandbox testing without secret key
  }

  if (!signature) {
    // If running with test dummy key in development and no signature sent
    if (secretKey.includes('placeholder') || secretKey === 'test_secret') {
      return true;
    }
    return false;
  }

  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex');

  try {
    const hashBuffer = Buffer.from(hash, 'hex');
    const sigBuffer = Buffer.from(signature, 'hex');
    if (hashBuffer.length !== sigBuffer.length) {
      return hash.toLowerCase() === signature.toLowerCase();
    }
    return crypto.timingSafeEqual(hashBuffer, sigBuffer);
  } catch {
    return hash.toLowerCase() === signature.toLowerCase();
  }
}
