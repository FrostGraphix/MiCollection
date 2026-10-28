'use client';

import React, { useState, useMemo } from 'react';
import { DiscountCoupon } from '@/types';
import { INITIAL_COUPONS } from '@/lib/mockOrders';
import { money } from '@/lib/utils';
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  TrendingUp,
  Percent,
  Sparkles,
  Calendar,
  Layers,
  Copy,
  AlertCircle,
  X,
  Clock,
} from 'lucide-react';
import { useModal } from '@/context/ModalContext';

export default function AdminDiscountsPage() {
  const { confirm } = useModal();
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(INITIAL_COUPONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Drawer / Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
  const [newValue, setNewValue] = useState<number>(10);
  const [newMinSpend, setNewMinSpend] = useState<number>(0);
  const [newExpiry, setNewExpiry] = useState('');
  const [newUsageLimit, setNewUsageLimit] = useState<number>(100);
  const [newDescription, setNewDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Copy code helper
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Toggle active status
  const toggleActive = (id: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  // Delete coupon
  const handleDelete = async (id: string, code: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Promo Code',
      message: (
        <span>
          Are you sure you want to delete promo code <strong className="text-[var(--ink)]">&ldquo;{code}&rdquo;</strong>? Active customers will no longer be able to use it.
        </span>
      ),
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      danger: true,
      variant: 'error',
    });

    if (isConfirmed) {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Create new coupon
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      setFormError('Please enter a coupon code.');
      return;
    }
    const cleanCode = newCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    // Check duplicate
    if (coupons.some((c) => c.code === cleanCode)) {
      setFormError(`Coupon with code '${cleanCode}' already exists.`);
      return;
    }

    if (newValue <= 0) {
      setFormError('Discount value must be greater than zero.');
      return;
    }

    const created: DiscountCoupon = {
      id: `coup-${Date.now().toString(36)}`,
      code: cleanCode,
      type: newType,
      value: Number(newValue),
      minSpend: Number(newMinSpend) || 0,
      expiryDate: newExpiry || '2027-12-31',
      usageLimit: Number(newUsageLimit) || undefined,
      usageCount: 0,
      revenueDriven: 0,
      isActive: true,
      description: newDescription || `${cleanCode} promotional offer`,
      createdAt: new Date().toISOString(),
    };

    setCoupons([created, ...coupons]);
    setIsCreateOpen(false);
    // Reset form
    setNewCode('');
    setNewType('percentage');
    setNewValue(10);
    setNewMinSpend(0);
    setNewExpiry('');
    setNewUsageLimit(100);
    setNewDescription('');
    setFormError('');
  };

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    if (!searchQuery.trim()) return coupons;
    const q = searchQuery.toLowerCase().trim();
    return coupons.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [coupons, searchQuery]);

  // Aggregate metrics
  const activeCount = useMemo(() => coupons.filter((c) => c.isActive).length, [coupons]);
  const totalRevenue = useMemo(
    () => coupons.reduce((sum, c) => sum + c.revenueDriven, 0),
    [coupons]
  );
  const totalUses = useMemo(
    () => coupons.reduce((sum, c) => sum + c.usageCount, 0),
    [coupons]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[var(--ink)]">
              Promo Codes & Discounts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-bold">
              Domain 4
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--mute)] mt-1">
            Manage flash sales, campaign discounts, and VIP promo incentives for MiCollections.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setIsCreateOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-brand hover:bg-brand-deep text-white flex items-center gap-2 transition-all shadow-md shadow-purple-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Promo Code</span>
        </button>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Codes</span>
            <Tag className="w-4 h-4 text-brand" />
          </div>
          <div className="text-2xl font-bold text-[var(--ink)] font-display">
            {activeCount} <span className="text-xs font-normal text-[var(--mute)]">/ {coupons.length}</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Ready at checkout</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Redemptions</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-brand font-display">
            {totalUses} <span className="text-xs font-normal text-[var(--mute)]">uses</span>
          </div>
          <p className="text-[11px] text-[var(--mute)] mt-1">Across all campaigns</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Revenue Driven</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-display">
            {money(totalRevenue)}
          </div>
          <p className="text-[11px] text-[var(--mute)] mt-1">From promo orders</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Top Code</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-brand font-mono font-display">
            WELCOME10
          </div>
          <p className="text-[11px] text-[var(--mute)] mt-1">48 redemptions</p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--mute)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search promo code or campaign note..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink)] placeholder-[var(--mute)] focus:outline-none focus:border-brand transition-colors"
          />
        </div>
        <div className="text-xs text-[var(--mute)] flex items-center gap-2 self-end sm:self-auto">
          <span>Total: <strong>{filteredCoupons.length}</strong> promo codes</span>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--surface2)]/60 text-[var(--mute)] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Discount Value</th>
                <th className="py-3.5 px-4">Min. Spend</th>
                <th className="py-3.5 px-4">Redemptions</th>
                <th className="py-3.5 px-4">Driven Revenue</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--mute)]">
                    <AlertCircle className="w-8 h-8 text-brand mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-sm text-[var(--ink)]">No promo codes found</p>
                    <p className="text-xs mt-1">Try another search term or create a new code.</p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const percentageUsed = coupon.usageLimit
                    ? Math.round((coupon.usageCount / coupon.usageLimit) * 100)
                    : 0;

                  return (
                    <tr key={coupon.id} className="hover:bg-purple-500/5 transition-colors">
                      {/* Code Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-brand px-2.5 py-1 rounded-lg bg-brand/10 border border-brand/20">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopy(coupon.code)}
                            title="Copy Code"
                            className="text-[var(--mute)] hover:text-brand transition-colors p-1"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {coupon.description && (
                          <div className="text-[11px] text-[var(--mute)] mt-1 max-w-[200px] truncate" title={coupon.description}>
                            {coupon.description}
                          </div>
                        )}
                      </td>

                      {/* Value & Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-[var(--ink)]">
                        {coupon.type === 'percentage' ? (
                          <span className="text-purple-600 dark:text-purple-300 font-display text-sm">
                            {coupon.value}% OFF
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-display text-sm">
                            {money(coupon.value)} OFF
                          </span>
                        )}
                      </td>

                      {/* Min Spend */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[var(--ink2)] font-medium">
                        {coupon.minSpend && coupon.minSpend > 0 ? money(coupon.minSpend) : 'No Minimum'}
                      </td>

                      {/* Redemptions */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--ink)]">{coupon.usageCount}</span>
                          <span className="text-[var(--mute)]">
                            / {coupon.usageLimit ? coupon.usageLimit : '∞'}
                          </span>
                        </div>
                        {coupon.usageLimit && (
                          <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-brand rounded-full transition-all"
                              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Revenue Driven */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[var(--ink)] font-display text-sm">
                        {money(coupon.revenueDriven)}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[var(--mute)]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand" />
                          <span>{coupon.expiryDate || 'No Expiry'}</span>
                        </div>
                      </td>

                      {/* Active Toggle Switch */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleActive(coupon.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                            coupon.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-300/40'
                          }`}
                        >
                          {coupon.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-gray-400" /> Inactive
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDelete(coupon.id, coupon.code)}
                          title="Delete Coupon"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Drawer / Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[var(--surface)] text-[var(--ink)] rounded-3xl border border-purple-500/20 shadow-2xl p-6 sm:p-7 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
              <div>
                <h3 className="text-xl font-bold font-display tracking-tight text-[var(--ink)]">
                  Create Promo Coupon
                </h3>
                <p className="text-xs text-[var(--mute)] mt-0.5">
                  Launch a new discount code for your store shoppers.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 text-[var(--mute)] hover:text-[var(--ink)] rounded-xl hover:bg-purple-500/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="mt-5 space-y-4 text-xs">
              {/* Code */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--mute)] mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH20, ABUJA5K, WELCOME10"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] font-mono font-bold text-sm tracking-wide focus:outline-none focus:border-brand"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--mute)] mb-1">
                    Discount Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] font-medium focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₦)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--mute)] mb-1">
                    Value {newType === 'percentage' ? '(%)' : '(₦)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    placeholder={newType === 'percentage' ? '20' : '5000'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] font-bold focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Min spend & Usage limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--mute)] mb-1">
                    Min. Order Spend (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newMinSpend}
                    onChange={(e) => setNewMinSpend(Number(e.target.value))}
                    placeholder="0 for no minimum"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] font-medium focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--mute)] mb-1">
                    Usage Limit (Times)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newUsageLimit}
                    onChange={(e) => setNewUsageLimit(Number(e.target.value))}
                    placeholder="100"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] font-medium focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--mute)] mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] font-medium focus:outline-none focus:border-brand cursor-pointer"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--mute)] mb-1">
                  Internal Campaign Note
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Abuja weekend campaign promo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] font-medium focus:outline-none focus:border-brand"
                />
              </div>

              <div className="pt-3 border-t border-[var(--line)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--line)] text-[var(--mute)] hover:text-[var(--ink)] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-deep text-white text-xs font-bold transition-all shadow-md shadow-purple-500/20"
                >
                  Publish Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
