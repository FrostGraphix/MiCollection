'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Percent,
  Bell,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import { getAdminSession, AdminUser } from '@/lib/adminAuth';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    variant: 'brand' | 'amber' | 'emerald';
  };
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ShoppingBag,
    badge: {
      text: '12 new',
      variant: 'emerald',
    },
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: Package,
    badge: {
      text: '4 low',
      variant: 'amber',
    },
  },
  {
    name: 'Customers',
    href: '/admin/customers',
    icon: Users,
  },
  {
    name: 'Discounts',
    href: '/admin/discounts',
    icon: Percent,
  },
  {
    name: 'Emails & Alerts',
    href: '/admin/notifications',
    icon: Bell,
  },
];

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    setCurrentUser(getAdminSession());
    const handleAuthChange = (e: Event) => {
      const custom = e as CustomEvent<{ user: AdminUser | null }>;
      setCurrentUser(custom.detail?.user || null);
    };
    window.addEventListener('mc:admin-auth', handleAuthChange as EventListener);
    return () => {
      window.removeEventListener('mc:admin-auth', handleAuthChange as EventListener);
    };
  }, []);

  const isRouteActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col justify-between backdrop-blur-xl bg-[var(--surface)]/90 border-r border-[var(--line)] transition-all duration-300 shadow-xl ${
          /* Desktop collapsed or expanded */
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          /* Mobile slide-in drawer */
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Brand Emblem */}
        <div className="flex flex-col">
          <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--line)]">
            <Link
              href="/admin"
              className="flex items-center gap-3 overflow-hidden group select-none"
              title="MiCollections Admin Shell"
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand via-brand-deep to-orchid text-white flex items-center justify-center font-black text-sm tracking-tight shadow-md shadow-brand/20 group-hover:scale-105 transition-transform duration-200">
                  Mi
                </div>
                {/* Live Online Ping Dot */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[var(--surface)]" />
                </span>
              </div>

              {(!isCollapsed || isMobileOpen) && (
                <div className="flex flex-col min-w-0 transition-opacity duration-200">
                  <div className="flex items-center gap-1.5 font-display text-base font-bold tracking-tight text-[var(--ink)]">
                    <span>MiCollections</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-brand/10 text-brand font-semibold">
                      v2.0
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--mute)] font-medium tracking-wide uppercase">
                    Admin Suite
                  </span>
                </div>
              )}
            </Link>

            {/* Close Button for Mobile Drawer */}
            {isMobileOpen && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-2 rounded-xl text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface2)]"
                aria-label="Close admin menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none">
            {NAV_ITEMS.map((item) => {
              const active = isRouteActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={isCollapsed && !isMobileOpen ? item.name : undefined}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-brand/15 via-brand/10 to-orchid/10 text-brand border border-brand/25 shadow-sm shadow-brand/5'
                      : 'text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--surface2)]/80'
                  }`}
                >
                  {/* Active Indicator Bar */}
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-brand to-orchid" />
                  )}

                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      active ? 'text-brand' : 'text-[var(--mute)] group-hover:text-[var(--ink)]'
                    }`}
                  />

                  {(!isCollapsed || isMobileOpen) && (
                    <span className="flex-1 truncate">{item.name}</span>
                  )}

                  {/* Notification badge */}
                  {item.badge && (!isCollapsed || isMobileOpen) && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        item.badge.variant === 'emerald'
                          ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                          : item.badge.variant === 'amber'
                          ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                          : 'bg-brand/15 text-brand border border-brand/30'
                      }`}
                    >
                      {item.badge.text}
                    </span>
                  )}

                  {/* Dot badge in collapsed mode */}
                  {item.badge && isCollapsed && !isMobileOpen && (
                    <span
                      className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                        item.badge.variant === 'emerald'
                          ? 'bg-emerald-500'
                          : item.badge.variant === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-brand'
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Storefront Quick Launch & User / Collapse Controls */}
        <div className="p-3 border-t border-[var(--line)] space-y-2 bg-[var(--surface)]/50">
          {/* Quick Launch Storefront Link */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Launch MiCollections Live Storefront in new tab"
            className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-[var(--surface2)] hover:bg-brand hover:text-white text-[var(--ink)] border border-[var(--line)] text-xs font-semibold transition-all duration-200 shadow-sm ${
              isCollapsed && !isMobileOpen ? 'justify-center' : ''
            }`}
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0 group-hover:rotate-45 transition-transform" />
            {(!isCollapsed || isMobileOpen) && (
              <span className="flex-1 truncate">View Storefront</span>
            )}
          </a>

          {/* Current Admin Profile Mini Strip */}
          {currentUser && (!isCollapsed || isMobileOpen) && (
            <div className="px-3 py-2 rounded-2xl bg-gradient-to-r from-brand/5 to-orchid/5 border border-[var(--line)] flex items-center gap-2.5">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-xl object-cover border border-brand/30 flex-shrink-0 shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-[var(--ink)]">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-brand font-medium truncate flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {currentUser.roleTitle}
                </p>
              </div>
            </div>
          )}

          {/* Desktop Collapse / Expand Toggle Button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex w-full items-center justify-center p-2 rounded-xl text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors"
              title={isCollapsed ? 'Expand sidebar (Ctrl+[)' : 'Collapse sidebar (Ctrl+[)'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <div className="flex items-center gap-2 text-xs font-medium">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse Menu</span>
                </div>
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
