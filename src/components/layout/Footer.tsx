'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CATS, CFG } from '@/lib/products';
import { waLink } from '@/lib/utils';
import { Phone, Mail, MapPin, Clock, ArrowUp, MessageSquare } from 'lucide-react';

export const Footer: React.FC = () => {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[var(--inv)] text-[var(--inv-ink)] pt-16 md:pt-24 mt-20 rounded-t-[44px] overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-16 border-b border-white/10">
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-white">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-deep text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                Mi
              </span>
              <span>
                Mi<b className="text-brand-light">Collections</b>
              </span>
            </Link>
            <p className="text-sm text-purple-200/80 leading-relaxed max-w-sm">
              Your number one home of varieties. Unisex clothing, shoes, bags, kitchen utensils and lots more. Delivered nationwide from Abuja.
            </p>
            <a
              href={waLink('Hello MiCollections, please add me to your new arrivals updates.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa inline-flex items-center gap-2 text-xs py-2.5 px-4 w-fit mt-2"
            >
              <MessageSquare className="w-4 h-4" /> New arrivals on WhatsApp
            </a>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-light mb-4">
              Shop Categories
            </h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-purple-200/80">
              {CATS.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/shop?cat=${cat.id}`}
                    className="hover:text-white hover:translate-x-1 inline-block transition-transform truncate"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li className="col-span-2 pt-1">
                <Link
                  href="/shop"
                  className="text-brand-light font-medium hover:text-white transition-colors"
                >
                  View all products &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation & Help */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-light mb-4">
              Customer Care
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-purple-200/80">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-white transition-colors text-brand-light font-medium">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Delivery & FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  My Orders & Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-light mb-4">
              Find Us
            </h4>
            <div className="flex flex-col gap-3 text-sm text-purple-200/80">
              <a
                href={waLink('Hello MiCollections!')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4 text-brand-light flex-shrink-0" />
                <span>{CFG.phoneDisp}</span>
              </a>
              <span className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-light flex-shrink-0" />
                <span className="break-all">{CFG.email}</span>
              </span>
              <span className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-brand-light flex-shrink-0" />
                <span>FCT Abuja, Nigeria</span>
              </span>
              <span className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-brand-light flex-shrink-0" />
                <span>Open 24 hours daily</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-purple-300/70">
          <span>&copy; {new Date().getFullYear()} MiCollections. All rights reserved.</span>
          <span className="font-medium text-purple-200">Customers order, we don&apos;t scam.</span>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 hover:text-white font-semibold transition-colors"
          >
            Back to top <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stylized Giant Background Typography */}
      <div
        className="font-display font-extrabold text-[clamp(3.5rem,18vw,16rem)] leading-none text-center select-none text-transparent tracking-tighter opacity-15 overflow-hidden whitespace-nowrap pointer-events-none mt-2 -mb-6"
        style={{
          WebkitTextStroke: '2px rgba(167, 139, 250, 0.4)',
        }}
        aria-hidden="true"
      >
        MiCollections
      </div>
    </footer>
  );
};
