import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 1. Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[match[1]] = val.trim();
    }
  });
}

// 2. Import API Route Handlers
import { POST as createOrder, GET as getOrders, PATCH as updateOrder } from '../src/app/api/orders/route';
import { POST as handlePaystackWebhook } from '../src/app/api/webhooks/paystack/route';

async function runSimulation() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING ORDER, CHECKOUT & WEBHOOK SIMULATION TEST');
  console.log('======================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`, detail || '');
    }
  }

  const testUserId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  const customOrderId = 'MC-TEST-' + Math.floor(1000 + Math.random() * 9000);

  // ---------------------------------------------------------
  // TEST 1: Simulate Order Creation (POST /api/orders)
  // ---------------------------------------------------------
  console.log('\n--- TEST 1: POST /api/orders (Order Creation) ---');
  const orderPayload = {
    id: customOrderId,
    userId: testUserId,
    name: 'Amina Bello',
    phone: '08031234567',
    email: 'amina.bello@example.com',
    address: '15 Adetokunbo Ademola Crescent, Wuse 2',
    state: 'Abuja (FCT)',
    landmark: 'Near Banex Plaza',
    deliveryLabel: 'Abuja Doorstep Delivery',
    eta: '1 to 2 working days',
    paymentMethod: 'link',
    subtotal: 45000,
    fee: 2500,
    discount: 1000,
    total: 46500,
    items: [
      {
        productId: 1,
        name: 'Royal Silk Abaya',
        price: 35000,
        qty: 1,
        art: 'abaya',
        color: 'plum',
        opt: 'Size 58',
      },
      {
        productId: 2,
        name: 'Oud Imperial Perfume',
        price: 10000,
        qty: 1,
        art: 'perfume',
        color: 'gold',
        opt: '100ml',
      },
    ],
  };

  const postReq = new Request('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });

  const postRes = await createOrder(postReq);
  const postData = await postRes.json();

  assert(postRes.status === 200, 'POST /api/orders returns HTTP 200');
  assert(postData.success === true, 'POST /api/orders returns success: true');
  assert(postData.order?.id === customOrderId, `Order ID generated matches: ${postData.order?.id}`);
  assert(postData.order?.userId === testUserId, `Order linked to user_id: ${postData.order?.userId}`);
  assert(postData.order?.orderStatus === 'received', 'Initial orderStatus is "received"');
  assert(postData.order?.paymentStatus === 'pending', 'Initial paymentStatus is "pending"');
  assert(postData.order?.items?.length === 2, 'Order has 2 items');
  assert(typeof postData.order?.wa === 'string' && postData.order.wa.includes(customOrderId), 'WhatsApp order confirmation message generated');

  // ---------------------------------------------------------
  // TEST 2: Query Order by ID (GET /api/orders?id=...)
  // ---------------------------------------------------------
  console.log('\n--- TEST 2: GET /api/orders?id=... (Fetch Single Order) ---');
  const getByIdReq = new Request(`http://localhost:3000/api/orders?id=${customOrderId}`);
  const getByIdRes = await getOrders(getByIdReq);
  const getByIdData = await getByIdRes.json();

  assert(getByIdRes.status === 200, 'GET /api/orders?id returns HTTP 200');
  assert(getByIdData.order?.id === customOrderId, `Fetched order ID matches: ${getByIdData.order?.id}`);
  assert(getByIdData.order?.name === 'Amina Bello', 'Fetched order customer name matches');
  assert(getByIdData.order?.total === 46500, 'Fetched order total matches');
  assert(getByIdData.order?.items?.length === 2, 'Fetched order items count matches');

  // ---------------------------------------------------------
  // TEST 3: Query Orders by userId (GET /api/orders?userId=...)
  // ---------------------------------------------------------
  console.log('\n--- TEST 3: GET /api/orders?userId=... (Account Order History) ---');
  const getByUserReq = new Request(`http://localhost:3000/api/orders?userId=${testUserId}`);
  const getByUserRes = await getOrders(getByUserReq);
  const getByUserData = await getByUserRes.json();

  assert(getByUserRes.status === 200, 'GET /api/orders?userId returns HTTP 200');
  assert(Array.isArray(getByUserData.orders), 'GET /api/orders?userId returns an orders array');
  const foundOrder = getByUserData.orders.find((o: any) => o.id === customOrderId);
  assert(Boolean(foundOrder), `User order history includes created order #${customOrderId}`);

  // ---------------------------------------------------------
  // TEST 4: Update Order Status via PATCH (PATCH /api/orders)
  // ---------------------------------------------------------
  console.log('\n--- TEST 4: PATCH /api/orders (Status Transition) ---');
  const patchReq = new Request('http://localhost:3000/api/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: customOrderId,
      orderStatus: 'shipped',
      note: 'Package handed to rider for delivery',
    }),
  });

  const patchRes = await updateOrder(patchReq);
  const patchData = await patchRes.json();

  assert(patchRes.status === 200, 'PATCH /api/orders returns HTTP 200');
  assert(patchData.success === true, 'PATCH /api/orders returns success: true');
  assert(patchData.order?.orderStatus === 'shipped', 'Order status updated to "shipped"');
  assert(patchData.order?.note === 'Package handed to rider for delivery', 'Order note updated');

  // ---------------------------------------------------------
  // TEST 5: Paystack Webhook - Signature Verification & Fulfillment
  // ---------------------------------------------------------
  console.log('\n--- TEST 5: POST /api/webhooks/paystack (Webhook & Verification) ---');
  const secretKey = process.env.PAYSTACK_SECRET_KEY || 'paystack_test_secret_placeholder';
  const paystackReference = 'pstk_ref_' + Date.now();

  const webhookEventPayload = JSON.stringify({
    event: 'charge.success',
    data: {
      id: 99887766,
      domain: 'test',
      status: 'success',
      reference: paystackReference,
      amount: 4650000, // 46,500 in Kobo
      gateway_response: 'Successful',
      paid_at: new Date().toISOString(),
      metadata: {
        orderId: customOrderId,
      },
    },
  });

  // 5a. Test Invalid Signature rejection
  const invalidSigReq = new Request('http://localhost:3000/api/webhooks/paystack', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-paystack-signature': 'invalid_forged_signature_12345',
    },
    body: webhookEventPayload,
  });

  // Only test rejection if not in sandbox fallback
  if (secretKey && !secretKey.includes('your_paystack') && !secretKey.includes('placeholder')) {
    const invalidSigRes = await handlePaystackWebhook(invalidSigReq);
    assert(invalidSigRes.status === 401, 'Webhook correctly rejects invalid signature with HTTP 401');
  } else {
    console.log('ℹ️  Sandbox secret key in use - skipping strict signature rejection test');
  }

  // 5b. Test Valid Signature processing
  const validHmacSignature = crypto
    .createHmac('sha512', secretKey)
    .update(webhookEventPayload)
    .digest('hex');

  const validSigReq = new Request('http://localhost:3000/api/webhooks/paystack', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-paystack-signature': validHmacSignature,
    },
    body: webhookEventPayload,
  });

  const webhookRes = await handlePaystackWebhook(validSigReq);
  const webhookData = await webhookRes.json();

  assert(webhookRes.status === 200, 'Webhook returns HTTP 200 on valid signature');
  assert(webhookData.received === true, 'Webhook returns { received: true }');

  // Verify order transitioned to paid and confirmed
  const verifyReq = new Request(`http://localhost:3000/api/orders?id=${customOrderId}`);
  const verifyRes = await getOrders(verifyReq);
  const verifyData = await verifyRes.json();

  assert(verifyData.order?.paymentStatus === 'paid', 'Order paymentStatus updated to "paid"');
  assert(verifyData.order?.orderStatus === 'confirmed', 'Order orderStatus updated to "confirmed"');

  // ---------------------------------------------------------
  // Summary
  // ---------------------------------------------------------
  console.log('\n======================================================');
  console.log(`📊 SIMULATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('🎉 ALL ORDER & WEBHOOK SIMULATION TESTS PASSED PERFECTLY!');
  } else {
    console.error(`⚠️  ${totalTests - passedTests} TEST(S) FAILED`);
  }
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSimulation().catch((err) => {
  console.error('Fatal simulation error:', err);
  process.exit(1);
});
