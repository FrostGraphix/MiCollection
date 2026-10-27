'use client';

import React from 'react';
import Link from 'next/link';
import { CATS, PRODUCTS } from '@/lib/products';
import { ProductArt } from '@/components/shop/ProductArt';
import { ArrowRight } from 'lucide-react';

interface MegaMenuProps {
  onClose?: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ onClose }) => {
  return (
    <div
      className="absolute left-4 right-4 top-[calc(100%+12px)] p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl z-50 transition-all duration-300"
      style={{ boxShadow: 'var(--shadow)' }}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {CATS.map((cat) => {
            const count = PRODUCTS.filter((p) => p.cat === cat.id).length;
            return (
              <Link
                key={cat.id}
                href={`/shop?cat=${cat.id}`}
                onClick={onClose}
                className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--pill)] transition-all duration-300 transform hover:translate-x-1"
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-[var(--surface2)] border border-[var(--line)]">
                  <ProductArt type={cat.art[0]} color={cat.cols[0]} view={0} />
                </div>
                <div>
                  <strong className="block font-display text-sm font-semibold group-hover:text-brand transition-colors">
                    {cat.name}
                  </strong>
                  <small className="text-xs text-[var(--mute)]">{count} items</small>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Featured Card */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-[#3b0f8c] to-[#12041f] text-white relative overflow-hidden flex flex-col justify-end min-h-[220px]">
          <div className="absolute right-[-10px] top-[-10px] w-48 h-48 opacity-90 rotate-12 pointer-events-none">
            <ProductArt type="watch" color="violet" view="bare" />
          </div>
          <div className="relative z-10">
            <span className="text-[10px] tracking-widest font-semibold uppercase text-brand-light">
              Popular Right Now
            </span>
            <strong className="block font-display text-xl font-bold mt-1 mb-3">
              Ultra 2 Smart Watch
            </strong>
            <Link
              href="/product/16"
              onClick={onClose}
              className="inline-flex items-center gap-2 text-xs font-semibold py-2 px-4 rounded-full bg-white text-[#2e1065] hover:bg-brand-light hover:text-white transition-all shadow-md"
            >
              Shop now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
