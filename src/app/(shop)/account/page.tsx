'use client';

import React, { useEffect, useState } from 'react';
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
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { OrderRecord } from '@/types';
import { money, waLink } from '@/lib/utils';
import { ProductArt } from '@/components/shop/ProductArt';

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, signOut, isLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchUserOrders() {
      try {
        const res = await fetch(`/api/orders?userId=${user?.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.warn('Could not fetch user orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    }

    fetchUserOrders();
  }, [user]);

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
            {profile?.state && (
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-brand flex-shrink-0" />
                <span>{profile.state}</span>
              </div>
            )}
          </div>

          <div className="pt-2">
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
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-brand" /> Order History
            </h2>
            <span className="text-xs text-[var(--mute)]">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
            </span>
          </div>

          {loadingOrders ? (
            <div className="p-8 text-center text-xs text-[var(--mute)]">
              Loading orders...
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--line)] text-xs">
                    <div>
                      <span className="font-mono font-bold text-sm text-brand mr-3">
                        {ord.id}
                      </span>
                      <span className="text-[var(--mute)]">
                        {ord.createdAt
                          ? new Date(ord.createdAt).toLocaleDateString()
                          : 'Recent'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {ord.orderStatus || 'Received'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-[var(--surface2)] text-[var(--mute)]">
                        {ord.paymentMethod}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2">
                    {ord.items?.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--surface2)] flex-shrink-0">
                          <ProductArt type={it.art} color={it.color} view={0} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block font-medium truncate">{it.name}</span>
                          <span className="text-[11px] text-[var(--mute)]">
                            {it.qty} x {money(it.price)} &bull; {it.opt}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary & WhatsApp Button */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[var(--line)]">
                    <div>
                      <span className="text-xs text-[var(--mute)] block">Total Paid</span>
                      <span className="font-display font-bold text-lg">
                        {money(ord.total)}
                      </span>
                    </div>

                    <a
                      href={waLink(
                        ord.wa ||
                          `Hello MiCollections, I would like to check on my order ${ord.id}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-wa text-xs py-2 px-4"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Track on WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl border-2 border-dashed border-[var(--line)] space-y-3">
              <Clock className="w-8 h-8 text-[var(--mute)] mx-auto opacity-50" />
              <h3 className="font-display text-lg font-bold">No orders placed yet</h3>
              <p className="text-xs text-[var(--mute)] max-w-xs mx-auto">
                Once you place an order, you can review its status and track delivery here.
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
    </div>
  );
}
