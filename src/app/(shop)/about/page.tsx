'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Truck } from 'lucide-react';
import { ProductArt } from '@/components/shop/ProductArt';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-6 sm:py-10 space-y-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--mute)]">
        <Link href="/" className="hover:text-brand transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--ink)] font-semibold">About</span>
      </nav>

      {/* Main Split Story */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Visual Card */}
        <div className="lg:col-span-5 relative aspect-square rounded-[44px] overflow-hidden bg-gradient-to-br from-[#4c1d95] via-[#2e1065] to-[#12041f] shadow-2xl flex items-center justify-center p-8">
          <div className="absolute left-[5%] top-[10%] w-[54%] -rotate-12 drop-shadow-2xl">
            <ProductArt type="abaya" color="ivory" view="bare" />
          </div>
          <div className="absolute right-[5%] top-[25%] w-[54%] rotate-12 drop-shadow-2xl">
            <ProductArt type="sneaker" color="violet" view="bare" />
          </div>
          <div className="absolute left-[26%] bottom-0 w-[54%] -rotate-3 drop-shadow-2xl z-10">
            <ProductArt type="tote" color="lilac" view="bare" />
          </div>
        </div>

        {/* Right Story Copy */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand">
            Our Story
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            One store for the <em className="serif-italic">whole</em> list.
          </h1>

          <div className="space-y-4 text-sm sm:text-base text-[var(--ink2)] leading-relaxed">
            <p>
              MiCollections is based in the Federal Capital Territory, Abuja, and was founded on a simple premise: you should not need five different shops to get what you love.
            </p>
            <p>
              We deal in unisex clothing, flowing abayas, street sneakers, elegant bags, tarnish-resistant jewellery, creators&apos; electronics, non-stick kitchen sets, and everyday household essentials.
            </p>
            <p>
              We are open 24 hours a day and deliver nationwide across Nigeria. Every order is confirmed directly with you on WhatsApp, because customers order, and we don&apos;t scam. Your money is completely safe with us.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Link href="/shop" className="btn-primary text-sm">
              Shop the Collection <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="btn-ghost text-sm">
              Talk to Us
            </Link>
          </div>
        </div>
      </div>

      {/* 3 Core Values Cards */}
      <section className="pt-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand">
            What We Stand For
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-1">
            Built on variety, trust, and speed.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-3 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-[var(--pill)] text-brand flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold">Variety First</h3>
            <p className="text-sm text-[var(--ink2)] leading-relaxed">
              From butterfly cut abayas to Ultra 2 smart watches and multi-size bottle sets. If it elevates everyday living, we stock it.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-3 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-[var(--pill)] text-brand flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold">Trust, Always</h3>
            <p className="text-sm text-[var(--ink2)] leading-relaxed">
              Transparent Naira pricing, honest descriptions, and every order confirmed directly with you before dispatch. Customers order, we don&apos;t scam.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-3 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-[var(--pill)] text-brand flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold">Delivered Anywhere</h3>
            <p className="text-sm text-[var(--ink2)] leading-relaxed">
              Abuja doorstep riders and courier delivery to every state in Nigeria. Tell us where you are, and we will get your package to your doorstep.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
