/**
 * Auth User Profile Pipeline Verification Suite
 * Tests GET, PATCH, and POST (/api/auth/profile) endpoints with live Supabase Auth and public.profiles.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yixzvnwerwcfzdhmjgyi.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ANON_KEY || !SERVICE_KEY) {
  console.error('Missing Supabase keys in environment.');
  process.exit(1);
}

const adminSupabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const clientSupabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = `shopper.profile.${Date.now()}@micollections.com`;
const INITIAL_PWD = 'InitPassword123!';
const UPDATED_PWD = 'UpdatedSecret999!';

let testUserId = null;
let authToken = null;

async function runTestSuite() {
  console.log('====================================================');
  console.log('👤 TESTING AUTH USER PROFILE PIPELINE');
  console.log('====================================================\n');

  // 1. Unauthenticated Security Rejection
  console.log('[Test 1] Testing unauthenticated rejection on /api/auth/profile...');
  const unauthRes = await fetch('http://localhost:3000/api/auth/profile');
  const unauthJson = await unauthRes.json();

  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized, got ${unauthRes.status}`);
  }
  console.log('  ✅ [PASS] Unauthenticated request correctly rejected with 401 Unauthorized');

  // 2. Provision test user & obtain JWT session
  console.log(`\n[Test 2] Provisioning customer: ${TEST_EMAIL}...`);
  const { data: userData, error: userErr } = await adminSupabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: INITIAL_PWD,
    email_confirm: true,
    user_metadata: {
      full_name: 'Farida Al-Mansoor',
      phone: '08145556677',
      state: 'Abuja (FCT)',
      address: 'Plot 22, Amazon Street, Maitama',
    },
  });

  if (userErr || !userData.user) {
    throw new Error(`Failed to create test user: ${userErr?.message}`);
  }
  testUserId = userData.user.id;
  console.log(`  ✅ [PASS] User created with ID: ${testUserId}`);

  // Allow trigger to populate profiles
  await new Promise((r) => setTimeout(r, 1000));

  // Sign in with client to obtain valid JWT token
  console.log('[Test 3] Authenticating customer to obtain live JWT session...');
  const { data: sessionData, error: sessionErr } = await clientSupabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: INITIAL_PWD,
  });

  if (sessionErr || !sessionData.session) {
    throw new Error(`Sign in failed: ${sessionErr?.message}`);
  }
  authToken = sessionData.session.access_token;
  console.log('  ✅ [PASS] Active Supabase JWT session acquired');

  // 3. GET /api/auth/profile with Bearer token
  console.log('\n[Test 4] Querying GET /api/auth/profile with session Bearer token...');
  const getProfileRes = await fetch('http://localhost:3000/api/auth/profile', {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const getProfileJson = await getProfileRes.json();
  if (!getProfileRes.ok || !getProfileJson.success) {
    throw new Error(`Profile GET failed: ${JSON.stringify(getProfileJson)}`);
  }

  console.log('  ✅ [PASS] Profile retrieved successfully:', {
    id: getProfileJson.profile.id,
    name: getProfileJson.profile.full_name,
    email: getProfileJson.profile.email,
    state: getProfileJson.profile.state,
    stats: getProfileJson.stats,
  });

  if (getProfileJson.profile.email !== TEST_EMAIL) {
    throw new Error(`Profile email mismatch: expected ${TEST_EMAIL}, got ${getProfileJson.profile.email}`);
  }

  // 4. PATCH /api/auth/profile (Update Name, Phone, Address, State)
  console.log('\n[Test 5] Updating profile fields via PATCH /api/auth/profile...');
  const updatePayload = {
    full_name: 'Farida Al-Mansoor (VIP Executive)',
    phone: '08091112233',
    address: 'Penthouse 4, Maitama Diplomatic View, Abuja',
    state: 'Abuja (FCT)',
  };

  const patchRes = await fetch('http://localhost:3000/api/auth/profile', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(updatePayload),
  });

  const patchJson = await patchRes.json();
  if (!patchRes.ok || !patchJson.success) {
    throw new Error(`Profile PATCH failed: ${JSON.stringify(patchJson)}`);
  }

  console.log('  ✅ [PASS] Profile updated successfully via API:', {
    name: patchJson.profile.full_name,
    phone: patchJson.profile.phone,
    address: patchJson.profile.address,
  });

  // Verify in PostgreSQL public.profiles table
  const { data: dbCheck, error: dbCheckErr } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', testUserId)
    .single();

  if (dbCheckErr || !dbCheck) {
    throw new Error(`PostgreSQL verification failed: ${dbCheckErr?.message}`);
  }

  if (dbCheck.full_name !== updatePayload.full_name || dbCheck.phone !== updatePayload.phone) {
    throw new Error(`PostgreSQL row does not match updated values: ${JSON.stringify(dbCheck)}`);
  }
  console.log('  ✅ [PASS] PostgreSQL public.profiles row verified with updated values');

  // 5. POST /api/auth/profile (Password Update)
  console.log('\n[Test 6] Updating security password via POST /api/auth/profile...');
  const pwdRes = await fetch('http://localhost:3000/api/auth/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      action: 'update_password',
      newPassword: UPDATED_PWD,
    }),
  });

  const pwdJson = await pwdRes.json();
  if (!pwdRes.ok || !pwdJson.success) {
    throw new Error(`Password update failed: ${JSON.stringify(pwdJson)}`);
  }
  console.log('  ✅ [PASS] Password updated successfully via profile security pipeline');

  // Verify user can now sign in with new password
  console.log('[Test 7] Authenticating with the NEW password to verify credentials in Supabase Auth...');
  const { data: newSignIn, error: newSignInErr } = await clientSupabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: UPDATED_PWD,
  });

  if (newSignInErr || !newSignIn.session) {
    throw new Error(`Failed to sign in with updated password: ${newSignInErr?.message}`);
  }
  console.log('  ✅ [PASS] Successfully authenticated with updated password!');

  // 6. Cleanup
  console.log('\n[Test 8] Cleaning up test customer from Supabase...');
  await adminSupabase.from('profiles').delete().eq('id', testUserId);
  await adminSupabase.auth.admin.deleteUser(testUserId);
  console.log('  ✅ [PASS] Test customer removed from live Supabase');

  console.log('\n====================================================');
  console.log('🎉 ALL 8 PROFILE PIPELINE TESTS PASSED 100%!');
  console.log('====================================================');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
