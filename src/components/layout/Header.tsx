'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Sun,
  Moon,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { getAdminSession, clearAdminSession, AdminUser } from '@/lib/adminAuth';
import { MegaMenu } from './MegaMenu';
import { CFG, CATS } from '@/lib/products';

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    const local = email.split('@')[0];
    return local.slice(0, 2).toUpperCase();
  }
  return 'MC';
}

function getFirstName(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    return name.trim().split(/\s+/)[0];
  }
  if (email && email.trim()) {
    const local = email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return 'Member';
}

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { cartCount, openDrawer } = useCart();
  const { wishlist } = useWishlist();
  const { user, profile, stats, signOut } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [mobileShopExpanded, setMobileShopExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  // Sync admin session from cookies/storage
  useEffect(() => {
    setAdminUser(getAdminSession());
    const handleAdminAuth = (e: any) => {
      setAdminUser(e?.detail?.user ?? getAdminSession());
    };
    window.addEventListener('mc:admin-auth', handleAdminAuth);
    return () => window.removeEventListener('mc:admin-auth', handleAdminAuth);
  }, []);

  // Close profile dropdown on route changes
  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [pathname]);

  const activeUser = user || adminUser;
  const displayName = profile?.full_name || adminUser?.name || user?.user_metadata?.full_name || '';
  const displayEmail = adminUser?.email || user?.email || profile?.email || '';
  const userInitials = getInitials(displayName, displayEmail);
  const firstName = getFirstName(displayName, displayEmail);
  const isStaff = Boolean(
    adminUser ||
    (displayEmail && (displayEmail.includes('@micollections.com') || displayEmail.includes('admin') || displayEmail.includes('manager') || displayEmail.includes('dispatch')))
  );

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false);
    clearAdminSession();
    setAdminUser(null);
    await signOut();
  };

  const headerRef = useRef<HTMLElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navWrapRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLElement>(null);
  const shopLinkRef = useRef<HTMLAnchorElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced open / close for smooth mega menu hover bridge
  const openMega = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsMegaOpen(true);
  }, []);

  const closeMega = useCallback((delay = 220) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsMegaOpen(false);
    }, delay);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (isMobileMenuOpen) return;
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 30);

      if (currentScrollY > lastScrollY.current + 8 && currentScrollY > 220) {
        setIsHidden(true);
        setIsMegaOpen(false);
      } else if (currentScrollY < lastScrollY.current - 6 || currentScrollY < 100) {
        setIsHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open (with defensive cleanup)
  useEffect(() => {
    document.body.classList.toggle('locked', isMobileMenuOpen);
    return () => {
      document.body.classList.remove('locked');
    };
  }, [isMobileMenuOpen]);

  // Click outside, Escape key, and focusout to close mega menu and mobile profile dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsMegaOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMegaOpen(false);
        setIsProfileMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.relatedTarget as Node)) {
        setIsMegaOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.relatedTarget as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    const headerEl = headerRef.current;
    if (headerEl) {
      headerEl.addEventListener('focusout', handleFocusOut);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (headerEl) {
        headerEl.removeEventListener('focusout', handleFocusOut);
      }
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop', hasMega: true },
    { label: 'Track Order', href: '/track' },
    { label: 'About', href: '/about' },
    { label: 'Delivery & FAQ', href: '/help' },
    { label: 'Contact', href: '/contact' },
  ];

  const movePill = useCallback((target: HTMLElement | null) => {
    const pill = pillRef.current;
    const wrap = navWrapRef.current;
    if (!pill || !wrap) return;

    if (!target) {
      pill.style.opacity = '0';
      return;
    }

    const wrapRect = wrap.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    pill.style.width = `${targetRect.width}px`;
    pill.style.height = `${targetRect.height}px`;
    pill.style.transform = `translate(${targetRect.left - wrapRect.left}px, ${targetRect.top - wrapRect.top}px)`;
    pill.style.opacity = '1';
  }, []);

  const resetPill = useCallback(() => {
    const wrap = navWrapRef.current;
    if (!wrap) return;

    // While mega menu is open, lock pill to Shop trigger!
    if (isMegaOpen && shopLinkRef.current) {
      movePill(shopLinkRef.current);
      return;
    }

    const activeEl = wrap.querySelector<HTMLElement>('.nl-active');
    movePill(activeEl);
  }, [isMegaOpen, movePill]);

  // Synchronize pill position on mount and window resize
  useEffect(() => {
    const handleResize = () => resetPill();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resetPill]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      resetPill();
    });
    return () => cancelAnimationFrame(raf);
  }, [resetPill]);

  // Sync pill whenever path or mega menu open status changes
  useEffect(() => {
    if (isMegaOpen && shopLinkRef.current) {
      movePill(shopLinkRef.current);
    } else {
      resetPill();
    }
  }, [pathname, isMegaOpen, resetPill, movePill]);

  // Close menus on route navigation
  useEffect(() => {
    setIsMegaOpen(false);
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky top-3 z-50 transition-transform duration-500 max-w-7xl mx-auto px-4 relative ${
          isHidden ? '-translate-y-28' : 'translate-y-0'
        }`}
      >
        <div
          className={`flex items-center justify-between gap-3 rounded-full border border-[var(--line)] bg-[var(--nav-bg)] backdrop-blur-xl shadow-lg px-4 md:px-6 transition-all duration-300 relative ${
            isScrolled ? 'h-14 shadow-xl' : 'h-16'
          }`}
          style={{ boxShadow: 'var(--shadow)' }}
        >
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-[var(--ink)]"
          >
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-deep text-white flex items-center justify-center font-extrabold text-sm shadow-md transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105">
              Mi
            </span>
            <span className="hidden sm:inline">
              Mi<b className="text-brand">Collections</b>
            </span>
          </Link>

          {/* Desktop Navigation with Sliding Pill Tracker */}
          <nav
            ref={navWrapRef}
            onMouseLeave={resetPill}
            className="hidden lg:flex items-center gap-1 relative"
          >
            <i ref={pillRef} className="nl-pill" />
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href);

              if (link.hasMega) {
                return (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={openMega}
                    onMouseLeave={() => closeMega(220)}
                  >
                    <Link
                      ref={shopLinkRef}
                      href={link.href}
                      onClick={(e) => {
                        // Clicking toggle: if already open, let it navigate; if closed, open it
                        if (!isMegaOpen) {
                          e.preventDefault();
                          openMega();
                        }
                      }}
                      onMouseEnter={(e) => {
                        openMega();
                        movePill(e.currentTarget);
                      }}
                      onFocus={(e) => {
                        openMega();
                        movePill(e.currentTarget);
                      }}
                      className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 select-none ${
                        isActive || isMegaOpen
                          ? 'text-brand font-semibold nl-active'
                          : 'text-[var(--ink)] hover:text-brand'
                      }`}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${
                          isMegaOpen ? 'rotate-180 text-brand' : 'opacity-70'
                        }`}
                      />
                    </Link>
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={(e) => {
                    closeMega(50);
                    movePill(e.currentTarget);
                  }}
                  onFocus={(e) => {
                    closeMega(50);
                    movePill(e.currentTarget);
                  }}
                  className={`relative z-10 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 select-none ${
                    isActive && !isMegaOpen
                      ? 'text-brand font-semibold nl-active'
                      : 'text-[var(--ink)] hover:text-brand'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Search */}
            <button
              onClick={onOpenSearch}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand active:scale-95 transition-all duration-200"
              aria-label="Search store"
              title="Search store (Ctrl+K or /)"
            >
              <Search className="w-5 h-5 transition-transform duration-200 hover:scale-110" />
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand active:scale-95 transition-all duration-200"
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-90 hover:scale-110" />
              ) : (
                <Moon className="w-5 h-5 text-purple-600 transition-transform duration-300 hover:-rotate-12 hover:scale-110" />
              )}
            </button>

            {/* Wishlist (Desktop) */}
            <Link
              href="/wishlist"
              className="hidden sm:flex group/wishlist relative w-10 h-10 rounded-full items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand active:scale-95 transition-all duration-200"
              aria-label="Wishlist"
              title="Saved items"
            >
              <Heart className="w-5 h-5 transition-transform duration-200 group-hover/wishlist:scale-110 group-hover/wishlist:text-pink-500" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white font-bold text-[10px] flex items-center justify-center shadow-sm group-hover/wishlist:scale-110 transition-transform duration-200">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Button (Desktop) */}
            <button
              id="headerCartBtn"
              onClick={openDrawer}
              className="hidden sm:flex group/cart relative w-10 h-10 rounded-full items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand active:scale-95 transition-all duration-200"
              aria-label="Shopping cart"
              title="View shopping bag"
            >
              <ShoppingBag className="w-5 h-5 transition-transform duration-200 group-hover/cart:scale-110" />
              {cartCount > 0 && (
                <span className="cart-badge absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white font-bold text-[10px] flex items-center justify-center shadow-sm group-hover/cart:scale-110 transition-transform duration-200">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account / Profile with Luxury Status Indicator & Interactive Popover */}
            <div ref={profileRef} className="relative">
              {/* Desktop Trigger: Authenticated Member Pill vs Guest Icon */}
              <div className="hidden sm:flex items-center">
                {activeUser ? (
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={`group/user relative flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border transition-all duration-200 cursor-pointer active:scale-95 ${
                      isProfileMenuOpen
                        ? 'border-brand bg-[var(--pill)] shadow-sm'
                        : 'border-[var(--line)] bg-[var(--surface2)]/60 hover:bg-[var(--pill)] hover:border-brand/40'
                    }`}
                    aria-label={`Account menu for ${displayName || 'User'}`}
                    aria-expanded={isProfileMenuOpen}
                  >
                    <div className="relative w-7 h-7 rounded-full bg-gradient-to-tr from-brand via-brand-deep to-orchid text-white flex items-center justify-center text-[11px] font-bold uppercase shadow-sm flex-shrink-0">
                      {userInitials}
                      {/* Pulsing Active Presence Indicator Dot */}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--surface)] shadow-sm animate-pulse" />
                    </div>
                    <span className="text-xs font-semibold text-[var(--ink)] max-w-[95px] truncate">
                      Hi, {firstName}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 text-[var(--mute)] transition-transform duration-200 ${
                        isProfileMenuOpen ? 'rotate-180 text-brand' : 'group-hover/user:text-brand'
                      }`}
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={`group/user relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand active:scale-95 transition-all duration-200 ${
                      isProfileMenuOpen ? 'bg-[var(--pill)] text-brand' : ''
                    }`}
                    aria-label="Sign in or register"
                    title="Sign in / Register"
                    aria-expanded={isProfileMenuOpen}
                  >
                    <UserIcon className="w-5 h-5 transition-transform duration-200 group-hover/user:scale-110" />
                  </button>
                )}
              </div>

              {/* Mobile Trigger: Avatar with presence dot or Guest Icon */}
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={`sm:hidden group/user relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isProfileMenuOpen
                    ? 'bg-[var(--pill)] text-brand'
                    : 'hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand'
                }`}
                aria-label="Account, favourites and cart menu"
                aria-expanded={isProfileMenuOpen}
              >
                {activeUser ? (
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-brand via-brand-deep to-orchid text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                    {userInitials}
                    {/* Pulsing Active Presence Indicator Dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--surface)] shadow-sm animate-pulse" />
                  </div>
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
                {/* Total badge for items in Cart + Wishlist on mobile */}
                {(cartCount > 0 || wishlist.length > 0) && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
                    {cartCount + wishlist.length}
                  </span>
                )}
              </button>

              {/* Universal Glassmorphic Account Popover (Desktop & Mobile) */}
              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+12px)] w-80 p-3.5 rounded-3xl bg-[var(--dropdown-bg)] backdrop-blur-2xl border border-[var(--line)] shadow-2xl z-50 animate-dropdown-in before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] transition-all"
                  style={{ boxShadow: 'var(--dropdown-shadow)' }}
                >
                  {activeUser ? (
                    /* Authenticated Member Menu */
                    <div className="flex flex-col gap-2">
                      {/* Profile Card Header */}
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--surface2)]/80 border border-[var(--line)]/70">
                        <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand via-brand-deep to-orchid text-white flex items-center justify-center text-sm font-bold uppercase shadow-md flex-shrink-0">
                          {userInitials}
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[var(--surface)] shadow-sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-display text-sm font-bold truncate text-[var(--ink)]">
                              {displayName || firstName}
                            </h4>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Online & Authenticated" />
                          </div>
                          <p className="text-xs text-[var(--mute)] truncate mb-1">
                            {displayEmail}
                          </p>
                          {adminUser ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/15 text-brand text-[10px] font-semibold border border-brand/25">
                              <ShieldCheck className="w-3 h-3" />
                              {adminUser.roleTitle || 'Staff Admin'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-semibold border border-amber-500/25">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              {stats?.tier || 'VIP Member'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="flex flex-col gap-1 my-1">
                        {/* My Orders & Tracking */}
                        <Link
                          href="/account"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-2xl border border-transparent hover:border-brand/20 hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand transition-all text-xs font-semibold group/item"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-brand group-hover/item:bg-brand/10 group-hover/item:border-brand/30 transition-colors flex-shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <span className="block font-semibold">My Orders & Tracking</span>
                              <span className="block text-[10px] text-[var(--mute)] font-normal">Live order milestones & courier</span>
                            </div>
                          </div>
                          {stats && stats.totalOrders > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold">
                              {stats.totalOrders} {stats.totalOrders === 1 ? 'order' : 'orders'}
                            </span>
                          )}
                        </Link>

                        {/* Saved Wishlist */}
                        <Link
                          href="/wishlist"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-2xl border border-transparent hover:border-brand/20 hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand transition-all text-xs font-semibold group/item"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-pink-500 group-hover/item:bg-pink-500/10 group-hover/item:border-pink-500/30 transition-colors flex-shrink-0">
                              <Heart className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <span className="block font-semibold">Saved Wishlist</span>
                              <span className="block text-[10px] text-[var(--mute)] font-normal">Saved luxury pieces</span>
                            </div>
                          </div>
                          {wishlist.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 text-[10px] font-bold">
                              {wishlist.length}
                            </span>
                          )}
                        </Link>

                        {/* Mobile Shopping Bag Shortcut */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            openDrawer();
                          }}
                          className="sm:hidden flex items-center justify-between p-2.5 rounded-2xl border border-transparent hover:border-brand/20 hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand transition-all text-xs font-semibold text-left group/item"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-brand group-hover/item:bg-brand/10 group-hover/item:border-brand/30 transition-colors flex-shrink-0">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <span className="block font-semibold">Shopping Bag</span>
                              <span className="block text-[10px] text-[var(--mute)] font-normal">View items & checkout</span>
                            </div>
                          </div>
                          {cartCount > 0 && (
                            <span className="cart-badge px-2 py-0.5 rounded-full bg-brand text-white text-[10px] font-bold">
                              {cartCount}
                            </span>
                          )}
                        </button>

                        {/* Account Settings */}
                        <Link
                          href="/account"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-2xl border border-transparent hover:border-brand/20 hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand transition-all text-xs font-semibold group/item"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover/item:bg-purple-500/10 group-hover/item:border-purple-500/30 transition-colors flex-shrink-0">
                              <Settings className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <span className="block font-semibold">Account Settings</span>
                              <span className="block text-[10px] text-[var(--mute)] font-normal">Addresses, profile & security</span>
                            </div>
                          </div>
                        </Link>

                        {/* Staff Admin Console Shortcut */}
                        {isStaff && (
                          <Link
                            href="/admin"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-2xl border border-brand/25 bg-brand/5 hover:bg-brand/15 text-brand transition-all text-xs font-semibold group/admin"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand group-hover/admin:scale-105 transition-transform flex-shrink-0">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <span className="block font-bold">Admin Console</span>
                                <span className="block text-[10px] text-brand/80 font-normal">Executive operations & orders</span>
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover/admin:opacity-100" />
                          </Link>
                        )}
                      </div>

                      {/* Divider & Sign Out */}
                      <div className="h-px bg-[var(--line)] my-0.5" />
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-2xl text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors text-xs font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out of Account</span>
                      </button>
                    </div>
                  ) : (
                    /* Guest Popover Menu */
                    <div className="flex flex-col gap-3 p-1">
                      <div className="text-center p-3.5 rounded-2xl bg-[var(--surface2)]/60 border border-[var(--line)]/60 space-y-1">
                        <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-2">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <h4 className="font-display text-sm font-bold text-[var(--ink)]">
                          Welcome to MiCollections
                        </h4>
                        <p className="text-[11px] text-[var(--mute)] leading-relaxed">
                          Sign in to track orders, manage delivery addresses, and save favorites.
                        </p>
                      </div>

                      <Link
                        href="/login"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full py-2.5 px-4 rounded-2xl bg-brand hover:bg-brand-deep text-white font-semibold text-xs text-center shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In to Account</span>
                      </Link>

                      <Link
                        href="/register"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full py-1 text-center text-xs font-medium text-[var(--mute)] hover:text-brand transition-colors"
                      >
                        New customer? <strong className="font-semibold text-brand underline decoration-brand/30">Create an account</strong>
                      </Link>

                      <div className="h-px bg-[var(--line)] my-0.5" />

                      {/* Guest Order Tracking */}
                      <Link
                        href="/track"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-[var(--ink)] hover:text-brand hover:bg-[var(--pill)] transition-colors"
                      >
                        <Package className="w-4 h-4 text-brand flex-shrink-0" />
                        <span className="truncate">Track an Order as Guest</span>
                      </Link>

                      {/* Staff & Admin Login */}
                      <Link
                        href="/admin/login"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl text-[11px] font-medium text-[var(--mute)] hover:text-brand hover:bg-[var(--pill)] transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">Staff & Admin Login Portal</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] active:scale-90 transition-all duration-200"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Full-width MegaMenu Dropdown */}
        {isMegaOpen && (
          <div
            className="hidden lg:block"
            onMouseEnter={openMega}
            onMouseLeave={() => closeMega(220)}
          >
            <MegaMenu onClose={() => setIsMegaOpen(false)} />
          </div>
        )}
      </header>

      {/* Mobile Menu Fullscreen Circular Clip-Path Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-[var(--inv)] text-[var(--inv-ink)] flex flex-col justify-between p-6 pt-28 overflow-y-auto transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          isMobileMenuOpen
            ? '[clip-path:circle(150%_at_calc(100%-44px)_44px)] visible opacity-100 pointer-events-auto'
            : '[clip-path:circle(0px_at_calc(100%-44px)_44px)] invisible opacity-0 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col gap-2">
          {navLinks.map((link, idx) => {
            if (link.hasMega) {
              return (
                <div key={link.href} className="border-b border-white/10 py-2">
                  <div className="flex items-center justify-between">
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="font-display text-3xl sm:text-4xl font-bold hover:text-brand-light"
                    >
                      {link.label}
                    </Link>
                    <button
                      onClick={() => setMobileShopExpanded(!mobileShopExpanded)}
                      className="p-2 rounded-xl bg-white/5 text-purple-200 hover:text-white flex items-center gap-1 text-xs"
                      aria-label="Toggle categories"
                    >
                      <span>Categories</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          mobileShopExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Expanded Categories in Mobile Menu */}
                  {mobileShopExpanded && (
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5 animate-dropdown-in">
                      {CATS.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/shop?cat=${cat.id}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-purple-200 hover:text-white transition-colors"
                        >
                          <span className="w-2 h-2 rounded-full bg-brand" />
                          <span className="font-medium truncate">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-display text-3xl sm:text-4xl font-bold py-3.5 border-b border-white/10 hover:text-brand-light flex items-center justify-between"
                style={{ transitionDelay: `${0.1 + idx * 0.05}s` }}
              >
                <span>{link.label}</span>
                <span className="text-xs font-normal text-purple-300">Browse</span>
              </Link>
            );
          })}

          {/* Account Profile Section with Favourite and Cart Underneath */}
          <div className="border-b border-white/10 py-3 mt-1">
            <Link
              href={user ? '/account' : '/login'}
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-display text-2xl sm:text-3xl font-bold hover:text-brand-light flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                  {user ? user.email?.charAt(0) || 'U' : <UserIcon className="w-4 h-4" />}
                </div>
                <span>{user ? 'My Account' : 'Sign in / Register'}</span>
              </div>
              <span className="text-xs font-normal text-purple-300 truncate max-w-[140px]">
                {user ? user.email?.split('@')[0] : 'Join'}
              </span>
            </Link>

            {/* Under Profile: Favourite and Cart */}
            <div className="pl-11 flex flex-col gap-1 mt-1">
              <Link
                href="/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 text-purple-200 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2.5 text-base font-medium">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span>Favourite</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold">
                  {wishlist.length}
                </span>
              </Link>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openDrawer();
                }}
                className="flex items-center justify-between py-2 text-purple-200 hover:text-white transition-colors text-left"
              >
                <span className="flex items-center gap-2.5 text-base font-medium">
                  <ShoppingBag className="w-4 h-4 text-brand-light" />
                  <span>Shopping Cart</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold">
                  {cartCount}
                </span>
              </button>
            </div>
          </div>
        </nav>

        <div className="mt-8 pt-6 border-t border-white/10 text-sm text-purple-200 flex flex-col gap-2">
          <span>Open 24 hours, FCT Abuja, Nigeria</span>
          <span>{CFG.phoneDisp}</span>
          <span>{CFG.email}</span>
        </div>
      </div>
    </>
  );
};
