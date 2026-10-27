'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { OrderRecord, OrderStatus } from '@/types';
import { INITIAL_ORDERS } from '@/lib/mockOrders';
import { STATES } from '@/lib/products';
import { money } from '@/lib/utils';
import { OrderModal } from '@/components/admin/OrderModal';
import {
  Search,
  Filter,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  MapPin,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Phone,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch live orders if available
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
          // Merge or replace with API orders
          setOrders(data.orders);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch orders from API, keeping current state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update order status callback
  const handleOrderStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: newStatus } : null));
    }
  };

  // Open modal
  const handleOpenOrder = (order: OrderRecord) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Tab counts
  const counts = useMemo(() => {
    const received = orders.filter((o) => o.orderStatus === 'received').length;
    const confirmed = orders.filter((o) => o.orderStatus === 'confirmed').length;
    const dispatched = orders.filter(
      (o) => o.orderStatus === 'dispatched' || o.orderStatus === 'shipped'
    ).length;
    const delivered = orders.filter((o) => o.orderStatus === 'delivered').length;
    const cancelled = orders.filter((o) => o.orderStatus === 'cancelled').length;

    return {
      all: orders.length,
      received,
      confirmed,
      dispatched,
      delivered,
      cancelled,
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab === 'received' && order.orderStatus !== 'received') return false;
      if (activeTab === 'confirmed' && order.orderStatus !== 'confirmed') return false;
      if (
        activeTab === 'dispatched' &&
        order.orderStatus !== 'dispatched' &&
        order.orderStatus !== 'shipped'
      )
        return false;
      if (activeTab === 'delivered' && order.orderStatus !== 'delivered') return false;
      if (activeTab === 'cancelled' && order.orderStatus !== 'cancelled') return false;

      // State filter
      if (selectedState !== 'all' && !order.state.toLowerCase().includes(selectedState.toLowerCase())) {
        return false;
      }

      // Payment filter
      if (selectedPayment !== 'all') {
        if (selectedPayment === 'transfer' && order.paymentMethod !== 'transfer') return false;
        if (selectedPayment === 'link' && order.paymentMethod !== 'link') return false;
        if (selectedPayment === 'pod' && order.paymentMethod !== 'pod') return false;
      }

      // Search query (Order ID, customer name, phone, email)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchId = order.id.toLowerCase().includes(query);
        const matchName = order.name.toLowerCase().includes(query);
        const matchPhone = order.phone.toLowerCase().includes(query);
        const matchEmail = order.email.toLowerCase().includes(query);
        const matchState = order.state.toLowerCase().includes(query);
        return matchId || matchName || matchPhone || matchEmail || matchState;
      }

      return true;
    });
  }, [orders, activeTab, selectedState, selectedPayment, searchQuery]);

  // Financial summary metrics
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  // Helper for status badge
  const renderStatusPill = (status?: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300/40">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'shipped':
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/40">
            <Truck className="w-3 h-3" /> Dispatched
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300/40">
            <PackageCheck className="w-3 h-3" /> Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300/40">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      case 'received':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300/40">
            <Clock className="w-3 h-3" /> Received
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[var(--ink)]">
              Orders & Fulfillment
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-bold">
              Domain 4
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--mute)] mt-1">
            Real-time Abuja doorstep and nationwide logistics fulfillment console.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-purple-500/10 flex items-center gap-2 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-brand ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Live</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Volume</span>
            <ShoppingBag className="w-4 h-4 text-brand" />
          </div>
          <div className="text-2xl font-bold text-[var(--ink)] font-display">
            {orders.length} <span className="text-xs font-normal text-[var(--mute)]">Orders</span>
          </div>
          <p className="text-[11px] text-[var(--mute)] mt-1">Across 36 states & FCT</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pipeline Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-brand font-display">
            {money(totalRevenue)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            +18.4% month-over-month
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Awaiting Pack</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-display">
            {counts.received + counts.confirmed}
          </div>
          <p className="text-[11px] text-[var(--mute)] mt-1">Received & Confirmed</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Transit</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-display">
            {counts.dispatched}
          </div>
          <p className="text-[11px] text-[var(--mute)] mt-1">Courier on delivery route</p>
        </div>
      </div>

      {/* Filter Tabs with Dynamic Counts */}
      <div className="border-b border-[var(--line)] flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-brand text-white shadow-md shadow-purple-500/20'
              : 'text-[var(--mute)] hover:text-[var(--ink)] hover:bg-purple-500/10'
          }`}
        >
          <span>All Orders</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-purple-500/10 text-brand'
          }`}>
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'received'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-[var(--mute)] hover:text-[var(--ink)] hover:bg-purple-500/10'
          }`}
        >
          <span>Received / New</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'received' ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
          }`}>
            {counts.received}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('confirmed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'confirmed'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-[var(--mute)] hover:text-[var(--ink)] hover:bg-purple-500/10'
          }`}
        >
          <span>Confirmed</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'confirmed' ? 'bg-white/20 text-white' : 'bg-purple-500/10 text-brand'
          }`}>
            {counts.confirmed}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('dispatched')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'dispatched'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-[var(--mute)] hover:text-[var(--ink)] hover:bg-purple-500/10'
          }`}
        >
          <span>Dispatched</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'dispatched' ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}>
            {counts.dispatched}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('delivered')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'delivered'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-[var(--mute)] hover:text-[var(--ink)] hover:bg-purple-500/10'
          }`}
        >
          <span>Delivered</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'delivered' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            {counts.delivered}
          </span>
        </button>

        {counts.cancelled > 0 && (
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'cancelled'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-[var(--mute)] hover:text-[var(--ink)] hover:bg-purple-500/10'
            }`}
          >
            <span>Cancelled</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'cancelled' ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-600'
            }`}>
              {counts.cancelled}
            </span>
          </button>
        )}
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-[var(--mute)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID, customer, phone, email, state..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink)] placeholder-[var(--mute)] focus:outline-none focus:border-brand transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--mute)] hover:text-[var(--ink)]"
            >
              Clear
            </button>
          )}
        </div>

        {/* State Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink)] focus:outline-none focus:border-brand transition-colors cursor-pointer"
          >
            <option value="all">All States (Nigeria)</option>
            <option value="abuja">Abuja (FCT)</option>
            <option value="lagos">Lagos</option>
            <option value="rivers">Rivers (Port Harcourt)</option>
            <option value="kano">Kano</option>
            <option value="kaduna">Kaduna</option>
            <option value="oyo">Oyo (Ibadan)</option>
            <option value="delta">Delta</option>
            <option value="enugu">Enugu</option>
            <option value="ogun">Ogun</option>
            <option value="plateau">Plateau (Jos)</option>
            <option value="anambra">Anambra</option>
            <option value="sokoto">Sokoto</option>
          </select>
        </div>

        {/* Payment Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink)] focus:outline-none focus:border-brand transition-colors cursor-pointer"
          >
            <option value="all">All Payment Methods</option>
            <option value="transfer">Bank Transfer</option>
            <option value="link">Card / USSD</option>
            <option value="pod">Pay on Delivery</option>
          </select>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--surface2)]/60 text-[var(--mute)] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Order / Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Destination</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Fulfillment</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--mute)]">
                    <AlertCircle className="w-8 h-8 text-brand mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-sm text-[var(--ink)]">No matching orders found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const initials = order.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  const isPaid = order.paymentStatus === 'paid';
                  const waPhone = order.phone.replace(/^0/, '234').replace(/[^0-9]/g, '');

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenOrder(order)}
                      className="hover:bg-purple-500/5 transition-colors cursor-pointer group"
                    >
                      {/* Order ID & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[var(--ink)] font-mono flex items-center gap-1.5 group-hover:text-brand transition-colors">
                          <span>#{order.id}</span>
                        </div>
                        <span className="text-[10px] text-[var(--mute)] block mt-0.5">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 text-brand border border-purple-500/20 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--ink)]">{order.name}</div>
                            <div className="text-[11px] text-[var(--mute)]">{order.phone}</div>
                          </div>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-[var(--ink)] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-brand" />
                          <span>{order.state}</span>
                        </div>
                        <div className="text-[11px] text-[var(--mute)] truncate max-w-[150px]" title={order.address}>
                          {order.address}
                        </div>
                      </td>

                      {/* Items Summary */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[var(--ink)] line-clamp-1">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'} •{' '}
                          <span className="text-[var(--mute)]">
                            {order.items.map((i) => i.name).join(', ')}
                          </span>
                        </div>
                        <div className="text-[10px] text-brand mt-0.5">
                          {order.deliveryLabel}
                        </div>
                      </td>

                      {/* Total ₦ */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-[var(--ink)] text-sm font-display">
                          {money(order.total)}
                        </div>
                        {order.discount > 0 && (
                          <span className="text-[10px] text-emerald-600 font-medium">
                            Saved {money(order.discount)}
                          </span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {isPaid ? 'Paid' : 'Pending'}
                        </span>
                        <div className="text-[10px] text-[var(--mute)] mt-0.5 truncate max-w-[90px]">
                          {order.payLabel}
                        </div>
                      </td>

                      {/* Fulfillment Status Pill */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusPill(order.orderStatus)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick WhatsApp */}
                          <a
                            href={`https://wa.me/${waPhone}?text=Hello+${encodeURIComponent(order.name)}+from+MiCollections+regarding+order+${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat on WhatsApp"
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>

                          {/* View Modal */}
                          <button
                            onClick={() => handleOpenOrder(order)}
                            title="Inspect Order"
                            className="px-2.5 py-1.5 rounded-lg bg-brand/10 text-brand hover:bg-brand hover:text-white transition-colors flex items-center gap-1 font-semibold text-[11px]"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--surface2)]/40 flex items-center justify-between text-xs text-[var(--mute)]">
          <span>
            Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> total orders
          </span>
          <span className="font-semibold text-brand">
            Active Filter Spend: {money(filteredOrders.reduce((sum, o) => sum + o.total, 0))}
          </span>
        </div>
      </div>

      {/* Order Inspection Modal */}
      <OrderModal
        isOpen={isModalOpen}
        order={selectedOrder}
        onClose={() => setIsModalOpen(false)}
        onStatusUpdate={handleOrderStatusUpdate}
      />
    </div>
  );
}
