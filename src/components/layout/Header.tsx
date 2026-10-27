'use client';

import React, { useEffect, useState, useRef } from 'react';
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
import { CFG } from '@/lib/products';

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 30);

      if (currentScrollY > lastScrollY.current + 8 && currentScrollY > 220) {
        setIsHidden(true);
      } else if (currentScrollY < lastScrollY.current - 6 || currentScrollY < 100) {
        setIsHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.classList.toggle('locked', isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop', hasMega: true },
    { label: 'About', href: '/about' },
    { label: 'Delivery & FAQ', href: '/help' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header
        className={`sticky top-3 z-50 transition-transform duration-500 max-w-7xl mx-auto px-4 ${
          isHidden ? '-translate-y-28' : 'translate-y-0'
        }`}
      >
        <div
          className={`flex items-center justify-between gap-3 rounded-full border border-[var(--line)] bg-[var(--nav-bg)] backdrop-blur-xl shadow-lg px-4 md:px-6 transition-all duration-300 ${
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

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 relative">
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
                    onMouseEnter={() => setIsMegaOpen(true)}
                    onMouseLeave={() => setIsMegaOpen(false)}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                        isActive
                          ? 'text-brand font-semibold bg-[var(--pill)]'
                          : 'text-[var(--ink)] hover:text-brand hover:bg-[var(--pill)]'
                      }`}
                    >
                      {link.label}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${
                          isMegaOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </Link>
                    {isMegaOpen && <MegaMenu onClose={() => setIsMegaOpen(false)} />}
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                    isActive
                      ? 'text-brand font-semibold bg-[var(--pill)]'
                      : 'text-[var(--ink)] hover:text-brand hover:bg-[var(--pill)]'
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
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] transition-transform hover:-translate-y-0.5"
              aria-label="Search store"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] transition-transform hover:-translate-y-0.5"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="w-5 h-5 text-purple-600 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] transition-transform hover:-translate-y-0.5"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={openDrawer}
              className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] transition-transform hover:-translate-y-0.5"
              aria-label="Shopping cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white font-bold text-[10px] flex items-center justify-center shadow-sm animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account / Login */}
            <Link
              href={user ? '/account' : '/login'}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)] transition-transform hover:-translate-y-0.5"
              aria-label="Account"
              title={user ? 'Your Account' : 'Sign in'}
            >
              {user ? (
                <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                  {user.email?.charAt(0) || 'U'}
                </div>
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </Link>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--ink)]"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Fullscreen Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[var(--inv)] text-[var(--inv-ink)] flex flex-col justify-between p-6 pt-24 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-display text-3xl font-bold py-3 border-b border-white/10 hover:text-brand-light flex items-center justify-between"
              >
                <span>{link.label}</span>
                <span className="text-xs font-normal text-purple-300">Browse</span>
              </Link>
            ))}
            <Link
              href="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-display text-2xl font-bold py-3 border-b border-white/10 hover:text-brand-light flex items-center justify-between"
            >
              <span>Saved Items</span>
              <span className="text-xs font-normal text-purple-300">
                {wishlist.length} items
              </span>
            </Link>
            <Link
              href={user ? '/account' : '/login'}
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-display text-2xl font-bold py-3 border-b border-white/10 hover:text-brand-light flex items-center justify-between"
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
      )}
    </>
  );
};
