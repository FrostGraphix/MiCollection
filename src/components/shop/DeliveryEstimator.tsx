'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Clock, MapPin, CheckCircle2, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import {
  NIGERIAN_STATES,
  getStateDeliveryInfo,
  FREE_DELIVERY_THRESHOLD,
} from '@/lib/deliveryRates';
import { money } from '@/lib/utils';

interface DeliveryEstimatorProps {
  subtotal?: number;
  cartTotal?: number;
  className?: string;
  compact?: boolean;
  onStateSelect?: (state: string) => void;
  onRateCalculated?: (info: ReturnType<typeof getStateDeliveryInfo>) => void;
}

export const DeliveryEstimator: React.FC<DeliveryEstimatorProps> = ({
  subtotal = 0,
  cartTotal,
  className = '',
  compact = false,
  onStateSelect,
  onRateCalculated,
}) => {
  const activeSubtotal = cartTotal ?? subtotal;
  const [selectedState, setSelectedState] = useState<string>('Abuja (FCT)');

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mic_delivery_state');
      if (saved && NIGERIAN_STATES.includes(saved as any)) {
        setSelectedState(saved);
      }
    } catch {}
  }, []);

  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    try {
      localStorage.setItem('mic_delivery_state', newState);
      window.dispatchEvent(
        new CustomEvent('mc:delivery-state-changed', { detail: { state: newState } })
      );
    } catch {}
    if (onStateSelect) {
      onStateSelect(newState);
    }
  };

  const deliveryInfo = getStateDeliveryInfo(selectedState, subtotal);
  const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  if (compact) {
    return (
      <div className={`p-3 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] space-y-2 text-xs ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
            <Truck className="w-4 h-4 text-brand" />
            <span>Delivery to:</span>
          </div>

          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="appearance-none bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] text-xs font-semibold rounded-xl pl-2.5 pr-7 py-1 outline-none focus:border-brand cursor-pointer"
            >
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--mute)]" />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[var(--line)]">
          <span className="text-[var(--mute)] flex items-center gap-1">
            <Clock className="w-3 h-3 text-brand" /> {deliveryInfo.sla}
          </span>
          <span className="font-extrabold text-[var(--ink)]">
            {deliveryInfo.isFreeDelivery ? (
              <span className="text-emerald-500 font-black">FREE</span>
            ) : (
              deliveryInfo.effectiveFeeFormatted
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl bg-[var(--surface2)]/80 border border-[var(--line)] shadow-sm space-y-3.5 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display font-bold text-xs sm:text-sm text-[var(--ink)]">
              Estimated Delivery & Transit SLA
            </h4>
            <span className="text-[11px] text-[var(--mute)]">
              Real-time delivery rates across Nigeria
            </span>
          </div>
        </div>

        {/* State Selector Dropdown */}
        <div className="relative min-w-[170px]">
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full appearance-none bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] text-xs font-bold rounded-2xl pl-3 pr-8 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 cursor-pointer shadow-sm transition-all"
          >
            {NIGERIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--mute)]" />
        </div>
      </div>

      {/* Delivery Metrics Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* Fee */}
        <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line)] flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--mute)]">
            Delivery Fee
          </span>
          <span className="font-display font-black text-sm text-[var(--ink)] mt-0.5">
            {deliveryInfo.isFreeDelivery ? (
              <span className="text-emerald-500 font-bold">FREE DELIVERY</span>
            ) : (
              deliveryInfo.effectiveFeeFormatted
            )}
          </span>
          <span className="text-[10px] text-[var(--mute)] mt-0.5">{deliveryInfo.courierMode}</span>
        </div>

        {/* Timeline SLA */}
        <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line)] flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--mute)]">
            Transit Time
          </span>
          <span className="font-display font-bold text-sm text-brand mt-0.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>{deliveryInfo.sla}</span>
          </span>
          <span className="text-[10px] text-[var(--mute)] mt-0.5">Dispatched from Abuja</span>
        </div>

        {/* Payment Policy */}
        <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line)] flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--mute)]">
            Payment Mode
          </span>
          <span className="font-semibold text-xs text-[var(--ink)] mt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{deliveryInfo.isPodAvailable ? 'Card, Transfer & POD' : 'Card & Transfer Pre-Pay'}</span>
          </span>
          <span className="text-[10px] text-[var(--mute)] mt-0.5">
            {deliveryInfo.isPodAvailable ? 'Pay on doorstep delivery' : 'Interstate express tracking'}
          </span>
        </div>
      </div>

      {/* Free Delivery Bar if subtotal > 0 */}
      {subtotal > 0 && remainingForFree > 0 && (
        <div className="p-2.5 rounded-xl bg-brand/5 border border-brand/15 flex items-center justify-between text-xs text-[var(--ink2)]">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>
              Add <strong className="text-brand font-bold">{money(remainingForFree)}</strong> more for <strong>FREE Delivery</strong>!
            </span>
          </div>
          <span className="font-bold text-[10px] text-brand uppercase tracking-wider hidden sm:inline">
            Free over ₦100k
          </span>
        </div>
      )}

      {/* Note */}
      <div className="flex items-start gap-1.5 text-[11px] text-[var(--mute)] leading-relaxed">
        <MapPin className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
        <span>{deliveryInfo.description}</span>
      </div>
    </div>
  );
};
