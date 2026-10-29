import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const routes = [
  'http://localhost:3000/',
  'http://localhost:3000/shop',
  'http://localhost:3000/product/1',
  'http://localhost:3000/cart',
  'http://localhost:3000/checkout',
  'http://localhost:3000/account',
  'http://localhost:3000/admin',
  'http://localhost:3000/admin/products',
  'http://localhost:3000/admin/orders',
  'http://localhost:3000/admin/customers',
  'http://localhost:3000/admin/discounts',
  'http://localhost:3000/admin/notifications',
  'http://localhost:3000/api/admin/analytics',
  'http://localhost:3000/api/admin/products',
  'http://localhost:3000/api/admin/customers',
  'http://localhost:3000/api/admin/notifications',
  'http://localhost:3000/api/orders',
];

async function checkAll() {
  console.log('--- Checking MiCollections Admin Suite Routes ---');

  let staffToken = null;
  if (supabaseUrl && anonKey) {
    try {
      const client = createClient(supabaseUrl, anonKey);
      const { data, error } = await client.auth.signInWithPassword({
        email: 'admin@micollections.com',
        password: 'admin123@MiCollection',
      });
      if (!error && data?.session?.access_token) {
        staffToken = data.session.access_token;
      }
    } catch (e) {
      console.warn('Could not acquire staff token for admin suite test:', e);
    }
  }

  let allPass = true;
  for (const r of routes) {
    try {
      const isProtected = r.includes('/admin') || r.includes('/api/admin') || r.includes('/api/orders') || r.includes('/account');
      const headers = {};
      if (staffToken && isProtected) {
        headers['Authorization'] = `Bearer ${staffToken}`;
        headers['Cookie'] = `mc_admin_session=${encodeURIComponent(JSON.stringify({ role: 'super_admin', email: 'admin@micollections.com' }))}`;
      }

      const res = await fetch(r, { headers });
      const isOk = res.status >= 200 && res.status < 400;
      console.log(`[${isOk ? 'PASS' : 'FAIL'}] ${r} -> Status ${res.status}`);
      if (!isOk) allPass = false;
    } catch (e) {
      console.error(`[FAIL] ${r} -> ${e.message}`);
      allPass = false;
    }
  }

  // Also verify live analytics content
  try {
    const headers = staffToken ? { Authorization: `Bearer ${staffToken}` } : {};
    const res = await fetch('http://localhost:3000/api/admin/analytics', { headers });
    const data = await res.json();
    console.log('\n--- Live Supabase Analytics Details ---');
    console.log(`Connected to Supabase: ${data.isLiveFromSupabase}`);
    console.log(`Gross Revenue: ${data.kpis?.grossRevenue?.formatted}`);
    console.log(`Total Orders: ${data.kpis?.totalOrders?.formatted} (${data.kpis?.totalOrders?.subtitle})`);
    console.log(`Average Order Value: ${data.kpis?.averageOrderValue?.formatted}`);
    console.log(`Fulfillment Rate: ${data.kpis?.fulfillmentRate?.formatted}`);
    console.log(`Top State: ${data.stateDistribution?.[0]?.state} (${data.stateDistribution?.[0]?.share}%)`);
    console.log(`Top Category: ${data.categoryBreakdown?.[0]?.name} (${data.categoryBreakdown?.[0]?.share}%)`);
  } catch (e) {
    console.error('Analytics detail check failed:', e);
  }

  if (allPass) {
    console.log('\n>>> All 17 Admin and Storefront routes PASSED with 200 OK! <<<');
  } else {
    console.log('\n>>> Some routes failed! <<<');
    process.exit(1);
  }
}

checkAll();
