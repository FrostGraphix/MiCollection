import { NextResponse } from 'next/server';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import {
  verifyStaffAuth,
  verifySuperAdminAuth,
  getStaffAuthSession,
  STAFF_ROLES,
  StaffRole,
  STAFF_EMAILS,
} from '@/lib/adminAuthServer';
import { formatAdminRole, StaffMember, ADMIN_PRESETS } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

function getDefaultDepartment(role: StaffRole): string {
  switch (role) {
    case 'super_admin':
      return 'Executive Operations';
    case 'store_manager':
      return 'Merchandising & Catalog';
    case 'dispatcher':
      return 'Abuja & Nationwide Logistics';
    default:
      return 'Administration';
  }
}

function getDefaultAvatar(role: StaffRole): string {
  switch (role) {
    case 'super_admin':
      return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    case 'store_manager':
      return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
    case 'dispatcher':
      return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80';
    default:
      return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80';
  }
}

// In-memory fallback for local development or when Supabase admin client is unconfigured
const getLocalStaffStore = (): StaffMember[] => {
  const g = globalThis as unknown as { __adminStaffStore?: StaffMember[] };
  if (!g.__adminStaffStore) {
    g.__adminStaffStore = [
      {
        id: 'staff-admin',
        email: process.env.ADMIN_EMAIL || 'admin@micollections.com',
        name: process.env.ADMIN_NAME || 'Mariam Siyaka',
        role: 'super_admin',
        roleTitle: 'Super Admin',
        department: 'Executive Operations',
        phone: '08145736483',
        avatar: ADMIN_PRESETS.super_admin.avatar,
        status: 'active',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        lastSignInAt: new Date().toISOString(),
        createdBy: 'System Root',
      },
      {
        id: 'staff-manager',
        email: process.env.MANAGER_EMAIL || 'manager@micollections.com',
        name: process.env.MANAGER_NAME || 'Aminu Bello',
        role: 'store_manager',
        roleTitle: 'Store Manager',
        department: 'Merchandising & Catalog',
        phone: '08031234567',
        avatar: ADMIN_PRESETS.store_manager.avatar,
        status: 'active',
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        lastSignInAt: new Date(Date.now() - 86400000).toISOString(),
        createdBy: 'Mariam Siyaka',
      },
      {
        id: 'staff-dispatch',
        email: process.env.DISPATCH_EMAIL || 'dispatch@micollections.com',
        name: process.env.DISPATCH_NAME || 'Chidi Okafor',
        role: 'dispatcher',
        roleTitle: 'Dispatcher',
        department: 'Abuja & Nationwide Logistics',
        phone: '08129876543',
        avatar: ADMIN_PRESETS.dispatcher.avatar,
        status: 'active',
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        lastSignInAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        createdBy: 'Mariam Siyaka',
      },
    ];
  }
  return g.__adminStaffStore;
};

