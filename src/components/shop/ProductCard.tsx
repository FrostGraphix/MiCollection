'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Plus } from 'lucide-react';
import { Product } from '@/types';
import { PAL } from '@/lib/products';
import { money } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { ProductArt } from './ProductArt';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);

  const isSaved = isInWishlist(product.id);
  const primaryColor = product.colors[0];
  const alternateColor = product.colors[Math.min(1, product.colors.length - 1)];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, primaryColor, product.sizes ? product.sizes[0] : undefined);
  };

  const handleToggleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <article
      className="group relative flex flex-col gap-3 min-w-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Stage */}
      <Link
        href={`/product/${product.id}`}
        className="relative block aspect-[1/1.12] rounded-3xl overflow-hidden bg-[var(--surface2)] border border-[var(--line)] shadow-sm transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-xl"
      >
        {/* Resting Art (View 0) */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isHovered ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <ProductArt type={product.art} color={primaryColor} view={0} />
        </div>

        {/* Hover Art (View 1, alternate angle) */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <ProductArt type={product.art} color={alternateColor} view={1} />
        </div>

        {/* Badge */}
        {product.badge && (
          <span
            className={`absolute left-3 top-3 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase z-10 shadow-sm ${
              product.badge === 'Sale'
                ? 'bg-brand text-white'
                : 'bg-[var(--ink)] text-[var(--bg)]'
            }`}
          >
            {product.badge}
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWish}
          className={`absolute right-3 top-3 z-10 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border border-[var(--line)] transition-all duration-300 hover:scale-110 active:scale-95 ${
            isSaved
              ? 'bg-brand text-white border-transparent'
              : 'bg-[var(--nav-bg)] text-[var(--ink)]'
          }`}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Add Overlay Button on Desktop */}
        <button
          onClick={handleQuickAdd}
          className="hidden md:flex absolute left-3 right-3 bottom-3 z-10 items-center justify-center gap-1.5 py-3 rounded-full bg-[var(--ink)] text-[var(--bg)] text-xs font-semibold shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-brand hover:text-white transition-all duration-300"
        >
          <span>{product.sizes && product.sizes.length > 1 ? 'Quick Add' : 'Add to Cart'}</span>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </Link>

      {/* Meta info */}
      <div className="flex flex-col gap-1 px-1">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--mute)]">
          {product.cat}
        </span>
        <h3 className="font-display font-semibold text-sm sm:text-base leading-snug truncate">
          <Link
            href={`/product/${product.id}`}
            className="hover:text-brand transition-colors"
          >
            {product.name}
          </Link>
        </h3>
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="font-display font-bold text-sm sm:text-base">
            <span>{money(product.price)}</span>
            {product.was && (
              <s className="text-xs text-[var(--mute)] font-normal ml-1.5 font-mono">
                {money(product.was)}
              </s>
            )}
          </div>

          {/* Color swatch dots */}
          {product.colors.length > 1 && (
            <div className="flex gap-1 items-center">
              {product.colors.map((colorKey) => (
                <span
                  key={colorKey}
                  className="w-3 h-3 rounded-full border border-white/60 shadow-sm"
                  style={{ backgroundColor: PAL[colorKey]?.main || '#7c3aed' }}
                  title={PAL[colorKey]?.n || colorKey}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
