import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Determine redirect URL
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get('origin') ||
      'http://localhost:3000';
    const redirectTo = `${origin}/auth/callback?next=/reset-password`;

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    if (error) {
      console.error('[API /api/auth/reset-password] Supabase error:', error.message);
      if (error.message.toLowerCase().includes('rate limit')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email delivery rate limit reached. Please wait a few minutes before requesting another link.',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message || 'Failed to send password reset email.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a secure password reset link has been dispatched.',
    });
  } catch (err: any) {
    console.error('[API /api/auth/reset-password] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
