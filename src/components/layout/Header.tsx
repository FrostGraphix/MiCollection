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
  const [mobileShopExpanded, setMobileShopExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  const headerRef = useRef<HTMLElement>(null);
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

  // Click outside, Escape key, and focusout to close mega menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsMegaOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMegaOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.relatedTarget as Node)) {
        setIsMegaOpen(false);
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

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="group/wishlist relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand active:scale-95 transition-all duration-200"
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

            {/* Cart Button */}
            <button
              id="headerCartBtn"
              onClick={openDrawer}
              className="group/cart relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand active:scale-95 transition-all duration-200"
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

            {/* User Account / Login */}
            <Link
              href={user ? '/account' : '/login'}
              className="group/user w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] hover:text-brand active:scale-95 transition-all duration-200"
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

          <Link
            href="/wishlist"
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-display text-2xl font-bold py-3.5 border-b border-white/10 hover:text-brand-light flex items-center justify-between"
          >
            <span>Saved Items</span>
            <span className="text-xs font-normal text-purple-300">
              {wishlist.length} items
            </span>
          </Link>

          <Link
            href={user ? '/account' : '/login'}
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-display text-2xl font-bold py-3.5 border-b border-white/10 hover:text-brand-light flex items-center justify-between"
          >
            <span>{user ? 'My Account' : 'Sign in / Register'}</span>
            <span className="text-xs font-normal text-purple-300">
              {user ? user.email : 'Join'}
            </span>
          </Link>
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
