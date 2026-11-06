'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  MessageSquare,
  X,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  Gift,
  Heart,
} from 'lucide-react';
import { CartItem } from '@/types';
import { byId } from '@/lib/products';
import { money, waLink } from '@/lib/utils';
import { ProductImage } from '@/components/shop/ProductImage';

interface ShareCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
}

export const ShareCartModal: React.FC<ShareCartModalProps> = ({
  isOpen,
  onClose,
  cart,
  subtotal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [customNote, setCustomNote] = useState('');

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('locked');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('locked');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Encode cart payload safely as base64 string
  const minimalCart = cart.map((i) => ({
    id: i.id,
    q: i.qty,
    c: i.color,
    s: i.size,
  }));

  let shareParam = '';
  try {
    shareParam = typeof window !== 'undefined'
      ? btoa(encodeURIComponent(JSON.stringify(minimalCart)))
      : '';
  } catch {
    shareParam = '';
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://micollection.vercel.app';
  const shareableUrl = `${origin}/cart?share=${shareParam}`;

  // Build WhatsApp text
  const greeting = sponsorName.trim() ? `Hello ${sponsorName.trim()}, ` : 'Hello! ';
  const noteText = customNote.trim() ? `\n"${customNote.trim()}"\n` : '\n';

  let itemsText = '';
  cart.forEach((item) => {
    const p = byId(item.id);
    if (p) {
      const optStr = item.size ? ` (Size: ${item.size})` : '';
      const colorStr = item.color ? ` [${item.color}]` : '';
      itemsText += `• ${item.qty}x ${p.name}${optStr}${colorStr} - ${money(p.price * item.qty)}\n`;
    }
  });

  const whatsappMessage =
    `${greeting}I curated my favourite pieces from MiCollections Abuja:${noteText}\n` +
    `${itemsText}\n` +
    `Grand Total: ${money(subtotal)}\n\n` +
    `Kindly sponsor or pay for my order using this direct link:\n` +
    `${shareableUrl}\n\n` +
    `Thank you so much! ✨`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copySummaryText = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share Shopping Bag"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl p-6 sm:p-7 relative overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--line)]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </div>
              <h3 className="font-display font-black text-xl text-[var(--ink)]">
                Share Bag / Ask Sponsor to Pay
              </h3>
            </div>
            <p className="text-xs text-[var(--mute)] mt-1">
              Send your curated shopping bag to a sponsor, partner, or friend to pay directly via card, bank transfer, or Pay on Delivery.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--surface2)] text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {/* Optional Sponsor Name & Personal Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider mb-1">
                Recipient / Sponsor Name (Optional)
              </label>
              <input
                type="text"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                placeholder="e.g. Bro Aliyu, Hubby, Sis"
                className="w-full h-10 px-3.5 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-xs text-[var(--ink)] placeholder:text-[var(--mute)] outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider mb-1">
                Personal Note (Optional)
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. For my birthday / Eid celebration!"
                className="w-full h-10 px-3.5 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-xs text-[var(--ink)] placeholder:text-[var(--mute)] outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Cart Items Preview Card */}
          <div className="p-3.5 rounded-2xl bg-[var(--surface2)]/70 border border-[var(--line)] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--ink)] pb-2 border-b border-[var(--line)]">
              <span>Bag Items ({cart.length})</span>
              <span className="font-display font-extrabold text-brand text-sm">{money(subtotal)}</span>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {cart.map((item, idx) => {
                const prod = byId(item.id);
                if (!prod) return null;
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-[var(--surface)] relative border border-[var(--line)] shrink-0">
                        <ProductImage
                          src={prod.images?.[0]}
                          alt={prod.name}
                          fallbackArt={{ type: prod.art, color: item.color || prod.colors[0], view: 0 }}
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-[var(--ink)] block truncate max-w-[190px]">
                          {prod.name}
                        </span>
                        <span className="text-[10px] text-[var(--mute)]">
                          Qty: {item.qty} {item.size ? `• ${item.size}` : ''}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-[var(--ink)] shrink-0">
                      {money(prod.price * item.qty)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Direct Share Primary Button */}
          <a
            href={waLink(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <MessageSquare className="w-4 h-4 fill-white" />
            <span>Send Bag via WhatsApp</span>
          </a>

          {/* Secondary Actions: Copy Link & Copy Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={copyLink}
              className="py-2.5 px-3 rounded-2xl bg-[var(--surface2)] hover:bg-[var(--surface2)]/80 border border-[var(--line)] text-xs font-semibold text-[var(--ink)] flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-brand" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Shareable Link'}</span>
            </button>

            <button
              type="button"
              onClick={copySummaryText}
              className="py-2.5 px-3 rounded-2xl bg-[var(--surface2)] hover:bg-[var(--surface2)]/80 border border-[var(--line)] text-xs font-semibold text-[var(--ink)] flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-orchid" />}
              <span>{copiedSummary ? 'Summary Copied!' : 'Copy Text Breakdown'}</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--mute)]">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-brand" /> Recipients can order with 1 click
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-semibold text-brand hover:underline"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};


/**
 * Safely decodes base64 shared cart query string into valid CartItem array
 */
export function decodeSharedCart(param: string): CartItem[] {
  if (!param) return [];
  try {
    const json = typeof window !== 'undefined'
      ? decodeURIComponent(atob(param))
      : Buffer.from(param, 'base64').toString('utf8');
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: any) => ({
        id: Number(item.id),
        qty: Number(item.q || 1),
        color: item.c,
        size: item.s,
      }))
      .filter((item: CartItem) => byId(item.id) && item.qty > 0);
  } catch {
    return [];
  }
}
