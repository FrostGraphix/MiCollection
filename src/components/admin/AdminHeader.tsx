'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Shield,
  Clock,
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  getAdminSession,
  clearAdminSession,
  isStoreOpen,
  setStoreOpen,
  AdminUser,
  formatAdminRole,
} from '@/lib/adminAuth';
import { AudioAlert } from './AudioAlert';
import { useTheme } from '@/context/ThemeContext';

interface AdminHeaderProps {
  onToggleMobileMenu?: () => void;
  onOpenSearch?: () => void;
}

interface StoreNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'order' | 'stock' | 'payment' | 'dispatch';
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: StoreNotification[] = [
  {
    id: 'n1',
    title: 'New Order #MC-9842',
    desc: 'Halima B. ordered 2x Emerald Velvet Abaya (₦78,000)',
    time: '3m ago',
    type: 'order',
    unread: true,
  },
  {
    id: 'n2',
    title: 'Low Stock Alert',
    desc: 'Chunky Sole Street Sneakers in Plum (2 pairs left)',
    time: '24m ago',
    type: 'stock',
    unread: true,
  },
  {
    id: 'n3',
    title: 'Paystack Payment Confirmed',
    desc: 'Instant settlement received for order #MC-9839',
    time: '1h ago',
    type: 'payment',
    unread: false,
  },
  {
    id: 'n4',
    title: 'Courier Dispatched',
    desc: 'Rider Tanko departed with Abuja doorstep batch',
    time: '2h ago',
    type: 'dispatch',
    unread: false,
  },
];

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleMobileMenu,
  onOpenSearch,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [storeActive, setStoreActive] = useState<boolean>(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<StoreNotification[]>(INITIAL_NOTIFICATIONS);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Sync session and store status
  useEffect(() => {
    setCurrentUser(getAdminSession());
    setStoreActive(isStoreOpen());

    const handleAuthChange = (e: Event) => {
      const custom = e as CustomEvent<{ user: AdminUser | null }>;
      setCurrentUser(custom.detail?.user || null);
    };

    const handleStoreChange = (e: Event) => {
      const custom = e as CustomEvent<{ isOpen: boolean }>;
      if (typeof custom.detail?.isOpen === 'boolean') {
        setStoreActive(custom.detail.isOpen);
      }
    };

    window.addEventListener('mc:admin-auth', handleAuthChange as EventListener);
    window.addEventListener('mc:store-status', handleStoreChange as EventListener);

    // Click outside handler for dropdowns
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('mc:admin-auth', handleAuthChange as EventListener);
      window.removeEventListener('mc:store-status', handleStoreChange as EventListener);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleStoreStatus = () => {
    const nextStatus = !storeActive;
    setStoreActive(nextStatus);
    setStoreOpen(nextStatus);
  };

  const handleSignOut = () => {
    clearAdminSession();
    setIsProfileOpen(false);
    router.push('/admin/login');
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Breadcrumbs derivation
  const getBreadcrumbTitle = () => {
    if (!pathname || pathname === '/admin') return 'Overview';
    const sub = pathname.replace('/admin/', '');
    switch (sub) {
      case 'orders':
        return 'Orders Management';
      case 'products':
        return 'Product Catalog';
      case 'customers':
        return 'Customers & VIPs';
      case 'discounts':
        return 'Promotions & Coupons';
      case 'notifications':
        return 'Broadcasts & Alerts';
      default:
        return sub.charAt(0).toUpperCase() + sub.slice(1);
    }
  };

  const renderRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-brand/20 to-orchid/20 text-brand border border-brand/30">
            Super Admin
          </span>
        );
      case 'store_manager':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 border border-blue-500/30">
            Store Manager
          </span>
        );
      case 'dispatcher':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
            Dispatcher
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/15 text-[var(--ink)] border border-[var(--line)]">
            Admin
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full backdrop-blur-xl bg-[var(--surface)]/85 border-b border-[var(--line)] px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Mobile Menu Toggle & Dynamic Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Breadcrumb Path */}
        <nav className="flex items-center gap-1.5 text-xs text-[var(--mute)] select-none">
          <Link
            href="/admin"
            className="font-medium hover:text-brand transition-colors flex items-center gap-1"
          >
            <span>Admin</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--line)] flex-shrink-0" />
          <span className="font-semibold text-[var(--ink)] truncate max-w-[150px] sm:max-w-none">
            {getBreadcrumbTitle()}
          </span>
        </nav>
      </div>

      {/* Center: Global Search Trigger */}
      <div className="hidden md:flex flex-1 max-w-md mx-2">
        <button
          type="button"
          onClick={() => {
            if (onOpenSearch) {
              onOpenSearch();
            } else {
              window.dispatchEvent(new CustomEvent('mc:open-admin-search'));
            }
          }}
          className="w-full h-9 px-3.5 rounded-2xl bg-[var(--surface2)]/75 hover:bg-[var(--surface2)] border border-[var(--line)] text-xs text-[var(--mute)] flex items-center justify-between transition-all group shadow-sm hover:border-brand/40"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 group-hover:text-brand transition-colors flex-shrink-0" />
            <span className="truncate">Quick search orders, products, customers...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-md bg-[var(--surface)] text-[var(--ink2)] border border-[var(--line)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Store Status, Sound Alert, Theme, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Store Status Toggle Button */}
        <button
          type="button"
          onClick={handleToggleStoreStatus}
          title={storeActive ? 'Store is Open 24/7. Click to Pause' : 'Store is Paused. Click to Open'}
          className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all duration-200 shadow-sm ${
            storeActive
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/15'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/15'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            {storeActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                storeActive ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="hidden md:inline font-medium">
            {storeActive ? 'Store Open 24/7' : 'Store Paused'}
          </span>
        </button>

        {/* Audio Alert Procedural Chime Widget */}
        <AudioAlert compact={true} showTestButton={false} />

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-brand" />
          )}
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-xl text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors"
            aria-label="Store alerts and notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orchid ring-2 ring-[var(--surface)]" />
            )}
          </button>

          {/* Notifications Popover */}
          {isNotificationsOpen && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
              style={{ boxShadow: 'var(--shadow)' }}
            >
              <div className="p-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface2)]/50">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-sm text-[var(--ink)]">Store Events</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/15 text-brand">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-medium text-brand hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[var(--line)]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--mute)]">
                    No store notifications at this time.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 flex items-start gap-3 transition-colors hover:bg-[var(--surface2)]/60 ${
                        item.unread ? 'bg-brand/5' : ''
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-[var(--surface2)] text-brand flex-shrink-0 mt-0.5">
                        {item.type === 'order' && <ShoppingBag className="w-4 h-4 text-emerald-500" />}
                        {item.type === 'stock' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        {item.type === 'payment' && <CheckCircle2 className="w-4 h-4 text-brand" />}
                        {item.type === 'dispatch' && <Clock className="w-4 h-4 text-blue-500" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-[var(--ink)] truncate">
                            {item.title}
                          </p>
                          <span className="text-[10px] text-[var(--mute)] whitespace-nowrap">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--ink2)] mt-0.5 line-clamp-2">
                          {item.desc}
                        </p>
                      </div>

                      {item.unread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 border-t border-[var(--line)] bg-[var(--surface2)]/50 text-center">
                <Link
                  href="/admin/notifications"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
                >
                  View all activity history &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-[var(--surface2)] border border-transparent hover:border-[var(--line)] transition-all"
            aria-label="Admin user account options"
          >
            {currentUser ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-brand/40 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-orchid text-white flex items-center justify-center font-bold text-xs">
                MC
              </div>
            )}

            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold leading-tight text-[var(--ink)] truncate max-w-[110px]">
                {currentUser?.name || 'Admin User'}
              </span>
              <span className="text-[10px] text-[var(--mute)] font-medium">
                {currentUser ? formatAdminRole(currentUser.role) : 'Portal'}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-[var(--mute)] hidden lg:block mr-1" />
          </button>

          {/* Profile Menu Popover */}
          {isProfileOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
              style={{ boxShadow: 'var(--shadow)' }}
            >
              {/* User Identity Header */}
              <div className="p-4 border-b border-[var(--line)] bg-[var(--surface2)]/60">
                <p className="text-xs font-bold text-[var(--ink)] truncate">
                  {currentUser?.name || 'MiCollections Admin'}
                </p>
                <p className="text-[11px] text-[var(--mute)] truncate mt-0.5">
                  {currentUser?.email || 'admin@micollections.com'}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  {renderRoleBadge(currentUser?.role)}
                  <span className="text-[10px] text-[var(--mute)] font-medium">
                    {currentUser?.department || 'Executive HQ'}
                  </span>
                </div>
              </div>

              {/* Action Links */}
              <div className="p-2 space-y-1">
                <Link
                  href="/admin"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors"
                >
                  <Shield className="w-4 h-4 text-brand" />
                  <span>Admin Console</span>
                </Link>

                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-orchid" />
                  <span>View Public Storefront</span>
                </a>
              </div>

              {/* Sign Out Button */}
              <div className="p-2 border-t border-[var(--line)] bg-[var(--surface2)]/40">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-red-600 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
