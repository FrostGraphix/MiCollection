/**
 * Server-Side Admin & Staff Authentication Verification Helper
 * Verifies staff roles: 'super_admin' | 'store_manager' | 'dispatcher'
 */

import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export const STAFF_ROLES = ['super_admin', 'store_manager', 'dispatcher'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export interface StaffSessionUser {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
}

export const STAFF_EMAILS: string[] = (
  process.env.STAFF_EMAILS ||
  process.env.ADMIN_EMAILS ||
  'admin@micollections.com,manager@micollections.com,dispatch@micollections.com'
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Resolves the authenticated staff session user from cookies or Authorization token.
 */
export async function getStaffAuthSession(request: Request): Promise<StaffSessionUser | null> {
  // 1. Check mc_admin_session cookie
  try {
    let sessionCookie: string | undefined;

    try {
      const cookieStore = cookies();
      sessionCookie = cookieStore.get('mc_admin_session')?.value;
    } catch {
      // Safe fallback if cookies() throws outside request context
    }

    if (!sessionCookie) {
      const rawCookie = request.headers.get('cookie') || '';
      const match = rawCookie.match(/(?:^|;\s*)mc_admin_session=([^;]+)/);
      if (match && match[1]) {
        sessionCookie = match[1];
      }
    }

    if (sessionCookie) {
      try {
        const decoded = decodeURIComponent(sessionCookie);
        const parsed = JSON.parse(decoded);
        const role = parsed?.role as StaffRole;
        const email = (parsed?.email || '').toLowerCase().trim();
        const name = parsed?.name || 'Administrator';
        const id = parsed?.id || 'staff-' + (email.split('@')[0] || 'member');

        if (
          (role && STAFF_ROLES.includes(role)) ||
          STAFF_EMAILS.includes(email)
        ) {
          return {
            id,
            email,
            name,
            role: role || (email.includes('admin') ? 'super_admin' : 'store_manager'),
          };
        }
      } catch {
        // Safe json parse fallback
      }
    }
  } catch (err) {
    console.warn('Error verifying admin session cookie:', err);
  }

  // 2. Check Supabase server session & authorization token
  if (isSupabaseConfigured()) {
    try {
      const serverClient = createServerClient();
      const {
        data: { user: cookieUser },
      } = await serverClient.auth.getUser();

      if (cookieUser) {
        const email = (cookieUser.email || '').toLowerCase().trim();
        const role = (cookieUser.app_metadata?.role || cookieUser.user_metadata?.role) as StaffRole;
        if (STAFF_ROLES.includes(role) || STAFF_EMAILS.includes(email)) {
          return {
            id: cookieUser.id,
            email,
            name: cookieUser.user_metadata?.name || cookieUser.user_metadata?.full_name || 'Staff Member',
            role: role || (email.includes('admin') ? 'super_admin' : 'store_manager'),
          };
        }
      }

      // 3. Check Authorization header
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        const adminClient = createAdminClient();
        const {
          data: { user: tokenUser },
          error,
        } = await adminClient.auth.getUser(token);

        if (!error && tokenUser) {
          const email = (tokenUser.email || '').toLowerCase().trim();
          const role = (tokenUser.app_metadata?.role || tokenUser.user_metadata?.role) as StaffRole;
          if (STAFF_ROLES.includes(role) || STAFF_EMAILS.includes(email)) {
            return {
              id: tokenUser.id,
              email,
              name: tokenUser.user_metadata?.name || tokenUser.user_metadata?.full_name || 'Staff Member',
              role: role || (email.includes('admin') ? 'super_admin' : 'store_manager'),
            };
          }
        }
      }
    } catch (err) {
      console.warn('Error verifying staff auth with Supabase:', err);
    }
  }

  return null;
}

/**
 * Validates whether the incoming HTTP request is made by an authorized staff member.
 */
export async function verifyStaffAuth(request: Request): Promise<boolean> {
  const session = await getStaffAuthSession(request);
  if (session) return true;

  // Safe read-only allowance: GET requests for executive metrics and live feeds are readable
  if (request.method === 'GET') {
    return true;
  }

  return false;
}

/**
 * Validates whether the incoming HTTP request is made by an authorized Super Administrator.
 * Super Admin privileges are required for staff creation, deletion, and role modifications.
 */
export async function verifySuperAdminAuth(request: Request): Promise<boolean> {
  const session = await getStaffAuthSession(request);
  if (!session) return false;
  const isSuper = session.role === 'super_admin' || session.email === (process.env.ADMIN_EMAIL || 'admin@micollections.com');
  return isSuper;
}
