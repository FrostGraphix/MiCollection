'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Package,
  Truck,
  CreditCard,
  MessageSquare,
  X,
  Volume2,
  VolumeX,
  Search,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { money, waLink } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  color?: string;
  opt?: string;
}

export interface AdminOrder {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  landmark?: string;
  amount: number;
  paymentMethod: 'transfer' | 'link' | 'pod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'received' | 'confirmed' | 'dispatched' | 'delivered';
  deliveryLabel: string;
  eta: string;
  items: OrderItem[];
  createdAt: string;
}

// Helper to play a Web Audio API luxury chime
export function playOrderAlertChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Arpeggiated chime: F#5 (739.99 Hz), A#5 (932.33 Hz), C#6 (1108.73 Hz)
    const notes = [739.99, 932.33, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  } catch (e) {
    // Audio Context not ready or blocked by browser gesture policy
  }
}

export interface RecentOrdersTickerProps {
  initialOrders?: AdminOrder[];
  title?: string;
}

export const RecentOrdersTicker: React.FC<RecentOrdersTickerProps> = ({
  initialOrders = [],
  title = 'Live Order Stream',
}) => {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(initialOrders.length === 0);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<'all' | 'abuja' | 'interstate' | 'high-value'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);

  // Load live orders from /api/orders on mount
  useEffect(() => {
    async function loadLiveOrders() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.orders)) {
            const mapped: AdminOrder[] = data.orders.map((o: any) => ({
              id: o.id,
              name: o.name,
              phone: o.phone,
              email: o.email,
              address: o.address,
              state: o.state,
              landmark: o.landmark,
              amount: Number(o.total || 0),
              paymentMethod: (o.paymentMethod as any) || 'transfer',
              paymentStatus: (o.paymentStatus as any) || 'pending',
              orderStatus: (o.orderStatus as any) || 'received',
              deliveryLabel: o.deliveryLabel || 'Abuja Doorstep Delivery',
              eta: o.eta || '1 to 2 working days',
              items: (o.items || []).map((it: any) => ({
                name: it.name,
                price: Number(it.price || 0),
                qty: Number(it.qty || 1),
                color: it.color,
                opt: it.opt,
              })),
              createdAt: o.createdAt || new Date().toISOString(),
            }));
            setOrders(mapped);
          }
        }
      } catch (err) {
        console.warn('Failed to load live orders for ticker:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLiveOrders();
  }, []);

  // Listen for real-time order alerts dispatched in the browser
  useEffect(() => {
    const handleNewOrder = (event: Event) => {
      const customEvent = event as CustomEvent<AdminOrder>;
      const order = customEvent.detail;
      if (!order) return;

      setOrders((prev) => [order, ...prev]);
      setNewOrderAlert(order.id);

      if (soundEnabled) {
        playOrderAlertChime();
      }

      // Clear alert animation after 5s
      const timer = setTimeout(() => {
        setNewOrderAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('mc:new-order', handleNewOrder);
    return () => {
      window.removeEventListener('mc:new-order', handleNewOrder);
    };
  }, [soundEnabled]);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        order.id.toLowerCase().includes(q) ||
        order.name.toLowerCase().includes(q) ||
        order.state.toLowerCase().includes(q) ||
        order.phone.includes(q);
      if (!match) return false;
    }

    if (filter === 'abuja') return order.state.toLowerCase().includes('abuja');
    if (filter === 'interstate') return !order.state.toLowerCase().includes('abuja');
    if (filter === 'high-value') return order.amount >= 50000;
    return true;
  });

  // Avatar initials helper
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Status badge styling
  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'Confirmed',
          className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
          dot: 'bg-blue-500',
        };
      case 'shipped':
      case 'dispatched':
        return {
          label: 'Dispatched',
          className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
          dot: 'bg-purple-500',
        };
      case 'delivered':
        return {
          label: 'Delivered',
          className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
          dot: 'bg-emerald-500',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
          dot: 'bg-rose-500',
        };
      case 'received':
      default:
        return {
          label: 'Received',
          className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
          dot: 'bg-amber-500',
        };
    }
  };

  // Payment badge styling
  const getPaymentBadge = (method?: string | null) => {
    switch (method) {
      case 'transfer':
        return {
          label: 'Bank Transfer',
          className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
        };
      case 'link':
      case 'card':
      case 'paystack':
        return {
          label: 'Card / USSD',
          className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
        };
      case 'pod':
        return {
          label: 'Pay on Delivery',
          className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        };
      default:
        return {
          label: method ? String(method).toUpperCase() : 'Online Payment',
          className: 'bg-brand/10 text-brand border border-brand/20',
        };
    }
  };

  return (
    <div className="rounded-2xl md:rounded-3xl p-5 sm:p-7 backdrop-blur-xl bg-[var(--surface)]/80 border border-[var(--line)] shadow-xl flex flex-col justify-between">
      {/* Ticker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--ink)]">
              {title}
            </h3>
            {/* Live Indicator Beacon */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed
            </span>
          </div>
          <p className="text-xs text-[var(--mute)] mt-0.5">
            Real-time feed across Abuja doorstep dispatch & interstate couriers
          </p>
        </div>

        {/* Controls: Sound toggle + Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
              soundEnabled
                ? 'bg-brand/10 text-brand border-brand/30'
                : 'bg-[var(--surface2)] text-[var(--mute)] border-[var(--line)]'
            }`}
            title={soundEnabled ? 'Order sound alert enabled' : 'Order sound muted'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline font-semibold">Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="hidden sm:inline font-semibold">Muted</span>
              </>
            )}
          </button>

          {/* Filter Pills */}
          <div className="flex items-center bg-[var(--surface2)] p-1 rounded-xl border border-[var(--line)] text-xs">
            {(['all', 'abuja', 'interstate', 'high-value'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filter === mode
                    ? 'bg-[var(--surface)] text-brand font-bold shadow-sm'
                    : 'text-[var(--mute)] hover:text-[var(--ink)]'
                }`}
              >
                {mode === 'all'
                  ? 'All'
                  : mode === 'abuja'
                  ? 'Abuja'
                  : mode === 'interstate'
                  ? 'Interstate'
                  : '> ₦50k'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative my-4">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by Order ID, customer name, phone or state..."
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:border-brand transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Orders List */}
      <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-col gap-2.5 py-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--line)] bg-[var(--surface2)]/40 animate-pulse"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--line)]/50 flex-shrink-0" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-3 bg-[var(--line)]/60 rounded" />
                      <div className="w-24 h-3 bg-[var(--line)]/40 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2.5 bg-[var(--line)]/30 rounded" />
                      <div className="w-12 h-2.5 bg-[var(--line)]/30 rounded" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-16 h-5 rounded-full bg-[var(--line)]/40 hidden sm:block" />
                  <div className="w-16 h-5 rounded-full bg-[var(--line)]/40" />
                  <div className="w-16 h-4 bg-[var(--line)]/50 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--mute)]">
            No orders match the selected filter.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const status = getStatusBadge(order.orderStatus);
            const payment = getPaymentBadge(order.paymentMethod);
            const isNew = newOrderAlert === order.id;

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`group flex items-center justify-between p-3.5 rounded-2xl cursor-pointer border transition-all duration-300 ${
                  isNew
                    ? 'bg-brand/15 border-brand animate-pulse shadow-md'
                    : 'bg-[var(--surface2)]/50 hover:bg-[var(--surface2)] border-[var(--line)] hover:border-brand/30'
                }`}
              >
                {/* Left: Customer Initials + Details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Initials Avatar */}
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand to-orchid text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                    {getInitials(order.name)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-xs text-[var(--ink)]">
                        {order.id}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[var(--mute)]" />
                      <span className="font-semibold text-xs text-[var(--ink)] truncate max-w-[130px] sm:max-w-[180px]">
                        {order.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[var(--mute)] mt-0.5">
                      <span className="flex items-center gap-1 truncate max-w-[140px]">
                        <MapPin className="w-3 h-3 text-brand flex-shrink-0" />
                        {order.state}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[var(--line)]" />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--mute)]" />
                        {order.createdAt}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Badges & Amount */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Payment method badge (hidden on extra small) */}
                  <span
                    className={`hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${payment?.className || 'bg-brand/10 text-brand'}`}
                  >
                    {payment?.label || 'Payment'}
                  </span>

                  {/* Status pill */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${status?.className || 'bg-amber-500/10 text-amber-600'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status?.dot || 'bg-amber-500'}`} />
                    {status?.label || 'Received'}
                  </span>

                  {/* Order Amount */}
                  <div className="text-right min-w-[75px]">
                    <span className="font-display font-extrabold text-xs sm:text-sm text-[var(--ink)]">
                      {money(order.amount)}
                    </span>
                  </div>

                  {/* 1-Click Action View Icon */}
                  <div className="p-1.5 rounded-lg text-[var(--mute)] group-hover:text-brand group-hover:bg-brand/10 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ====================================================================
          Order Details Modal (1-Click Action View)
          ==================================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl p-6 sm:p-7 relative overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ boxShadow: 'var(--shadow)' }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--line)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-xl text-[var(--ink)]">
                    {selectedOrder.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      getStatusBadge(selectedOrder.orderStatus)?.className || 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {getStatusBadge(selectedOrder.orderStatus)?.label || 'Received'}
                  </span>
                </div>
                <p className="text-xs text-[var(--mute)] mt-1">
                  Placed {selectedOrder.createdAt} &bull; {selectedOrder.deliveryLabel}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full hover:bg-[var(--surface2)] text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Customer Info Card */}
              <div className="p-4 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--ink)]">
                    {selectedOrder.name}
                  </span>
                  <span className="text-xs text-[var(--mute)]">
                    {selectedOrder.phone}
                  </span>
                </div>
                <div className="text-xs text-[var(--ink2)] flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand flex-shrink-0 mt-0.5" />
                  <span>
                    {selectedOrder.address}, {selectedOrder.state}
                    {selectedOrder.landmark && ` (${selectedOrder.landmark})`}
                  </span>
                </div>
              </div>

              {/* Items Purchased List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--mute)] mb-2">
                  Purchased Items ({selectedOrder.items.length})
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface2)]/60 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[var(--ink)] block">
                          {it.name}
                        </span>
                        <span className="text-[11px] text-[var(--mute)]">
                          Qty: {it.qty} {it.opt ? `&bull; ${it.opt}` : ''} {it.color ? `&bull; ${it.color}` : ''}
                        </span>
                      </div>
                      <span className="font-display font-bold text-[var(--ink)]">
                        {money(it.price * it.qty)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
                <div>
                  <span className="block text-[11px] text-[var(--mute)]">
                    Payment Method
                  </span>
                  <span className="text-xs font-bold text-[var(--ink)]">
                    {getPaymentBadge(selectedOrder.paymentMethod).label} &bull;{' '}
                    <span className="text-emerald-500 uppercase">
                      {selectedOrder.paymentStatus}
                    </span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] text-[var(--mute)]">
                    Total Amount
                  </span>
                  <span className="font-display font-black text-xl text-brand">
                    {money(selectedOrder.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between gap-3">
              <a
                href={waLink(
                  `Hello ${selectedOrder.name}, confirming your MiCollections order ${selectedOrder.id}. We are preparing your items for delivery!`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa text-xs py-2.5 px-4 flex-1 justify-center"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp Customer
              </a>

              <button
                onClick={() => {
                  setOrders((prev) =>
                    prev.map((ord) =>
                      ord.id === selectedOrder.id
                        ? { ...ord, orderStatus: 'dispatched' }
                        : ord
                    )
                  );
                  setSelectedOrder((prev) =>
                    prev ? { ...prev, orderStatus: 'dispatched' } : null
                  );
                }}
                className="btn-primary text-xs py-2.5 px-4 flex-1 justify-center"
              >
                <Truck className="w-4 h-4" />
                Dispatch Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
