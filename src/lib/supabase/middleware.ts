import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Route Protection: Customer Account requires Supabase Auth
    if (pathname.startsWith('/account') && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return NextResponse.redirect(loginUrl);
    }

    // Route Protection: Admin Console UI pages and API endpoints require staff session
    const isAdminApi = pathname.startsWith('/api/admin');
    const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login' && !pathname.startsWith('/admin/login/');

    if (isAdminApi || isAdminPage) {
      let isStaff = false;

      // 1. Check mc_admin_session cookie
      const hasAdminCookie = request.cookies.get('mc_admin_session')?.value;
      if (hasAdminCookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(hasAdminCookie));
          if (parsed && (parsed.role === 'super_admin' || parsed.role === 'store_manager' || parsed.role === 'dispatcher')) {
            isStaff = true;
          }
        } catch {
          if (hasAdminCookie.length > 5) isStaff = true;
        }
      }

      // 2. Check Supabase Auth user
      if (!isStaff && user) {
        const role = (user.app_metadata?.role || user.user_metadata?.role) as string | undefined;
        const validRoles = ['super_admin', 'store_manager', 'dispatcher'];
        const email = (user.email || '').toLowerCase().trim();
        const staffEmails = (
          process.env.STAFF_EMAILS ||
          process.env.ADMIN_EMAILS ||
          'admin@micollections.com,manager@micollections.com,dispatch@micollections.com'
        )
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);

        if (
          (role && validRoles.includes(role)) ||
          staffEmails.includes(email)
        ) {
          isStaff = true;
        }
      }

      // 3. Check Authorization header for Bearer tokens
      if (!isStaff && isAdminApi) {
        const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.slice(7).trim();
          try {
            const { data: tokenData, error: tokenErr } = await supabase.auth.getUser(token);
            if (!tokenErr && tokenData?.user) {
              const u = tokenData.user;
              const role = (u.app_metadata?.role || u.user_metadata?.role) as string | undefined;
              const validRoles = ['super_admin', 'store_manager', 'dispatcher'];
              const email = (u.email || '').toLowerCase().trim();
              const staffEmails = (
                process.env.STAFF_EMAILS ||
                process.env.ADMIN_EMAILS ||
                'admin@micollections.com,manager@micollections.com,dispatch@micollections.com'
              )
                .split(',')
                .map((e) => e.trim().toLowerCase())
                .filter(Boolean);

              if (
                (role && validRoles.includes(role)) ||
                staffEmails.includes(email)
              ) {
                isStaff = true;
              }
            }
          } catch {}
        }
      }

      if (!isStaff) {
        if (isAdminApi) {
          return NextResponse.json(
            { error: 'Unauthorized: Staff credentials required' },
            { status: 401 }
          );
        }
        const adminLoginUrl = request.nextUrl.clone();
        adminLoginUrl.pathname = '/admin/login';
        return NextResponse.redirect(adminLoginUrl);
      }
    }
  } catch (err) {
    // Graceful fallback to next response
  }

  return response;
}

