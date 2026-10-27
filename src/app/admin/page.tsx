'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  Sparkles,
  Store,
  Shield,
  Truck,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { getAdminSession, AdminUser, isStoreOpen, formatAdminRole } from '@/lib/adminAuth';
import { playOrderChime } from '@/components/admin/AudioAlert';

export default function AdminOverviewPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [storeStatus, setStoreStatus] = useState<boolean>(true);

  useEffect(() => {
    setCurrentUser(getAdminSession());
    setStoreStatus(isStoreOpen());

    const handleAuthChange = (e: Event) => {
      const custom = e as CustomEvent<{ user: AdminUser | null }>;
      setCurrentUser(custom.detail?.user || null);
    };

    const handleStoreChange = (e: Event) => {
      const custom = e as CustomEvent<{ isOpen: boolean }>;
      if (typeof custom.detail?.isOpen === 'boolean') {
        setStoreStatus(custom.detail.isOpen);
      }
    };

    window.addEventListener('mc:admin-auth', handleAuthChange as EventListener);
    window.addEventListener('mc:store-status', handleStoreChange as EventListener);

    return () => {
      window.removeEventListener('mc:admin-auth', handleAuthChange as EventListener);
      window.removeEventListener('mc:store-status', handleStoreChange as EventListener);
    };
  }, []);

  const triggerSimulatedOrderAlert = () => {
    // Triggers custom event that both AudioAlert and notification system listen to
    window.dispatchEvent(
      new CustomEvent('mc:new-order', {
        detail: {
          id: `MC-${Math.floor(1000 + Math.random() * 9000)}`,
          amount: 58000,
          customer: 'Amina Danjuma',
        },
      })
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-brand-deep via-brand to-orchid p-6 sm:p-8 text-white shadow-xl shadow-brand/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>MiCollections Operations Suite 2.0</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
              Welcome, {currentUser?.name || 'Admin'}
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              Operational control for orders, live inventory, Abuja doorstep courier, and nationwide delivery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={triggerSimulatedOrderAlert}
              className="px-4 py-2.5 rounded-2xl bg-white text-brand font-bold text-xs shadow-lg hover:bg-purple-50 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <BellRing className="w-4 h-4 text-orchid" />
              <span>Simulate Order Chime</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs backdrop-blur-md border border-white/25 transition-all flex items-center gap-1.5"
            >
              <span>Visit Storefront</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Live Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--mute)]">Revenue Today</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
              ₦384,500
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span>+18.4%</span>
              <span className="text-[var(--mute)] font-normal">vs yesterday</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--mute)]">Pending Orders</span>
            <div className="p-2 rounded-xl bg-brand/10 text-brand">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
              12 Orders
            </div>
            <div className="text-[11px] text-brand font-semibold mt-1">
              4 awaiting Abuja dispatch
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--mute)]">Low Stock Alerts</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
              4 Items
            </div>
            <div className="text-[11px] text-amber-600 font-semibold mt-1">
              Sneakers & Abayas below threshold
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--mute)]">Storefront Status</span>
            <div
              className={`p-2 rounded-xl ${
                storeStatus ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
              }`}
            >
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  storeStatus ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                }`}
              />
              <span>{storeStatus ? 'Open 24/7' : 'Paused'}</span>
            </div>
            <div className="text-[11px] text-[var(--mute)] font-medium mt-1">
              Nationwide checkout active
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h3 className="font-display text-lg font-bold mb-4 text-[var(--ink)]">
          Operations Core Modules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/orders"
            className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] hover:border-brand/40 transition-all group shadow-sm flex items-start gap-4"
          >
            <div className="p-3 rounded-2xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-colors">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-bold text-sm text-[var(--ink)] group-hover:text-brand transition-colors">
                Orders & Fulfillment
              </h4>
              <p className="text-xs text-[var(--mute)] mt-1">
                Track Abuja doorsteps, nationwide couriers, and payment verification.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/products"
            className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] hover:border-brand/40 transition-all group shadow-sm flex items-start gap-4"
          >
            <div className="p-3 rounded-2xl bg-orchid/10 text-orchid group-hover:bg-orchid group-hover:text-white transition-colors">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-bold text-sm text-[var(--ink)] group-hover:text-orchid transition-colors">
                Product Catalog
              </h4>
              <p className="text-xs text-[var(--mute)] mt-1">
                Manage varieties, colors, sizes, inventory levels, and pricing.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/customers"
            className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] hover:border-brand/40 transition-all group shadow-sm flex items-start gap-4"
          >
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-bold text-sm text-[var(--ink)] group-hover:text-blue-600 transition-colors">
                Customers & VIPs
              </h4>
              <p className="text-xs text-[var(--mute)] mt-1">
                Review repeat customers, WhatsApp numbers, and delivery addresses.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
