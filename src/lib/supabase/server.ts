import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isSupabaseConfigured } from './client';

export { isSupabaseConfigured };

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 * Manages session cookies through Next.js headers cookie store with graceful fallbacks.
 *
 * @param customCookieStore - Optional custom cookie store to use instead of next/headers cookies()
 */
export function createClient(customCookieStore?: any) {
  let cookieStore: any = customCookieStore;
  if (!cookieStore) {
    try {
      cookieStore = cookies();
    } catch {
      // Safe fallback when executed outside Next.js request context (e.g. node scripts, testing)
      cookieStore = null;
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const cookieHandlers = cookieStore
    ? {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Can happen in Server Component render, handled by middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Can happen in Server Component render, handled by middleware
          }
        },
      }
    : {
        get(_name: string) {
          return undefined;
        },
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      };

  if (!isSupabaseConfigured()) {
    return createServerClient(
      'https://placeholder-project.supabase.co',
      'placeholder-anon-key',
      { cookies: cookieHandlers }
    );
  }

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: cookieHandlers,
    global: {
      fetch: (url: any, init?: any) => fetch(url, { ...init, cache: 'no-store' }),
    },
  });
}
