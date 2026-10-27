'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, MessageSquare, ArrowRight, Package } from 'lucide-react';
import { ConfettiEffect } from '@/components/ui/Confetti';
import { OrderRecord } from '@/types';
import { money, waLink } from '@/lib/utils';
import { ProductArt } from '@/components/shop/ProductArt';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id') || searchParams.get('reference') || '';
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders?id=${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            setOrder(data.order);
          }
        }
      } catch (err) {
        console.warn('Could not fetch order:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  const timelineSteps = [
    { title: 'Order Received', desc: 'We have logged your order.', done: true },
    {
      title: 'Confirm on WhatsApp',
      desc: 'Send us the order message so we can verify sizes and total.',
      done: false,
    },
    {
      title: 'Payment Confirmed',
      desc: `Pay by ${order?.payLabel || 'selected method'}. We verify right away.`,
      done: false,
    },
    {
      title: 'Packed & Dispatched',
      desc: 'Carefully packaged in Abuja and handed to rider or courier.',
      done: false,
    },
    {
      title: 'Delivered to You',
      desc: `Arrives in ${order?.eta || '1 to 2 working days'}.`,
      done: false,
    },
  ];

  const whatsappMessage = order
    ? order.wa
    : `Hello MiCollections, I just placed an order on your website with reference ${orderId}. Please confirm!`;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 sm:py-16">
      <ConfettiEffect trigger={true} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Confirmation & Timeline */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full border border-emerald-500/20 w-fit">
            <Check className="w-3.5 h-3.5" /> Order Received
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight">
            Thank you, <br />
            <em className="serif-italic">
              {order ? order.name.split(' ')[0] : 'Customer'}
            </em>
            !
          </h1>

          <p className="text-sm sm:text-base text-[var(--ink2)] leading-relaxed">
            Your order{' '}
            <b className="px-3 py-1 rounded-full bg-[var(--pill)] text-brand font-mono text-sm inline-block">
              {orderId || 'MC-ORDER'}
            </b>{' '}
            is in! One last step: tap the button below to confirm with us on WhatsApp so we can verify your items and dispatch promptly.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <a
              href={waLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa text-sm py-3 px-6 shadow-xl"
            >
              <MessageSquare className="w-4 h-4" /> Confirm Order on WhatsApp
            </a>

            <Link href="/shop" className="btn-ghost text-sm py-3 px-6">
              Keep Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Fulfillment Timeline */}
          <div className="mt-8 pt-8 border-t border-[var(--line)]">
            <h3 className="font-display text-lg font-bold mb-6">Order Status Timeline</h3>
            <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-[var(--line)]">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4 relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 shadow-sm ${
                      step.done
                        ? 'bg-brand text-white'
                        : 'bg-[var(--surface2)] text-[var(--mute)] border border-[var(--line)]'
                    }`}
                  >
                    {step.done ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <strong className="block text-sm font-semibold">{step.title}</strong>
                    <span className="text-xs text-[var(--mute)]">{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Details Summary */}
        <aside
          className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xl flex flex-col gap-6"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-brand" /> Summary for {orderId}
          </h3>

          {order && (
            <>
              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-[var(--line)]">
                {order.items.map((it, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 flex items-center gap-3 text-xs">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--surface2)] border border-[var(--line)] flex-shrink-0">
                      <ProductArt type={it.art} color={it.color} view={0} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{it.name}</span>
                      <span className="text-[11px] text-[var(--mute)]">
                        {it.qty} x {money(it.price)} &bull; {it.opt}
                      </span>
                    </div>
                    <span className="font-mono font-bold">{money(it.price * it.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Price Details */}
              <div className="space-y-2 text-xs sm:text-sm pt-4 border-t border-[var(--line)]">
                <div className="flex justify-between">
                  <span className="text-[var(--mute)]">Subtotal</span>
                  <span className="font-mono">{money(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-{money(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--mute)]">Delivery</span>
                  <span className="font-mono">
                    {order.fee === 0 ? 'Free' : money(order.fee)}
                  </span>
                </div>
                <div className="flex justify-between font-display text-xl font-bold pt-2 border-t border-[var(--line)]">
                  <span>Total</span>
                  <span>{money(order.total)}</span>
                </div>
              </div>

              {/* Delivery Destination */}
              <div className="p-4 rounded-2xl bg-[var(--surface2)] text-xs text-[var(--ink2)] space-y-1">
                <strong className="block text-[var(--ink)] font-semibold">
                  Delivery Destination
                </strong>
                <div>{order.name}</div>
                <div>
                  {order.address}, {order.state}
                </div>
                <div>{order.phone}</div>
              </div>
            </>
          )}

          {!order && !loading && (
            <p className="text-xs text-[var(--mute)]">
              Your order record is being processed. Feel free to message us directly on WhatsApp with your reference number.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-6 py-20">Loading order...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
