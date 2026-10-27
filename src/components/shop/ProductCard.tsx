'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Heart, Plus, Check } from 'lucide-react';
import { Product } from '@/types';
import { PAL } from '@/lib/products';
import { money } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { ProductImage } from './ProductImage';
import { flyToCart } from '@/lib/effects';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [heartPopping, setHeartPopping] = useState(false);
  const cardImgRef = useRef<HTMLAnchorElement>(null);

  const isSaved = isInWishlist(product.id);
  const primaryColor = product.colors[0];
  const alternateColor = product.colors[Math.min(1, product.colors.length - 1)];

  const primaryImage = product.images?.[0];
  const hoverImage = product.images?.[1] || product.images?.[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, primaryColor, product.sizes ? product.sizes[0] : undefined);

    // Parabolic arc fly to cart
    if (cardImgRef.current) {
      flyToCart(cardImgRef.current, primaryImage);
    }

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const handleToggleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
    setHeartPopping(true);
    setTimeout(() => setHeartPopping(false), 500);
  };

  return (
    <article
      className="group relative flex flex-col gap-3 min-w-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Stage */}
      <Link
        ref={cardImgRef}
        href={`/product/${product.id}`}
        className="relative block aspect-[1/1.12] rounded-[26px] overflow-hidden bg-[var(--surface2)] border border-[var(--line)] shadow-sm transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-xl"
        style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}
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
              alt={`${product.name} alternate view`}
              fallbackArt={{ type: product.art, color: alternateColor, view: 1 }}
            />
          </div>
        )}

        {/* Badge: New / Sale / Popular / Trending */}
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

        {/* Wishlist Heart Button with glass backdrop and pop animation */}
        <button
          onClick={handleToggleWish}
          className={`absolute right-3 top-3 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center backdrop-blur-md border border-[var(--line)] transition-all duration-300 hover:scale-110 active:scale-95 ${
            heartPopping ? 'animate-pop' : ''
          } ${
            isSaved
              ? 'bg-brand text-white border-transparent'
              : 'bg-[var(--nav-bg)] text-[var(--ink)]'
          }`}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Mobile Quick Add Floating Button (Touch-Friendly) */}
        <button
          onClick={handleQuickAdd}
          className={`md:hidden absolute right-3 bottom-3 z-10 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-md active:scale-90 transition-all ${
            justAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-brand text-white'
          }`}
          aria-label="Add to cart"
        >
          {justAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>

        {/* Desktop Quick Add Overlay Button on Hover - Inset Purple Pill Button */}
        <button
          onClick={handleQuickAdd}
          className="hidden md:flex absolute left-3 right-3 bottom-3 z-10 items-center justify-center gap-2 py-3 rounded-full bg-brand text-white text-xs font-semibold shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-brand-deep transition-all duration-300"
        >
          {justAdded ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Added to Cart!</span>
            </>
          ) : (
            <>
              <span>{product.sizes && product.sizes.length > 1 ? 'Quick Add' : 'Add to Cart'}</span>
              <Plus className="w-4 h-4" />
            </>
          )}
        </button>
      </Link>

      {/* Product Meta Section */}
      <div className="flex flex-col gap-1 px-1">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--mute)]">
          {product.cat}
        </span>
        <h3 className="font-display font-semibold text-sm sm:text-base leading-snug line-clamp-1">
          <Link
            href={`/product/${product.id}`}
            className="hover:text-brand transition-colors"
          >
            {product.name}
          </Link>
        </h3>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="font-display font-bold text-sm sm:text-base flex items-baseline flex-wrap gap-1.5">
            <span>{money(product.price)}</span>
            {product.was && (
              <s className="text-xs text-[var(--mute)] font-normal font-mono">
                {money(product.was)}
              </s>
            )}
          </div>

          {/* Color swatch dots */}
          {product.colors.length > 1 && (
            <div className="flex gap-1.5 items-center flex-shrink-0">
              {product.colors.slice(0, 3).map((colorKey) => (
                <span
                  key={colorKey}
                  className="w-3 h-3 rounded-full border border-white/80 shadow-sm"
                  style={{ backgroundColor: PAL[colorKey]?.main || '#7c3aed' }}
                  title={PAL[colorKey]?.n || colorKey}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-[10px] text-[var(--mute)] font-mono font-medium">
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

