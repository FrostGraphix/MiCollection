import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceKey) {
  console.error('Missing Supabase configuration environment variables.');
  process.exit(1);
}

const client = createClient(supabaseUrl, anonKey);
const adminSupabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSecurityTests() {
  console.log('====================================================');
  console.log('🛡️  VERIFYING SECURITY HARDENING & AUDIT REMEDIATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, extra = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${testName} ${extra ? `(${extra})` : ''}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${extra ? `(${extra})` : ''}`);
    }
  }

  // -------------------------------------------------------------
  // Test Suite 1: Unauthenticated Perimeter Security Rejection
  // -------------------------------------------------------------
  console.log('[Suite 1] Testing Unauthenticated Access Rejections...');

  // 1.1 GET /api/orders without auth
  try {
    const res = await fetch(`${BASE_URL}/api/orders`);
    assert(
      res.status === 401 || res.status === 403,
      'Test 1: Unauthenticated GET /api/orders rejected',
      `HTTP ${res.status}`
    );
  } catch (err) {
    assert(false, 'Test 1: GET /api/orders request failed', err.message);
  }

  // 1.2 PATCH /api/orders without auth
  try {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'MC-TEST', orderStatus: 'delivered', paymentStatus: 'paid' }),
    });
    assert(
      res.status === 401 || res.status === 403,
      'Test 2: Unauthenticated PATCH /api/orders rejected',
      `HTTP ${res.status}`
    );
  } catch (err) {
    assert(false, 'Test 2: PATCH /api/orders request failed', err.message);
  }

  // 1.3 GET /api/admin/customers without auth
  try {
    const res = await fetch(`${BASE_URL}/api/admin/customers`);
    assert(
      res.status === 401 || res.status === 403,
      'Test 3: Unauthenticated GET /api/admin/customers rejected',
      `HTTP ${res.status}`
    );
  } catch (err) {
    assert(false, 'Test 3: GET /api/admin/customers request failed', err.message);
  }

  // 1.4 GET /api/admin/analytics without auth
  try {
    const res = await fetch(`${BASE_URL}/api/admin/analytics`);
    assert(
      res.status === 401 || res.status === 403,
      'Test 4: Unauthenticated GET /api/admin/analytics rejected',
      `HTTP ${res.status}`
    );
  } catch (err) {
    assert(false, 'Test 4: GET /api/admin/analytics request failed', err.message);
  }

  // 1.5 GET /api/admin/notifications without auth
  try {
    const res = await fetch(`${BASE_URL}/api/admin/notifications`);
    assert(
      res.status === 401 || res.status === 403,
      'Test 5: Unauthenticated GET /api/admin/notifications rejected',
      `HTTP ${res.status}`
    );
  } catch (err) {
    assert(false, 'Test 5: GET /api/admin/notifications request failed', err.message);
  }

  // 1.6 POST /api/admin/products without auth
  try {
    const res = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Malicious Product', price: 10 }),
    });
    assert(
      res.status === 401 || res.status === 403,
      'Test 6: Unauthenticated POST /api/admin/products rejected',
      `HTTP ${res.status}`
    );
  } catch (err) {
    assert(false, 'Test 6: POST /api/admin/products request failed', err.message);
  }

  // -------------------------------------------------------------
  // Test Suite 2: Authenticated Staff Member Authorized Access
  // -------------------------------------------------------------
  console.log('\n[Suite 2] Testing Authenticated Staff Member Access...');

  let staffToken = null;
  try {
    const { data: staffAuth, error: staffErr } = await client.auth.signInWithPassword({
      email: process.env.ADMIN_EMAIL || 'admin@micollections.com',
      password: process.env.ADMIN_DEFAULT_PASSWORD || 'admin123@MiCollection',
    });
    if (!staffErr && staffAuth?.session?.access_token) {
      staffToken = staffAuth.session.access_token;
    }
  } catch (err) {
    console.warn('Could not authenticate staff:', err);
  }

  assert(Boolean(staffToken), 'Test 7: Staff session token acquired from live Supabase Auth');

  if (staffToken) {
    // 2.1 Staff access to GET /api/orders
    try {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      const data = await res.json();
      assert(
        res.ok && Array.isArray(data.orders),
        'Test 8: Authenticated staff member granted access to GET /api/orders',
        `${data.orders?.length || 0} orders returned`
      );
    } catch (err) {
      assert(false, 'Test 8: Staff GET /api/orders failed', err.message);
    }

    // 2.2 Staff access to GET /api/admin/analytics
    try {
      const res = await fetch(`${BASE_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      const data = await res.json();
      assert(
        res.ok && data.success && data.isLiveFromSupabase === true,
        'Test 9: Staff access to GET /api/admin/analytics verified live without mock fallback',
        `Gross Revenue: ${data.kpis?.grossRevenue?.formatted || '₦0'}`
      );
    } catch (err) {
      assert(false, 'Test 9: Staff GET /api/admin/analytics failed', err.message);
    }

    // 2.3 Staff access to GET /api/admin/customers
    try {
      const res = await fetch(`${BASE_URL}/api/admin/customers`, {
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      const data = await res.json();
      assert(
        res.ok && Array.isArray(data.customers),
        'Test 10: Staff access to GET /api/admin/customers verified live',
        `${data.customers?.length || 0} customers aggregated`
      );
    } catch (err) {
      assert(false, 'Test 10: Staff GET /api/admin/customers failed', err.message);
    }
  }

  // -------------------------------------------------------------
  // Test Suite 3: Customer Session Isolation & Cross-Account Protection
  // -------------------------------------------------------------
  console.log('\n[Suite 3] Testing Customer Session Isolation...');

  const testEmail = `shopper.sec.${Date.now()}@gmail.com`;
  const testPassword = 'ShopperSecurePass2026!';
  let customerUser = null;
  let customerToken = null;

  try {
    const { data: created, error: createErr } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Security Test Shopper', phone: '08123456789', state: 'Abuja (FCT)' },
    });

    if (!createErr && created?.user) {
      customerUser = created.user;
      const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      if (!signInErr && signInData?.session?.access_token) {
        customerToken = signInData.session.access_token;
      }
    }
  } catch (err) {
    console.warn('Customer provision error:', err);
  }

  assert(Boolean(customerToken), 'Test 11: Dedicated test customer session provisioned in Supabase');

  if (customerToken && customerUser) {
    // 3.1 Customer accessing their own orders
    try {
      const res = await fetch(`${BASE_URL}/api/orders?userId=${customerUser.id}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const data = await res.json();
      assert(
        res.ok && Array.isArray(data.orders),
        'Test 12: Customer authorized to query their own orders via userId parameter'
      );
    } catch (err) {
      assert(false, 'Test 12: Customer own orders query failed', err.message);
    }

    // 3.2 Customer attempting to access all orders (unauthorized)
    try {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert(
        res.status === 401 || res.status === 403,
        'Test 13: Customer rejected when attempting to harvest all orders',
        `HTTP ${res.status}`
      );
    } catch (err) {
      assert(false, 'Test 13: Customer all-orders request failed', err.message);
    }

    // 3.3 Customer attempting to access another customer's orders
    try {
      const otherUserId = '00000000-0000-0000-0000-000000000001';
      const res = await fetch(`${BASE_URL}/api/orders?userId=${otherUserId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert(
        res.status === 401 || res.status === 403,
        'Test 14: Customer rejected when attempting to view another customer order history',
        `HTTP ${res.status}`
      );
    } catch (err) {
      assert(false, 'Test 14: Cross-account query test failed', err.message);
    }
  }

  // -------------------------------------------------------------
  // Test Suite 4: Guesswork Purging & Fallback Bug Remediation
  // -------------------------------------------------------------
  console.log('\n[Suite 4] Testing Guesswork & Catalog Fallback Fixes...');

  // 4.1 Empty search query must return empty array, NOT fallback mock products
  try {
    const res = await fetch(`${BASE_URL}/api/products?q=nonexistentproduct_xyz_98765`);
    const data = await res.json();
    assert(
      res.ok && Array.isArray(data.products) && data.products.length === 0 && data.total === 0,
      'Test 15: Empty search returns 0 products without leaking mock catalog',
      `Total: ${data.total}`
    );
  } catch (err) {
    assert(false, 'Test 15: Empty search test failed', err.message);
  }

  // 4.2 Single product query for non-existent item returns 404, NOT fallback
  try {
    const res = await fetch(`${BASE_URL}/api/products/999999`);
    assert(
      res.status === 404,
      'Test 16: Non-existent product ID returns clean 404 without mock injection',
      `HTTP ${res.status}`
    );
  } catch (err) {
    assert(false, 'Test 16: Non-existent product test failed', err.message);
  }

  // -------------------------------------------------------------
  // Test Suite 5: Cleanup Test Artifacts
  // -------------------------------------------------------------
  console.log('\n[Suite 5] Cleaning up test artifacts...');
  if (customerUser?.id) {
    try {
      await adminSupabase.from('profiles').delete().eq('id', customerUser.id);
      await adminSupabase.auth.admin.deleteUser(customerUser.id);
      console.log(`  ✅ Cleaned up test customer ${customerUser.id}`);
    } catch (cleanErr) {
      console.warn('Cleanup warning:', cleanErr);
    }
  }

  console.log('\n====================================================');
  if (passed === total) {
    console.log(`🎉 ALL ${passed}/${total} SECURITY & AUDIT REMEDIATION TESTS PASSED 100%!`);
  } else {
    console.warn(`⚠️  ${passed}/${total} tests passed.`);
  }
  console.log('====================================================\n');

  if (passed < total) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
