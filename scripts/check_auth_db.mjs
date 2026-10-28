import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: process.env.SUPABASE_DB_HOST || 'aws-1-eu-central-1.pooler.supabase.com',
  port: parseInt(process.env.SUPABASE_DB_PORT || '5432', 10),
  user: process.env.SUPABASE_DB_USER || 'postgres.yixzvnwerwcfzdhmjgyi',
  password: process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT trigger_name, event_manipulation, event_object_table, action_statement
    FROM information_schema.triggers
    WHERE event_object_table IN ('users', 'profiles');
  `);
  console.log('Triggers:', res.rows);

  // Check RLS policies on profiles
  const rls = await client.query(`
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'profiles';
  `);
  console.log('Profiles RLS policies:', rls.rows);

  await client.end();
}

run().catch(console.error);
