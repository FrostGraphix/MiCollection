'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Maximize2,
  X,
  Check,
} from 'lucide-react';
import { byId, catOf, PAL, PRODUCTS } from '@/lib/products';
import { money, waLink } from '@/lib/utils';
import { ColorKey } from '@/types';
import { ProductImage } from '@/components/shop/ProductImage';
import { ProductCard } from '@/components/shop/ProductCard';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { flyToCart } from '@/lib/effects';

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
  const [activeGalleryView, setActiveGalleryView] = useState<number>(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<'details' | 'delivery' | 'payment' | null>(
    'details'
  );

  const mainCtaRef = useRef<HTMLDivElement>(null);
  const mainImgRef = useRef<HTMLDivElement>(null);

  const isSaved = isInWishlist(product.id);
  const category = catOf(product.cat);

  const productImages = product.images && product.images.length > 0
    ? product.images
    : [];

  const relatedProducts = PRODUCTS.filter(
    (p) => p.cat === product.cat && p.id !== product.id
  ).slice(0, 4);

  // Monitor scroll position to show sticky mobile buy bar when scrolled past main CTA
  useEffect(() => {
    const handleScroll = () => {
      if (!mainCtaRef.current) return;
      const rect = mainCtaRef.current.getBoundingClientRect();
      const isPast = rect.bottom < 0;
      setShowStickyBar(isPast);
      document.body.classList.toggle('has-buybar', isPast);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.classList.remove('has-buybar');
    };
  }, []);

  const handleAddToCart = () => {
    addToCart(product.id, selectedColor, selectedSize, quantity);
    if (mainImgRef.current) {
      flyToCart(mainImgRef.current, productImages[activeGalleryView] || productImages[0]);
    }
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product.id, selectedColor, selectedSize, quantity);
    router.push('/checkout');
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const zx = ((e.clientX - rect.left) / rect.width) * 100;
    const zy = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--zx', `${zx}%`);
    el.style.setProperty('--zy', `${zy}%`);
  };

  const whatsappMessage = `Hello MiCollections, I would like to order: ${quantity} x ${product.name} (${PAL[selectedColor]?.n || selectedColor}${selectedSize ? ', Size ' + selectedSize : ''}) at ${money(product.price)} each.`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--mute)] mb-6 overflow-x-auto whitespace-nowrap">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        {/* Left Gallery Column */}
        <div className="lg:col-span-6 lg:sticky lg:top-24 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
          {/* Thumbnails list */}
          <div className="flex sm:flex-col gap-2.5 sm:gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-none">
            {([0, 1, 2, 3] as const).map((idx) => {
              const thumbSrc = productImages[idx];
              return (
                <button
                  key={idx}
                  onClick={() => setActiveGalleryView(idx)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[var(--surface2)] border-2 transition-all flex-shrink-0 relative ${
                    activeGalleryView === idx
                      ? 'border-brand scale-105 shadow-md'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                  aria-label={`View angle ${idx + 1}`}
                >
                  <ProductImage
                    src={thumbSrc}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    fallbackArt={{
                      type: product.art,
                      color: selectedColor,
                      view: idx as 0 | 1 | 2 | 3,
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Main Large Stage */}
          <div
            ref={mainImgRef}
            onMouseMove={handleImageMouseMove}
            className="main-img-stage relative flex-1 aspect-[1/1.05] sm:aspect-square rounded-3xl sm:rounded-[36px] overflow-hidden bg-[var(--surface2)] border border-[var(--line)] shadow-xl group"
          >
            <ProductImage
              src={productImages[activeGalleryView] || productImages[0]}
              alt={`${product.name} view ${activeGalleryView + 1}`}
              priority={true}
              fallbackArt={{
                type: product.art,
                color: selectedColor,
                view: (activeGalleryView as 0 | 1 | 2 | 3) || 0,
              }}
            />

            {/* Zoom / Lightbox Trigger */}
            <button
              onClick={() => setIsZoomOpen(true)}
              className="absolute right-3.5 top-3.5 z-10 w-9 h-9 rounded-full bg-[var(--nav-bg)] backdrop-blur-md border border-[var(--line)] flex items-center justify-center text-[var(--ink)] opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition-all shadow-md"
              aria-label="Zoom image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Badge */}
            {product.badge && (
              <span className="absolute left-3.5 top-3.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand text-white shadow-md z-10">
                {product.badge}
              </span>
            )}

            <div className="absolute right-3.5 bottom-3.5 px-3 py-1.5 rounded-full bg-[var(--nav-bg)] backdrop-blur-md border border-[var(--line)] text-[11px] font-semibold text-[var(--ink2)] pointer-events-none z-10">
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
            <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-1">
              {product.name}
            </h1>

            {/* Price and Stock status */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--ink)]">
                {money(product.price)}
              </span>
              {product.was && (
                <s className="text-sm sm:text-base text-[var(--mute)] font-mono">
                  {money(product.was)}
                </s>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                In stock, Abuja
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
                        ? 'border-brand scale-110 shadow-md ring-2 ring-brand/20'
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
                    className={`min-w-[48px] h-11 px-4 rounded-xl text-xs font-semibold border transition-all ${
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

          {/* Main Action CTAs */}
          <div ref={mainCtaRef} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center pt-2">
            {/* Quantity Stepper */}
            <div className="inline-flex items-center justify-between sm:justify-start border border-[var(--line)] rounded-full h-12 px-2 bg-[var(--surface)] w-full sm:w-auto">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-full flex items-center justify-center text-[var(--mute)] hover:text-brand active:scale-95"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-sm font-bold font-mono">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(20, quantity + 1))}
                className="w-10 h-full flex items-center justify-center text-[var(--mute)] hover:text-brand active:scale-95"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="btn-primary text-sm flex-1 h-12 justify-center shadow-lg active:scale-98 transition-all"
            >
              {addedToast ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" /> Add to cart
                </>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              className="h-12 px-6 rounded-full font-semibold text-sm bg-[var(--ink)] text-[var(--bg)] hover:opacity-90 active:scale-98 transition-all text-center flex items-center justify-center"
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
              className="btn-wa text-xs py-2.5 px-4 flex-1 sm:flex-initial justify-center"
            >
              <MessageSquare className="w-4 h-4" /> Order on WhatsApp
            </a>

            <button
              onClick={() => toggleWishlist(product.id)}
              className={`btn-ghost text-xs py-2.5 px-4 flex-1 sm:flex-initial justify-center ${
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
        <section className="mt-16 sm:mt-24 pt-10 border-t border-[var(--line)]">
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand">
              You May Also Like
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight mt-1">
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

      {/* Lightbox Modal for High-Resolution Inspection */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            aria-label="Close zoom"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-4xl aspect-square max-h-[85vh] rounded-3xl overflow-hidden">
            <ProductImage
              src={productImages[activeGalleryView] || productImages[0]}
              alt={product.name}
              priority={true}
              fallbackArt={{
                type: product.art,
                color: selectedColor,
                view: (activeGalleryView as 0 | 1 | 2 | 3) || 0,
              }}
            />
          </div>
        </div>
      )}

      {/* Mobile Enhanced Sticky Buy Bar (appears when scrolled past main CTA) */}
      <aside
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--line)] p-3 px-4 shadow-2xl transition-transform duration-300 ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        aria-label="Quick order bar"
      >
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          {/* Mini Thumbnail and Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-[var(--surface2)] border border-[var(--line)] flex-shrink-0 relative">
              <ProductImage
                src={productImages[0]}
                alt={product.name}
                fallbackArt={{ type: product.art, color: selectedColor, view: 0 }}
              />
            </div>
            <div className="min-w-0">
              <h4 className="font-display font-semibold text-xs truncate">
                {product.name}
              </h4>
              <span className="font-display font-bold text-xs text-brand">
                {money(product.price)}
              </span>
            </div>
          </div>

          {/* Quick CTA */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleAddToCart}
              className="btn-primary text-xs py-2.5 px-4 h-10 shadow"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
            <button
              onClick={handleBuyNow}
              className="h-10 px-3.5 rounded-full font-semibold text-xs bg-[var(--ink)] text-[var(--bg)]"
            >
              Buy
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
