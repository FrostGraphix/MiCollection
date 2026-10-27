'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { CFG } from '@/lib/products';

export const AnnouncementBar: React.FC = () => {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  const items = [
    "Customers order, we don't scam. Your money is safe with us",
    'Open 24 hours',
    'Delivery is nationwide',
    `Chat or order on WhatsApp: ${CFG.phoneDisp}`,
    'Unisex clothing, shoes, bags, kitchen utensils and lots more',
  ];

  return (
    <div
      className="bg-[var(--inv)] text-[var(--inv-ink)] text-xs md:text-sm font-medium overflow-hidden whitespace-nowrap py-2 border-b border-white/10 select-none"
      aria-label="Store announcements"
    >
      <div className="animate-marquee flex items-center gap-10">
        {[...items, ...items, ...items, ...items].map((text, idx) => (
          <span key={idx} className="inline-flex items-center gap-10">
            <span>{text}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-light flex-shrink-0" />
          </span>
        ))}
      </div>
    </div>
  );
};
