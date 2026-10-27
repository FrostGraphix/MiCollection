'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send } from 'lucide-react';
import { CFG } from '@/lib/products';
import { waLink } from '@/lib/utils';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    topic: 'Product question',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = `Hello MiCollections, ${formData.topic}${
      formData.name ? ' (from ' + formData.name + ')' : ''
    }: ${formData.message || 'I would like to chat.'}`;
    window.open(waLink(query), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--mute)] mb-4">
        <Link href="/" className="hover:text-brand transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--ink)] font-semibold">Contact</span>
      </nav>

      <div className="mb-10">
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight">
          Say <em className="serif-italic">Hello</em>
        </h1>
        <p className="text-sm sm:text-base text-[var(--ink2)] max-w-md mt-2">
          We are open 24 hours every day. WhatsApp is the fastest way to get an immediate reply.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <a
            href={waLink('Hello MiCollections!')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm hover:border-brand hover:translate-x-1.5 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)]">
                WhatsApp
              </span>
              <strong className="text-base font-semibold group-hover:text-brand transition-colors">
                {CFG.phoneDisp}
              </strong>
            </div>
          </a>

          <div className="flex items-center gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[var(--pill)] text-brand flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)]">
                Call Us
              </span>
              <strong className="text-base font-semibold">{CFG.phoneDisp}</strong>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[var(--pill)] text-brand flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)]">
                Email
              </span>
              <strong className="text-base font-semibold break-all">{CFG.email}</strong>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[var(--pill)] text-brand flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)]">
                Location
              </span>
              <strong className="text-base font-semibold">FCT Abuja, Nigeria</strong>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[var(--pill)] text-brand flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)]">
                Working Hours
              </span>
              <strong className="text-base font-semibold">Open 24 hours daily</strong>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-10 rounded-[36px] bg-[var(--surface)] border border-[var(--line)] shadow-xl flex flex-col gap-5"
            style={{ boxShadow: 'var(--shadow)' }}
          >
            <div>
              <h3 className="font-display text-2xl font-bold">Send Us a Message</h3>
              <p className="text-xs text-[var(--mute)] mt-1">
                Submitting this form prepares your message directly into WhatsApp with no delay.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Maryam"
                  className="w-full h-12 px-4 rounded-2xl bg-[var(--surface2)] border border-transparent text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Topic</label>
                <select
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full h-12 px-4 rounded-2xl bg-[var(--surface2)] border border-transparent text-sm outline-none focus:border-brand cursor-pointer"
                >
                  <option>Product question</option>
                  <option>Delivery</option>
                  <option>Custom order or screenshot</option>
                  <option>Something else</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="How can we help you today?"
                className="w-full h-32 p-4 rounded-2xl bg-[var(--surface2)] border border-transparent text-sm outline-none focus:border-brand resize-y"
              />
            </div>

            <button
              type="submit"
              className="btn-wa text-sm py-3.5 px-6 self-start inline-flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Send on WhatsApp
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
