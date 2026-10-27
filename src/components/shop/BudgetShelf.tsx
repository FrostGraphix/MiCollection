'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PRODUCTS } from '@/lib/products';
import { ProductCard } from './ProductCard';

export const BudgetShelf: React.FC = () => {
  const shelfRef = useRef<HTMLDivElement>(null);
  const cheapProducts = PRODUCTS.filter((p) => p.price <= 10000).sort(
    (a, b) => a.price - b.price
  );

  const scroll = (direction: 'left' | 'right') => {
    if (shelfRef.current) {
      const scrollAmount = shelfRef.current.clientWidth * 0.75;
      shelfRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">
            Budget Finds
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-1">
            Lovely things under ₦10,000.
          </h2>
        </div>

        {/* Scroll Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-11 h-11 rounded-full border border-[var(--line)] flex items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition-all active:scale-95 shadow-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-11 h-11 rounded-full border border-[var(--line)] flex items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition-all active:scale-95 shadow-sm"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={shelfRef}
        className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cheapProducts.map((product) => (
          <div
            key={product.id}
            className="flex-none w-[240px] sm:w-[270px] snap-start"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};
