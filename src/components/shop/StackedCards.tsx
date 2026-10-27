'use client';

import React from 'react';
import Link from 'next/link';
import { CATS, PRODUCTS } from '@/lib/products';
import { money } from '@/lib/utils';
import { ProductArt } from './ProductArt';
import { ArrowRight } from 'lucide-react';

const CARD_THEMES = [
  { bg: '#5b21b6', text: '#f7f2ff', sub: 'rgba(247,242,255,0.75)' },
  { bg: '#0b0613', text: '#f7f2ff', sub: 'rgba(247,242,255,0.7)' },
  { bg: '#ddd2ff', text: '#1d0b3a', sub: 'rgba(29,11,58,0.7)' },
  { bg: '#7c3aed', text: '#ffffff', sub: 'rgba(255,255,255,0.8)' },
  { bg: '#f6f1ff', text: '#1d0b3a', sub: 'rgba(29,11,58,0.7)' },
  { bg: '#1c0a3a', text: '#f7f2ff', sub: 'rgba(247,242,255,0.72)' },
  { bg: '#b9a3f5', text: '#150629', sub: 'rgba(21,6,41,0.72)' },
  { bg: '#a21caf', text: '#ffffff', sub: 'rgba(255,255,255,0.82)' },
];

export const StackedCards: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 relative">
      {CATS.map((cat, i) => {
        const items = PRODUCTS.filter((p) => p.cat === cat.id);
        const fromPrice = Math.min(...items.map((p) => p.price));
        const theme = CARD_THEMES[i % CARD_THEMES.length];

        return (
          <article
            key={cat.id}
            className="sticky rounded-[36px] overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[440px] md:h-[540px] border border-white/10 shadow-2xl transition-all duration-300"
            style={{
              top: `calc(90px + ${i * 14}px)`,
              backgroundColor: theme.bg,
              color: theme.text,
            }}
          >
            {/* Left Content Column */}
            <div className="p-8 md:p-12 flex flex-col justify-between gap-6 relative z-10">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider">
                <span
                  className="px-3 py-1.5 rounded-full border"
                  style={{ borderColor: 'currentColor' }}
                >
                  {items.length} items
                </span>
                <span
                  className="px-3 py-1.5 rounded-full border"
                  style={{ borderColor: 'currentColor' }}
                >
                  From {money(fromPrice)}
                </span>
              </div>

              <div>
                <h3 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
                  {cat.name}
                </h3>
                <p className="mt-4 text-sm sm:text-base max-w-md leading-relaxed" style={{ color: theme.sub }}>
                  {cat.blurb}
                </p>
              </div>

              <div>
                <Link
                  href={`/shop?cat=${cat.id}`}
                  className="inline-flex items-center gap-2 py-3 px-6 rounded-full font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                  style={{ backgroundColor: theme.text, color: theme.bg }}
                >
                  Shop {cat.name} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Visual Floating Art Column */}
            <div className="relative min-h-[240px] overflow-hidden flex items-center justify-center">
              {/* Outer circle accent */}
              <div className="absolute right-[-15%] bottom-[-20%] w-[110%] aspect-square rounded-full border border-current opacity-15 pointer-events-none" />

              {/* 3 Floating Art Items */}
              {cat.art.slice(0, 3).map((artType, idx) => {
                const positions = [
                  'left-[6%] top-[12%] -rotate-12 w-[48%]',
                  'right-[6%] top-[6%] rotate-12 w-[44%]',
                  'left-[28%] bottom-[-5%] -rotate-3 w-[46%] z-10',
                ];

                return (
                  <div
                    key={idx}
                    className={`absolute drop-shadow-2xl transition-transform duration-700 hover:scale-110 ${positions[idx]}`}
                  >
                    <ProductArt
                      type={artType}
                      color={cat.cols[idx] || 'violet'}
                      view="bare"
                    />
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
};
