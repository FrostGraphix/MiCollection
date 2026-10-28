import { createBrowserClient } from '@supabase/ssr';

let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Validates whether Supabase environment variables are properly configured.
 * Checks that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set,
 * formatted as valid URLs/tokens, and not set to dummy/placeholder values.
 */
export function isSupabaseConfigured(
  customUrl?: string,
  customAnonKey?: string
): boolean {
  const supabaseUrl = customUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = customAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }

  const trimmedUrl = supabaseUrl.trim();
  const trimmedKey = supabaseAnonKey.trim();

  if (!trimmedUrl || !trimmedKey) {
    return false;
  }

  // Reject dummy and placeholder values
  if (
    trimmedUrl.includes('your-project-id') ||
    trimmedUrl.includes('placeholder') ||
    trimmedKey.includes('placeholder') ||
    trimmedKey === 'undefined' ||
    trimmedKey === 'null'
  ) {
    return false;
  }

  // Ensure URL is a valid HTTP/HTTPS URL
  try {
    const parsed = new URL(trimmedUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    // Must have a valid hostname (e.g. yixzvnwerwcfzdhmjgyi.supabase.co)
    if (!parsed.hostname || parsed.hostname.length < 3) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Creates or retrieves a Supabase browser client.
 * In browser environments, reuses the singleton instance to prevent multiple client overhead.
 * In non-browser / server environments, returns a fresh instance.
 */
export function createClient(forceNew = false) {
  if (typeof window !== 'undefined' && browserClientInstance && !forceNew) {
    return browserClientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured()) {
    // Return mock or placeholder client if env vars are not yet configured
    // This ensures local dev and preview never crashes
    return createBrowserClient(
      'https://placeholder-project.supabase.co',
      'placeholder-anon-key'
    );
  }

  const client = createBrowserClient(supabaseUrl!, supabaseAnonKey!);

  if (typeof window !== 'undefined' && !forceNew) {
    browserClientInstance = client;
  }

  return client;
}
