'use client';

import React from 'react';
import Link from 'next/link';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { byId, CFG, PAL, PRODUCTS } from '@/lib/products';
import { lineKey, money } from '@/lib/utils';
import { ProductArt } from './ProductArt';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartCount,
    subtotal,
    discount,
    isDrawerOpen,
    closeDrawer,
    setQty,
    removeItem,
    addToCart,
  } = useCart();

  if (!isDrawerOpen) return null;

  const freeThreshold = CFG.freeOver;
  const currentTotal = subtotal - discount;
  const amountLeft = Math.max(0, freeThreshold - currentTotal);
  const progressPercent = Math.min(100, (currentTotal / freeThreshold) * 100);

  // Pick up to 3 affordable items not currently in the cart for upsell
  const upsellItems = PRODUCTS.filter(
    (p) => !cart.some((l) => l.id === p.id) && p.price <= 10000
  ).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Scrim backdrop */}
      <div
        onClick={closeDrawer}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div
        className="relative w-full max-w-md bg-[var(--surface)] border-l border-[var(--line)] shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl font-bold">Your Cart</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--pill)] text-brand">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={closeDrawer}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--pill)] text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
              <div className="w-28 h-28 mb-4 opacity-80">
                <ProductArt type="tote" color="violet" view={0} />
              </div>
              <h4 className="font-display text-lg font-bold">Your cart is empty</h4>
              <p className="text-xs text-[var(--mute)] mt-1 max-w-xs mb-6">
                Pick something you love from our store. We will pack it and deliver it to you.
              </p>
              <button
                onClick={closeDrawer}
                className="btn-primary text-xs py-2.5 px-6"
              >
                Start Shopping <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {cart.map((item) => {
                const product = byId(item.id);
                if (!product) return null;
                const k = lineKey(item);

                return (
                  <div key={k} className="py-4 flex gap-3.5 items-start">
                    {/* Item Thumbnail */}
                    <Link
                      href={`/product/${product.id}`}
                      onClick={closeDrawer}
                      className="w-20 h-20 rounded-2xl overflow-hidden bg-[var(--surface2)] border border-[var(--line)] flex-shrink-0"
                    >
                      <ProductArt type={product.art} color={item.color} view={0} />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${product.id}`}
                        onClick={closeDrawer}
                        className="font-display font-semibold text-sm hover:text-brand line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <div className="text-xs text-[var(--mute)] mt-0.5">
                        {PAL[item.color]?.n || item.color}
                        {item.size ? ` / ${item.size}` : ''}
                      </div>

                      {/* Quantity Stepper & Remove */}
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="inline-flex items-center border border-[var(--line)] rounded-full h-7 px-1 bg-[var(--surface2)]">
                          <button
                            onClick={() => setQty(k, item.qty - 1)}
                            className="w-5 h-full flex items-center justify-center text-[var(--mute)] hover:text-brand"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold font-mono">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => setQty(k, item.qty + 1)}
                            className="w-5 h-full flex items-center justify-center text-[var(--mute)] hover:text-brand"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(k)}
                          className="text-[var(--mute)] hover:text-red-500 transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="text-right">
                      <span className="font-display font-bold text-sm">
                        {money(product.price * item.qty)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upsells */}
          {cart.length > 0 && upsellItems.length > 0 && (
            <div className="pt-4 border-t border-[var(--line)]">
              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)] mb-2.5">
                Add a little extra
              </h5>
              <div className="space-y-2">
                {upsellItems.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[var(--surface2)] border border-[var(--line)]"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                      <ProductArt type={p.art} color={p.colors[0]} view={0} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block font-semibold text-xs truncate">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-[var(--mute)] font-mono">
                        {money(p.price)}
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(p.id, p.colors[0])}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand text-white hover:bg-brand-deep transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Free Shipping Bar & Checkout */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-[var(--line)] bg-[var(--surface2)] flex flex-col gap-3">
            {/* Free Shipping Milestone */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                {amountLeft > 0 ? (
                  <span>
                    Add <b>{money(amountLeft)}</b> more for free delivery
                  </span>
                ) : (
                  <span className="text-green-600 font-semibold flex items-center gap-1">
                    ✓ You unlocked free nationwide delivery!
                  </span>
                )}
                <span className="text-[10px] text-[var(--mute)]">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--line)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand to-orchid transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-between font-display text-lg font-bold pt-1">
              <span>Subtotal</span>
              <span>{money(subtotal - discount)}</span>
            </div>

            <p className="text-[11px] text-[var(--mute)]">
              Delivery fees and promo discounts are calculated at checkout.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="btn-ghost text-xs py-3 text-center"
              >
                View Full Cart
              </Link>
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="btn-primary text-xs py-3 text-center"
              >
                Checkout <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
