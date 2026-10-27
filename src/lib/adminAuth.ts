/**
 * Admin Authentication & Session Management Core for MiCollections
 * Domain 1: Admin Shell & Security Core
 */

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

export interface DemoAdminCredential {
  email: string;
  password: string;
  role: AdminRole;
  name: string;
  roleTitle: string;
  avatar: string;
  department: string;
}

export const DEMO_ADMINS: Record<AdminRole, DemoAdminCredential> = {
  super_admin: {
    email: 'admin@micollections.com',
    password: 'admin123',
    role: 'super_admin',
    name: 'Mariam Siyaka',
    roleTitle: 'Super Admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'Executive Operations',
  },
  store_manager: {
    email: 'manager@micollections.com',
    password: 'manager123',
    role: 'store_manager',
    name: 'Aminu Bello',
    roleTitle: 'Store Manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Merchandising & Catalog',
  },
  dispatcher: {
    email: 'dispatch@micollections.com',
    password: 'dispatch123',
    role: 'dispatcher',
    name: 'Chidi Okafor',
    roleTitle: 'Dispatcher',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    department: 'Abuja & Nationwide Logistics',
  },
};

const SESSION_STORAGE_KEY = 'mc_admin_session';
const SESSION_COOKIE_KEY = 'mc_admin_session';
const STORE_OPEN_KEY = 'mc_store_open';

// Cookie helpers for client-side storage with fallback to localStorage
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
 * Validates hardcoded demo credentials
 */
export function validateAdminCredentials(email: string, password: string): AdminUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  for (const cred of Object.values(DEMO_ADMINS)) {
    if (cred.email.toLowerCase() === normalizedEmail && cred.password === password) {
      return {
        id: `adm_${cred.role}`,
        email: cred.email,
        name: cred.name,
        role: cred.role,
        roleTitle: cred.roleTitle,
        avatar: cred.avatar,
        department: cred.department,
        lastLogin: new Date().toISOString(),
      };
    }
  }
  return null;
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
        // Re-sync cookie
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
 * Clears admin session from cookie and localStorage
 */
export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  deleteCookie(SESSION_COOKIE_KEY);
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn('localStorage error clearing admin session:', err);
  }

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
