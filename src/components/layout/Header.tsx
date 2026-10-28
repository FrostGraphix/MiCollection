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
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { MegaMenu } from './MegaMenu';
import { CFG, CATS } from '@/lib/products';

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { cartCount, openDrawer } = useCart();
  const { wishlist } = useWishlist();
  const { user } = useAuth();

  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [mobileShopExpanded, setMobileShopExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

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
          <div className="flex items-center gap-1.5 sm:gap-2">
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

            {/* User Account / Profile with Mobile Dropdown (Favourite & Cart under Profile on Mobile) */}
            <div ref={profileRef} className="relative">
              {/* Desktop Link Directly to Account */}
              <Link
                href={user ? '/account' : '/login'}
                className="hidden sm:flex group/user w-10 h-10 rounded-full items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand active:scale-95 transition-all duration-200"
                aria-label="Account"
                title={user ? 'Your Account' : 'Sign in / Register'}
              >
                {user ? (
                  <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm group-hover/user:scale-105 transition-transform duration-200">
                    {user.email?.charAt(0) || 'U'}
                  </div>
                ) : (
                  <UserIcon className="w-5 h-5 transition-transform duration-200 group-hover/user:scale-110" />
                )}
              </Link>

              {/* Mobile Profile Trigger (Toggles Favourite & Cart Under Profile Icon) */}
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
                {user ? (
                  <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                    {user.email?.charAt(0) || 'U'}
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

              {/* Mobile Profile Dropdown: Favourite and Cart Under Profile Icon */}
              {isProfileMenuOpen && (
                <div
                  className="sm:hidden absolute right-0 top-[calc(100%+12px)] w-72 p-3 rounded-3xl bg-[var(--dropdown-bg)] backdrop-blur-2xl border border-[var(--line)] shadow-2xl z-50 animate-dropdown-in before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] transition-all"
                  style={{ boxShadow: 'var(--dropdown-shadow)' }}
                >
                  {/* Account / User Link */}
                  <Link
                    href={user ? '/account' : '/login'}
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="group/acc flex items-center gap-3 p-2.5 rounded-2xl border border-transparent hover:border-brand/20 hover:bg-[var(--pill)] transition-all duration-200"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-deep text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm group-hover/acc:scale-105 transition-transform duration-200 flex-shrink-0">
                      {user ? user.email?.charAt(0) || 'U' : <UserIcon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <strong className="block font-display text-sm font-semibold truncate text-[var(--ink)] group-hover/acc:text-brand transition-colors duration-200">
                        {user ? user.email?.split('@')[0] : 'My Account'}
                      </strong>
                      <small className="block text-xs text-[var(--mute)] group-hover/acc:text-brand-deep/80 dark:group-hover/acc:text-brand-light/80 transition-colors duration-200">
                        {user ? 'View profile & orders' : 'Sign in / Register'}
                      </small>
                    </div>
                  </Link>

                  <div className="h-px bg-[var(--line)] my-1.5" />

                  {/* Favourite Under Profile Icon */}
                  <Link
                    href="/wishlist"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="group/fav flex items-center justify-between p-2.5 rounded-2xl border border-transparent hover:border-brand/20 hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand transition-all duration-200 text-sm font-medium"
                  >
                    <span className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center group-hover/fav:border-pink-500/30 group-hover/fav:bg-pink-500/10 transition-all duration-200 flex-shrink-0">
                        <Heart className="w-4 h-4 text-pink-500 transition-transform duration-200 group-hover/fav:scale-110" />
                      </div>
                      <span className="font-medium">Favourite</span>
                    </span>
                    {wishlist.length > 0 ? (
                      <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-brand text-white font-bold text-xs flex items-center justify-center shadow-sm">
                        {wishlist.length}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--mute)]">0</span>
                    )}
                  </Link>

                  {/* Cart Under Profile Icon */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      openDrawer();
                    }}
                    className="group/cart w-full flex items-center justify-between p-2.5 rounded-2xl border border-transparent hover:border-brand/20 hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand transition-all duration-200 text-sm font-medium text-left"
                  >
                    <span className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center group-hover/cart:border-brand/30 group-hover/cart:bg-brand/10 transition-all duration-200 flex-shrink-0">
                        <ShoppingBag className="w-4 h-4 text-brand transition-transform duration-200 group-hover/cart:scale-110" />
                      </div>
                      <span className="font-medium">Cart</span>
                    </span>
                    {cartCount > 0 ? (
                      <span className="cart-badge min-w-[20px] h-[20px] px-1.5 rounded-full bg-brand text-white font-bold text-xs flex items-center justify-center shadow-sm">
                        {cartCount}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--mute)]">Empty</span>
                    )}
                  </button>
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
