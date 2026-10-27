'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Clock,
  Plus,
  Minus,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { byId, catOf, PAL, PRODUCTS } from '@/lib/products';
import { money, waLink } from '@/lib/utils';
import { ColorKey } from '@/types';
import { ProductArt } from '@/components/shop/ProductArt';
import { ProductCard } from '@/components/shop/ProductCard';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params?.id);
  const product = byId(productId);

  if (!product) {
    notFound();
  }

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selectedColor, setSelectedColor] = useState<ColorKey>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes ? product.sizes[0] : ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [activeGalleryView, setActiveGalleryView] = useState<0 | 1 | 2 | 3>(0);
  const [openAccordion, setOpenAccordion] = useState<'details' | 'delivery' | 'payment' | null>(
    'details'
  );

  const isSaved = isInWishlist(product.id);
  const category = catOf(product.cat);

  const relatedProducts = PRODUCTS.filter(
    (p) => p.cat === product.cat && p.id !== product.id
  ).slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product.id, selectedColor, selectedSize, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product.id, selectedColor, selectedSize, quantity);
    router.push('/checkout');
  };

  const whatsappMessage = `Hello MiCollections, I would like to order: ${quantity} x ${product.name} (${PAL[selectedColor]?.n || selectedColor}${selectedSize ? ', Size ' + selectedSize : ''}) at ${money(product.price)} each.`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--mute)] mb-6">
        <Link href="/" className="hover:text-brand transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href={`/shop?cat=${product.cat}`} className="hover:text-brand transition-colors">
          {category.name}
        </Link>
        <span>/</span>
        <span className="text-[var(--ink)] font-semibold truncate max-w-xs sm:max-w-md">
          {product.name}
        </span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Sticky Gallery */}
        <div className="lg:col-span-6 lg:sticky lg:top-24 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails */}
          <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible">
            {([0, 1, 2, 3] as const).map((v) => (
              <button
                key={v}
                onClick={() => setActiveGalleryView(v)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[var(--surface2)] border-2 transition-all flex-shrink-0 ${
                  activeGalleryView === v
                    ? 'border-brand scale-105 shadow-md'
                    : 'border-transparent opacity-75 hover:opacity-100'
                }`}
                aria-label={`View angle ${v + 1}`}
              >
                <ProductArt type={product.art} color={selectedColor} view={v} />
              </button>
            ))}
          </div>

          {/* Main Large Stage */}
          <div className="relative flex-1 aspect-square rounded-[34px] overflow-hidden bg-[var(--surface2)] border border-[var(--line)] shadow-xl group">
            <ProductArt type={product.art} color={selectedColor} view={activeGalleryView} />

            {/* Badge */}
            {product.badge && (
              <span className="absolute left-4 top-4 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand text-white shadow-md">
                {product.badge}
              </span>
            )}

            <div className="absolute right-4 bottom-4 px-3 py-1.5 rounded-full bg-[var(--nav-bg)] backdrop-blur-md border border-[var(--line)] text-[11px] font-semibold text-[var(--ink2)] pointer-events-none">
              MiCollections Abuja
            </div>
          </div>
        </div>

        {/* Right Details Column */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-brand">
              {category.name}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-1">
              {product.name}
            </h1>

            {/* Price and Stock status */}
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <span className="font-display text-3xl font-extrabold text-[var(--ink)]">
                {money(product.price)}
              </span>
              {product.was && (
                <s className="text-base text-[var(--mute)] font-mono">
                  {money(product.was)}
                </s>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                In stock, ships from Abuja
              </span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-[var(--ink2)] leading-relaxed">
            {product.desc}
          </p>

          {/* Color Selector */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-2.5">
              Colour: <b className="text-[var(--ink)] capitalize">{PAL[selectedColor]?.n || selectedColor}</b>
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((cKey) => {
                const isCurrent = selectedColor === cKey;
                return (
                  <button
                    key={cKey}
                    onClick={() => setSelectedColor(cKey)}
                    className={`w-10 h-10 rounded-full border-2 p-0.5 transition-all ${
                      isCurrent
                        ? 'border-brand scale-110 shadow-md'
                        : 'border-[var(--line)] hover:scale-105'
                    }`}
                    aria-label={`Select ${PAL[cKey]?.n || cKey}`}
                    title={PAL[cKey]?.n || cKey}
                  >
                    <span
                      className="block w-full h-full rounded-full shadow-inner"
                      style={{ backgroundColor: PAL[cKey]?.main || '#7c3aed' }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-2.5">
                Size: <b className="text-[var(--ink)]">{selectedSize}</b>
              </h4>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[48px] h-10 px-3.5 rounded-xl text-xs font-semibold border transition-all ${
                      selectedSize === size
                        ? 'bg-[var(--ink)] text-[var(--bg)] border-transparent shadow'
                        : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink)] hover:border-brand'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Stepper & Add to Cart */}
          <div className="flex flex-wrap gap-3 items-center pt-2">
            <div className="inline-flex items-center border border-[var(--line)] rounded-full h-12 px-2 bg-[var(--surface)]">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-full flex items-center justify-center text-[var(--mute)] hover:text-brand"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold font-mono">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(20, quantity + 1))}
                className="w-8 h-full flex items-center justify-center text-[var(--mute)] hover:text-brand"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="btn-primary text-sm flex-1 h-12"
            >
              <ShoppingBag className="w-4 h-4" /> Add to cart
            </button>

            <button
              onClick={handleBuyNow}
              className="h-12 px-6 rounded-full font-semibold text-sm bg-[var(--ink)] text-[var(--bg)] hover:opacity-90 transition-opacity"
            >
              Buy now
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={waLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa text-xs py-2.5 px-4"
            >
              <MessageSquare className="w-4 h-4" /> Order on WhatsApp
            </a>

            <button
              onClick={() => toggleWishlist(product.id)}
              className={`btn-ghost text-xs py-2.5 px-4 ${
                isSaved ? 'text-brand border-brand' : ''
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved to Wishlist' : 'Save for Later'}
            </button>
          </div>

          {/* 3 Perks Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] flex flex-col gap-1 text-xs text-[var(--ink2)]">
              <Truck className="w-5 h-5 text-brand" />
              <b className="text-[var(--ink)]">Nationwide delivery</b>
              <span>Abuja & all 36 states</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] flex flex-col gap-1 text-xs text-[var(--ink2)]">
              <ShieldCheck className="w-5 h-5 text-brand" />
              <b className="text-[var(--ink)]">Money safe with us</b>
              <span>Confirmed on WhatsApp</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] flex flex-col gap-1 text-xs text-[var(--ink2)]">
              <Clock className="w-5 h-5 text-brand" />
              <b className="text-[var(--ink)]">Open 24 hours</b>
              <span>Always ready to reply</span>
            </div>
          </div>

          {/* Accordions */}
          <div className="divide-y divide-[var(--line)] border-y border-[var(--line)] pt-2">
            {/* Features Accordion */}
            <div>
              <button
                onClick={() =>
                  setOpenAccordion(openAccordion === 'details' ? null : 'details')
                }
                className="w-full py-4 flex items-center justify-between text-left font-display font-semibold text-base hover:text-brand transition-colors"
              >
                <span>Features & Specifications</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${
                    openAccordion === 'details' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openAccordion === 'details' && (
                <div className="pb-4 text-xs sm:text-sm text-[var(--ink2)]">
                  <ul className="list-disc pl-5 space-y-1.5">
                    {product.feat.map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Delivery & Returns Accordion */}
            <div>
              <button
                onClick={() =>
                  setOpenAccordion(openAccordion === 'delivery' ? null : 'delivery')
                }
                className="w-full py-4 flex items-center justify-between text-left font-display font-semibold text-base hover:text-brand transition-colors"
              >
                <span>Delivery & Returns</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${
                    openAccordion === 'delivery' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openAccordion === 'delivery' && (
                <div className="pb-4 text-xs sm:text-sm text-[var(--ink2)] leading-relaxed space-y-2">
                  <p>
                    Abuja doorstep delivery takes 1 to 2 working days. Nationwide courier to other states takes 2 to 5 working days. Same-day pickup is also available in Abuja.
                  </p>
                  <p>
                    If an item arrives damaged or incorrect, contact us on WhatsApp within 24 hours of delivery and we will make it right immediately.
                  </p>
                </div>
              )}
            </div>

            {/* Payment & Safety Accordion */}
            <div>
              <button
                onClick={() =>
                  setOpenAccordion(openAccordion === 'payment' ? null : 'payment')
                }
                className="w-full py-4 flex items-center justify-between text-left font-display font-semibold text-base hover:text-brand transition-colors"
              >
                <span>Payment & Safety</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${
                    openAccordion === 'payment' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openAccordion === 'payment' && (
                <div className="pb-4 text-xs sm:text-sm text-[var(--ink2)] leading-relaxed space-y-2">
                  <p>
                    Pay securely using Paystack (Debit card, USSD, Apple Pay), bank transfer, or pay on delivery within Abuja.
                  </p>
                  <p>
                    Customers order, we don&apos;t scam. Your order and tracking details are always verified directly with you on WhatsApp.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Recommendation Shelf */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-10 border-t border-[var(--line)]">
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand">
              You May Also Like
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-1">
              More from the shelves.
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
