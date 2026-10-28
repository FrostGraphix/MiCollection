const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read mockOrders to extract INITIAL_ORDERS
async function seedOrders() {
  console.log('Connecting to Supabase PostgreSQL at aws-1-eu-central-1.pooler.supabase.com:5432...');
  const client = new Client({
    host: process.env.SUPABASE_DB_HOST || 'aws-1-eu-central-1.pooler.supabase.com',
    port: parseInt(process.env.SUPABASE_DB_PORT || '5432', 10),
    user: process.env.SUPABASE_DB_USER || 'postgres.yixzvnwerwcfzdhmjgyi',
    password: process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✅ Connected successfully to remote database!');

  // Check how many orders already exist
  const existingRes = await client.query('SELECT count(*) FROM public.orders;');
  console.log(`Current orders in database: ${existingRes.rows[0].count}`);

  // Load INITIAL_ORDERS
  const mockOrdersModule = require('../src/lib/mockOrders.ts');
  const initialOrders = mockOrdersModule.INITIAL_ORDERS || [];
  console.log(`Found ${initialOrders.length} authentic orders to seed...`);

  let insertedOrders = 0;
  let insertedItems = 0;

  for (const ord of initialOrders) {
    try {
      const orderQuery = `
        INSERT INTO public.orders (
          id, user_id, name, phone, email, address, state, landmark,
          delivery_label, eta, pay_label, payment_method, payment_status,
          order_status, subtotal, fee, discount, total, note, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) ON CONFLICT (id) DO UPDATE SET
          order_status = EXCLUDED.order_status,
          payment_status = EXCLUDED.payment_status,
          total = EXCLUDED.total;
      `;

      await client.query(orderQuery, [
        ord.id,
        null, // user_id (guest / initial order)
        ord.name,
        ord.phone,
        ord.email,
        ord.address,
        ord.state,
        ord.landmark || null,
        ord.deliveryLabel || 'Abuja Doorstep Delivery',
        ord.eta || '1 to 2 working days',
        ord.payLabel || 'Card / USSD Payment',
        ord.paymentMethod || 'link',
        ord.paymentStatus || 'paid',
        ord.orderStatus || 'received',
        ord.subtotal,
        ord.fee,
        ord.discount || 0,
        ord.total,
        ord.note || null,
        ord.createdAt || new Date().toISOString()
      ]);
      insertedOrders++;

      // Insert line items
      if (Array.isArray(ord.items) && ord.items.length > 0) {
        for (const it of ord.items) {
          const itemQuery = `
            INSERT INTO public.order_items (
              order_id, product_id, name, price, qty, art, color, opt
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8
            );
          `;
          await client.query(itemQuery, [
            ord.id,
            it.productId || null,
            it.name,
            it.price,
            it.qty || 1,
            it.art || 'dress',
            it.color || 'violet',
            it.opt || ''
          ]);
          insertedItems++;
        }
      }
    } catch (err) {
      console.warn(`Error inserting order ${ord.id}:`, err.message);
    }
  }

  console.log(`\n🎉 Seeded ${insertedOrders} orders and ${insertedItems} order items into Supabase!`);

  // Verify
  const totalOrdersRes = await client.query('SELECT count(*) FROM public.orders;');
  const totalRevenueRes = await client.query('SELECT sum(total) FROM public.orders;');
  console.log(`✅ Total orders now in Supabase: ${totalOrdersRes.rows[0].count}`);
  console.log(`✅ Total revenue in Supabase: ₦${Number(totalRevenueRes.rows[0].sum).toLocaleString('en-NG')}`);

  await client.end();
}

seedOrders().catch(console.error);
