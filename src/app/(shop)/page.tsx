'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Clock,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { PRODUCTS, CATS, CFG, byId } from '@/lib/products';
import { money, waLink } from '@/lib/utils';
import { ProductArt } from '@/components/shop/ProductArt';
import { ProductImage } from '@/components/shop/ProductImage';
import { ProductCard } from '@/components/shop/ProductCard';
import { StackedCards } from '@/components/shop/StackedCards';
import { HowItWorksPhone } from '@/components/shop/HowItWorksPhone';
import { BudgetShelf } from '@/components/shop/BudgetShelf';

import { Product } from '@/types';

// Animated Counter component from MiCollections.html
const AnimatedCounter: React.FC<{ end: number; suffix?: string }> = ({ end, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          const startTime = performance.now();
          const duration = 1400;

          const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Quartic ease-out from original HTML: 1 - Math.pow(1 - k, 4)
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(Math.round(end * eased));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  return (
    <span ref={ref} className="font-variant-numeric tabular-nums">
      {count}
      {suffix}
    </span>
  );
};

export default function HomePage() {
  const featuredPicks: Product[] = [16, 4, 7, 10, 13, 20, 23, 22]
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const heroSectionRef = useRef<HTMLElement>(null);
  const heroArtRef = useRef<HTMLDivElement>(null);

  // Desktop Pointer Parallax Effect on Hero Stage from original MiCollections.html heroFX()
  useEffect(() => {
    const hero = heroSectionRef.current;
    const art = heroArtRef.current;
    if (!hero || !art) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const rect = art.getBoundingClientRect();
      const mx = ((e.clientX - (rect.left + rect.width / 2)) / rect.width).toFixed(3);
      const my = ((e.clientY - (rect.top + rect.height / 2)) / rect.height).toFixed(3);
      art.style.setProperty('--mx', mx);
      art.style.setProperty('--my', my);
    };

    hero.addEventListener('pointermove', handlePointerMove);
    return () => hero.removeEventListener('pointermove', handlePointerMove);
  }, []);

  const marqueeTrackRef = useRef<HTMLDivElement>(null);

  // Big Marquee scroll velocity inertia from MiCollections.html
  useEffect(() => {
    const tr = marqueeTrackRef.current;
    if (!tr) return;

    let x = 0;
    let last = window.scrollY;
    let vel = 0;
    let rafId: number;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const loop = () => {
      const currentY = window.scrollY;
      const dy = currentY - last;
      last = currentY;
      vel += (dy - vel) * 0.1;
      x -= (reduced ? 0 : 1.1) + vel * 0.55;

      const half = tr.scrollWidth / 4;
      if (half > 0) {
        if (x <= -half) x += half;
        if (x > 0) x -= half;
      }

      tr.style.transform = `translate3d(${x}px, 0, 0)`;
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="flex flex-col gap-20 md:gap-28">
      {/* Hero Section */}
      <section ref={heroSectionRef} className="relative pt-8 md:pt-16 pb-12 overflow-hidden">
        {/* Ambient Gradient Blobs */}
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-brand/30 rounded-full blur-[90px] pointer-events-none -z-10" />
        <div className="absolute bottom-[-80px] left-[-100px] w-[420px] h-[420px] bg-orchid/20 rounded-full blur-[80px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-7 flex flex-col gap-6 items-start">
            <div className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-widest text-brand bg-[var(--pill)] px-3.5 py-1.5 rounded-full">
              <span className="dot-ping" />
              Open 24 hours &bull; FCT Abuja
            </div>

            {/* Headline with original lineUp reveal */}
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.92]">
              <span className="block overflow-hidden py-1">
                <span className="inline-block animate-lineUp">Every variety.</span>
              </span>
              <span className="block overflow-hidden py-1">
                <span className="inline-block animate-lineUp [animation-delay:120ms]">
                  <em className="serif-italic">One</em> home.
                </span>
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--ink2)] max-w-xl leading-relaxed">
              MiCollections is your number one home of varieties. Abayas, sneakers, jewellery, smart gadgets, and kitchen finds, delivered across Nigeria.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link href="/shop" className="btn-primary text-sm mag">
                Shop the collection <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={waLink('Hello MiCollections, I would like to place an order.')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-sm text-[#16a34a] hover:border-[#16a34a] hover:bg-green-500/10 mag"
              >
                <MessageSquare className="w-4 h-4" /> Order on WhatsApp
              </a>
            </div>

            {/* Trust Bullet Items */}
            <ul className="flex flex-wrap items-center gap-4 sm:gap-8 pt-4 text-xs sm:text-sm font-medium text-[var(--ink2)]">
              <li className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand" /> Nationwide delivery
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand" /> Money safe with us
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand" /> Open 24 hours
              </li>
            </ul>
          </div>

          {/* Right Hero Interactive 3D Parallax Cards Stage */}
          <div
            ref={heroArtRef}
            className="lg:col-span-5 relative aspect-square max-w-[500px] mx-auto w-full"
            style={{ ['--mx' as any]: 0, ['--my' as any]: 0 }}
          >
            {/* Card 1: Ultra 2 Watch */}
            <Link
              href="/product/16"
              className="absolute left-0 top-[2%] w-[48%] aspect-[1/1.18] rounded-3xl overflow-hidden bg-[var(--surface)] border border-[var(--line)] shadow-2xl transition-transform duration-300 hover:scale-105"
              style={{
                boxShadow: 'var(--shadow)',
                transform:
                  'translate(calc(var(--mx, 0) * -14px), calc(var(--my, 0) * -10px)) rotate(-6deg)',
              }}
            >
              <ProductImage
                src={byId(16)?.images?.[0]}
                alt="Ultra 2 Amoled Smart Watch"
                fallbackArt={{ type: 'watch', color: 'violet', view: 0 }}
              />
              <div className="absolute left-2.5 right-2.5 bottom-2.5 z-10 px-3 py-1.5 rounded-full bg-[var(--nav-bg)]/90 backdrop-blur-md border border-[var(--line)] flex items-center justify-between text-[11px] font-semibold">
                <span>Watch</span>
                <b className="text-brand">{money(25000)}</b>
              </div>
            </Link>

            {/* Card 2: Wrap Midi Dress */}
            <Link
              href="/product/1"
              className="absolute right-0 top-[10%] w-[48%] aspect-[1/1.15] rounded-3xl overflow-hidden bg-[var(--surface)] border border-[var(--line)] shadow-2xl transition-transform duration-300 hover:scale-105"
              style={{
                boxShadow: 'var(--shadow)',
                transform:
                  'translate(calc(var(--mx, 0) * 18px), calc(var(--my, 0) * 12px)) rotate(6deg)',
              }}
            >
              <ProductImage
                src={byId(1)?.images?.[0]}
                alt="Ankara Wrap Midi Dress"
                fallbackArt={{ type: 'dress', color: 'orchid', view: 1 }}
              />
              <div className="absolute left-2.5 right-2.5 bottom-2.5 z-10 px-3 py-1.5 rounded-full bg-[var(--nav-bg)]/90 backdrop-blur-md border border-[var(--line)] flex items-center justify-between text-[11px] font-semibold">
                <span>Dress</span>
                <b className="text-brand">{money(18500)}</b>
              </div>
            </Link>

            {/* Card 3: Everyday Tote */}
            <Link
              href="/product/10"
              className="absolute left-[26%] bottom-[0%] w-[46%] aspect-[1/1.1] rounded-3xl overflow-hidden bg-[var(--surface)] border border-[var(--line)] shadow-2xl transition-transform duration-300 hover:scale-105 z-10"
              style={{
                boxShadow: 'var(--shadow)',
                transform:
                  'translate(calc(var(--mx, 0) * -8px), calc(var(--my, 0) * 16px)) rotate(-2deg)',
              }}
            >
              <ProductImage
                src={byId(10)?.images?.[0]}
                alt="Everyday Canvas & Leather Tote"
                fallbackArt={{ type: 'tote', color: 'plum', view: 0 }}
              />
              <div className="absolute left-2.5 right-2.5 bottom-2.5 z-10 px-3 py-1.5 rounded-full bg-[var(--nav-bg)]/90 backdrop-blur-md border border-[var(--line)] flex items-center justify-between text-[11px] font-semibold">
                <span>Tote Bag</span>
                <b className="text-brand">{money(24000)}</b>
              </div>
            </Link>

            {/* Spinning Brand Badge */}
            <div className="hidden sm:flex absolute right-4 bottom-6 w-28 h-28 rounded-full bg-brand text-white items-center justify-center shadow-xl z-20">
              <svg viewBox="0 0 132 132" className="absolute inset-0 w-full h-full animate-[spin_16s_linear_infinite]">
                <defs>
                  <path id="badgeCircle" d="M66 66 m-48 0 a48 48 0 1 1 96 0 a48 48 0 1 1 -96 0" />
                </defs>
                <text className="text-[11px] font-semibold uppercase tracking-[0.22em] fill-white">
                  <textPath href="#badgeCircle">
                    MiCollections &bull; Home of varieties &bull;
                  </textPath>
                </text>
              </svg>
              <Sparkles className="w-7 h-7" />
            </div>
          </div>
        </div>
      </section>

      {/* Big Rotated Category Marquee with dynamic scroll velocity inertia */}
      <section className="bg-[var(--inv)] text-[var(--inv-ink)] py-5 -rotate-1 -mx-4 border-y border-white/10 select-none overflow-hidden">
        <div
          ref={marqueeTrackRef}
          className="flex items-center gap-8 text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight will-change-transform"
        >
          {Array(4)
            .fill(CATS)
            .flat()
            .map((cat, idx) => (
              <span key={idx} className="inline-flex items-center gap-8 whitespace-nowrap">
                <span>{cat.name}</span>
                <span className="w-3 h-3 rounded-full bg-brand-light flex-shrink-0" />
              </span>
            ))}
        </div>
      </section>

      {/* Stacked Category Cards: Shop by world */}
      <section className="max-w-7xl mx-auto px-6 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand rv">
              Shop By World
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mt-1 max-w-lg rv">
              Eight ways to find your next favourite.
            </h2>
          </div>
          <p className="text-sm text-[var(--ink2)] max-w-sm leading-relaxed rv">
            Scroll the stack. Each card is a full aisle of our Abuja store, from flowing abayas to kitchen utensil sets.
          </p>
        </div>

        <StackedCards />
      </section>

      {/* Picks of the Week Grid */}
      <section className="max-w-7xl mx-auto px-6 w-full">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand rv">
              Picks of the Week
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mt-1 rv">
              Fresh from the shelves.
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
          >
            Shop everything <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {featuredPicks.map((product) => (
            <div key={product.id} className="rv-s">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      {/* Pinned How It Works Screen */}
      <section className="bg-[var(--bg2)] py-16 md:py-24 border-y border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand rv">
              How It Works
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mt-1 rv">
              Order the way you already chat.
            </h2>
          </div>

          <HowItWorksPhone />
        </div>
      </section>

      {/* Budget Finds Shelf */}
      <section className="max-w-7xl mx-auto px-6 w-full">
        <BudgetShelf />
      </section>

      {/* Screenshot Sourcing Banner */}
      <section className="max-w-7xl mx-auto px-6 w-full">
        <div className="rounded-[40px] bg-gradient-to-br from-[#2e1065] via-[#1b073b] to-[#12041f] text-white p-8 sm:p-12 md:p-16 relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 items-center shadow-2xl">
          <div className="md:col-span-7 flex flex-col gap-4 relative z-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-light rv">
              Can&apos;t find it?
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-tight rv">
              Send a screenshot. We will find it.
            </h2>
            <p className="text-sm sm:text-base text-purple-200/80 leading-relaxed max-w-lg rv">
              Saw jewellery, a bag, abaya or a gadget online? Take a screenshot and send it to us on WhatsApp. We will source it for you and quote you the exact price.
            </p>
            <div className="pt-2">
              <a
                href={waLink('Hello MiCollections, I am sending a screenshot of what I want.')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa inline-flex items-center gap-2 text-sm"
              >
                <MessageSquare className="w-4 h-4" /> Send a screenshot on WhatsApp
              </a>
            </div>
          </div>

          {/* Screenshot floating visuals */}
          <div className="md:col-span-5 relative h-64 sm:h-72">
            <div className="absolute left-[5%] top-[10%] w-36 rounded-2xl bg-white p-2 shadow-2xl -rotate-12 border border-purple-200">
              <div className="aspect-square rounded-xl overflow-hidden bg-purple-50 relative">
                <ProductImage
                  src={byId(13)?.images?.[0]}
                  alt="Earrings find"
                  fallbackArt={{ type: 'earrings', color: 'gold', view: 0 }}
                />
              </div>
            </div>
            <div className="absolute left-[35%] top-[0%] w-36 rounded-2xl bg-white p-2 shadow-2xl rotate-6 border border-purple-200 z-10">
              <div className="aspect-square rounded-xl overflow-hidden bg-purple-50 relative">
                <ProductImage
                  src={byId(7)?.images?.[0]}
                  alt="Sneaker find"
                  fallbackArt={{ type: 'sneaker', color: 'violet', view: 1 }}
                />
              </div>
            </div>
            <div className="absolute right-[5%] top-[25%] w-36 rounded-2xl bg-white p-2 shadow-2xl rotate-12 border border-purple-200">
              <div className="aspect-square rounded-xl overflow-hidden bg-purple-50 relative">
                <ProductImage
                  src={byId(11)?.images?.[0]}
                  alt="Crossbody find"
                  fallbackArt={{ type: 'crossbody', color: 'black', view: 0 }}
                />
              </div>
            </div>
            <div className="absolute left-[15%] bottom-2 px-4 py-2 rounded-2xl bg-wa text-black font-semibold text-xs shadow-lg z-20">
              Found it. {money(16500)}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Quote & Live Statistics */}
      <section className="max-w-5xl mx-auto px-6 text-center py-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-brand rv">
          Our Promise
        </span>
        <blockquote className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight mt-3 max-w-2xl mx-auto leading-tight rv">
          Customers order. <br />
          We don&apos;t scam.
        </blockquote>
        <p className="text-sm sm:text-base text-[var(--ink2)] max-w-xl mx-auto mt-4 leading-relaxed rv">
          Your money is safe with us. Every order is confirmed with you directly on WhatsApp before anything ships, from Abuja to every state across Nigeria.
        </p>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 text-left">
          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm hover:-translate-y-1 transition-transform rv-s">
            <b className="block font-display text-3xl sm:text-4xl font-extrabold text-brand">
              <AnimatedCounter end={24} />
            </b>
            <span className="text-xs text-[var(--ink2)] mt-1 block">
              hours a day, every day, we are open
            </span>
          </div>
          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm hover:-translate-y-1 transition-transform rv-s">
            <b className="block font-display text-3xl sm:text-4xl font-extrabold text-brand">
              <AnimatedCounter end={37} />
            </b>
            <span className="text-xs text-[var(--ink2)] mt-1 block">
              states & the FCT we deliver to
            </span>
          </div>
          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm hover:-translate-y-1 transition-transform rv-s">
            <b className="block font-display text-3xl sm:text-4xl font-extrabold text-brand">
              <AnimatedCounter end={CATS.length} />
            </b>
            <span className="text-xs text-[var(--ink2)] mt-1 block">
              aisles of fashion, tech & home
            </span>
          </div>
          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm hover:-translate-y-1 transition-transform rv-s">
            <b className="block font-display text-3xl sm:text-4xl font-extrabold text-brand">
              <AnimatedCounter end={PRODUCTS.length} suffix="+" />
            </b>
            <span className="text-xs text-[var(--ink2)] mt-1 block">
              products and more added weekly
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
