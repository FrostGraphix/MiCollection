'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { byId } from '@/lib/products';
import { ProductCard } from '@/components/shop/ProductCard';

import { Product } from '@/types';

export default function WishlistPage() {
  const { wishlist } = useWishlist();

  const savedProducts: Product[] = wishlist
    .map((id) => byId(id))
    .filter((p): p is Product => Boolean(p));

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--mute)] mb-4">
        <Link href="/" className="hover:text-brand transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--ink)] font-semibold">Wishlist</span>
      </nav>

      <div className="mb-8">
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
          Saved <em className="serif-italic">For Later</em>
        </h1>
        <p className="text-sm text-[var(--ink2)] max-w-md mt-1">
          Your saved items will wait here for you. Tap on any item to view details or add to cart.
        </p>
      </div>

      {savedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 space-y-4 rounded-3xl border-2 border-dashed border-[var(--line)]">
          <div className="w-16 h-16 rounded-full bg-[var(--pill)] text-brand flex items-center justify-center mb-2">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-display text-2xl font-bold">No favourites saved yet</h3>
          <p className="text-xs sm:text-sm text-[var(--mute)] max-w-sm">
            Tap the heart icon on any product in our shop and it will be safely kept right here.
          </p>
          <div className="pt-2">
            <Link href="/shop" className="btn-primary text-xs py-3 px-6">
              Browse Collection <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
