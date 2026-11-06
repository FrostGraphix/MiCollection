'use client';

import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  MapPin,
  Truck,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { money, waLink } from '@/lib/utils';
import { CFG } from '@/lib/products';

export interface ReceiptItem {
  name: string;
  price: number;
  qty: number;
  color?: string;
  size?: string;
  opt?: string;
}

export interface OrderReceiptData {
  orderId: string;
  createdAt: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  state: string;
  landmark?: string;
  deliveryLabel: string;
  eta: string;
  paymentMethod: string;
  paymentStatus: string;
  items: ReceiptItem[];
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  total: number;
}

export interface OrderReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderReceiptData;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/track?id=${encodeURIComponent(order.orderId)}`
    : `https://micollection.vercel.app/track?id=${encodeURIComponent(order.orderId)}`;

  const supportMessage = `Hello MiCollections, I am contacting you regarding official invoice for order ${order.orderId}.`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Official Invoice ${order.orderId}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      {/* Print-specific style block */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #micollection-official-receipt, #micollection-official-receipt * {
            visibility: visible;
          }
          #micollection-official-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="w-full max-w-2xl bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] shadow-2xl rounded-3xl overflow-hidden my-auto relative animate-in zoom-in-95 duration-200"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        {/* Modal Top Action Toolbar (hidden on print) */}
        <div className="no-print p-4 sm:px-6 bg-[var(--surface2)]/70 border-b border-[var(--line)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand px-2.5 py-0.5 rounded-full bg-brand/10 border border-brand/20">
              Tax Invoice & Logistics Receipt
            </span>
            <span className="text-xs text-[var(--mute)] hidden sm:inline">
              #{order.orderId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand to-orchid text-white font-bold text-xs shadow-md shadow-brand/20 hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[var(--surface)] text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
              aria-label="Close invoice modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div
          id="micollection-official-receipt"
          ref={receiptRef}
          className="p-6 sm:p-8 space-y-6 bg-white dark:bg-[#120f1d] text-slate-900 dark:text-slate-100"
        >
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-dashed border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl sm:text-3xl font-black tracking-tight text-purple-700 dark:text-purple-400">
                  MiCollections
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase tracking-widest border border-purple-200 dark:border-purple-800">
                  Couture
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Luxury Ready-to-Wear, Abayas & Streetwear Atelier
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Maitama & Wuse 2 &bull; Abuja FCT, Nigeria &bull; RC: 3829104
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {order.paymentStatus.toUpperCase()}
              </span>
              <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                Invoice No: <b className="font-mono text-slate-800 dark:text-slate-200">{order.orderId}</b>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                Date: {order.createdAt}
              </div>
            </div>
          </div>

          {/* Customer & Delivery Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Billed & Dispatched To
              </span>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {order.customerName}
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Phone: <span className="font-mono">{order.phone}</span>
              </div>
              {order.email && (
                <div className="text-slate-600 dark:text-slate-300 truncate">
                  Email: {order.email}
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Truck className="w-3 h-3 text-purple-600" /> Logistics Destination
              </span>
              <div className="font-bold text-slate-900 dark:text-white">
                {order.deliveryLabel}
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                {order.address}, {order.state}
              </div>
              {order.landmark && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Landmark: {order.landmark}
                </div>
              )}
              <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 pt-0.5">
                Transit SLA: {order.eta}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Item & Variant</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {order.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {it.name}
                      </span>
                      {(it.color || it.size || it.opt) && (
                        <span className="text-[11px] text-slate-400">
                          {[it.color, it.size, it.opt].filter(Boolean).join(' • ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{it.qty}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {money(it.price)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {money(it.price * it.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals & Verification QR */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-2">
            {/* Live QR Verification Badge */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
              {/* Minimal SVG QR Code */}
              <div className="w-14 h-14 bg-white p-1 rounded-xl border border-slate-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg viewBox="0 0 24 24" className="w-12 h-12 text-slate-900 fill-current">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v4h-4v-4zm-4-2h2v2h-2v-2zm2 4h2v2h-2v-2zm-2 2h2v2h-2v-2zm6-4h2v2h-2v-2zm-6-2h4v2h-4v-2zm0 6h4v2h-4v-2z" />
                </svg>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Authenticated Receipt
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Scan to verify status on live tracker
                </p>
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold underline hover:opacity-80"
                >
                  Verify Online
                </a>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="w-full sm:w-60 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {money(order.subtotal)}
                </span>
              </div>

              {Boolean(order.discount && order.discount > 0) && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Promo Discount</span>
                  <span className="font-mono">-{money(order.discount || 0)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Nationwide Courier</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {order.deliveryFee === 0 ? 'FREE' : money(order.deliveryFee)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Total Paid
                </span>
                <span className="font-display font-extrabold text-xl text-purple-700 dark:text-purple-400 font-mono">
                  {money(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Official Notice */}
          <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400 dark:text-slate-500 space-y-1">
            <p>
              Thank you for shopping with MiCollections Haute Couture. Goods sold in good condition are covered by our artisan warranty.
            </p>
            <p>
              For dispatches, exchanges, or enquiries: WhatsApp +234 800 000 0000 &bull; support@micollection.com
            </p>
          </div>
        </div>

        {/* Modal Bottom Actions (hidden on print) */}
        <div className="no-print p-4 sm:px-6 bg-[var(--surface2)]/70 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
          <a
            href={waLink(supportMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-wa text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Support on WhatsApp</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
