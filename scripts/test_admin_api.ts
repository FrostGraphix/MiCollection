import assert from 'node:assert';
import { GET as getProducts, POST as postProduct, PUT as putProduct, DELETE as deleteProduct } from '@/app/api/admin/products/route';
import { GET as getCustomers } from '@/app/api/admin/customers/route';
import { calculateVIPTier } from '@/lib/utils';
import { GET as getOrders, PATCH as patchOrder } from '@/app/api/orders/route';

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING ADMIN API NODE TEST SUITE');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => Promise<void> | void) {
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  async function asyncTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // ----------------------------------------------------
  // SECTION 1: /api/admin/products
  // ----------------------------------------------------
  console.log('\n--- 1. Testing /api/admin/products ---');

  await asyncTest('GET /api/admin/products returns catalog and categories', async () => {
    const req = new Request('http://localhost:3000/api/admin/products');
    const res = await getProducts(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.products), 'products must be an array');
    assert(data.products.length > 0, 'products must not be empty');
    assert(Array.isArray(data.categories), 'categories must be an array');
    assert(typeof data.total === 'number', 'total must be a number');
  });

  await asyncTest('GET /api/admin/products?cat=wears filters by category', async () => {
    const req = new Request('http://localhost:3000/api/admin/products?cat=wears');
    const res = await getProducts(req);
    const data = await res.json();
    assert(data.products.length > 0, 'should return wears products');
    data.products.forEach((p: any) => {
      assert(
        p.cat === 'wears' || p.cat === 'abayas',
        `Expected cat to be wears/abayas, got ${p.cat}`
      );
    });
  });

  await asyncTest('GET /api/admin/products?status=active filters by active status', async () => {
    const req = new Request('http://localhost:3000/api/admin/products?status=active');
    const res = await getProducts(req);
    const data = await res.json();
    assert(data.products.length > 0, 'should return active products');
    data.products.forEach((p: any) => {
      assert.strictEqual(p.status, 'active');
    });
  });

  await asyncTest('GET /api/admin/products?search=Abaya searches by keyword', async () => {
    const req = new Request('http://localhost:3000/api/admin/products?search=Abaya');
    const res = await getProducts(req);
    const data = await res.json();
    assert(data.products.length > 0, 'should find products matching Abaya');
    data.products.forEach((p: any) => {
      const match =
        p.name.toLowerCase().includes('abaya') ||
        p.desc.toLowerCase().includes('abaya') ||
        p.cat.toLowerCase().includes('abaya');
      assert(match, `Product ${p.name} should match Abaya search`);
    });
  });

  let createdProductId: number;

  await asyncTest('POST /api/admin/products creates a new product', async () => {
    const newProductPayload = {
      name: 'Automated Test Luxury Velvet Dress',
      cat: 'wears',
      price: 49500,
      was: 65000,
      cogs: 27000,
      stock: 12,
      lowStockThreshold: 4,
      status: 'active',
      art: 'dress',
      colors: ['violet', 'black'],
      sizes: ['M', 'L', 'XL'],
      badge: 'New Arrival',
      desc: 'Exclusive velvet evening dress designed for royal occasions.',
      feat: ['Premium Silk Velvet', 'Gold thread embroidery'],
      images: ['https://images.unsplash.com/photo-test-dress'],
    };

    const req = new Request('http://localhost:3000/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProductPayload),
    });

    const res = await postProduct(req);
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert(data.success, 'response success should be true');
    assert(data.product, 'response should include product');
    assert.strictEqual(data.product.name, newProductPayload.name);
    assert.strictEqual(data.product.price, 49500);
    assert.strictEqual(data.product.stock, 12);
    assert.strictEqual(data.product.slug, 'automated-test-luxury-velvet-dress');
    createdProductId = data.product.id;
  });

  await asyncTest('POST /api/admin/products validates missing name/price with 400', async () => {
    const invalidPayload = { desc: 'No name or price here' };
    const req = new Request('http://localhost:3000/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });
    const res = await postProduct(req);
    assert.strictEqual(res.status, 400);
  });

  await asyncTest('PUT /api/admin/products updates an existing product', async () => {
    assert(createdProductId, 'createdProductId must be set');
    const updatePayload = {
      id: createdProductId,
      price: 52000,
      badge: 'Best Seller',
      stock: 8,
    };

    const req = new Request('http://localhost:3000/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });

    const res = await putProduct(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.success, 'response success should be true');
    assert.strictEqual(data.product.price, 52000);
    assert.strictEqual(data.product.badge, 'Best Seller');
    assert.strictEqual(data.product.stock, 8);
  });

  await asyncTest('DELETE /api/admin/products removes the product', async () => {
    assert(createdProductId, 'createdProductId must be set');
    const req = new Request(`http://localhost:3000/api/admin/products?id=${createdProductId}`, {
      method: 'DELETE',
    });

    const res = await deleteProduct(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.success, 'response success should be true');
    assert.strictEqual(data.deletedId, createdProductId);
  });

  // ----------------------------------------------------
  // SECTION 2: /api/admin/customers
  // ----------------------------------------------------
  console.log('\n--- 2. Testing /api/admin/customers ---');

  test('VIP Tier calculation unit test (Bronze / Silver / Gold / Platinum thresholds)', () => {
    assert.strictEqual(calculateVIPTier(350000), 'VIP Platinum');
    assert.strictEqual(calculateVIPTier(250000), 'VIP Platinum');
    assert.strictEqual(calculateVIPTier(150000), 'Gold Member');
    assert.strictEqual(calculateVIPTier(100000), 'Gold Member');
    assert.strictEqual(calculateVIPTier(75000), 'Silver Member');
    assert.strictEqual(calculateVIPTier(50000), 'Silver Member');
    assert.strictEqual(calculateVIPTier(49999), 'Regular');
    assert.strictEqual(calculateVIPTier(0), 'Regular');
  });

  await asyncTest('GET /api/admin/customers returns customers array and aggregate stats', async () => {
    const req = new Request('http://localhost:3000/api/admin/customers');
    const res = await getCustomers(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.customers), 'customers must be an array');
    assert(data.customers.length > 0, 'customers array must not be empty');
    assert(typeof data.total === 'number', 'total must be a number');
    assert(data.stats, 'stats object must exist');
    assert(data.stats.totalShoppers > 0, 'totalShoppers must be > 0');
    assert(data.stats.totalLTV > 0, 'totalLTV must be > 0');
    assert(data.stats.avgLTV > 0, 'avgLTV must be > 0');

    // Verify first customer structure
    const first = data.customers[0];
    assert(first.id, 'customer must have id');
    assert(first.name, 'customer must have name');
    assert(first.phone, 'customer must have phone');
    assert(first.email, 'customer must have email');
    assert(first.state, 'customer must have state');
    assert(typeof first.totalOrders === 'number', 'totalOrders must be a number');
    assert(typeof first.lifetimeValue === 'number', 'lifetimeValue must be a number');
    assert(first.lastOrderDate, 'lastOrderDate must exist');
    assert(first.tier, 'tier must exist');
  });

  await asyncTest('GET /api/admin/customers?tier=VIP Platinum filters by VIP tier', async () => {
    const req = new Request('http://localhost:3000/api/admin/customers?tier=VIP%20Platinum');
    const res = await getCustomers(req);
    const data = await res.json();
    assert(data.customers.length > 0, 'should return VIP Platinum members');
    data.customers.forEach((c: any) => {
      assert.strictEqual(c.tier, 'VIP Platinum');
      assert(c.lifetimeValue >= 250000, `VIP Platinum customer ${c.name} spend should be >= 250k`);
    });
  });

  await asyncTest('GET /api/admin/customers?state=Abuja filters by state', async () => {
    const req = new Request('http://localhost:3000/api/admin/customers?state=Abuja');
    const res = await getCustomers(req);
    const data = await res.json();
    assert(data.customers.length > 0, 'should return Abuja customers');
    data.customers.forEach((c: any) => {
      assert(c.state.toLowerCase().includes('abuja'), `Customer state should be Abuja`);
    });
  });

  await asyncTest('GET /api/admin/customers?search=Zainab searches by name/keyword', async () => {
    const req = new Request('http://localhost:3000/api/admin/customers?search=Zainab');
    const res = await getCustomers(req);
    const data = await res.json();
    assert(data.customers.length > 0, 'should find customer named Zainab');
    data.customers.forEach((c: any) => {
      assert(
        c.name.toLowerCase().includes('zainab') || c.email.toLowerCase().includes('zainab'),
        `Customer should match Zainab`
      );
    });
  });

  await asyncTest('GET /api/admin/customers?id=cust-1 returns single customer', async () => {
    const req = new Request('http://localhost:3000/api/admin/customers?id=cust-1');
    const res = await getCustomers(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.customer, 'response should include customer object');
    assert.strictEqual(data.customer.id, 'cust-1');
    assert.strictEqual(data.customer.name, 'Fatima Mohammed');
  });

  test('Customer order aggregation logic with multi-order spend and date tracking', () => {
    const mockOrders = [
      { id: 'O1', total: 60000, created_at: '2026-10-15T10:00:00Z' },
      { id: 'O2', total: 65000, created_at: '2026-10-25T14:30:00Z' },
    ];
    const totalOrders = mockOrders.length;
    const ltv = mockOrders.reduce((sum, o) => sum + o.total, 0);
    const tier = calculateVIPTier(ltv);
    const sortedDates = mockOrders.map(o => o.created_at).sort();
    const lastDate = sortedDates[sortedDates.length - 1].slice(0, 10);

    assert.strictEqual(totalOrders, 2);
    assert.strictEqual(ltv, 125000);
    assert.strictEqual(tier, 'Gold Member');
    assert.strictEqual(lastDate, '2026-10-25');
  });

  // ----------------------------------------------------
  // SECTION 3: /api/orders (Live order retrieval & PATCH)
  // ----------------------------------------------------
  console.log('\n--- 3. Testing /api/orders verification ---');

  let testOrderId: string;

  await asyncTest('GET /api/orders returns live orders array', async () => {
    const req = new Request('http://localhost:3000/api/orders');
    const res = await getOrders(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.orders), 'orders must be an array');
    assert(data.orders.length > 0, 'orders must not be empty');
    testOrderId = data.orders[0].id;
    assert(testOrderId, 'test order ID must exist');
  });

  await asyncTest('PATCH /api/orders updates order fulfillment status', async () => {
    assert(testOrderId, 'testOrderId must be set');
    const patchPayload = {
      id: testOrderId,
      orderStatus: 'confirmed',
      note: 'Admin confirmed via test suite',
    };

    const req = new Request('http://localhost:3000/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchPayload),
    });

    const res = await patchOrder(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.success, 'response success should be true');
    assert.strictEqual(data.order.orderStatus, 'confirmed');
    assert.strictEqual(data.order.note, 'Admin confirmed via test suite');
  });

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n========================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
