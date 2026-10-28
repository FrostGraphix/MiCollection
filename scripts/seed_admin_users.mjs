import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const staff = [
  {
    email: 'admin@micollections.com',
    password: 'admin123@MiCollection',
    name: 'Mariam Siyaka',
    role: 'super_admin',
    roleTitle: 'Super Admin',
    department: 'Executive Operations',
    phone: '08145736483',
  },
  {
    email: 'manager@micollections.com',
    password: 'manager123@MiCollection',
    name: 'Aminu Bello',
    role: 'store_manager',
    roleTitle: 'Store Manager',
    department: 'Merchandising & Catalog',
    phone: '08031234567',
  },
  {
    email: 'dispatch@micollections.com',
    password: 'dispatch123@MiCollection',
    name: 'Chidi Okafor',
    role: 'dispatcher',
    roleTitle: 'Dispatcher',
    department: 'Abuja & Nationwide Logistics',
    phone: '08099887766',
  },
];

async function seedStaff() {
  console.log('--- Seeding Live Staff in Supabase Auth ---');
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
  const existingUsers = listData?.users || [];

  for (const s of staff) {
    const existing = existingUsers.find((u) => u.email === s.email);
    if (!existing) {
      console.log(`Creating ${s.email}...`);
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: s.email,
        password: s.password,
        email_confirm: true,
        user_metadata: {
          full_name: s.name,
          phone: s.phone,
          role: s.role,
          roleTitle: s.roleTitle,
          department: s.department,
        },
        app_metadata: {
          role: s.role,
        },
      });
      if (error) console.error(`Error creating ${s.email}:`, error);
      else console.log(`Created ${s.email} (${data.user.id})`);
    } else {
      console.log(`${s.email} already exists (${existing.id}), updating metadata...`);
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        user_metadata: {
          full_name: s.name,
          phone: s.phone,
          role: s.role,
          roleTitle: s.roleTitle,
          department: s.department,
        },
        app_metadata: {
          role: s.role,
        },
      });
    }
  }

  console.log('✅ Staff seeding complete.');
}

seedStaff().catch(console.error);
