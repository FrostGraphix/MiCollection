/**
 * Admin Authentication & Session Management Core for MiCollections
 * Connected directly to Live Supabase Authentication
 */

import { createClient } from '@/lib/supabase/client';

export type AdminRole = 'super_admin' | 'store_manager' | 'dispatcher';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  roleTitle: string;
  avatar: string;
  department: string;
  lastLogin?: string;
}

export interface AdminPreset {
  email: string;
  role: AdminRole;
  name: string;
  roleTitle: string;
  avatar: string;
  department: string;
}

// Live Supabase Authenticated Staff Accounts
export const ADMIN_PRESETS: Record<AdminRole, AdminPreset> = {
  super_admin: {
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@micollections.com',
    role: 'super_admin',
    name: process.env.NEXT_PUBLIC_ADMIN_NAME || 'Mariam Siyaka',
    roleTitle: 'Super Admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'Executive Operations',
  },
  store_manager: {
    email: process.env.NEXT_PUBLIC_MANAGER_EMAIL || 'manager@micollections.com',
    role: 'store_manager',
    name: process.env.NEXT_PUBLIC_MANAGER_NAME || 'Aminu Bello',
    roleTitle: 'Store Manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Merchandising & Catalog',
  },
  dispatcher: {
    email: process.env.NEXT_PUBLIC_DISPATCH_EMAIL || 'dispatch@micollections.com',
    role: 'dispatcher',
    name: process.env.NEXT_PUBLIC_DISPATCH_NAME || 'Chidi Okafor',
    roleTitle: 'Dispatcher',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    department: 'Abuja & Nationwide Logistics',
  },
};

// Backward-compatible alias
export const DEMO_ADMINS = ADMIN_PRESETS;

const SESSION_STORAGE_KEY = 'mc_admin_session';
const SESSION_COOKIE_KEY = 'mc_admin_session';
const STORE_OPEN_KEY = 'mc_store_open';

// Cookie helpers for client-side storage
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, val: string, days = 7): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(val)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

/**
 * Authenticates admin directly with Live Supabase Auth service
 */
export async function signInAdminWithSupabase(
  email: string,
  password: string
): Promise<{ user: AdminUser | null; error: string | null }> {
  try {
    const supabase = createClient();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user) {
      return {
        user: null,
        error: error?.message || 'Invalid administrative credentials.',
      };
    }

    const sbUser = data.user;

    // 2. Determine admin role from app_metadata or user_metadata
    let role: AdminRole = 'super_admin';
    const metadataRole = (sbUser.app_metadata?.role || sbUser.user_metadata?.role) as AdminRole;

    if (metadataRole && ['super_admin', 'store_manager', 'dispatcher'].includes(metadataRole)) {
      role = metadataRole;
    } else if (cleanEmail.includes('manager')) {
      role = 'store_manager';
    } else if (cleanEmail.includes('dispatch')) {
      role = 'dispatcher';
    }

    const preset = ADMIN_PRESETS[role];

    const adminUser: AdminUser = {
      id: sbUser.id,
      email: sbUser.email || cleanEmail,
      name: sbUser.user_metadata?.full_name || preset?.name || 'Administrator',
      role,
      roleTitle: sbUser.user_metadata?.roleTitle || preset?.roleTitle || formatAdminRole(role),
      avatar: sbUser.user_metadata?.avatar || preset?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      department: sbUser.user_metadata?.department || preset?.department || 'Executive Operations',
      lastLogin: new Date().toISOString(),
    };

    // 3. Save admin session in cookie & localStorage
    setAdminSession(adminUser);

    return {
      user: adminUser,
      error: null,
    };
  } catch (err: any) {
    console.error('Supabase admin login exception:', err);
    return {
      user: null,
      error: err.message || 'Authentication service error.',
    };
  }
}

/**
 * Saves authenticated admin session in both cookie and localStorage
 */
export function setAdminSession(user: AdminUser): void {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify(user);
  setCookie(SESSION_COOKIE_KEY, payload);
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, payload);
  } catch (err) {
    console.warn('localStorage error setting admin session:', err);
  }

  // Notify reactive components in same window
  window.dispatchEvent(new CustomEvent('mc:admin-auth', { detail: { user } }));
}

/**
 * Reads admin session from cookie, falling back to localStorage
 */
export function getAdminSession(): AdminUser | null {
  if (typeof window === 'undefined') return null;

  // 1. Try reading cookie
  const cookieData = getCookie(SESSION_COOKIE_KEY);
  if (cookieData) {
    try {
      const user = JSON.parse(cookieData) as AdminUser;
      if (user && user.role) return user;
    } catch {
      // ignore JSON parse error, check localStorage
    }
  }

  // 2. Fallback to localStorage
  try {
    const localData = localStorage.getItem(SESSION_STORAGE_KEY);
    if (localData) {
      const user = JSON.parse(localData) as AdminUser;
      if (user && user.role) {
        setCookie(SESSION_COOKIE_KEY, localData);
        return user;
      }
    }
  } catch (err) {
    console.warn('localStorage error reading admin session:', err);
  }

  return null;
}

/**
 * Clears admin session from cookie and localStorage, and signs out of Supabase
 */
export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  deleteCookie(SESSION_COOKIE_KEY);
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn('localStorage error clearing admin session:', err);
  }

  try {
    const supabase = createClient();
    supabase.auth.signOut().catch(() => {});
  } catch {}

  window.dispatchEvent(new CustomEvent('mc:admin-auth', { detail: { user: null } }));
}

/**
 * Retrieves the live store open status (defaults to true / Open 24 Hours)
 */
export function isStoreOpen(): boolean {
  if (typeof window === 'undefined') return true;

  const cookieVal = getCookie(STORE_OPEN_KEY);
  if (cookieVal !== null) {
    return cookieVal !== 'false';
  }

  try {
    const localVal = localStorage.getItem(STORE_OPEN_KEY);
    if (localVal !== null) {
      return localVal !== 'false';
    }
  } catch {}

  return true;
}

/**
 * Sets the live store open status and dispatches 'mc:store-status'
 */
export function setStoreOpen(isOpen: boolean): void {
  if (typeof window === 'undefined') return;
  const val = String(isOpen);
  setCookie(STORE_OPEN_KEY, val, 30);
  try {
    localStorage.setItem(STORE_OPEN_KEY, val);
  } catch {}

  window.dispatchEvent(
    new CustomEvent('mc:store-status', {
      detail: { isOpen },
    })
  );
}

/**
 * Formats role into a human-friendly luxury badge label
 */
export function formatAdminRole(role: AdminRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'store_manager':
      return 'Store Manager';
    case 'dispatcher':
      return 'Dispatcher';
    default:
      return 'Admin';
  }
}
