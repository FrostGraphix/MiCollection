'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Store,
  Sun,
  Moon,
  ExternalLink,
  ShieldCheck,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export const AdminNav: React.FC = () => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { label: 'Executive Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag, badge: '4 Pending' },
    { label: 'Products', href: '/admin/products', icon: Package },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[var(--surface)]/85 border-b border-[var(--line)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand & Crest */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand via-orchid to-brand-deep text-white flex items-center justify-center font-extrabold text-base shadow-md group-hover:scale-105 transition-transform duration-300">
              Mi
            </span>
            <div className="flex flex-col">
              <span className="font-display font-black text-base sm:text-lg tracking-tight text-[var(--ink)] leading-tight">
                MiCollections
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-brand uppercase">
                Executive Suite
              </span>
            </div>
          </Link>

          {/* Abuja Hub Status Pill */}
          <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Store Live 24/7 &bull; Abuja HQ</span>
          </div>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-[var(--surface2)]/80 p-1 rounded-2xl border border-[var(--line)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--surface)] text-brand shadow-sm font-bold'
                    : 'text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded-md bg-brand/10 text-brand text-[10px] font-extrabold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Storefront Link, Theme Toggle, Mariam Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Link to public storefront */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface2)] text-[var(--ink)] hover:text-brand border border-[var(--line)] hover:border-brand/40 transition-colors"
            title="Open Public Customer Storefront in New Tab"
          >
            <Store className="w-3.5 h-3.5 text-brand" />
            <span>Storefront</span>
            <ExternalLink className="w-3 h-3 text-[var(--mute)]" />
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] border border-[var(--line)] transition-colors"
            aria-label="Toggle dark/light theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-violet-500" />
            )}
          </button>

          {/* Executive Owner Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--line)]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-deep to-orchid text-white flex items-center justify-center font-bold text-xs shadow-sm">
              M
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[var(--ink)] leading-tight">
                Mariam
              </span>
              <span className="text-[10px] font-medium text-[var(--mute)] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Owner
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
