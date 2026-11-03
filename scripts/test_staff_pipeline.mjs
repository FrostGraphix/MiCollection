import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ [PASS] ${message}`);
}

async function runStaffPipelineTest() {
  console.log('====================================================================');
  console.log('🚀 COMPREHENSIVE STAFF CREATION & ROLE PIPELINE E2E VERIFICATION');
  console.log('====================================================================\n');

  assert(Boolean(supabaseUrl && serviceKey), 'Live Supabase credentials configured in environment');

  const adminClient = createClient(supabaseUrl, serviceKey);
  const anonClient = createClient(supabaseUrl, anonKey);

  // 1. Acquire Super Admin Token
  console.log('[Phase 1] Acquiring Live Super Admin Authentication...');
  const { data: superAuth, error: superAuthErr } = await anonClient.auth.signInWithPassword({
    email: process.env.ADMIN_EMAIL || 'admin@micollections.com',
    password: process.env.ADMIN_DEFAULT_PASSWORD || 'admin123@MiCollection',
  });
  assert(!superAuthErr && superAuth?.session?.access_token, 'Super Admin authenticated with live Supabase');
  const superToken = superAuth.session.access_token;
  const superAdminCookie = `mc_admin_session=${encodeURIComponent(
    JSON.stringify({
      id: superAuth.user.id,
      email: superAuth.user.email,
      name: 'Mariam Siyaka',
      role: 'super_admin',
    })
  )}`;

  // 2. Acquire Dispatcher Token (to test permission denial)
  console.log('\n[Phase 2] Acquiring Non-Super-Admin (Dispatcher) Credentials...');
  const { data: dispatchAuth, error: dispatchErr } = await anonClient.auth.signInWithPassword({
    email: process.env.DISPATCH_EMAIL || 'dispatch@micollections.com',
    password: process.env.DISPATCH_DEFAULT_PASSWORD || 'dispatch123@MiCollection',
  });
  assert(!dispatchErr && dispatchAuth?.session?.access_token, 'Dispatcher authenticated with live Supabase');
  const dispatchToken = dispatchAuth.session.access_token;
  const dispatcherCookie = `mc_admin_session=${encodeURIComponent(
    JSON.stringify({
      id: dispatchAuth.user.id,
      email: dispatchAuth.user.email,
      name: 'Chidi Okafor',
      role: 'dispatcher',
    })
  )}`;

  // 3. Verify Permission Guards (Security Boundaries)
  console.log('\n[Phase 3] Testing Permission Boundaries & Access Control...');
  
  // 3.1 Unauthenticated POST should fail
  const unauthPostRes = await fetch(`${BASE_URL}/api/admin/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Hacker', email: 'hacker@test.com', role: 'super_admin' }),
  });
  assert(unauthPostRes.status === 401 || unauthPostRes.status === 403, 'Unauthenticated POST /api/admin/staff rejected (HTTP 401/403)');

  // 3.2 Dispatcher POST should be rejected (403 Forbidden)
  const forbiddenPostRes = await fetch(`${BASE_URL}/api/admin/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': dispatcherCookie,
      'Authorization': `Bearer ${dispatchToken}`,
    },
    body: JSON.stringify({ name: 'Illegal Manager', email: 'illegal@test.com', role: 'store_manager' }),
  });
  assert(forbiddenPostRes.status === 403, 'Non-super admin forbidden from creating staff (HTTP 403)');

  // 4. Staff Creation by Super Admin
  console.log('\n[Phase 4] Executing Staff Creation via POST /api/admin/staff...');
  const testEmail = `staff.e2e.${Date.now()}@micollections.com`;
  const staffPayload = {
    name: 'Amina Danjuma-Sule',
    email: testEmail,
    role: 'store_manager',
    department: 'Haute Couture & Abayas',
    phone: '08149876543',
  };

  const createRes = await fetch(`${BASE_URL}/api/admin/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': superAdminCookie,
      'Authorization': `Bearer ${superToken}`,
    },
    body: JSON.stringify(staffPayload),
  });

  const createData = await createRes.json();
  assert(createRes.status === 201 && createData.success, 'Staff member successfully created (HTTP 201)');
  assert(Boolean(createData.temporaryPassword && createData.temporaryPassword.length >= 8), 'Temporary secure password generated');
  assert(createData.staff?.email === testEmail, 'Staff email matches provisioned payload');
  assert(createData.staff?.role === 'store_manager', 'Staff role correctly set to store_manager');
  assert(Boolean(createData.waInviteUrl && createData.waInviteUrl.includes('https://wa.me')), 'WhatsApp invitation link generated');

  const createdStaffId = createData.staff.id;
  const tempPassword = createData.temporaryPassword;

  // 5. Verify in Live Supabase Auth & DB Tables
  console.log('\n[Phase 5] Verifying Provisioned User in Live Supabase Auth & public.profiles...');
  const { data: sbUserRes, error: sbUserErr } = await adminClient.auth.admin.getUserById(createdStaffId);
  assert(!sbUserErr && sbUserRes?.user, 'User discovered in live Supabase Auth');
  assert(sbUserRes.user.app_metadata?.role === 'store_manager', 'Supabase Auth app_metadata.role verified as store_manager');
  assert(sbUserRes.user.user_metadata?.department === 'Haute Couture & Abayas', 'Supabase Auth user_metadata.department verified');

  const { data: profileRow, error: profileErr } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', createdStaffId)
    .single();
  assert(!profileErr && profileRow, 'User row verified in live public.profiles');
  assert(profileRow.full_name === 'Amina Danjuma-Sule', 'Profile full_name matches provisioned name');

  // 6. Test Immediate Authentication with New Credentials
  console.log('\n[Phase 6] Testing Live Authentication with Generated Credentials...');
  const { data: newStaffAuth, error: newStaffAuthErr } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: tempPassword,
  });
  assert(!newStaffAuthErr && newStaffAuth?.session?.access_token, 'New staff member successfully signed in using generated key');
  assert(newStaffAuth.user.id === createdStaffId, 'Signed in user ID matches provisioned staff ID');

  // 7. Test Staff Directory GET
  console.log('\n[Phase 7] Testing Staff Directory Listing via GET /api/admin/staff...');
  const getStaffRes = await fetch(`${BASE_URL}/api/admin/staff`, {
    headers: {
      'Cookie': superAdminCookie,
      'Authorization': `Bearer ${superToken}`,
    },
  });
  const getStaffData = await getStaffRes.json();
  assert(getStaffRes.ok && Array.isArray(getStaffData.staff), 'Staff directory returned successfully (HTTP 200)');
  const foundInList = getStaffData.staff.find((s) => s.id === createdStaffId);
  assert(Boolean(foundInList), 'Newly provisioned staff found in active staff directory');
  assert(getStaffData.stats?.total >= 4, 'Stats reflects increased staff count');

  // 8. Test Staff Profile Update (PATCH /api/admin/staff)
  console.log('\n[Phase 8] Testing Staff Profile & Role Update via PATCH /api/admin/staff...');
  const patchRes = await fetch(`${BASE_URL}/api/admin/staff`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': superAdminCookie,
      'Authorization': `Bearer ${superToken}`,
    },
    body: JSON.stringify({
      id: createdStaffId,
      department: 'Executive Merchandising (Promoted)',
      status: 'active',
    }),
  });
  const patchData = await patchRes.json();
  assert(patchRes.ok && patchData.success, 'Staff member updated via PATCH (HTTP 200)');
  assert(patchData.staff?.department === 'Executive Merchandising (Promoted)', 'Department updated to Executive Merchandising');

  // 9. Test Self-Deletion Protection
  console.log('\n[Phase 9] Testing Self-Deletion Security Guard...');
  const selfDelRes = await fetch(`${BASE_URL}/api/admin/staff?id=${superAuth.user.id}`, {
    method: 'DELETE',
    headers: {
      'Cookie': superAdminCookie,
      'Authorization': `Bearer ${superToken}`,
    },
  });
  assert(selfDelRes.status === 400, 'Self-deletion rejected with security violation (HTTP 400)');

  // 10. Test Staff Revocation & Deletion
  console.log('\n[Phase 10] Testing Staff Revocation & Deletion via DELETE /api/admin/staff...');
  const deleteRes = await fetch(`${BASE_URL}/api/admin/staff?id=${createdStaffId}`, {
    method: 'DELETE',
    headers: {
      'Cookie': superAdminCookie,
      'Authorization': `Bearer ${superToken}`,
    },
  });
  const deleteData = await deleteRes.json();
  assert(deleteRes.ok && deleteData.success, 'Staff member access revoked and deleted (HTTP 200)');

  // Verify purged from Supabase Auth
  const { data: purgedAuth } = await adminClient.auth.admin.getUserById(createdStaffId);
  assert(!purgedAuth?.user, 'Staff user confirmed purged from live Supabase Auth');

  // Verify purged from public.profiles
  const { data: purgedProfile } = await adminClient.from('profiles').select('*').eq('id', createdStaffId).single();
  assert(!purgedProfile, 'Staff profile confirmed purged from live public.profiles');

  console.log('\n====================================================================');
  console.log('🎉 ENTIRE STAFF CREATION & MANAGEMENT PIPELINE CONFIRMED 100% OPERATIONAL!');
  console.log('====================================================================\n');
}

runStaffPipelineTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
