import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { calculateVIPTier } from '@/lib/utils';
import { UserProfile, UserProfileStats } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * Resolves authenticated user from server session cookies or bearer token.
 */
async function resolveAuthUser(request: Request) {
  if (!isSupabaseConfigured()) return null;

  try {
    // 1. Try server cookie session
    const serverClient = createServerClient();
    const {
      data: { user: cookieUser },
    } = await serverClient.auth.getUser();

    if (cookieUser) return { user: cookieUser, client: serverClient };

    // 2. Try Authorization Bearer token header
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const adminClient = createAdminClient();
      const {
        data: { user: tokenUser },
        error,
      } = await adminClient.auth.getUser(token);

      if (!error && tokenUser) {
        return { user: tokenUser, client: adminClient };
      }
    }
  } catch (err) {
    console.warn('Error resolving auth user in profile pipeline:', err);
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const auth = await resolveAuthUser(request);
    if (!auth || !auth.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Active user session required' },
        { status: 401 }
      );
    }

    const { user } = auth;
    const adminSupabase = createAdminClient(true);

    // Fetch profile from public.profiles
    const { data: profileRow, error: profileErr } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    let profile: UserProfile;

    if (!profileErr && profileRow) {
      profile = profileRow;
    } else {
      // Sync from auth metadata if not yet provisioned
      profile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        state: user.user_metadata?.state || 'Abuja (FCT)',
        address: user.user_metadata?.address || '',
      };
      await adminSupabase.from('profiles').upsert(profile);
    }

    // Fetch user orders to calculate live stats
    let stats: UserProfileStats = {
      totalOrders: 0,
      lifetimeValue: 0,
      tier: 'Regular',
      lastOrderDate: undefined,
    };

    const { data: orders } = await adminSupabase
      .from('orders')
      .select('id, total, created_at')
      .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
      .order('created_at', { ascending: false });

    if (orders && orders.length > 0) {
      const totalOrders = orders.length;
      const lifetimeValue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const lastOrderDate = orders[0]?.created_at
        ? new Date(orders[0].created_at).toISOString().slice(0, 10)
        : undefined;

      stats = {
        totalOrders,
        lifetimeValue,
        tier: calculateVIPTier(lifetimeValue),
        lastOrderDate,
      };
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
      },
      profile,
      stats,
    });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await resolveAuthUser(request);
    if (!auth || !auth.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Active user session required' },
        { status: 401 }
      );
    }

    const { user, client } = auth;
    const body = await request.json();

    const updates: Partial<UserProfile> = {};
    if (typeof body.full_name === 'string') updates.full_name = body.full_name.trim();
    if (typeof body.phone === 'string') updates.phone = body.phone.trim();
    if (typeof body.address === 'string') updates.address = body.address.trim();
    if (typeof body.state === 'string') updates.state = body.state.trim();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid profile fields provided for update' }, { status: 400 });
    }

    const adminSupabase = createAdminClient(true);

    // 1. Update public.profiles row
    const { data: updatedProfile, error: profileErr } = await adminSupabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (profileErr) {
      throw new Error(`Database profile update failed: ${profileErr.message}`);
    }

    // 2. Synchronize user_metadata in Supabase Auth
    try {
      if (client.auth?.updateUser) {
        await client.auth.updateUser({
          data: updates,
        });
      } else {
        await adminSupabase.auth.admin.updateUserById(user.id, {
          user_metadata: updates,
        });
      }
    } catch (metaErr) {
      console.warn('Metadata sync warning:', metaErr);
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully in live Supabase',
    });
  } catch (error: any) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await resolveAuthUser(request);
    if (!auth || !auth.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Active user session required' },
        { status: 401 }
      );
    }

    const { user, client } = auth;
    const body = await request.json();
    const action = body.action || 'update_password';

    if (action === 'update_password') {
      const newPassword = body.newPassword || body.password;
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      // Update password via server client or admin API
      const adminSupabase = createAdminClient(true);
      const { error: pwdErr } = await adminSupabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });

      if (pwdErr) {
        throw new Error(pwdErr.message);
      }

      return NextResponse.json({
        success: true,
        message: 'Security credentials updated successfully',
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Profile POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}
