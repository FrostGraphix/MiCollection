import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instance cache
let adminClientInstance: SupabaseClient | null = null;

/**
 * Validates whether Supabase admin credentials (SERVICE_ROLE_KEY and URL)
 * are properly configured with valid non-placeholder values.
 */
export function isAdminConfigured(
  customUrl?: string,
  customServiceKey?: string
): boolean {
  const supabaseUrl = customUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = customServiceKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return false;
  }

  const trimmedUrl = supabaseUrl.trim();
  const trimmedKey = serviceRoleKey.trim();

  if (
    !trimmedUrl ||
    !trimmedKey ||
    trimmedUrl.includes('placeholder') ||
    trimmedUrl.includes('your-project-id') ||
    trimmedKey.includes('placeholder') ||
    trimmedKey === 'undefined' ||
    trimmedKey === 'null'
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmedUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Creates or retrieves the singleton Supabase admin client using the service role key.
 * Service role client bypasses Row Level Security (RLS) policies and should only be used in secure server contexts.
 *
 * @param forceNew - If true, bypasses singleton cache and creates a fresh client instance.
 */
export function createAdminClient(forceNew = false): SupabaseClient {
  if (adminClientInstance && !forceNew) {
    return adminClientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (isAdminConfigured()) {
    try {
      const client = createClient(supabaseUrl!, serviceRoleKey!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          fetch: (url: any, init?: any) => fetch(url, { ...init, cache: 'no-store' }),
        },
      });

      if (!forceNew) {
        adminClientInstance = client;
      }

      return client;
    } catch (err) {
      console.error('[Supabase Admin] Error initializing Supabase admin client:', err);
    }
  } else {
    if (process.env.NODE_ENV !== 'production' && !serviceRoleKey) {
      console.warn(
        '[Supabase Admin] Warning: SUPABASE_SERVICE_ROLE_KEY is not configured. Falling back to anon key or placeholder.'
      );
    }
  }

  // Graceful fallback for preview, CI, or unconfigured local environments
  const fallbackUrl =
    supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('your-project-id')
      ? supabaseUrl
      : 'https://placeholder-project.supabase.co';

  const fallbackKey =
    serviceRoleKey ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-service-key';

  const fallbackClient = createClient(fallbackUrl, fallbackKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (url: any, init?: any) => fetch(url, { ...init, cache: 'no-store' }),
    },
  });

  if (!forceNew) {
    adminClientInstance = fallbackClient;
  }

  return fallbackClient;
}

/**
 * Resets the cached singleton admin client.
 * Useful for testing, environment switches, or teardown.
 */
export function resetAdminClient(): void {
  adminClientInstance = null;
}

/**
 * Retrieves the cached admin client singleton instance (alias for createAdminClient(false)).
 */
export const getAdminClient = () => createAdminClient(false);
