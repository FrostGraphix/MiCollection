'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldAlert } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session) {
          setHasValidSession(true);
          setIsCheckingSession(false);
          return;
        }

        // Listen for potential auth state change if hash fragments are being parsed
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (!isMounted) return;
          if (session && (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY')) {
            setHasValidSession(true);
            setIsCheckingSession(false);
          }
        });

        // Timeout fallback if no session is detected within 2 seconds
        setTimeout(() => {
          if (isMounted && isCheckingSession) {
            setIsCheckingSession(false);
          }
        }, 1500);

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } catch (err) {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password.trim(),
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);

      // Auto redirect to account after 2.5 seconds
      setTimeout(() => {
        router.push('/account');
        router.refresh();
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16 sm:py-24">
      <div
        className="p-8 sm:p-10 rounded-[36px] bg-[var(--surface)] border border-[var(--line)] shadow-2xl flex flex-col gap-6"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--pill)] text-brand flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Create <em className="serif-italic">New Password</em>
          </h1>
          <p className="text-xs text-[var(--mute)]">
            Choose a strong, secure password for your MiCollections account.
          </p>
        </div>

        {isCheckingSession ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs text-[var(--mute)]">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
            <span>Verifying recovery link...</span>
          </div>
        ) : !hasValidSession && !isSuccess ? (
          <div className="space-y-5 text-center">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-3 text-left">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-semibold mb-1">Session Expired or Invalid Link</p>
                <p className="leading-relaxed">
                  Your password reset link is invalid or has expired. For your security, recovery links can only be used once.
                </p>
              </div>
            </div>

            <Link
              href="/forgot-password"
              className="btn-primary w-full py-3.5 text-xs font-semibold justify-center"
            >
              Request New Reset Link <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="pt-2">
              <Link href="/login" className="text-xs text-[var(--mute)] hover:underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="space-y-5 text-center">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <p className="text-sm font-bold text-[var(--fg)]">Password Updated!</p>
              <p className="text-xs text-[var(--mute)]">
                Your new password has been saved. Redirecting you to your account...
              </p>
            </div>

            <Link
              href="/account"
              className="btn-primary w-full py-3.5 text-xs font-semibold justify-center"
            >
              Go to My Account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 font-medium text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-12 pl-4 pr-11 rounded-2xl bg-[var(--surface2)] border border-transparent text-sm outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--fg)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    className="w-full h-12 pl-4 pr-11 rounded-2xl bg-[var(--surface2)] border border-transparent text-sm outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--fg)] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3.5 text-xs font-semibold justify-center disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Password...
                  </>
                ) : (
                  <>
                    Update Password <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
