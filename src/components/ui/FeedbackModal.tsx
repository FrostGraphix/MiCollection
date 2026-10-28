'use client';

import React, { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  X,
  Loader2,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  CreditCard,
  Building2,
} from 'lucide-react';

export type FeedbackModalVariant = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface ModalAction {
  label: string;
  onClick?: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'wa' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose?: () => void;
  variant?: FeedbackModalVariant;
  title: string;
  message?: React.ReactNode;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  extraActions?: ModalAction[];
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  variant = 'info',
  title,
  message,
  primaryAction,
  secondaryAction,
  extraActions = [],
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  size = 'md',
  children,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Auto-focus primary button or container
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (primaryBtnRef.current) {
          primaryBtnRef.current.focus();
        } else {
          modalRef.current?.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Variant themes & bespoke animated icons
  const getVariantConfig = () => {
    switch (variant) {
      case 'success':
        return {
          glow: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
          iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 ring-emerald-500/20',
          badgeText: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          badgeLabel: 'Success',
          primaryBtnDefaultVariant: 'primary' as const,
          icon: (
            <div className="relative flex items-center justify-center">
              <span className="absolute -inset-1 rounded-full bg-emerald-400/20 animate-ping opacity-60" />
              <CheckCircle2 className="w-8 h-8 text-emerald-500 transition-transform duration-300 transform group-hover:scale-110" />
            </div>
          ),
        };
      case 'error':
        return {
          glow: 'from-rose-500/20 via-rose-500/5 to-transparent',
          iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 ring-rose-500/20',
          badgeText: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
          badgeLabel: 'Action Required',
          primaryBtnDefaultVariant: 'danger' as const,
          icon: (
            <div className="relative flex items-center justify-center">
              <span className="absolute -inset-1 rounded-full bg-rose-400/20 animate-ping opacity-60" />
              <AlertCircle className="w-8 h-8 text-rose-500 animate-bounce" />
            </div>
          ),
        };
      case 'warning':
        return {
          glow: 'from-amber-500/20 via-amber-500/5 to-transparent',
          iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 ring-amber-500/20',
          badgeText: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
          badgeLabel: 'Warning',
          primaryBtnDefaultVariant: 'primary' as const,
          icon: (
            <div className="relative flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
          ),
        };
      case 'confirm':
        return {
          glow: 'from-purple-500/25 via-purple-500/5 to-transparent',
          iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25 ring-purple-500/20',
          badgeText: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/25',
          badgeLabel: 'Confirmation',
          primaryBtnDefaultVariant: 'primary' as const,
          icon: (
            <div className="relative flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-brand animate-pulse" />
            </div>
          ),
        };
      case 'info':
      default:
        return {
          glow: 'from-blue-500/20 via-blue-500/5 to-transparent',
          iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 ring-blue-500/20',
          badgeText: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
          badgeLabel: 'Information',
          primaryBtnDefaultVariant: 'primary' as const,
          icon: (
            <div className="relative flex items-center justify-center">
              <Info className="w-8 h-8 text-blue-500" />
            </div>
          ),
        };
    }
  };

  const config = getVariantConfig();

  // Width classes
  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[size];

  // Action button style helper
  const renderActionButton = (action: ModalAction, isPrimary = false, ref?: React.RefObject<HTMLButtonElement>) => {
    const btnVariant = action.variant || (isPrimary ? config.primaryBtnDefaultVariant : 'secondary');

    let style = 'px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm ';

    switch (btnVariant) {
      case 'primary':
        style += 'bg-brand hover:bg-brand-deep text-white shadow-brand/20';
        break;
      case 'danger':
        style += 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20';
        break;
      case 'wa':
        style += 'bg-[#25D366] hover:bg-[#20ba59] text-white shadow-emerald-500/20';
        break;
      case 'outline':
        style += 'bg-transparent border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface2)]';
        break;
      case 'ghost':
        style += 'bg-transparent text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface2)]';
        break;
      case 'secondary':
      default:
        style += 'bg-[var(--surface2)] border border-[var(--line)] text-[var(--ink)] hover:bg-purple-500/10';
        break;
    }

    return (
      <button
        ref={ref}
        type="button"
        disabled={action.disabled || action.loading}
        onClick={action.onClick}
        className={style}
      >
        {action.loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          action.icon
        )}
        <span>{action.label}</span>
      </button>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={closeOnBackdrop ? onClose : undefined}
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative w-full ${widthClasses} my-auto bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] shadow-2xl rounded-3xl p-6 sm:p-8 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 outline-none`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), var(--shadow, 0 10px 15px -3px rgba(0,0,0,0.1))',
        }}
      >
        {/* Subtle Ambient Glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-48 bg-gradient-to-b ${config.glow} rounded-full blur-2xl pointer-events-none`}
        />

        {/* Close button */}
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors z-10"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header with animated icon */}
        <div className="flex flex-col items-center text-center relative z-10">
          <div
            className={`w-16 h-16 rounded-2xl border ring-4 flex items-center justify-center mb-4 transition-all duration-300 ${config.iconBg}`}
          >
            {config.icon}
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-2 ${config.badgeText}`}
          >
            {config.badgeLabel}
          </span>

          <h3
            id="feedback-modal-title"
            className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]"
          >
            {title}
          </h3>

          {message && (
            <div className="text-xs sm:text-sm text-[var(--mute)] mt-2 leading-relaxed max-w-sm">
              {message}
            </div>
          )}
        </div>

        {/* Custom optional content / children */}
        {children && <div className="mt-4 relative z-10">{children}</div>}

        {/* Extra Action Buttons (e.g. WhatsApp, Direct Bank Transfer) */}
        {extraActions.length > 0 && (
          <div className="mt-5 space-y-2 relative z-10">
            {extraActions.map((action, idx) => (
              <div key={idx} className="w-full">
                {renderActionButton({ ...action, variant: action.variant || 'outline' })}
              </div>
            ))}
          </div>
        )}

        {/* Primary & Secondary Action Row */}
        {(primaryAction || secondaryAction) && (
          <div
            className={`mt-6 relative z-10 grid gap-2.5 ${
              primaryAction && secondaryAction ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {secondaryAction && renderActionButton(secondaryAction, false)}
            {primaryAction && renderActionButton(primaryAction, true, primaryBtnRef)}
          </div>
        )}
      </div>
    </div>
  );
};
