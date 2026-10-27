'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Plus, Check } from 'lucide-react';
import { Product } from '@/types';
import { PAL } from '@/lib/products';
import { money } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const isSaved = isInWishlist(product.id);
  const primaryColor = product.colors[0];
  const alternateColor = product.colors[Math.min(1, product.colors.length - 1)];

  const primaryImage = product.images?.[0];
  const hoverImage = product.images?.[1] || product.images?.[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, primaryColor, product.sizes ? product.sizes[0] : undefined);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const handleToggleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <article
      className="group relative flex flex-col gap-2.5 sm:gap-3 min-w-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Stage */}
      <Link
        href={`/product/${product.id}`}
        className="relative block aspect-[1/1.12] rounded-2xl sm:rounded-3xl overflow-hidden bg-[var(--surface2)] border border-[var(--line)] shadow-sm transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-xl"
      >
        {/* Primary Image View */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isHovered && hoverImage && hoverImage !== primaryImage ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <ProductImage
            src={primaryImage}
            alt={product.name}
            priority={index < 4}
            fallbackArt={{ type: product.art, color: primaryColor, view: 0 }}
          />
        </div>

        {/* Alternate Hover Image View */}
        {hoverImage && hoverImage !== primaryImage && (
          <div
            className={`absolute inset-0 transition-all duration-500 ${
              isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`}
          >
            <ProductImage
              src={hoverImage}
              alt={`${product.name} angle 2`}
              fallbackArt={{ type: product.art, color: alternateColor, view: 1 }}
            />
          </div>
        )}

        {/* Badge */}
        {product.badge && (
          <span
            className={`absolute left-2.5 sm:left-3 top-2.5 sm:top-3 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase z-10 shadow-sm ${
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
          className={`absolute right-2.5 sm:right-3 top-2.5 sm:top-3 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center backdrop-blur-md border border-[var(--line)] transition-all duration-300 hover:scale-110 active:scale-95 ${
            isSaved
              ? 'bg-brand text-white border-transparent'
              : 'bg-[var(--nav-bg)] text-[var(--ink)]'
          }`}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Mobile Quick Add Floating Button (Touch-Friendly) */}
        <button
          onClick={handleQuickAdd}
          className={`md:hidden absolute right-2.5 bottom-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-md active:scale-90 transition-all ${
            justAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-[var(--ink)] text-[var(--bg)]'
          }`}
          aria-label="Add to cart"
        >
          {justAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
        </button>

        {/* Desktop Quick Add Overlay Button on Hover */}
        <button
          onClick={handleQuickAdd}
          className="hidden md:flex absolute left-3 right-3 bottom-3 z-10 items-center justify-center gap-1.5 py-3 rounded-full bg-[var(--ink)] text-[var(--bg)] text-xs font-semibold shadow-lg opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-brand hover:text-white transition-all duration-300"
        >
          {justAdded ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Added to Cart!</span>
            </>
          ) : (
            <>
              <span>{product.sizes && product.sizes.length > 1 ? 'Quick Add' : 'Add to Cart'}</span>
              <Plus className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </Link>

      {/* Meta info */}
      <div className="flex flex-col gap-1 px-0.5 sm:px-1">
        <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-[var(--mute)]">
          {product.cat}
        </span>
        <h3 className="font-display font-semibold text-xs sm:text-base leading-snug line-clamp-1">
          <Link
            href={`/product/${product.id}`}
            className="hover:text-brand transition-colors"
          >
            {product.name}
          </Link>
        </h3>
        <div className="flex items-center justify-between gap-1.5 mt-0.5">
          <div className="font-display font-bold text-xs sm:text-base flex items-baseline flex-wrap gap-1">
            <span>{money(product.price)}</span>
            {product.was && (
              <s className="text-[10px] sm:text-xs text-[var(--mute)] font-normal font-mono">
                {money(product.was)}
              </s>
            )}
          </div>

          {/* Color swatch dots */}
          {product.colors.length > 1 && (
            <div className="flex gap-1 items-center flex-shrink-0">
              {product.colors.slice(0, 3).map((colorKey) => (
                <span
                  key={colorKey}
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-white/60 shadow-sm"
                  style={{ backgroundColor: PAL[colorKey]?.main || '#7c3aed' }}
                  title={PAL[colorKey]?.n || colorKey}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-[9px] text-[var(--mute)] font-mono">
                  +{product.colors.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
