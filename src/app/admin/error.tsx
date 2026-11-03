'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, RotateCcw, Lock, Home, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error('[Admin Console Error Caught]:', error);
  }, [error]);

  const handleCopyDetails = () => {
    const diagnostic = `[MiCollections Admin Error]\nMessage: ${error.message}\nDigest: ${error.digest || 'N/A'}\nStack:\n${error.stack || 'N/A'}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(diagnostic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="max-w-lg w-full bg-[var(--surface)]/90 backdrop-blur-xl border border-[var(--line)] shadow-2xl rounded-3xl p-8 space-y-6">
        {/* Header Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand via-brand-deep to-orchid flex items-center justify-center text-white shadow-xl shadow-brand/25">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border-2 border-[var(--surface)]" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand px-3 py-1 rounded-full bg-brand/10 border border-brand/20">
            Operations Core Guard
          </span>
          <h2 className="font-display text-2xl font-black text-[var(--ink)]">
            Operations Console Interruption
          </h2>
          <p className="text-xs sm:text-sm text-[var(--mute)] leading-relaxed">
            An administrative subsystem encountered an unexpected state. You can reload the view, re-authenticate your staff credentials, or return to the storefront.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand to-orchid text-white font-bold text-xs shadow-lg shadow-brand/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/admin/login"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[var(--surface2)] hover:bg-brand/10 text-[var(--ink)] font-semibold text-xs border border-[var(--line)] transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 text-brand" />
            <span>Staff Portal Login</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl text-[var(--mute)] hover:text-[var(--ink)] font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
        </div>

        {/* Collapsible Diagnostics Accordion */}
        <div className="pt-4 border-t border-[var(--line)] text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-[11px] font-semibold text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
          >
            <span>Diagnostic Details</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-[11px] font-mono text-[var(--ink2)] space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--mute)] truncate">
                  Digest: {error.digest || 'Client Component Exception'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyDetails}
                  className="px-2 py-0.5 rounded-lg bg-[var(--surface)] text-[10px] text-brand hover:bg-brand/10 flex items-center gap-1 border border-[var(--line)]"
                  title="Copy error details"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-rose-500 font-bold break-words">{error.message || 'Unknown runtime error'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
