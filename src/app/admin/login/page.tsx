'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Crown,
  Store,
  Truck,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  signInAdminWithSupabase,
  getAdminSession,
  ADMIN_PRESETS,
  AdminRole,
} from '@/lib/adminAuth';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeRolePreset, setActiveRolePreset] = useState<AdminRole | null>(null);

  // If already logged in, redirect straight to /admin
  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      router.replace('/admin');
    }
  }, [router]);

  const handleSelectDemoPreset = (role: AdminRole) => {
    const cred = ADMIN_PRESETS[role];
    if (cred) {
      setEmail(cred.email);
      setPassword('');
      setActiveRolePreset(role);
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your administrative email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await signInAdminWithSupabase(email, password);

      if (res.error || !res.user) {
        setErrorMsg(res.error || 'Invalid administrative credentials.');
        setIsLoading(false);
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your connection.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-[var(--bg)] text-[var(--ink)] overflow-hidden">
      {/* Ambient glowing violet mesh backdrop */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-brand/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-orchid/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-brand/10 via-orchid/10 to-transparent blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-lg mx-auto z-10">
        {/* Main Glass Card */}
        <div
          className="p-8 sm:p-10 rounded-[36px] backdrop-blur-2xl bg-[var(--surface)]/90 border border-brand/25 shadow-2xl flex flex-col gap-6 transition-all"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          {/* Header & Brand Emblem */}
          <div className="text-center space-y-2">
            <div className="relative inline-flex items-center justify-center mb-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand via-brand-deep to-orchid text-white flex items-center justify-center font-black text-xl shadow-lg shadow-brand/30">
                Mi
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[var(--surface)]" />
              </span>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--ink)]">
              Admin <em className="serif-italic">Shell</em>
            </h1>
            <p className="text-xs text-[var(--mute)] max-w-sm mx-auto">
              Secure operations portal for MiCollections catalog, orders, and nationwide fulfillment.
            </p>
          </div>

          {/* Quick Demo Login Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--mute)] px-1 uppercase tracking-wider">
              <span>Quick Demo Roles</span>
              <span className="text-brand font-medium normal-case flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto-fill credentials
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Super Admin */}
              <button
                type="button"
                onClick={() => handleSelectDemoPreset('super_admin')}
                className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all text-xs ${
                  activeRolePreset === 'super_admin'
                    ? 'border-brand bg-brand/10 text-brand shadow-sm shadow-brand/10'
                    : 'border-[var(--line)] bg-[var(--surface2)]/80 hover:border-brand/40 text-[var(--ink)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Crown className="w-3.5 h-3.5 text-brand" />
                  {activeRolePreset === 'super_admin' && (
                    <Check className="w-3 h-3 text-brand" />
                  )}
                </div>
                <span className="font-bold truncate">Super Admin</span>
                <span className="text-[10px] text-[var(--mute)] truncate">Full Root</span>
              </button>

              {/* Store Manager */}
              <button
                type="button"
                onClick={() => handleSelectDemoPreset('store_manager')}
                className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all text-xs ${
                  activeRolePreset === 'store_manager'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 shadow-sm shadow-blue-500/10'
                    : 'border-[var(--line)] bg-[var(--surface2)]/80 hover:border-blue-400 text-[var(--ink)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Store className="w-3.5 h-3.5 text-blue-500" />
                  {activeRolePreset === 'store_manager' && (
                    <Check className="w-3 h-3 text-blue-500" />
                  )}
                </div>
                <span className="font-bold truncate">Manager</span>
                <span className="text-[10px] text-[var(--mute)] truncate">Catalog & Ops</span>
              </button>

              {/* Dispatcher */}
              <button
                type="button"
                onClick={() => handleSelectDemoPreset('dispatcher')}
                className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all text-xs ${
                  activeRolePreset === 'dispatcher'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-sm shadow-emerald-500/10'
                    : 'border-[var(--line)] bg-[var(--surface2)]/80 hover:border-emerald-400 text-[var(--ink)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Truck className="w-3.5 h-3.5 text-emerald-500" />
                  {activeRolePreset === 'dispatcher' && (
                    <Check className="w-3 h-3 text-emerald-500" />
                  )}
                </div>
                <span className="font-bold truncate">Dispatcher</span>
                <span className="text-[10px] text-[var(--mute)] truncate">Courier Hub</span>
              </button>
            </div>
          </div>

          {/* Error Message Notice */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 text-xs text-red-600 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[var(--ink)]">
                Admin Work Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setActiveRolePreset(null);
                  }}
                  placeholder="admin@micollections.com"
                  className="w-full h-12 pl-10 pr-4 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-[var(--ink)] placeholder:text-[var(--mute)]"
                />
                <Mail className="w-4 h-4 text-[var(--mute)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[var(--ink)]">
                  Security Passphrase
                </label>
                <span className="text-[11px] text-emerald-500 font-medium">Supabase Auth Verified</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setActiveRolePreset(null);
                  }}
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-11 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-[var(--ink)] placeholder:text-[var(--mute)] font-mono"
                />
                <Lock className="w-4 h-4 text-[var(--mute)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 text-xs font-semibold justify-center disabled:opacity-50 mt-2 shadow-lg shadow-brand/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Security Handshake...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Sign In to Admin Console{' '}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="text-center pt-2 border-t border-[var(--line)]">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-[var(--mute)] hover:text-brand transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Public Storefront
            </Link>
          </div>
        </div>

        {/* Security watermark footer */}
        <p className="text-center text-[11px] text-[var(--mute)] mt-4">
          Protected by MiCollections Hardware & Multi-Role Security Core &bull; FCT Abuja
        </p>
      </div>
    </div>
  );
}
