'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PRODUCTS } from '@/lib/products';
import { ProductCard } from './ProductCard';

export const BudgetShelf: React.FC = () => {
  const shelfRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
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

  // Desktop click-and-drag horizontal physics from MiCollections.html
  useEffect(() => {
    const sh = shelfRef.current;
    if (!sh) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let moved = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      isDown = true;
      moved = 0;
      startX = e.clientX;
      scrollLeft = sh.scrollLeft;
      setIsDragging(true);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      moved = Math.abs(dx);
      sh.scrollLeft = scrollLeft - dx;
    };

    const handlePointerUp = () => {
      isDown = false;
      setTimeout(() => setIsDragging(false), 50);
    };

    const handleClick = (e: MouseEvent) => {
      if (moved > 5) {
        e.preventDefault();
        e.stopPropagation();
        moved = 0;
      }
    };

    sh.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    sh.addEventListener('click', handleClick, true);

    return () => {
      sh.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      sh.removeEventListener('click', handleClick, true);
    };
  }, []);

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
        className={`flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory select-none ${
          isDragging ? 'cursor-grabbing snap-none' : 'cursor-grab'
        }`}
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

