'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Minus, Trash2, ArrowRight, ArrowLeft, MessageSquare } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { byId, CFG, PAL } from '@/lib/products';
import { lineKey, money, generateOrderText, waLink } from '@/lib/utils';
import { ProductArt } from '@/components/shop/ProductArt';
import { ProductImage } from '@/components/shop/ProductImage';

export default function CartPage() {
  const {
    cart,
    subtotal,
    discount,
    promoApplied,
    promoCode,
    setQty,
    removeItem,
    applyPromo,
  } = useCart();

  const [inputCode, setInputCode] = useState(promoCode);
  const [promoMessage, setPromoMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  const freeThreshold = CFG.freeOver;
  const currentTotal = subtotal - discount;
  const amountLeft = Math.max(0, freeThreshold - currentTotal);
  const progressPercent = Math.min(100, (currentTotal / freeThreshold) * 100);

  const handleApplyPromo = () => {
    if (!inputCode.trim()) return;
    const res = applyPromo(inputCode);
    setPromoMessage({ text: res.message, isError: !res.success });
  };

  const whatsappCartMessage = generateOrderText(null, cart, subtotal);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="w-32 h-32 mx-auto opacity-75">
          <ProductArt type="tote" color="violet" view={0} />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
          Your cart is <em className="serif-italic">empty</em>
        </h1>
        <p className="text-sm text-[var(--mute)] max-w-sm mx-auto">
          Browse the shelves and pick something you love. Your selections will be waiting right here.
        </p>
        <div>
          <Link href="/shop" className="btn-primary text-xs py-3 px-8">
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--mute)] mb-4">
        <Link href="/" className="hover:text-brand transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--ink)] font-semibold">Cart</span>
      </nav>

      <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mb-8">
        Your <em className="serif-italic">Cart</em>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Cart Items List */}
        <div className="lg:col-span-8 flex flex-col divide-y divide-[var(--line)]">
          {cart.map((item) => {
            const product = byId(item.id);
            if (!product) return null;
            const k = lineKey(item);

            return (
              <div
                key={k}
                className="py-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between"
              >
                <div className="flex gap-4 items-center min-w-0">
                  <Link
                    href={`/product/${product.id}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[var(--surface2)] border border-[var(--line)] flex-shrink-0 relative"
                  >
                    <ProductImage
                      src={product.images?.[0]}
                      alt={product.name}
                      fallbackArt={{ type: product.art, color: item.color, view: 0 }}
                    />
                  </Link>

                  <div className="min-w-0">
                    <Link
                      href={`/product/${product.id}`}
                      className="font-display font-semibold text-base sm:text-lg hover:text-brand transition-colors line-clamp-1"
                    >
                      {product.name}
                    </Link>
                    <div className="text-xs text-[var(--mute)] mt-0.5">
                      {PAL[item.color]?.n || item.color}
                      {item.size ? ` / ${item.size}` : ''}
                    </div>
                    <div className="font-display font-bold text-sm sm:hidden mt-2">
                      {money(product.price * item.qty)}
                    </div>
                  </div>
                </div>

                {/* Controls & Price */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="inline-flex items-center border border-[var(--line)] rounded-full h-9 px-2 bg-[var(--surface)]">
                    <button
                      onClick={() => setQty(k, item.qty - 1)}
                      className="w-6 h-full flex items-center justify-center text-[var(--mute)] hover:text-brand"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold font-mono">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => setQty(k, item.qty + 1)}
                      className="w-6 h-full flex items-center justify-center text-[var(--mute)] hover:text-brand"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="hidden sm:block text-right min-w-[100px]">
                    <span className="font-display font-bold text-base sm:text-lg">
                      {money(product.price * item.qty)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(k)}
                    className="text-[var(--mute)] hover:text-red-500 transition-colors p-2"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-6">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-xs font-semibold text-brand hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right Sticky Order Summary */}
        <aside
          className="lg:col-span-4 lg:sticky lg:top-24 p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xl flex flex-col gap-6"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <h3 className="font-display text-xl font-bold">Order Summary</h3>

          {/* Free Shipping Milestone */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[var(--surface2)] border border-[var(--line)]">
            <div className="flex items-center justify-between text-xs">
              {amountLeft > 0 ? (
                <span>
                  Add <b>{money(amountLeft)}</b> more for free delivery
                </span>
              ) : (
                <span className="text-green-600 font-semibold">
                  ✓ You unlock free delivery!
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

          {/* Promo Code Input */}
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="PROMO CODE"
                className="flex-1 uppercase font-mono text-xs h-11 px-4 rounded-full bg-[var(--surface2)] border border-[var(--line)] outline-none focus:border-brand"
              />
              <button
                onClick={handleApplyPromo}
                className="btn-primary text-xs py-2 px-5"
              >
                Apply
              </button>
            </div>
            {promoMessage && (
              <p
                className={`text-xs ${
                  promoMessage.isError ? 'text-red-500' : 'text-green-600 font-semibold'
                }`}
              >
                {promoMessage.text}
              </p>
            )}
            {!promoMessage && (
              <p className="text-[11px] text-[var(--mute)]">
                Use code <b>WELCOME10</b> for 10% off your order.
              </p>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2.5 text-sm pt-2 border-t border-[var(--line)]">
            <div className="flex justify-between">
              <span className="text-[var(--mute)]">Subtotal</span>
              <span className="font-medium font-mono">{money(subtotal)}</span>
            </div>

            {promoApplied && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount ({CFG.promo.pct}%)</span>
                <span className="font-mono">-{money(discount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-[var(--mute)]">Delivery</span>
              <span className="text-xs text-[var(--mute)]">Calculated at checkout</span>
            </div>

            <div className="flex justify-between font-display text-xl font-bold pt-3 border-t border-[var(--line)]">
              <span>Total</span>
              <span>{money(subtotal - discount)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/checkout"
              className="btn-primary text-sm py-3.5 w-full justify-center"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href={waLink(whatsappCartMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa text-xs py-3 w-full justify-center"
            >
              <MessageSquare className="w-4 h-4" /> Send Cart on WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
