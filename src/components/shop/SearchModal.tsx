'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X, MessageSquare, ArrowRight } from 'lucide-react';
import { CATS, PRODUCTS } from '@/lib/products';
import { money, waLink } from '@/lib/utils';
import { ProductArt } from './ProductArt';
import { ProductImage } from './ProductImage';
import { Product } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const popularSearches = ['Abaya', 'Sneakers', 'Smart watch', 'Perfume', 'Kitchen', 'Earrings'];

  const results: Product[] = query.trim()
    ? PRODUCTS.filter((p) => {
        const fullString = `${p.name} ${p.cat} ${p.desc}`.toLowerCase();
        return fullString.includes(query.trim().toLowerCase());
      }).slice(0, 6)
    : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Catalog"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 pb-[max(1.5rem,env(safe-area-inset-bottom))] overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--line)] rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 my-auto sm:my-0"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-[var(--line)]">
          <Search className="w-5 h-5 text-brand flex-shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search abayas, sneakers, smart watch..."
            className="flex-1 bg-transparent border-0 outline-none text-base placeholder:text-[var(--mute)]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-[var(--mute)] hover:text-[var(--ink)] px-2"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--mute)] hover:text-[var(--ink)]"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6 space-y-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {query.trim() === '' ? (
            <>
              {/* Popular Searches */}
              <div>
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)] mb-3">
                  Popular Searches
                </h5>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="text-xs font-medium px-3.5 py-1.5 rounded-full border border-[var(--line)] hover:border-brand hover:bg-[var(--pill)] transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Browse Categories */}
              <div>
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)] mb-3">
                  Browse by Category
                </h5>
                <div className="flex flex-wrap gap-2">
                  {CATS.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/shop?cat=${cat.id}`}
                      onClick={onClose}
                      className="text-xs font-medium px-3.5 py-1.5 rounded-full border border-[var(--line)] hover:border-brand hover:bg-[var(--pill)] transition-all"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)] mb-3">
                Matching Results ({results.length})
              </h5>
              <div className="divide-y divide-[var(--line)]">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-[var(--pill)] transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--surface2)] border border-[var(--line)] flex-shrink-0 relative">
                      <ProductImage
                        src={product.images?.[0]}
                        alt={product.name}
                        fallbackArt={{ type: product.art, color: product.colors[0], view: 0 }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="block font-display text-sm font-semibold truncate group-hover:text-brand transition-colors">
                        {product.name}
                      </strong>
                      <span className="text-xs text-[var(--mute)] capitalize">
                        {product.cat}
                      </span>
                    </div>
                    <span className="font-display font-bold text-sm">
                      {money(product.price)}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="pt-2 text-center">
                <Link
                  href={`/shop?q=${encodeURIComponent(query)}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                >
                  View all results for &ldquo;{query}&rdquo; <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 px-4 space-y-4">
              <h4 className="font-display text-lg font-bold">
                No match found for &ldquo;{query}&rdquo;
              </h4>
              <p className="text-xs text-[var(--mute)] max-w-sm mx-auto">
                Can&apos;t find it in stock? Send us a screenshot or picture on WhatsApp and we will source it for you right away.
              </p>
              <a
                href={waLink(`Hello MiCollections, I am looking for: ${query}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa inline-flex items-center gap-2 text-xs py-2.5 px-5"
              >
                <MessageSquare className="w-4 h-4" /> Ask & Source on WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