// ============================================================================
// 1. GET /api/admin/staff (List all staff members)
// ============================================================================
export async function GET(request: Request) {
  try {
    const isStaff = await verifyStaffAuth(request);
    if (!isStaff) {
      return NextResponse.json(
        { error: 'Unauthorized: Staff credentials required.' },
        { status: 401 }
      );
    }

    if (isAdminConfigured()) {
      try {
        const supabase = createAdminClient();

        // 1. Fetch live Auth users from Supabase Auth admin API
        const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({
          perPage: 100,
        });

        if (!usersErr && usersData?.users) {
          // 2. Fetch public.profiles to enrich names and phones
          const { data: profilesData } = await supabase.from('profiles').select('*');
          const profileMap = new Map<string, any>();
          if (Array.isArray(profilesData)) {
            profilesData.forEach((p) => profileMap.set(p.id, p));
          }

          // 3. Filter for staff users
          const staffUsers: StaffMember[] = [];

          for (const u of usersData.users) {
            const email = (u.email || '').toLowerCase().trim();
            const metaRole = (u.app_metadata?.role || u.user_metadata?.role) as StaffRole | undefined;

            const isRoleStaff = metaRole && STAFF_ROLES.includes(metaRole);
            const isEmailStaff = STAFF_EMAILS.includes(email);

            if (isRoleStaff || isEmailStaff) {
              const role: StaffRole = metaRole || (email.includes('admin') ? 'super_admin' : 'store_manager');
              const prof = profileMap.get(u.id);

              const name =
                u.user_metadata?.name ||
                u.user_metadata?.full_name ||
                prof?.full_name ||
                (email.includes('admin') ? 'Mariam Siyaka' : email.split('@')[0]);

              const phone = u.user_metadata?.phone || prof?.phone || '';
              const department = u.user_metadata?.department || getDefaultDepartment(role);
              const avatar = u.user_metadata?.avatar || getDefaultAvatar(role);
              const status: 'active' | 'suspended' = u.user_metadata?.status === 'suspended' ? 'suspended' : 'active';

              staffUsers.push({
                id: u.id,
                email: u.email || email,
                name,
                role,
                roleTitle: u.user_metadata?.roleTitle || formatAdminRole(role),
                department,
                phone,
                avatar,
                status,
                createdAt: u.created_at || new Date().toISOString(),
                lastSignInAt: u.last_sign_in_at || undefined,
                createdBy: u.user_metadata?.created_by || 'System',
              });
            }
          }

          // Sort staff: super_admin first, then store_manager, then dispatcher, then newest
          const roleWeight: Record<StaffRole, number> = {
            super_admin: 3,
            store_manager: 2,
            dispatcher: 1,
          };

          staffUsers.sort((a, b) => {
            const weightA = roleWeight[a.role] || 0;
            const weightB = roleWeight[b.role] || 0;
            if (weightB !== weightA) return weightB - weightA;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

          const stats = {
            total: staffUsers.length,
            rolesCount: {
              super_admin: staffUsers.filter((s) => s.role === 'super_admin').length,
              store_manager: staffUsers.filter((s) => s.role === 'store_manager').length,
              dispatcher: staffUsers.filter((s) => s.role === 'dispatcher').length,
            },
            activeCount: staffUsers.filter((s) => s.status === 'active').length,
            suspendedCount: staffUsers.filter((s) => s.status === 'suspended').length,
          };

          return NextResponse.json({
            success: true,
            isLiveFromSupabase: true,
            staff: staffUsers,
            stats,
          });
        }
      } catch (err) {
        console.warn('Supabase admin listUsers fallback to local store:', err);
      }
    }

    // Fallback in-memory store
    const localStaff = getLocalStaffStore();
    const stats = {
      total: localStaff.length,
      rolesCount: {
        super_admin: localStaff.filter((s) => s.role === 'super_admin').length,
        store_manager: localStaff.filter((s) => s.role === 'store_manager').length,
        dispatcher: localStaff.filter((s) => s.role === 'dispatcher').length,
      },
      activeCount: localStaff.filter((s) => s.status === 'active').length,
      suspendedCount: localStaff.filter((s) => s.status === 'suspended').length,
    };

    return NextResponse.json({
      success: true,
      isLiveFromSupabase: false,
      staff: localStaff,
      stats,
    });
  } catch (err: any) {
    console.error('Error in GET /api/admin/staff:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ============================================================================
// 2. POST /api/admin/staff (Create / Provision a New Staff Member)
// ============================================================================
export async function POST(request: Request) {
  try {
    // Permission check: Only Super Admins can create staff accounts
    const isSuper = await verifySuperAdminAuth(request);
    if (!isSuper) {
      return NextResponse.json(
        { error: 'Forbidden: Super Administrator credentials required to create staff accounts.' },
        { status: 403 }
      );
    }

    const callerSession = await getStaffAuthSession(request);
    const body = await request.json();

    const name = String(body.name || '').trim();
    const email = String(body.email || '').toLowerCase().trim();
    const role = String(body.role || '').toLowerCase().trim() as StaffRole;
    const department = String(body.department || '').trim();
    const phone = String(body.phone || '').trim();
    const userPassword = String(body.password || '').trim();

    // Validations
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Staff member name must be at least 2 characters long.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid administrative email address.' },
        { status: 400 }
      );
    }

    if (!STAFF_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid staff role. Must be one of: ${STAFF_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    const finalDepartment = department || getDefaultDepartment(role);
    const finalAvatar = getDefaultAvatar(role);

    // Generate secure temporary password if not explicitly supplied
    let finalPassword = userPassword;
    if (!finalPassword || finalPassword.length < 8) {
      const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      finalPassword = `MC!${randomHex}#${randomNum}`;
    }

    // 1. Provision via Live Supabase Auth if configured
    if (isAdminConfigured()) {
      try {
        const supabase = createAdminClient();

        // Check if user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        if (existingUsers?.users?.some((u) => u.email?.toLowerCase() === email)) {
          return NextResponse.json(
            { error: `A staff or customer account with email "${email}" already exists.` },
            { status: 400 }
          );
        }

        // Create user in Supabase Auth
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
          email,
          password: finalPassword,
          email_confirm: true,
          app_metadata: {
            role,
          },
          user_metadata: {
            name,
            full_name: name,
            role,
            roleTitle: formatAdminRole(role),
            department: finalDepartment,
            phone,
            avatar: finalAvatar,
            status: 'active',
            created_by: callerSession?.name || 'Super Admin',
            created_at: new Date().toISOString(),
          },
        });

        if (createError || !createData.user) {
          return NextResponse.json(
            { error: createError?.message || 'Failed to provision staff user in Supabase Auth.' },
            { status: 400 }
          );
        }

        const newUser = createData.user;

        // Upsert public.profiles to maintain relational integrity
        try {
          await supabase.from('profiles').upsert({
            id: newUser.id,
            email,
            full_name: name,
            phone,
            updated_at: new Date().toISOString(),
          });
        } catch (profErr) {
          console.warn('Profile sync warning for new staff:', profErr);
        }

        const newStaff: StaffMember = {
          id: newUser.id,
          email,
          name,
          role,
          roleTitle: formatAdminRole(role),
          department: finalDepartment,
          phone,
          avatar: finalAvatar,
          status: 'active',
          createdAt: newUser.created_at || new Date().toISOString(),
          createdBy: callerSession?.name || 'Super Admin',
        };

        // WhatsApp invite link generation
        const waCleanPhone = phone.replace(/^0/, '234').replace(/[^0-9]/g, '');
        const inviteMessage = `Hello ${name}, your MiCollections staff account has been provisioned!\n\n` +
          `🔐 Portal URL: https://micollection.vercel.app/admin/login\n` +
          `📧 Login Email: ${email}\n` +
          `🔑 Temporary Password: ${finalPassword}\n` +
          `🛡️ Role Assigned: ${formatAdminRole(role)}\n` +
          `🏢 Department: ${finalDepartment}\n\n` +
          `Please log in and update your security credentials.`;

        const waInviteUrl = waCleanPhone
          ? `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(inviteMessage)}`
          : `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;

        return NextResponse.json(
          {
            success: true,
            message: `Staff member ${name} (${formatAdminRole(role)}) created successfully.`,
            staff: newStaff,
            temporaryPassword: finalPassword,
            waInviteUrl,
          },
          { status: 201 }
        );
      } catch (err: any) {
        console.error('Supabase admin staff create error:', err);
        return NextResponse.json(
          { error: err.message || 'Supabase admin creation failed.' },
          { status: 500 }
        );
      }
    }

    // 2. Fallback in-memory provisioning
    const localStaff = getLocalStaffStore();
    if (localStaff.some((s) => s.email.toLowerCase() === email)) {
      return NextResponse.json(
        { error: `Staff member with email "${email}" already exists in local registry.` },
        { status: 400 }
      );
    }

    const newStaff: StaffMember = {
      id: `staff-${Date.now().toString(36)}`,
      email,
      name,
      role,
      roleTitle: formatAdminRole(role),
      department: finalDepartment,
      phone,
      avatar: finalAvatar,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: callerSession?.name || 'Super Admin',
    };

    localStaff.unshift(newStaff);

    return NextResponse.json(
      {
        success: true,
        message: `Staff member ${name} created successfully (sandbox mode).`,
        staff: newStaff,
        temporaryPassword: finalPassword,
        waInviteUrl: `https://wa.me/?text=${encodeURIComponent(`Hello ${name}, welcome to MiCollections operations!`)}`,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error in POST /api/admin/staff:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ============================================================================
// 3. PATCH /api/admin/staff (Update Staff Role, Status, Department, or Password)
// ============================================================================
export async function PATCH(request: Request) {
  try {
    const isSuper = await verifySuperAdminAuth(request);
    if (!isSuper) {
      return NextResponse.json(
        { error: 'Forbidden: Super Administrator credentials required to update staff.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const id = String(body.id || '').trim();

    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required.' }, { status: 400 });
    }

    const role = body.role ? (String(body.role).toLowerCase().trim() as StaffRole) : undefined;
    const department = body.department ? String(body.department).trim() : undefined;
    const phone = body.phone !== undefined ? String(body.phone).trim() : undefined;
    const status = body.status ? (String(body.status).toLowerCase().trim() as 'active' | 'suspended') : undefined;
    const newPassword = body.newPassword ? String(body.newPassword).trim() : undefined;

    if (role && !STAFF_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid staff role.' }, { status: 400 });
    }

    if (status && status !== 'active' && status !== 'suspended') {
      return NextResponse.json({ error: 'Status must be active or suspended.' }, { status: 400 });
    }

    if (isAdminConfigured()) {
      try {
        const supabase = createAdminClient();

        // 1. Fetch current user from Supabase Auth
        const { data: userData, error: getUserErr } = await supabase.auth.admin.getUserById(id);
        if (getUserErr || !userData?.user) {
          return NextResponse.json({ error: 'Staff user not found in database.' }, { status: 404 });
        }

        const currentUser = userData.user;
        const currentMeta = currentUser.user_metadata || {};
        const currentAppMeta = currentUser.app_metadata || {};

        const updatedRole = role || currentAppMeta.role || currentMeta.role || 'store_manager';
        const updatedDepartment = department || currentMeta.department || getDefaultDepartment(updatedRole);
        const updatedPhone = phone !== undefined ? phone : currentMeta.phone || '';
        const updatedStatus = status || currentMeta.status || 'active';

        const updateAttributes: any = {
          app_metadata: {
            ...currentAppMeta,
            role: updatedRole,
          },
          user_metadata: {
            ...currentMeta,
            role: updatedRole,
            roleTitle: formatAdminRole(updatedRole),
            department: updatedDepartment,
            phone: updatedPhone,
            status: updatedStatus,
            updated_at: new Date().toISOString(),
          },
        };

        if (newPassword && newPassword.length >= 8) {
          updateAttributes.password = newPassword;
        }

        // Ban or unban user based on suspension status
        if (updatedStatus === 'suspended') {
          updateAttributes.ban_duration = '87600h'; // 10 years ban
        } else if (status === 'active') {
          updateAttributes.ban_duration = 'none';
        }

        const { data: updatedUserData, error: updateErr } = await supabase.auth.admin.updateUserById(
          id,
          updateAttributes
        );

        if (updateErr || !updatedUserData?.user) {
          return NextResponse.json(
            { error: updateErr?.message || 'Failed to update staff user in Supabase.' },
            { status: 400 }
          );
        }

        // Update public.profiles if phone changed
        if (phone !== undefined) {
          try {
            await supabase.from('profiles').update({ phone: updatedPhone, updated_at: new Date().toISOString() }).eq('id', id);
          } catch {}
        }

        const u = updatedUserData.user;
        const updatedStaff: StaffMember = {
          id: u.id,
          email: u.email || '',
          name: u.user_metadata?.name || u.user_metadata?.full_name || 'Staff Member',
          role: updatedRole,
          roleTitle: formatAdminRole(updatedRole),
          department: updatedDepartment,
          phone: updatedPhone,
          avatar: u.user_metadata?.avatar || getDefaultAvatar(updatedRole),
          status: updatedStatus,
          createdAt: u.created_at || new Date().toISOString(),
          lastSignInAt: u.last_sign_in_at || undefined,
        };

        return NextResponse.json({
          success: true,
          message: `Staff member ${updatedStaff.name} updated successfully.`,
          staff: updatedStaff,
        });
      } catch (err: any) {
        console.error('Supabase admin staff update error:', err);
        return NextResponse.json({ error: err.message || 'Update failed.' }, { status: 500 });
      }
    }

    // Fallback in-memory update
    const localStaff = getLocalStaffStore();
    const index = localStaff.findIndex((s) => s.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Staff member not found.' }, { status: 404 });
    }

    const existing = localStaff[index];
    const updated: StaffMember = {
      ...existing,
      role: role || existing.role,
      roleTitle: role ? formatAdminRole(role) : existing.roleTitle,
      department: department || existing.department,
      phone: phone !== undefined ? phone : existing.phone,
      status: status || existing.status,
    };
    localStaff[index] = updated;

    return NextResponse.json({
      success: true,
      message: `Staff member ${updated.name} updated successfully.`,
      staff: updated,
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/admin/staff:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ============================================================================
// 4. DELETE /api/admin/staff (Revoke & Delete Staff Account)
// ============================================================================
export async function DELETE(request: Request) {
  try {
    const isSuper = await verifySuperAdminAuth(request);
    if (!isSuper) {
      return NextResponse.json(
        { error: 'Forbidden: Super Administrator credentials required to revoke staff access.' },
        { status: 403 }
      );
    }

    const callerSession = await getStaffAuthSession(request);
    const { searchParams } = new URL(request.url);
    const body = request.headers.get('content-type')?.includes('application/json')
      ? await request.json().catch(() => ({}))
      : {};

    const id = searchParams.get('id') || body.id;

    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required for deletion.' }, { status: 400 });
    }

    // Self-deletion protection: Super Admin cannot delete their own active session
    if (callerSession && (callerSession.id === id || callerSession.email === id)) {
      return NextResponse.json(
        { error: 'Security violation: You cannot delete your own active administrative account.' },
        { status: 400 }
      );
    }

    if (isAdminConfigured()) {
      try {
        const supabase = createAdminClient();

        // 1. Check user exists
        const { data: userRes } = await supabase.auth.admin.getUserById(id);
        const targetEmail = userRes?.user?.email?.toLowerCase();

        // Protect primary root admin email
        if (targetEmail === (process.env.ADMIN_EMAIL || 'admin@micollections.com').toLowerCase()) {
          return NextResponse.json(
            { error: 'Security violation: Cannot delete the primary root Super Admin account.' },
            { status: 400 }
          );
        }

        // 2. Delete user from Supabase Auth
        const { error: delErr } = await supabase.auth.admin.deleteUser(id);
        if (delErr) {
          return NextResponse.json(
            { error: delErr.message || 'Failed to delete staff user from Supabase Auth.' },
            { status: 400 }
          );
        }

        // 3. Clean up profiles row
        try {
          await supabase.from('profiles').delete().eq('id', id);
        } catch (profErr) {
          console.warn('Profile deletion cleanup notice:', profErr);
        }

        return NextResponse.json({
          success: true,
          message: 'Staff account access successfully revoked and deleted from live directory.',
        });
      } catch (err: any) {
        console.error('Supabase admin staff delete error:', err);
        return NextResponse.json({ error: err.message || 'Deletion failed.' }, { status: 500 });
      }
    }

    // Fallback in-memory delete
    const localStaff = getLocalStaffStore();
    const index = localStaff.findIndex((s) => s.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Staff member not found.' }, { status: 404 });
    }

    localStaff.splice(index, 1);
    return NextResponse.json({
      success: true,
      message: 'Staff access revoked successfully.',
    });
  } catch (err: any) {
    console.error('Error in DELETE /api/admin/staff:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
