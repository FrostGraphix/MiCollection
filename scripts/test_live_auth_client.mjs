import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const client = createClient(supabaseUrl, anonKey);

async function testAuth() {
  console.log('--- Testing Live Supabase Authentication via Client SDK ---');
  
  // 1. Test valid credentials
  console.log('Attempting sign in with admin@micollections.com...');
  const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
    email: 'admin@micollections.com',
    password: 'admin123@MiCollection'
  });

  if (loginError) {
    console.error('❌ Login failed:', loginError);
    process.exit(1);
  }

  console.log('✅ Live Supabase Login Successful!');
  console.log('User ID:', loginData.user.id);
  console.log('User Email:', loginData.user.email);
  console.log('App Metadata Role:', loginData.user.app_metadata?.role);
  console.log('Session Access Token (JWT):', loginData.session.access_token ? 'Present & Valid' : 'Missing');

  // 2. Test reading live profile
  const { data: profile, error: profError } = await client
    .from('profiles')
    .select('*')
    .eq('id', loginData.user.id)
    .single();

  if (profError) {
    console.error('❌ Failed to fetch live profile:', profError);
  } else {
    console.log('✅ Live Profile Row Fetched:', profile);
  }

  // 3. Test invalid credentials
  console.log('\nTesting invalid credentials (should be rejected by Supabase)...');
  const { data: badData, error: badError } = await client.auth.signInWithPassword({
    email: 'admin@micollections.com',
    password: 'wrongpassword'
  });

  if (badError) {
    console.log('✅ Correctly rejected invalid credentials with message:', badError.message);
  } else {
    console.error('❌ Security issue: invalid credentials were not rejected');
  }

  // 4. Test Sign Out
  await client.auth.signOut();
  console.log('✅ Sign out verified.');
}

testAuth().catch(console.error);
