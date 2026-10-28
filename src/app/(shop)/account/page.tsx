'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Package,
  LogOut,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  MessageSquare,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Edit3,
  Save,
  X,
  Home,
  Crown,
  KeyRound,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { OrderRecord } from '@/types';
import { money, waLink } from '@/lib/utils';
import { ProductImage } from '@/components/shop/ProductImage';
import { STATES } from '@/lib/products';

function getOrderStatusBadge(status?: string) {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return {
        label: 'Confirmed',
        classes: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30',
        icon: <CheckCircle2 className="w-3 h-3 text-blue-500" />,
      };
    case 'shipped':
    case 'dispatched':
      return {
        label: status === 'shipped' ? 'Shipped' : 'Dispatched',
        classes: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30',
        icon: <Truck className="w-3 h-3 text-purple-500" />,
      };
    case 'delivered':
      return {
        label: 'Delivered',
        classes: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
        icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        classes: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30',
        icon: <XCircle className="w-3 h-3 text-rose-500" />,
      };
    case 'received':
    default:
      return {
        label: 'Order Received',
        classes: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30',
        icon: <Clock className="w-3 h-3 text-amber-500" />,
      };
  }
}

function getPaymentStatusBadge(status?: string, method?: string) {
  const methodLabel =
    method === 'link' ? 'Card / USSD' : method === 'pod' ? 'Pay on Delivery' : 'Bank Transfer';

  switch (status?.toLowerCase()) {
    case 'paid':
      return {
        label: 'Paid',
        methodLabel,
        classes: 'bg-emerald-50 text-emerald-700 border border-emerald-300/40',
      };
    case 'failed':
      return {
        label: 'Payment Failed',
        methodLabel,
        classes: 'bg-rose-50 text-rose-700 border border-rose-300/40',
      };
    case 'pending':
    default:
      return {
        label: method === 'pod' ? 'Pay on Delivery' : 'Pending Payment',
        methodLabel,
        classes: 'bg-amber-50 text-amber-700 border border-amber-300/40',
      };
  }
}

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, stats, signOut, isLoading, updateProfile, updatePassword } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    state: 'Abuja (FCT)',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Change Password State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [passwordFeedback, setPasswordFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchUserOrders = useCallback(async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const url = `/api/orders?userId=${encodeURIComponent(user.id)}${
        user.email ? `&email=${encodeURIComponent(user.email)}` : ''
      }`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.warn('Could not fetch user orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);

  const handleOpenEdit = () => {
    setEditForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      state: profile?.state || 'Abuja (FCT)',
    });
    setProfileFeedback(null);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileFeedback(null);
    try {
      const res = await updateProfile({
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
        state: editForm.state,
      });
      if (res.error) {
        setProfileFeedback({ message: res.error, isError: true });
      } else {
        setProfileFeedback({ message: 'Profile updated in Supabase successfully!', isError: false });
        setTimeout(() => {
          setIsEditingProfile(false);
          setProfileFeedback(null);
        }, 1200);
      }
    } catch (err: any) {
      setProfileFeedback({ message: err.message || 'Failed to update profile', isError: true });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.password.length < 6) {
      setPasswordFeedback({ message: 'Password must be at least 6 characters long.', isError: true });
      return;
    }
    if (passwordForm.password !== passwordForm.confirm) {
      setPasswordFeedback({ message: 'Passwords do not match.', isError: true });
      return;
    }

    setIsSavingPassword(true);
    setPasswordFeedback(null);
    try {
      const res = await updatePassword(passwordForm.password);
      if (!res.success) {
        setPasswordFeedback({ message: res.error || 'Failed to update password', isError: true });
      } else {
        setPasswordFeedback({ message: 'Password updated securely in Supabase!', isError: false });
        setTimeout(() => {
          setIsChangingPassword(false);
          setPasswordFeedback(null);
          setPasswordForm({ password: '', confirm: '' });
        }, 1200);
      }
    } catch (err: any) {
      setPasswordFeedback({ message: err.message || 'Failed to update password', isError: true });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (isLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center text-sm text-[var(--mute)]">
        Loading account...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--mute)] mb-4">
        <Link href="/" className="hover:text-brand transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--ink)] font-semibold">Account</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-[var(--line)]">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
            My <em className="serif-italic">Account</em>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--mute)] mt-1">
            Logged in as {user.email}
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="btn-ghost text-xs py-2.5 px-4 w-fit inline-flex items-center gap-2 text-red-500 hover:border-red-500 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Profile Card */}
        <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center font-bold text-lg shadow">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div>
                <strong className="block font-display text-lg font-bold">
                  {profile?.full_name || 'Customer'}
                </strong>
                <small className="text-xs text-[var(--mute)]">MiCollections Member</small>
              </div>
            </div>

            <button
              onClick={handleOpenEdit}
              className="btn-ghost text-xs py-1.5 px-3 inline-flex items-center gap-1.5 text-brand border border-brand/20 hover:bg-brand/10"
              title="Edit Profile"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-[var(--ink2)] border-t border-[var(--line)] pt-4">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-brand flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand flex-shrink-0" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile?.address && (
              <div className="flex items-start gap-2.5">
                <Home className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
                <span>{profile.address}</span>
              </div>
            )}
            {profile?.state && (
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-brand flex-shrink-0" />
                <span>{profile.state}</span>
              </div>
            )}
          </div>

          {/* VIP Member Badge & Spend Stats */}
          {stats && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-brand/10 via-purple-500/5 to-transparent border border-brand/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" /> {stats.tier}
                </span>
                <span className="text-[11px] text-[var(--mute)]">
                  {stats.totalOrders} {stats.totalOrders === 1 ? 'order' : 'orders'}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-[var(--mute)]">Lifetime Value:</span>
                <span className="font-mono font-bold text-[var(--ink)]">{money(stats.lifetimeValue)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-[var(--line)]">
            <button
              onClick={() => {
                setPasswordForm({ password: '', confirm: '' });
                setPasswordFeedback(null);
                setIsChangingPassword(true);
              }}
              className="btn-ghost text-xs py-2.5 px-3 w-full justify-center inline-flex items-center gap-2 text-[var(--ink2)] border border-[var(--line)] hover:border-brand/30"
            >
              <KeyRound className="w-3.5 h-3.5 text-brand" /> Change Password
            </button>

            <Link
              href="/shop"
              className="btn-primary text-xs py-3 w-full justify-center"
            >
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-brand" /> Order History
              </h2>
              <p className="text-xs text-[var(--mute)] mt-0.5">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
              </p>
            </div>

            <button
              onClick={() => fetchUserOrders()}
              disabled={loadingOrders}
              className="btn-ghost text-xs py-1.5 px-3 inline-flex items-center gap-1.5 text-[var(--mute)] hover:text-brand"
              title="Refresh order history"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {loadingOrders ? (
            <div className="p-12 text-center text-xs text-[var(--mute)] space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-brand mx-auto opacity-70" />
              <p>Fetching your orders...</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((ord) => {
                const orderBadge = getOrderStatusBadge(ord.orderStatus);
                const paymentBadge = getPaymentStatusBadge(ord.paymentStatus, ord.paymentMethod);

                // Re-order WhatsApp text
                const reorderLines = (ord.items || [])
                  .map((it) => `- ${it.qty} x ${it.name} (${it.opt || 'Default'})`)
                  .join('\n');
                const reorderText = `Hello MiCollections, I would like to re-order the items from my previous order #${ord.id}:\n${reorderLines}\nTotal: ${money(ord.total)}. Please help me place this re-order.`;

                return (
                  <div
                    key={ord.id}
                    className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-4 hover:border-brand/30 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--line)] text-xs">
                      <div>
                        <span className="font-mono font-bold text-sm text-brand mr-3">
                          {ord.id}
                        </span>
                        <span className="text-[var(--mute)]">
                          {ord.createdAt
                            ? new Date(ord.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Recent'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Order Status Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${orderBadge.classes}`}
                        >
                          {orderBadge.icon}
                          {orderBadge.label}
                        </span>

                        {/* Payment Status Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-semibold ${paymentBadge.classes}`}
                        >
                          {paymentBadge.label}
                        </span>

                        {/* Payment Method Badge */}
                        <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-[var(--surface2)] text-[var(--mute)]">
                          {paymentBadge.methodLabel}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2.5">
                      {ord.items?.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-xs">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--surface2)] flex-shrink-0 relative border border-[var(--line)]">
                            <ProductImage
                              src={it.image}
                              alt={it.name}
                              fallbackArt={{ type: it.art, color: it.color, view: 0 }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block font-medium truncate text-sm text-[var(--ink)]">
                              {it.name}
                            </span>
                            <span className="text-xs text-[var(--mute)]">
                              {it.qty} x {money(it.price)} {it.opt ? `• ${it.opt}` : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--line)]">
                      <div>
                        <span className="text-[11px] text-[var(--mute)] block">Order Total</span>
                        <span className="font-display font-bold text-lg text-brand">
                          {money(ord.total)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* WhatsApp Re-order Link */}
                        <a
                          href={waLink(reorderText)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-wa text-xs py-2 px-3.5 inline-flex items-center gap-1.5 font-semibold"
                          title="Re-order items from this order via WhatsApp"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Re-order on WhatsApp
                        </a>

                        {/* WhatsApp Tracking Link */}
                        <a
                          href={waLink(
                            ord.wa ||
                              `Hello MiCollections, I would like to check on my order ${ord.id}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost text-xs py-2 px-3 inline-flex items-center gap-1.5 text-[var(--ink2)] hover:text-brand"
                          title="Track delivery status on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-brand" /> Track
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl border-2 border-dashed border-[var(--line)] space-y-3">
              <Clock className="w-8 h-8 text-[var(--mute)] mx-auto opacity-50" />
              <h3 className="font-display text-lg font-bold">No orders placed yet</h3>
              <p className="text-xs text-[var(--mute)] max-w-xs mx-auto">
                Once you place an order, you can review its status and re-order items with one click here.
              </p>
              <div className="pt-2">
                <Link href="/shop" className="btn-primary text-xs py-2.5 px-6 inline-flex">
                  Explore Products
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-[32px] bg-[var(--surface)] border border-[var(--line)] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand" /> Edit Profile
              </h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface2)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {profileFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium text-center ${
                  profileFeedback.isError
                    ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                }`}
              >
                {profileFeedback.message}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="e.g. Maryam Bello"
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--surface2)] border border-transparent text-xs sm:text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">WhatsApp Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g. 0814 573 6483"
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--surface2)] border border-transparent text-xs sm:text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Delivery Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="e.g. Plot 104, Diplomatic Zone, Maitama"
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--surface2)] border border-transparent text-xs sm:text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">State</label>
                <select
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--surface2)] border border-transparent text-xs sm:text-sm outline-none focus:border-brand cursor-pointer"
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="btn-ghost text-xs py-2.5 flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="btn-primary text-xs py-2.5 flex-1 justify-center disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-[32px] bg-[var(--surface)] border border-[var(--line)] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand" /> Account Security
              </h3>
              <button
                onClick={() => setIsChangingPassword(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface2)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium text-center ${
                  passwordFeedback.isError
                    ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                }`}
              >
                {passwordFeedback.message}
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--surface2)] border border-transparent text-xs sm:text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  placeholder="Re-enter new password"
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--surface2)] border border-transparent text-xs sm:text-sm outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="btn-ghost text-xs py-2.5 flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="btn-primary text-xs py-2.5 flex-1 justify-center disabled:opacity-50"
                >
                  {isSavingPassword ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
