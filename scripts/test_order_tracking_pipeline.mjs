/**
 * Automated Verification Suite for End-to-End Order Tracking Pipeline Across All Auth States
 * Tests:
 * 1. Missing order ID validation (400)
 * 2. Non-existent order lookup (404)
 * 3. Unauthorized guest access rejection (403)
 * 4. Mismatched email/phone rejection (403)
 * 5. Guest access with verified email (200, masked address)
 * 6. Guest access with verified phone (200)
 * 7. Provision test customer & place live order
 * 8. Authenticated customer session access (200, full address, no email/phone param required)
 * 9. Admin dispatcher access (200, full access)
 * 10. Live dispatch transition (carrier, waybill, rider info) and real-time milestone progression
 * 11. Final delivery transition (100% progress)
 * 12. Cleanup of test artifacts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const adminSupabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonSupabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runOrderTrackingSuite() {
  console.log('====================================================');
  console.log('🚚 TESTING END-TO-END ORDER TRACKING PIPELINE');
  console.log('====================================================\n');

  let testUserId = null;
  let testOrderId = null;
  const testEmail = `track.customer.${Date.now()}@micollections.com`;
  const testPassword = 'SecureTrackingPass123!';
  const testPhone = '08099887766';

  try {
    // ----------------------------------------------------
    // TEST 1: Missing Order ID Validation
    // ----------------------------------------------------
    console.log('[Test 1] Testing missing Order ID on GET /api/track...');
    const missingIdRes = await fetch(`${BASE_URL}/api/track`);
    if (missingIdRes.status !== 400) {
      throw new Error(`Expected 400 for missing ID, got ${missingIdRes.status}`);
    }
    console.log('  ✅ [PASS] Missing order ID correctly rejected with 400 Bad Request');

    // ----------------------------------------------------
    // TEST 2: Non-Existent Order
    // ----------------------------------------------------
    console.log('\n[Test 2] Testing non-existent Order ID on GET /api/track...');
    const notFoundRes = await fetch(`${BASE_URL}/api/track?id=MC-GHOST999`);
    if (notFoundRes.status !== 404) {
      throw new Error(`Expected 404 for ghost order, got ${notFoundRes.status}`);
    }
    console.log('  ✅ [PASS] Non-existent order correctly rejected with 404 Not Found');

    // ----------------------------------------------------
    // TEST 3: Unauthorized Guest Access Rejection
    // ----------------------------------------------------
    console.log('\n[Test 3] Testing unauthorized guest tracking rejection on #MC-19R3L5...');
    const unauthRes = await fetch(`${BASE_URL}/api/track?id=MC-19R3L5`);
    const unauthJson = await unauthRes.json();
    if (unauthRes.status !== 403 || !unauthJson.requiresVerification) {
      throw new Error(`Expected 403 with requiresVerification, got ${unauthRes.status}`);
    }
    console.log('  ✅ [PASS] Guest tracking without verification correctly rejected with 403 Forbidden');

    // ----------------------------------------------------
    // TEST 4: Mismatched Guest Credentials Rejection
    // ----------------------------------------------------
    console.log('\n[Test 4] Testing mismatched email on #MC-19R3L5...');
    const mismatchRes = await fetch(`${BASE_URL}/api/track?id=MC-19R3L5&email=hacker@badactor.com`);
    if (mismatchRes.status !== 403) {
      throw new Error(`Expected 403 for mismatched email, got ${mismatchRes.status}`);
    }
    console.log('  ✅ [PASS] Mismatched guest email rejected with 403 Forbidden');

    // ----------------------------------------------------
    // TEST 5: Verified Guest Email Access
    // ----------------------------------------------------
    console.log('\n[Test 5] Testing verified guest tracking via matching email...');
    const guestEmailRes = await fetch(
      `${BASE_URL}/api/track?id=MC-19R3L5&email=chinedu.okeke@onitshamarket.ng`
    );
    const guestEmailJson = await guestEmailRes.json();
    if (!guestEmailRes.ok || !guestEmailJson.success || !guestEmailJson.tracking) {
      throw new Error(`Verified email tracking failed: ${guestEmailJson.error}`);
    }
    if (guestEmailJson.isFullAccess !== false) {
      throw new Error('Guest should have isFullAccess=false for privacy');
    }
    if (!guestEmailJson.tracking.destination.addressMasked.includes('...')) {
      throw new Error('Guest destination address should be masked for privacy');
    }
    console.log('  ✅ [PASS] Guest verified via email: tracking milestones, masked address returned');

    // ----------------------------------------------------
    // TEST 6: Verified Guest Phone Access
    // ----------------------------------------------------
    console.log('\n[Test 6] Testing verified guest tracking via matching phone (08051239876)...');
    const guestPhoneRes = await fetch(`${BASE_URL}/api/track?id=MC-19R3L5&phone=08051239876`);
    const guestPhoneJson = await guestPhoneRes.json();
    if (!guestPhoneRes.ok || !guestPhoneJson.success) {
      throw new Error(`Verified phone tracking failed: ${guestPhoneJson.error}`);
    }
    console.log('  ✅ [PASS] Guest verified via phone: tracking milestones retrieved successfully');

    // ----------------------------------------------------
    // TEST 7: Provision Customer & Create Live Order
    // ----------------------------------------------------
    console.log(`\n[Test 7] Provisioning customer and creating live order: ${testEmail}...`);
    const { data: userData, error: userErr } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Amina Yusuf', phone: testPhone, state: 'Abuja (FCT)' },
    });
    if (userErr || !userData.user) {
      throw new Error(`Failed to create test customer: ${userErr?.message}`);
    }
    testUserId = userData.user.id;

    // Authenticate customer to obtain JWT
    const { data: authData, error: authErr } = await anonSupabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    if (authErr || !authData.session) {
      throw new Error(`Failed to log in customer: ${authErr?.message}`);
    }
    const customerToken = authData.session.access_token;

    // Place live test order
    testOrderId = 'MC-TRK-' + Date.now().toString(36).toUpperCase().slice(-6);
    const orderPayload = {
      id: testOrderId,
      userId: testUserId,
      name: 'Amina Yusuf',
      phone: testPhone,
      email: testEmail,
      address: 'Villa 12, Aso Drive, Asokoro',
      state: 'Abuja (FCT)',
      deliveryLabel: 'Same-day Abuja Express',
      eta: 'Today within 3 hours',
      payLabel: 'Bank Transfer',
      paymentMethod: 'transfer',
      paymentStatus: 'pending',
      orderStatus: 'received',
      fee: 2500,
      subtotal: 48000,
      total: 50500,
      items: [
        {
          name: 'Classic Velvet Abaya',
          price: 48000,
          qty: 1,
          art: 'abaya',
          color: 'violet',
          opt: 'Size L',
        },
      ],
    };

    const createOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    if (!createOrderRes.ok) {
      throw new Error(`Failed to create test order: ${createOrderRes.statusText}`);
    }
    console.log(`  ✅ [PASS] Live order #${testOrderId} created for customer ${testUserId}`);

    // ----------------------------------------------------
    // TEST 8: Authenticated Customer Tracking with Session Token
    // ----------------------------------------------------
    console.log('\n[Test 8] Testing authenticated customer tracking (bearer token, no email param)...');
    const authTrackRes = await fetch(`${BASE_URL}/api/track?id=${testOrderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const authTrackJson = await authTrackRes.json();
    if (!authTrackRes.ok || !authTrackJson.success) {
      throw new Error(`Authenticated customer tracking failed: ${authTrackJson.error}`);
    }
    if (!authTrackJson.isFullAccess) {
      throw new Error('Authenticated order owner should have isFullAccess=true');
    }
    if (authTrackJson.tracking.destination.addressMasked !== 'Villa 12, Aso Drive, Asokoro, Abuja (FCT)') {
      throw new Error(`Expected unmasked address for owner, got ${authTrackJson.tracking.destination.addressMasked}`);
    }
    console.log('  ✅ [PASS] Authenticated customer authorized without credentials, full address returned');

    // ----------------------------------------------------
    // TEST 9: Admin / Staff Tracking
    // ----------------------------------------------------
    console.log('\n[Test 9] Testing staff admin tracking without guest email...');
    const { data: adminAuthData, error: adminAuthErr } = await anonSupabase.auth.signInWithPassword({
      email: 'admin@micollections.com',
      password: 'admin123@MiCollection',
    });
    if (adminAuthErr || !adminAuthData.session) {
      throw new Error(`Failed to authenticate admin: ${adminAuthErr?.message}`);
    }

    const adminTrackRes = await fetch(`${BASE_URL}/api/track?id=${testOrderId}`, {
      headers: { Authorization: `Bearer ${adminAuthData.session.access_token}` },
    });
    const adminTrackJson = await adminTrackRes.json();
    if (!adminTrackRes.ok || !adminTrackJson.success || !adminTrackJson.isFullAccess) {
      throw new Error(`Admin tracking failed: ${adminTrackJson.error}`);
    }
    console.log('  ✅ [PASS] Staff member authorized to track customer order with full dossier');

    // ----------------------------------------------------
    // TEST 10: Dispatcher Updates Status & Assigns Courier
    // ----------------------------------------------------
    console.log('\n[Test 10] Testing dispatch transition: assigning carrier, waybill, and rider...');
    const dispatchPayload = {
      id: testOrderId,
      orderStatus: 'dispatched',
      carrier: 'GIG Logistics (Nationwide)',
      trackingNumber: 'GIG-ABJ-90412',
      riderName: 'Ibrahim Danjuma',
      riderPhone: '08123456789',
      dispatchNote: 'Fragile luxury apparel, handle with care.',
    };

    const patchRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dispatchPayload),
    });
    if (!patchRes.ok) {
      throw new Error(`Failed to dispatch order: ${patchRes.statusText}`);
    }

    // Verify tracking reflects dispatch in real-time
    const updatedTrackRes = await fetch(`${BASE_URL}/api/track?id=${testOrderId}&email=${testEmail}`);
    const updatedTrackJson = await updatedTrackRes.json();
    if (!updatedTrackRes.ok || !updatedTrackJson.success) {
      throw new Error(`Failed to fetch updated tracking: ${updatedTrackJson.error}`);
    }

    const trk = updatedTrackJson.tracking;
    if (trk.orderStatus !== 'dispatched') {
      throw new Error(`Expected status 'dispatched', got ${trk.orderStatus}`);
    }
    if (trk.carrier !== 'GIG Logistics (Nationwide)') {
      throw new Error(`Expected carrier 'GIG Logistics (Nationwide)', got ${trk.carrier}`);
    }
    if (trk.trackingNumber !== 'GIG-ABJ-90412') {
      throw new Error(`Expected trackingNumber 'GIG-ABJ-90412', got ${trk.trackingNumber}`);
    }
    if (trk.riderName !== 'Ibrahim Danjuma') {
      throw new Error(`Expected rider 'Ibrahim Danjuma', got ${trk.riderName}`);
    }
    if (trk.progressPercent !== 75) {
      throw new Error(`Expected progressPercent=75, got ${trk.progressPercent}`);
    }
    console.log('  ✅ [PASS] Real-time dispatch reflection: Carrier, Waybill, Rider, and 75% progress verified');

    // ----------------------------------------------------
    // TEST 11: Final Delivery Transition
    // ----------------------------------------------------
    console.log('\n[Test 11] Testing delivery completion transition...');
    const deliveryRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: testOrderId, orderStatus: 'delivered' }),
    });
    if (!deliveryRes.ok) {
      throw new Error(`Failed to deliver order: ${deliveryRes.statusText}`);
    }

    const deliveredTrackRes = await fetch(`${BASE_URL}/api/track?id=${testOrderId}&email=${testEmail}`);
    const deliveredTrackJson = await deliveredTrackRes.json();
    if (deliveredTrackJson.tracking.progressPercent !== 100) {
      throw new Error(`Expected progressPercent=100, got ${deliveredTrackJson.tracking.progressPercent}`);
    }
    if (!deliveredTrackJson.tracking.milestones[3].completed) {
      throw new Error('Milestone 4 (Delivered) should be marked completed');
    }
    console.log('  ✅ [PASS] Final delivery reached: 100% progress and delivery milestone verified');

    console.log('\n====================================================');
    console.log('🎉 ALL 11 ORDER TRACKING PIPELINE TESTS PASSED 100%!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ Order Tracking Test Suite Failed:', error);
    process.exit(1);
  } finally {
    if (testOrderId) {
      console.log(`Cleaning up test order #${testOrderId} from Supabase...`);
      try {
        await adminSupabase.from('order_items').delete().eq('order_id', testOrderId);
        await adminSupabase.from('orders').delete().eq('id', testOrderId);
      } catch {}
    }
    if (testUserId) {
      console.log(`Cleaning up test user ${testUserId} from Supabase...`);
      try {
        await adminSupabase.auth.admin.deleteUser(testUserId);
      } catch {}
    }
    console.log('✅ Cleanup complete');
  }
}

runOrderTrackingSuite();
