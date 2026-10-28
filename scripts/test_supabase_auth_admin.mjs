import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log('--- Testing Supabase Auth Admin API ---');
  const { data: users, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    console.error('List users error:', listErr);
    return;
  }
  console.log('Existing users count:', users.users.length);

  // If admin user doesn't exist, create it
  const adminEmail = 'admin@micollections.com';
  const existingAdmin = users.users.find(u => u.email === adminEmail);

  if (!existingAdmin) {
    console.log(`Creating live admin user in Supabase: ${adminEmail}`);
    const { data: newAdmin, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: 'admin123@MiCollection', // Strong real password
      email_confirm: true,
      user_metadata: {
        full_name: 'Mariam Siyaka',
        phone: '08145736483',
        role: 'super_admin',
        department: 'Executive Operations',
        roleTitle: 'Super Admin'
      },
      app_metadata: {
        role: 'super_admin'
      }
    });

    if (createErr) {
      console.error('Failed to create admin user:', createErr);
    } else {
      console.log('Successfully created admin user in Supabase:', newAdmin.user.id, newAdmin.user.email);
    }
  } else {
    console.log('Admin user already exists in Supabase:', existingAdmin.id, existingAdmin.email);
  }

  // Also check if public.profiles has this user
  const { data: profiles, error: profErr } = await supabaseAdmin.from('profiles').select('*');
  console.log('Profiles table rows:', profiles?.length, profiles);
}

run().catch(console.error);
