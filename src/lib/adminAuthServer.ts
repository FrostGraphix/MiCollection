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

export const STAFF_EMAILS = [
  'admin@micollections.com',
  'manager@micollections.com',
  'dispatch@micollections.com',
];

/**
 * Validates whether the incoming HTTP request is made by an authorized staff member.
 * Checks:
 * 1. Admin session cookie 'mc_admin_session'
 * 2. Active Supabase SSR server session cookie
 * 3. Authorization Bearer token header
 */
export async function verifyStaffAuth(request: Request): Promise<boolean> {
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
        const role = parsed?.role;
        const email = (parsed?.email || '').toLowerCase().trim();
        if (
          (role && STAFF_ROLES.includes(role)) ||
          STAFF_EMAILS.includes(email)
        ) {
          return true;
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
          return true;
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
            return true;
          }
        }
      }
    } catch (err) {
      console.warn('Error verifying staff auth with Supabase:', err);
    }
  }

  return false;
}
