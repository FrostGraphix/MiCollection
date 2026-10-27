'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { StoreNotification } from '@/types';
import {
  ShoppingBag,
  Tag,
  Users,
  Bell,
  Sun,
  Moon,
  ExternalLink,
  CheckCheck,
  AlertCircle,
  Truck,
  CreditCard,
  Crown,
  ChevronRight,
  Shield,
  Sparkles,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Could not load notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(0);
      }
    } catch (err) {
      console.warn('Could not mark notifications read:', err);
    }
  };

  const navLinks = [
    {
      href: '/admin/orders',
      label: 'Orders & Fulfillment',
      icon: ShoppingBag,
      match: '/admin/orders',
    },
    {
      href: '/admin/discounts',
      label: 'Promo Codes & Discounts',
      icon: Tag,
      match: '/admin/discounts',
    },
    {
      href: '/admin/customers',
      label: 'Customer CRM',
      icon: Users,
      match: '/admin/customers',
    },
  ];

  const getNotifIcon = (type: StoreNotification['type']) => {
    switch (type) {
      case 'order_new':
        return <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />;
      case 'payment_alert':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-500" />;
      case 'order_dispatched':
        return <Truck className="w-3.5 h-3.5 text-amber-500" />;
      case 'vip_customer':
        return <Crown className="w-3.5 h-3.5 text-purple-500" />;
      case 'stock_warning':
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-rose-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans transition-colors duration-300">
      {/* Admin Top Navbar */}
      <header className="sticky top-0 z-40 bg-[var(--nav-bg)] backdrop-blur-xl border-b border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Mark */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-deep text-white flex items-center justify-center font-extrabold text-sm shadow-md group-hover:scale-105 transition-transform">
                Mi
              </div>
              <div>
                <span className="font-display font-bold text-lg tracking-tight text-[var(--ink)]">
                  Mi<b className="text-brand">Collections</b>
                </span>
                <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-brand bg-brand/10 px-2 py-0.5 rounded-full border border-brand/20">
                  Admin Hub
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[var(--surface2)]/80 p-1 rounded-2xl border border-[var(--line)]">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname?.startsWith(link.match);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-brand text-white shadow-md shadow-purple-500/20'
                      : 'text-[var(--mute)] hover:text-[var(--ink)] hover:bg-purple-500/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Controls: Storefront, Notifications, Theme */}
          <div className="flex items-center gap-2">
            
            {/* View Storefront Link */}
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--ink2)] hover:text-brand hover:bg-purple-500/10 border border-[var(--line)] transition-colors"
            >
              <span>View Store</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </Link>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-xl text-[var(--mute)] hover:text-[var(--ink)] hover:bg-purple-500/10 border border-[var(--line)] transition-colors"
                aria-label="Open notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--surface)] text-[var(--ink)] border border-purple-500/20 shadow-2xl overflow-hidden z-50">
                  <div className="p-3.5 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface2)]/80">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-brand">
                        Store Alerts
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-brand hover:underline flex items-center gap-1 font-semibold"
                      >
                        <CheckCheck className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[var(--line)] text-xs">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-[var(--mute)]">
                        No notifications right now.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 hover:bg-purple-500/5 transition-colors flex items-start gap-2.5 ${
                            !notif.read ? 'bg-purple-500/5' : ''
                          }`}
                        >
                          <div className="mt-0.5 p-1 rounded-lg bg-[var(--surface2)] border border-[var(--line)] flex-shrink-0">
                            {getNotifIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-1">
                              <h4 className="font-bold text-xs text-[var(--ink)] truncate">
                                {notif.title}
                              </h4>
                              <span className="text-[10px] text-[var(--mute)] flex-shrink-0">
                                {notif.timestamp}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--mute)] mt-0.5 leading-snug">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--mute)] hover:text-[var(--ink)] hover:bg-purple-500/10 border border-[var(--line)] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-brand" />
              )}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around border-t border-[var(--line)] bg-[var(--surface2)]/90 px-2 py-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname?.startsWith(link.match);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-[var(--mute)] hover:text-[var(--ink)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Minimal Admin Footer */}
      <footer className="border-t border-[var(--line)] py-4 text-center text-xs text-[var(--mute)]">
        MiCollections Store Management Suite • Domain 4: Orders, WhatsApp, CRM & Notification Pipeline
      </footer>
    </div>
  );
}
