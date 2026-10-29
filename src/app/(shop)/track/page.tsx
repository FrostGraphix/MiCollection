'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { OrderTrackingInfo, TrackingMilestone } from '@/types';
import { money, waLink } from '@/lib/utils';
import { ProductImage } from '@/components/shop/ProductImage';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  PackageCheck,
  XCircle,
  MapPin,
  Phone,
  Copy,
  ExternalLink,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Loader2,
  AlertCircle,
  Package,
  Calendar,
  CreditCard,
  ChevronRight,
} from 'lucide-react';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const urlOrderId = (searchParams.get('id') || searchParams.get('orderId') || '').trim();
  const urlEmail = (searchParams.get('email') || '').trim();
  const urlPhone = (searchParams.get('phone') || '').trim();

  const [orderIdInput, setOrderIdInput] = useState(urlOrderId);
  const [emailInput, setEmailInput] = useState(urlEmail || user?.email || '');
  const [phoneInput, setPhoneInput] = useState(urlPhone);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [trackingData, setTrackingData] = useState<OrderTrackingInfo | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const executeTrack = useCallback(
    async (idToTrack: string, emailToTrack?: string, phoneToTrack?: string) => {
      const cleanId = idToTrack.trim();
      if (!cleanId) return;

      setIsLoading(true);
      setErrorMsg(null);
      setRequiresVerification(false);

      try {
        const query = new URLSearchParams();
        query.set('id', cleanId);
        if (emailToTrack) query.set('email', emailToTrack.trim());
        if (phoneToTrack) query.set('phone', phoneToTrack.trim());

        const res = await fetch(`/api/track?${query.toString()}`);
        const data = await res.json();

        if (res.ok && data.success && data.tracking) {
          setTrackingData(data.tracking);
          setRequiresVerification(false);
        } else if (res.status === 403 && data.requiresVerification) {
          setRequiresVerification(true);
          setErrorMsg(
            data.error ||
              'For your security, please verify with the email or phone number used during checkout.'
          );
        } else {
          setErrorMsg(data.error || 'Could not locate tracking information for this order.');
          setTrackingData(null);
        }
      } catch (err: any) {
        console.error('Tracking query error:', err);
        setErrorMsg('Network error. Please try again or contact support.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (urlOrderId) {
      setOrderIdInput(urlOrderId);
      executeTrack(urlOrderId, urlEmail || user?.email || '', urlPhone);
    }
  }, [urlOrderId, urlEmail, urlPhone, user, executeTrack]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim()) {
      setErrorMsg('Please enter an Order ID (e.g. MC-XXXXXX)');
      return;
    }
    executeTrack(orderIdInput, emailInput, phoneInput);
  };

  const getMilestoneIcon = (step: string, completed: boolean, current: boolean) => {
    if (step === 'cancelled') {
      return <XCircle className="w-5 h-5 text-rose-500" />;
    }
    if (current) {
      return <Clock className="w-5 h-5 text-amber-500 animate-spin-slow" />;
    }
    if (completed) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    }
    return <Clock className="w-5 h-5 text-[var(--mute)] opacity-40" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'Confirmed & Packing',
          classes: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        };
      case 'dispatched':
      case 'shipped':
        return {
          label: 'Dispatched & In Transit',
          classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'delivered':
        return {
          label: 'Delivered',
          classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        };
      case 'received':
      default:
        return {
          label: 'Order Placed',
          classes: 'bg-purple-500/10 text-brand border-purple-500/20',
        };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--pill)] border border-[var(--line)] text-brand text-xs font-bold uppercase tracking-wider">
          <Truck className="w-3.5 h-3.5" /> Live Order Tracking
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">
          Track Your <em className="serif-italic">Package</em>
        </h1>
        <p className="text-xs sm:text-sm text-[var(--mute)] max-w-lg mx-auto leading-relaxed">
          Follow your luxury items from our Abuja fulfillment center straight to your doorstep in real time.
        </p>
      </div>

      {/* Search & Lookup Card */}
      <div
        className="p-6 sm:p-8 rounded-[32px] bg-[var(--surface)] border border-[var(--line)] shadow-xl"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className={requiresVerification ? 'md:col-span-4' : 'md:col-span-8'}>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mute)] mb-1.5">
                Order ID / Reference
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  placeholder="e.g. MC-19R3L5"
                  className="w-full h-12 pl-4 pr-10 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-sm font-mono uppercase tracking-wider outline-none focus:border-brand font-semibold text-[var(--ink)]"
                />
                <Search className="w-4 h-4 text-[var(--mute)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {requiresVerification && (
              <>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mute)] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-12 px-4 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-sm outline-none focus:border-brand text-[var(--ink)]"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mute)] mb-1.5">
                    Or Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="e.g. 08012345678"
                    className="w-full h-12 px-4 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] text-sm outline-none focus:border-brand text-[var(--ink)]"
                  />
                </div>
              </>
            )}

            <div className={requiresVerification ? 'md:col-span-12' : 'md:col-span-4'}>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full h-12 text-xs font-bold justify-center disabled:opacity-50 tracking-wider uppercase"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Tracking...
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" /> Track Package
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{errorMsg}</div>
          </div>
        )}
      </div>

      {/* Live Tracking Presentation */}
      {trackingData && (
        <div className="space-y-6 animate-fade-in">
          {/* Status Hero Card */}
          <div className="p-6 sm:p-8 rounded-[32px] bg-[var(--surface)] border border-[var(--line)] shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-[var(--mute)] font-semibold uppercase tracking-wider">
                    Order Reference
                  </span>
                  <button
                    onClick={() => handleCopy(trackingData.orderId, 'order_id')}
                    className="text-[var(--mute)] hover:text-brand transition-colors"
                    title="Copy Order ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copiedField === 'order_id' && (
                    <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>
                  )}
                </div>
                <h2 className="font-mono text-2xl sm:text-3xl font-extrabold text-brand tracking-tight">
                  #{trackingData.orderId}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    getStatusBadge(trackingData.orderStatus).classes
                  }`}
                >
                  {getStatusBadge(trackingData.orderStatus).label}
                </span>

                <span className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--surface2)] text-[var(--mute)]">
                  {trackingData.deliveryLabel}
                </span>
              </div>
            </div>

            {/* Estimated Delivery & Progress Bar */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                <span className="text-[var(--mute)] flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-brand" /> Estimated Delivery:{' '}
                  <strong className="text-[var(--ink)]">{trackingData.eta}</strong>
                </span>

                <span className="font-mono font-bold text-brand">
                  {trackingData.progressPercent}% Completed
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full bg-[var(--surface2)] overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-brand via-purple-600 to-brand-light rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${trackingData.progressPercent}%` }}
                />
              </div>
            </div>

            {/* 4-Step Milestone Timeline */}
            <div className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              {trackingData.milestones.map((m, idx) => {
                const isCurrent = m.current;
                const isDone = m.completed;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-brand/5 border-brand ring-2 ring-brand/20 shadow-md'
                        : isDone
                        ? 'bg-[var(--surface2)]/70 border-emerald-500/20'
                        : 'bg-[var(--surface2)]/30 border-[var(--line)] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--mute)]">
                        Step 0{idx + 1}
                      </span>
                      {getMilestoneIcon(m.step, isDone, isCurrent)}
                    </div>

                    <h4 className="text-xs font-bold text-[var(--ink)] mb-1 leading-snug">
                      {m.title}
                    </h4>

                    <p className="text-[11px] text-[var(--mute)] leading-relaxed">
                      {m.description}
                    </p>

                    {m.timestamp && (
                      <span className="text-[10px] text-[var(--mute)] block mt-2 font-mono">
                        {new Date(m.timestamp).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2-Column Info Grid: Courier & Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Courier & Rider Dossier */}
            <div className="p-6 rounded-[28px] bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Courier & Dispatch Details
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Verified Dispatch
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[var(--mute)] block text-[11px] uppercase tracking-wider font-semibold">
                    Delivery Partner
                  </span>
                  <span className="font-bold text-sm text-[var(--ink)]">
                    {trackingData.carrier || 'MiCollections Express (Abuja Local)'}
                  </span>
                </div>

                {trackingData.trackingNumber && (
                  <div>
                    <span className="text-[var(--mute)] block text-[11px] uppercase tracking-wider font-semibold">
                      Waybill / Tracking Number
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-brand bg-[var(--pill)] px-2.5 py-1 rounded-lg">
                        {trackingData.trackingNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(trackingData.trackingNumber!, 'waybill')}
                        className="text-[var(--mute)] hover:text-brand"
                        title="Copy Waybill"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {trackingData.riderName && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--line)]">
                    <div>
                      <span className="text-[var(--mute)] block text-[11px] uppercase tracking-wider font-semibold">
                        Assigned Rider
                      </span>
                      <span className="font-semibold text-[var(--ink)]">{trackingData.riderName}</span>
                    </div>

                    {trackingData.riderPhone && (
                      <div>
                        <span className="text-[var(--mute)] block text-[11px] uppercase tracking-wider font-semibold">
                          Rider Phone
                        </span>
                        <a
                          href={`tel:${trackingData.riderPhone}`}
                          className="font-semibold text-brand hover:underline font-mono"
                        >
                          {trackingData.riderPhone}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {trackingData.dispatchNote && (
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs italic text-[var(--ink)]">
                    &ldquo;{trackingData.dispatchNote}&rdquo;
                  </div>
                )}
              </div>
            </div>

            {/* Destination & Delivery Address */}
            <div className="p-6 rounded-[28px] bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Destination
                </span>
                <span className="text-xs text-[var(--mute)] font-medium">
                  {trackingData.destination.city}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[var(--mute)] block text-[11px] uppercase tracking-wider font-semibold">
                    Recipient
                  </span>
                  <span className="font-bold text-sm text-[var(--ink)]">
                    {trackingData.destination.name}
                  </span>
                </div>

                <div>
                  <span className="text-[var(--mute)] block text-[11px] uppercase tracking-wider font-semibold">
                    Delivery Address
                  </span>
                  <p className="font-medium text-[var(--ink)] leading-relaxed mt-0.5">
                    {trackingData.destination.addressMasked}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
                  <div>
                    <span className="text-[var(--mute)] block text-[11px] uppercase tracking-wider font-semibold">
                      Payment
                    </span>
                    <span className="font-semibold text-[var(--ink)] capitalize">
                      {trackingData.payLabel} ({trackingData.paymentStatus})
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[var(--mute)] block text-[11px] uppercase tracking-wider font-semibold">
                      Total
                    </span>
                    <span className="font-display font-bold text-base text-brand">
                      {money(trackingData.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Summary & Quick Support Actions */}
          <div className="p-6 rounded-[28px] bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--mute)] flex items-center gap-2">
              <Package className="w-4 h-4 text-brand" /> Package Contents ({trackingData.items?.length || 0} items)
            </h3>

            <div className="divide-y divide-[var(--line)]">
              {trackingData.items?.map((it, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--surface2)] relative border border-[var(--line)] shrink-0">
                      <ProductImage
                        src={it.image}
                        alt={it.name}
                        fallbackArt={{ type: it.art, color: it.color, view: 0 }}
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-[var(--ink)] block text-sm">{it.name}</span>
                      <span className="text-[var(--mute)] text-[11px]">
                        Qty: {it.qty} {it.opt ? `• ${it.opt}` : ''} ({it.color})
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-[var(--ink)]">{money(it.price * it.qty)}</span>
                    <span className="block text-[11px] text-[var(--mute)]">{money(it.price)} each</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Action Footer */}
            <div className="pt-4 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
              <a
                href={trackingData.waSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa text-xs py-2.5 px-4 inline-flex items-center gap-2 font-semibold"
              >
                <MessageSquare className="w-4 h-4 fill-white" /> Live Dispatch WhatsApp Support
              </a>

              <Link
                href="/shop"
                className="btn-ghost text-xs py-2 px-4 inline-flex items-center gap-1.5 text-[var(--mute)] hover:text-brand"
              >
                Continue Shopping <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
          <p className="text-xs text-[var(--mute)]">Loading live tracking system...</p>
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
