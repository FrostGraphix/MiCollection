'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CustomerProfile, CustomerVIPTier } from '@/types';
import { money } from '@/lib/utils';
import {
  Users,
  Search,
  Crown,
  Award,
  UserCheck,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
  X,
  CreditCard,
  Building,
  RefreshCw,
  Shield,
} from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'all' | CustomerVIPTier>('all');
  const [selectedState, setSelectedState] = useState('all');
  const [activeDossier, setActiveDossier] = useState<CustomerProfile | null>(null);

  // Fetch live aggregated customers from API
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      if (res.ok) {
        const data = await res.json();
        if (data.customers && Array.isArray(data.customers)) {
          setCustomers(data.customers);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch customers from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      // Tier filter
      if (selectedTier !== 'all') {
        if (selectedTier === 'Regular') {
          if (cust.tier !== 'Regular' && cust.tier !== 'Bronze Member') return false;
        } else if (cust.tier !== selectedTier) {
          return false;
        }
      }

      // State filter
      if (selectedState !== 'all' && !cust.state.toLowerCase().includes(selectedState.toLowerCase())) {
        return false;
      }

      // Search keyword
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          cust.name.toLowerCase().includes(q) ||
          cust.phone.toLowerCase().includes(q) ||
          cust.email.toLowerCase().includes(q) ||
          cust.state.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [customers, selectedTier, selectedState, searchQuery]);

  // Aggregate stats
  const totalLTV = useMemo(
    () => customers.reduce((sum, c) => sum + c.lifetimeValue, 0),
    [customers]
  );
  const avgLTV = Math.round(totalLTV / (customers.length || 1));
  const platinumCount = customers.filter((c) => c.tier === 'VIP Platinum').length;
  const goldCount = customers.filter((c) => c.tier === 'Gold Member').length;

  // Render VIP Tier Badge
  const renderTierBadge = (tier: CustomerVIPTier) => {
    switch (tier) {
      case 'VIP Platinum':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-900/60 to-purple-600 text-purple-100 border border-purple-400/40 shadow-sm">
            <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            VIP Platinum
          </span>
        );
      case 'Gold Member':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-400/50">
            <Award className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Gold Member
          </span>
        );
      case 'Silver Member':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300/60">
            <Shield className="w-3.5 h-3.5 text-slate-500 fill-slate-400" />
            Silver Member
          </span>
        );
      case 'Bronze Member':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/10 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-700/30">
            <UserCheck className="w-3 h-3 text-amber-700" />
            Bronze Member
          </span>
        );
      case 'Regular':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300/40">
            <UserCheck className="w-3 h-3 text-gray-500" />
            Regular
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
              Customer CRM Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-bold">
              Domain 4
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--mute)] mt-1">
            Aggregated shopper history, Lifetime Value (LTV), VIP tier progression, and 1-click WhatsApp care.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCustomers}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-purple-500/10 flex items-center gap-2 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Live</span>
          </button>
          <div className="hidden sm:flex text-xs text-[var(--mute)] bg-[var(--surface)] border border-[var(--line)] px-3.5 py-2 rounded-xl items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand" />
            <span>Automatic Tier: <strong>₦250k+ (Platinum)</strong> • <strong>₦100k+ (Gold)</strong> • <strong>₦50k+ (Silver)</strong></span>
          </div>
        </div>
      </div>

      {/* CRM Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Shopper Base</span>
            <Users className="w-4 h-4 text-brand" />
          </div>
          <div className="text-2xl font-bold text-[var(--ink)] font-display">
            {customers.length} <span className="text-xs font-normal text-[var(--mute)]">Profiles</span>
          </div>
          <p className="text-[11px] text-[var(--mute)] mt-1">Direct from store orders</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">VIP Platinum</span>
            <Crown className="w-4 h-4 text-purple-500 fill-purple-500" />
          </div>
          <div className="text-2xl font-bold text-brand font-display">
            {platinumCount} <span className="text-xs font-normal text-[var(--mute)]">Members</span>
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1">Over ₦250,000 spend</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gold Members</span>
            <Award className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-display">
            {goldCount} <span className="text-xs font-normal text-[var(--mute)]">Members</span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Over ₦100,000 spend</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average LTV</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-display">
            {money(avgLTV)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Per unique customer</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-[var(--mute)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, phone, email, state..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink)] placeholder-[var(--mute)] focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink)] focus:outline-none focus:border-brand transition-colors cursor-pointer"
          >
            <option value="all">All VIP Tiers</option>
            <option value="VIP Platinum">VIP Platinum (₦250k+)</option>
            <option value="Gold Member">Gold Member (₦100k+)</option>
            <option value="Silver Member">Silver Member (₦50k+)</option>
            <option value="Regular">Regular / Bronze</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink)] focus:outline-none focus:border-brand transition-colors cursor-pointer"
          >
            <option value="all">All States (Nigeria)</option>
            <option value="abuja">Abuja (FCT)</option>
            <option value="lagos">Lagos</option>
            <option value="rivers">Rivers</option>
            <option value="kano">Kano</option>
            <option value="kaduna">Kaduna</option>
            <option value="oyo">Oyo</option>
          </select>
        </div>
      </div>

      {/* CRM Customer Directory Table */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--surface2)]/60 text-[var(--mute)] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">State & Location</th>
                <th className="py-3.5 px-4 text-center">Orders</th>
                <th className="py-3.5 px-4">Lifetime Value</th>
                <th className="py-3.5 px-4">VIP Tier</th>
                <th className="py-3.5 px-4">Last Order</th>
                <th className="py-3.5 px-4 text-right">Quick Care</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--mute)]">
                    <RefreshCw className="w-6 h-6 text-brand mx-auto mb-2 animate-spin opacity-80" />
                    <p className="font-semibold text-sm text-[var(--ink)]">Loading live CRM data...</p>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--mute)]">
                    <Users className="w-8 h-8 text-brand mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-sm text-[var(--ink)]">No customers found</p>
                    <p className="text-xs mt-1">Try another search or filter.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const initials = cust.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
                  const waPhone = cleanPhone.startsWith('0')
                    ? '234' + cleanPhone.slice(1)
                    : cleanPhone.startsWith('234')
                    ? cleanPhone
                    : '234' + cleanPhone;

                  const careGreeting = `Hello ${cust.name}! Thank you for being a valued customer of MiCollections. How can we assist you today?`;
                  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(careGreeting)}`;

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setActiveDossier(cust)}
                      className="hover:bg-purple-500/5 transition-colors cursor-pointer group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand/20 to-purple-600/30 text-brand border border-purple-500/20 font-bold flex items-center justify-center text-xs shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--ink)] text-sm group-hover:text-brand transition-colors">
                              {cust.name}
                            </div>
                            <div className="text-[11px] text-[var(--mute)]">{cust.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[var(--ink2)]">
                        <a
                          href={`tel:${cust.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-brand flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-brand" />
                          <span>{cust.phone}</span>
                        </a>
                      </td>

                      {/* State & Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-[var(--ink)] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-brand" />
                          <span>{cust.state}</span>
                        </div>
                        {cust.address && (
                          <div className="text-[10px] text-[var(--mute)] truncate max-w-[150px]">
                            {cust.address}
                          </div>
                        )}
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-500/10 text-brand font-bold text-xs">
                          {cust.totalOrders} {cust.totalOrders === 1 ? 'order' : 'orders'}
                        </span>
                      </td>

                      {/* Lifetime Value (LTV) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-sm font-display text-[var(--ink)]">
                          {money(cust.lifetimeValue)}
                        </span>
                      </td>

                      {/* VIP Tier */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderTierBadge(cust.tier)}
                      </td>

                      {/* Last Order Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[var(--mute)]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-brand" />
                          <span>{cust.lastOrderDate}</span>
                        </div>
                      </td>

                      {/* 1-Click WhatsApp Quick Care */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Start WhatsApp Care Conversation"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 active:scale-95"
                        >
                          <MessageSquare className="w-3.5 h-3.5 fill-white" />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--surface2)]/40 flex items-center justify-between text-xs text-[var(--mute)]">
          <span>
            Total CRM Shoppers: <strong>{filteredCustomers.length}</strong>
          </span>
          <span className="font-semibold text-brand">
            Total LTV Tracked: {money(totalLTV)}
          </span>
        </div>
      </div>

      {/* Customer Dossier Drawer/Modal */}
      {activeDossier && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[var(--surface)] text-[var(--ink)] rounded-3xl border border-purple-500/20 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand/20 text-brand border border-purple-500/30 flex items-center justify-center font-bold text-base">
                  {activeDossier.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg font-display text-[var(--ink)]">
                    {activeDossier.name}
                  </h3>
                  <div className="mt-0.5">{renderTierBadge(activeDossier.tier)}</div>
                </div>
              </div>
              <button
                onClick={() => setActiveDossier(null)}
                className="p-2 text-[var(--mute)] hover:text-[var(--ink)] rounded-xl hover:bg-purple-500/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--surface2)]/60 border border-[var(--line)]">
                <div>
                  <span className="text-[var(--mute)] block text-[10px] uppercase font-bold">
                    Lifetime Spend
                  </span>
                  <span className="text-xl font-bold font-display text-brand">
                    {money(activeDossier.lifetimeValue)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--mute)] block text-[10px] uppercase font-bold">
                    Total Purchases
                  </span>
                  <span className="text-xl font-bold font-display text-[var(--ink)]">
                    {activeDossier.totalOrders} Orders
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[var(--mute)] block font-semibold">Phone:</span>
                  <span className="font-bold text-brand">{activeDossier.phone}</span>
                </div>
                <div>
                  <span className="text-[var(--mute)] block font-semibold">Email:</span>
                  <span className="font-medium text-[var(--ink)]">{activeDossier.email}</span>
                </div>
                <div>
                  <span className="text-[var(--mute)] block font-semibold">Delivery Address:</span>
                  <p className="text-[var(--ink)] mt-0.5 font-medium">
                    {activeDossier.address || 'Address provided on checkout'}, {activeDossier.state}
                  </p>
                  {activeDossier.landmark && (
                    <p className="text-brand font-medium mt-0.5">
                      Landmark: {activeDossier.landmark}
                    </p>
                  )}
                </div>
              </div>

              {/* VIP Perks */}
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200">
                <span className="font-bold block text-[11px] uppercase tracking-wider mb-1">
                  VIP Club Entitlements:
                </span>
                <p className="leading-relaxed">
                  {activeDossier.tier === 'VIP Platinum'
                    ? '★ Priority packing & 24hr Abuja express delivery. Eligible for coupon VIPPERK (15% OFF).'
                    : activeDossier.tier === 'Gold Member'
                    ? '★ Complimentary nationwide dispatch on orders over ₦40,000. Priority WhatsApp line.'
                    : activeDossier.tier === 'Silver Member'
                    ? '★ Free standard gift packaging and 5% loyalty discount on select items.'
                    : 'Standard shopper account. ₦' + Math.max(0, 100000 - activeDossier.lifetimeValue).toLocaleString() + ' to unlock Gold Tier.'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--line)] flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveDossier(null)}
                className="px-4 py-2 border border-[var(--line)] rounded-xl text-xs font-semibold text-[var(--ink2)]"
              >
                Close
              </button>
              <a
                href={`https://wa.me/${activeDossier.phone.replace(/^0/, '234').replace(/[^0-9]/g, '')}?text=Hello+${encodeURIComponent(activeDossier.name)}+from+MiCollections`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center gap-2 hover:bg-[#20ba59]"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-white" />
                <span>Open WhatsApp Chat</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
