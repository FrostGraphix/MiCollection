'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, RotateCcw, MessageSquare, SlidersHorizontal } from 'lucide-react';
import { CATS, PRODUCTS, catOf } from '@/lib/products';
import { money, waLink } from '@/lib/utils';
import { ProductCard } from '@/components/shop/ProductCard';

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('cat') || 'all';
  const initialQ = searchParams.get('q') || '';

  const [selectedCat, setSelectedCat] = useState<string>(initialCat);
  const [maxPrice, setMaxPrice] = useState<number>(40000);
  const [searchQuery, setSearchQuery] = useState<string>(initialQ);
  const [sortBy, setSortBy] = useState<'featured' | 'low' | 'high' | 'az'>('featured');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  const filteredProducts = useMemo(() => {
    let result = PRODUCTS.filter((p) => {
      const matchCat = selectedCat === 'all' || p.cat === selectedCat;
      const matchPrice = p.price <= maxPrice;
      const matchQuery =
        !searchQuery.trim() ||
        `${p.name} ${p.desc} ${p.cat}`.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchPrice && matchQuery;
    });

    if (sortBy === 'low') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'high') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'az') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [selectedCat, maxPrice, searchQuery, sortBy]);

  const resetFilters = () => {
    setSelectedCat('all');
    setMaxPrice(40000);
    setSearchQuery('');
    setSortBy('featured');
  };

  const currentCategory = catOf(selectedCat);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--mute)] mb-4">
        <Link href="/" className="hover:text-brand transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--ink)] font-semibold">Shop</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight">
          {selectedCat === 'all' ? (
            <>
              All <em className="serif-italic">Products</em>
            </>
          ) : (
            currentCategory.name
          )}
        </h1>
        <p className="text-sm text-[var(--ink2)] max-w-xl mt-2 leading-relaxed">
          Fashion, footwear, smart gadgets, and kitchen finds. Every price is in Nigerian Naira and every order is confirmed with you on WhatsApp.
        </p>
      </div>

      {/* Mobile Horizontal Category Chips */}
      <div className="flex lg:hidden gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        <button
          onClick={() => setSelectedCat('all')}
          className={`flex-none text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
            selectedCat === 'all'
              ? 'bg-brand text-white border-transparent'
              : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink)]'
          }`}
        >
          All ({PRODUCTS.length})
        </button>
        {CATS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`flex-none text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
              selectedCat === cat.id
                ? 'bg-brand text-white border-transparent'
                : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink)]'
            }`}
          >
            {cat.name} ({PRODUCTS.filter((p) => p.cat === cat.id).length})
          </button>
        ))}
      </div>

      {/* Main Layout: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside
          className="hidden lg:block lg:col-span-3 sticky top-24 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-6"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          {/* Categories Filter */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-3">
              Categories
            </h4>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setSelectedCat('all')}
                className={`flex items-center justify-between text-xs font-semibold py-2 px-3 rounded-xl transition-all ${
                  selectedCat === 'all'
                    ? 'bg-brand text-white'
                    : 'text-[var(--ink)] hover:bg-[var(--pill)]'
                }`}
              >
                <span>All Products</span>
                <span className="opacity-70 font-mono">{PRODUCTS.length}</span>
              </button>
              {CATS.map((cat) => {
                const count = PRODUCTS.filter((p) => p.cat === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className={`flex items-center justify-between text-xs font-semibold py-2 px-3 rounded-xl transition-all ${
                      selectedCat === cat.id
                        ? 'bg-brand text-white'
                        : 'text-[var(--ink)] hover:bg-[var(--pill)]'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="opacity-70 font-mono">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Slider */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-2">
              Max Price
            </h4>
            <input
              type="range"
              min="2000"
              max="40000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-brand cursor-pointer"
            />
            <div className="flex justify-between items-center text-xs mt-1 font-mono">
              <span className="text-[var(--mute)]">₦2,000</span>
              <span className="font-bold text-brand">{money(maxPrice)}</span>
            </div>
          </div>

          {/* Need Help WhatsApp Button */}
          <div className="pt-2 border-t border-[var(--line)]">
            <a
              href={waLink('Hello MiCollections, I need help choosing a product from the shop.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa text-xs py-2.5 px-4 w-full justify-center"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Need help choosing?
            </a>
          </div>
        </aside>

        {/* Product Catalog Content */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {/* Top Controls: Search Bar & Sort Dropdown */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search this collection..."
                className="w-full h-11 pl-10 pr-4 rounded-full bg-[var(--surface)] border border-[var(--line)] text-xs outline-none focus:border-brand transition-colors"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs text-[var(--mute)]">
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'product' : 'products'}
              </span>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`lg:hidden flex items-center gap-1.5 h-11 px-4 rounded-full border text-xs font-semibold transition-all ${
                  showMobileFilters
                    ? 'bg-brand text-white border-transparent shadow'
                    : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink)]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Price</span>
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-11 px-4 rounded-full bg-[var(--surface)] border border-[var(--line)] text-xs font-semibold outline-none cursor-pointer focus:border-brand"
              >
                <option value="featured">Featured</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="az">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Expandable Mobile Filters Sheet */}
          {showMobileFilters && (
            <div className="lg:hidden p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-lg space-y-4 animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--mute)]">
                  Filter by Price
                </span>
                <span className="text-xs font-bold font-mono text-brand">
                  Up to {money(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min="2000"
                max="40000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand cursor-pointer"
              />
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={resetFilters}
                  className="text-xs font-semibold text-brand flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset all
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="text-xs font-semibold px-4 py-1.5 rounded-full bg-[var(--ink)] text-[var(--bg)]"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 sm:p-16 rounded-3xl border-2 border-dashed border-[var(--line)] space-y-4">
              <h3 className="font-display text-2xl font-bold">Nothing matches yet</h3>
              <p className="text-xs sm:text-sm text-[var(--mute)] max-w-sm">
                Try selecting another category, clearing your search, or raising the maximum price limit.
              </p>
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <button
                  onClick={resetFilters}
                  className="btn-ghost text-xs py-2.5 px-5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
                </button>
                <a
                  href={waLink('Hello MiCollections, I am looking for something I did not find in the shop.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-wa text-xs py-2.5 px-5"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Ask on WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-12">Loading products...</div>}>
      <ShopContent />
    </Suspense>
  );
}
