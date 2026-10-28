/**
 * Test Suite: Supabase Client Creators, Configuration, & Health Verification
 *
 * Verifies:
 * 1. src/lib/supabase/client.ts (Browser Client creator & isSupabaseConfigured)
 * 2. src/lib/supabase/server.ts (Server Client creator & safe cookie handling)
 * 3. src/lib/supabase/admin.ts (Admin Client creator, singleton caching, isAdminConfigured)
 * 4. src/lib/supabase/bootstrap.ts (checkDatabaseHealth, helper utilities & schema verification)
 */

import { createClient as createBrowserClient, isSupabaseConfigured } from '../src/lib/supabase/client';
import { createClient as createServerClient } from '../src/lib/supabase/server';
import {
  createAdminClient,
  isAdminConfigured,
  resetAdminClient,
} from '../src/lib/supabase/admin';
import {
  checkDatabaseHealth,
  safeServerQuery,
  safeDbQuery,
  checkTableExists,
  getTableCount,
  verifyRequiredSchema,
} from '../src/lib/supabase/bootstrap';

async function runTests() {
  console.log('================================================================');
  console.log('🚀 Running Supabase Database & Client Architecture Tests');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (detail !== undefined) {
        console.error('     Detail:', detail);
      }
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: isSupabaseConfigured & Environment Validation
  // --------------------------------------------------------------------------
  console.log('--- Test Suite 1: Configuration Validation ---');
  const configured = isSupabaseConfigured();
  assert(configured === true, 'isSupabaseConfigured() returns true for valid production URL and anon key');

  // Test placeholder rejection
  const placeholderUrlCheck = isSupabaseConfigured(
    'https://placeholder-project.supabase.co',
    'valid-key-xyz'
  );
  assert(placeholderUrlCheck === false, 'isSupabaseConfigured() rejects placeholder project URL');

  const placeholderKeyCheck = isSupabaseConfigured(
    'https://yixzvnwerwcfzdhmjgyi.supabase.co',
    'placeholder-anon-key'
  );
  assert(placeholderKeyCheck === false, 'isSupabaseConfigured() rejects placeholder anon key');

  const adminConfigured = isAdminConfigured();
  assert(adminConfigured === true, 'isAdminConfigured() returns true for valid service role key');

  // --------------------------------------------------------------------------
  // TEST 2: Client 1 - Browser Client Creator (src/lib/supabase/client.ts)
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 2: Browser Client Creator ---');
  let browserClient: any;
  try {
    browserClient = createBrowserClient();
    assert(
      Boolean(browserClient && typeof browserClient.from === 'function' && typeof browserClient.auth === 'object'),
      'createBrowserClient() instantiates without exceptions and provides Supabase client API'
    );
  } catch (err: any) {
    assert(false, 'createBrowserClient() threw an exception', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Client 2 - Server Client Creator (src/lib/supabase/server.ts)
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 3: Server Client Creator ---');
  let serverClient: any;
  try {
    // Tests that createServerClient handles running outside of Next.js request context gracefully
    serverClient = createServerClient();
    assert(
      Boolean(serverClient && typeof serverClient.from === 'function' && typeof serverClient.auth === 'object'),
      'createServerClient() instantiates without exceptions outside Next.js request context'
    );
  } catch (err: any) {
    assert(false, 'createServerClient() threw an exception', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Client 3 - Admin Client Creator (src/lib/supabase/admin.ts)
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 4: Admin Client Creator & Singleton Cache ---');
  let adminClient1: any;
  let adminClient2: any;
  try {
    resetAdminClient();
    adminClient1 = createAdminClient();
    assert(
      Boolean(adminClient1 && typeof adminClient1.from === 'function' && typeof adminClient1.auth === 'object'),
      'createAdminClient() instantiates without exceptions'
    );

    adminClient2 = createAdminClient();
    assert(
      adminClient1 === adminClient2,
      'createAdminClient() reuses cached singleton client on subsequent calls'
    );

    const adminClientForced = createAdminClient(true);
    assert(
      adminClientForced !== adminClient1 && Boolean(adminClientForced.from),
      'createAdminClient(forceNew=true) successfully instantiates a fresh client'
    );
  } catch (err: any) {
    assert(false, 'createAdminClient() threw an exception', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Database Health Check (src/lib/supabase/bootstrap.ts)
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 5: checkDatabaseHealth() Verification ---');
  try {
    const health = await checkDatabaseHealth();
    console.log('  Health check result:', {
      isConnected: health.isConnected,
      tablesExist: health.tablesExist,
      productCount: health.productCount,
      error: health.error,
    });

    assert(
      typeof health.isConnected === 'boolean' && health.isConnected === true,
      'checkDatabaseHealth() connects to Supabase remote API successfully'
    );
    assert(
      typeof health.tablesExist === 'boolean',
      'checkDatabaseHealth() returns valid boolean tablesExist'
    );
    assert(
      typeof health.productCount === 'number',
      'checkDatabaseHealth() returns valid number productCount'
    );
    assert(
      health.tables !== undefined &&
        typeof health.tables.products === 'object' &&
        typeof health.tables.categories === 'object' &&
        typeof health.tables.orders === 'object' &&
        typeof health.tables.profiles === 'object',
      'checkDatabaseHealth() returns breakdown for all 4 required tables (products, categories, orders, profiles)'
    );
  } catch (err: any) {
    assert(false, 'checkDatabaseHealth() threw an exception', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Helper Utilities (src/lib/supabase/bootstrap.ts)
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 6: Safe Query Helper Utilities ---');
  try {
    // Test safeServerQuery fallback
    const fallbackProducts = [{ id: 999, name: 'Fallback Product' }];
    const failingPromise = Promise.reject(new Error('Simulated query failure'));
    const safeResult = await safeServerQuery(failingPromise as any, fallbackProducts);
    assert(
      safeResult === fallbackProducts,
      'safeServerQuery() returns fallback value when query fails'
    );

    // Test safeDbQuery
    const safeDbRes = await safeDbQuery(
      async () => ({ data: null, error: { message: 'Table offline' } }),
      ['fallback-item']
    );
    assert(
      safeDbRes.isFallback === true && safeDbRes.data[0] === 'fallback-item',
      'safeDbQuery() marks isFallback = true and returns provided fallback on error'
    );

    // Test getTableCount
    const count = await getTableCount('products');
    assert(typeof count === 'number', `getTableCount('products') returns a safe numeric count (${count})`);

    // Test verifyRequiredSchema
    const schemaVerification = await verifyRequiredSchema();
    assert(
      typeof schemaVerification.valid === 'boolean' && Array.isArray(schemaVerification.missingTables),
      `verifyRequiredSchema() returns schema status (missing: ${schemaVerification.missingTables.join(', ') || 'none'})`
    );
  } catch (err: any) {
    assert(false, 'Helper utilities threw an exception', err.message);
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

  if (passedTests < totalTests) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test execution error:', e);
  process.exit(1);
});
