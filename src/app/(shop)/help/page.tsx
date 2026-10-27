'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MessageSquare } from 'lucide-react';
import { waLink } from '@/lib/utils';

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Do you deliver outside Abuja?',
      a: 'Yes! Delivery is nationwide. Abuja doorstep orders usually arrive in 1 to 2 working days, and other states take 2 to 5 working days by reliable interstate courier. Courier rates depend on your state and are confirmed on WhatsApp.',
    },
    {
      q: 'How do I order?',
      a: 'Add items to your cart and check out on this website, or message us on WhatsApp with what you want. We confirm availability, your total, and delivery details with you before anything is dispatched.',
    },
    {
      q: 'How can I pay?',
      a: 'You can pay using Paystack (Debit card, USSD, Apple Pay), direct bank transfer, or pay on delivery within Abuja. We never store raw card numbers on this site.',
    },
    {
      q: 'Is my money safe?',
      a: 'Customers order, we do not scam. Every order is confirmed with you on WhatsApp, and you will always receive tracking and delivery updates until the package is in your hands.',
    },
    {
      q: 'Can you find something I saw online?',
      a: 'Yes! Screenshot whatever you found online (jewellery, bags, abayas, sneakers, or gadgets) and send it to us on WhatsApp. We will source it and quote you the exact price.',
    },
    {
      q: 'What if something is wrong or damaged?',
      a: 'Message us on WhatsApp within 24 hours of delivery with a photo and your order number. We will promptly arrange an exchange or replacement where possible.',
    },
    {
      q: 'How do I pick a size?',
      a: 'Each product page lists available sizes. If you are unsure between two sizes, message us your measurements on WhatsApp and our team will guide you to the perfect fit.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--mute)] mb-4">
        <Link href="/" className="hover:text-brand transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--ink)] font-semibold">Delivery & FAQ</span>
      </nav>

      <div className="mb-10">
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight">
          Delivery &amp; <em className="serif-italic">Answers</em>
        </h1>
        <p className="text-sm sm:text-base text-[var(--ink2)] max-w-lg mt-2">
          Everything you need to know about ordering, paying, and receiving your items across Nigeria.
        </p>
      </div>

      {/* Accordions */}
      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between text-left font-display font-bold text-lg sm:text-xl gap-4 hover:text-brand transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 text-brand ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <p className="mt-3 text-sm text-[var(--ink2)] leading-relaxed pt-2 border-t border-[var(--line)] animate-in fade-in duration-200">
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Prompt */}
      <div className="mt-12 p-8 rounded-3xl bg-[var(--surface2)] border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display text-xl font-bold">Still have a question?</h3>
          <p className="text-xs sm:text-sm text-[var(--mute)] mt-1">
            Our team is available 24 hours on WhatsApp to assist you.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={waLink('Hello MiCollections, I have a question about delivery.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-wa text-xs py-3 px-5"
          >
            <MessageSquare className="w-4 h-4" /> Ask on WhatsApp
          </a>
          <Link href="/contact" className="btn-ghost text-xs py-3 px-5">
            Contact Page
          </Link>
        </div>
      </div>
    </div>
  );
}
