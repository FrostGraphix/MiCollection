'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CATS, PRODUCTS } from '@/lib/products';
import { money } from '@/lib/utils';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ProductImage } from './ProductImage';

const CARD_THEMES = [
  { bg: '#5b21b6', text: '#f7f2ff', sub: 'rgba(247,242,255,0.85)' },
  { bg: '#0b0613', text: '#f7f2ff', sub: 'rgba(247,242,255,0.8)' },
  { bg: '#ddd2ff', text: '#1d0b3a', sub: 'rgba(29,11,58,0.82)' },
  { bg: '#7c3aed', text: '#ffffff', sub: 'rgba(255,255,255,0.88)' },
  { bg: '#f6f1ff', text: '#1d0b3a', sub: 'rgba(29,11,58,0.82)' },
  { bg: '#1c0a3a', text: '#f7f2ff', sub: 'rgba(247,242,255,0.82)' },
  { bg: '#b9a3f5', text: '#150629', sub: 'rgba(21,6,41,0.82)' },
  { bg: '#a21caf', text: '#ffffff', sub: 'rgba(255,255,255,0.88)' },
];

export const StackedCards: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic scroll compression and brightness dimming physics from original MiCollections.html
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const cards = containerRef.current.querySelectorAll<HTMLElement>('.stack-card');
      if (!cards.length) return;

      const topOffset = 96;
      cards.forEach((card, idx) => {
        const nextCard = cards[idx + 1];
        if (!nextCard) return;

        const h = card.offsetHeight;
        const stickyTop = topOffset + idx * 16;
        const nextTop = nextCard.getBoundingClientRect().top;
        const progress = Math.min(Math.max(1 - (nextTop - stickyTop) / (h * 0.95), 0), 1);

        card.style.transform = `scale(${1 - progress * 0.05})`;
        card.style.filter = `brightness(${1 - progress * 0.4})`;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col gap-8 pb-12 relative">
      {CATS.map((cat, i) => {
        const items = PRODUCTS.filter((p) => p.cat === cat.id);
        const fromPrice = Math.min(...items.map((p) => p.price));
        const theme = CARD_THEMES[i % CARD_THEMES.length];
        const previewItem1 = items[0];
        const previewItem2 = items[1] || items[0];

        return (
          <article
            key={cat.id}
            className="stack-card sticky rounded-3xl sm:rounded-[36px] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[430px] h-[min(74vh,560px)] border border-white/10 will-change-transform"
            style={{
              top: `calc(96px + ${i * 16}px)`,
              backgroundColor: theme.bg,
              color: theme.text,
              transformOrigin: '50% 0',
              boxShadow: '0 -24px 60px -30px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Left Content Column */}
            <div className="md:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between gap-6 relative z-10">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                <span
                  className="px-3 py-1 rounded-full border backdrop-blur-sm"
                  style={{ borderColor: 'currentColor' }}
                >
                  {items.length} items
                </span>
                <span
                  className="px-3 py-1 rounded-full border backdrop-blur-sm"
                  style={{ borderColor: 'currentColor' }}
                >
                  From {money(fromPrice)}
                </span>
              </div>

              <div>
                <h3 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
                  {cat.name}
                </h3>
                <p
                  className="mt-3 sm:mt-4 text-xs sm:text-base max-w-md leading-relaxed"
                  style={{ color: theme.sub }}
                >
                  {cat.blurb}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href={`/shop?cat=${cat.id}`}
                  className="inline-flex items-center gap-2 py-3 px-6 rounded-full font-semibold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                  style={{ backgroundColor: theme.text, color: theme.bg }}
                >
                  Shop {cat.name} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Visual Floating Editorial Stage */}
            <div className="md:col-span-5 relative min-h-[220px] sm:min-h-[260px] md:min-h-full overflow-hidden flex items-center justify-center p-4 sm:p-8">
              {/* Subtle ambient circle backdrop */}
              <div className="absolute right-[-15%] bottom-[-20%] w-[120%] aspect-square rounded-full border border-current opacity-15 pointer-events-none" />

              {/* Main Focal Editorial Photo */}
              <div className="relative w-[65%] sm:w-[60%] md:w-[75%] aspect-[3/3.8] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={`${cat.name} world`}
                    fill
                    sizes="(max-width: 768px) 60vw, 30vw"
                    className="object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute left-3 bottom-3 right-3 text-white text-[11px] font-semibold flex items-center justify-between">
                  <span>{cat.name} Collection</span>
                  <Sparkles className="w-3.5 h-3.5 text-brand-light" />
                </div>
              </div>

              {/* Floating Product Badge 1 */}
              {previewItem1 && (
                <div className="hidden sm:flex absolute left-4 bottom-6 z-10 items-center gap-2.5 p-2 pr-3.5 rounded-2xl bg-white/90 dark:bg-black/85 backdrop-blur-md text-[var(--ink)] shadow-xl border border-white/20 transform -rotate-3 hover:rotate-0 transition-transform">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--surface2)] flex-shrink-0 relative">
                    <ProductImage
                      src={previewItem1.images?.[0]}
                      alt={previewItem1.name}
                      fallbackArt={{ type: previewItem1.art, color: previewItem1.colors[0], view: 0 }}
                    />
                  </div>
                  <div className="text-left leading-tight">
                    <span className="block font-semibold text-[11px] truncate max-w-[110px]">
                      {previewItem1.name}
                    </span>
                    <b className="text-[10px] text-brand">{money(previewItem1.price)}</b>
                  </div>
                </div>
              )}

              {/* Floating Product Badge 2 */}
              {previewItem2 && (
                <div className="hidden sm:flex absolute right-4 top-6 z-10 items-center gap-2.5 p-2 pr-3.5 rounded-2xl bg-white/90 dark:bg-black/85 backdrop-blur-md text-[var(--ink)] shadow-xl border border-white/20 transform rotate-3 hover:rotate-0 transition-transform">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--surface2)] flex-shrink-0 relative">
                    <ProductImage
                      src={previewItem2.images?.[0]}
                      alt={previewItem2.name}
                      fallbackArt={{ type: previewItem2.art, color: previewItem2.colors[0], view: 0 }}
                    />
                  </div>
                  <div className="text-left leading-tight">
                    <span className="block font-semibold text-[11px] truncate max-w-[110px]">
                      {previewItem2.name}
                    </span>
                    <b className="text-[10px] text-brand">{money(previewItem2.price)}</b>
                  </div>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};
