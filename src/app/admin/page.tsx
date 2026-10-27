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
  Download,
  Plus,
  Clock,
  Zap,
} from 'lucide-react';
import { getAdminSession, AdminUser, isStoreOpen, formatAdminRole } from '@/lib/adminAuth';
import { playOrderChime } from '@/components/admin/AudioAlert';
import { StatCard } from '@/components/admin/StatCard';
import {
  RevenueGrowthChart,
  CategorySalesDonut,
  NigeriaStateDistribution,
  ConversionFunnelChart,
} from '@/components/admin/AnalyticsCharts';
import { RecentOrdersTicker } from '@/components/admin/RecentOrdersTicker';

export default function AdminOverviewPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [storeStatus, setStoreStatus] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  useEffect(() => {
    setCurrentUser(getAdminSession());
    setStoreStatus(isStoreOpen());

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'Africa/Lagos',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WAT'
      );
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

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
      clearInterval(clockInterval);
      window.removeEventListener('mc:admin-auth', handleAuthChange as EventListener);
      window.removeEventListener('mc:store-status', handleStoreChange as EventListener);
    };
  }, []);

  const triggerSimulatedOrderAlert = () => {
    setIsSimulating(true);
    playOrderChime(true);

    const randomId = `MC-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomAmount = Math.floor(35000 + Math.random() * 65000);

    window.dispatchEvent(
      new CustomEvent('mc:new-order', {
        detail: {
          id: randomId,
          amount: randomAmount,
          customer: 'Amina Danjuma',
          city: 'Maitama, Abuja',
        },
      })
    );

    setTimeout(() => {
      setIsSimulating(false);
    }, 1200);
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value,Period\n' +
      'Gross Revenue,8450000,Last 30 Days\n' +
      'Total Orders,248,Last 30 Days\n' +
      'Average Order Value,34070,Last 30 Days\n' +
      'Delivery Success Rate,98.4%,Last 30 Days\n' +
      'Abuja Share,54%,All Time\n' +
      'Lagos Share,26%,All Time\n' +
      'Other States Share,20%,All Time\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MiCollections_Analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              {currentTime && (
                <span className="ml-1 opacity-85 font-mono text-[11px]">&bull; {currentTime}</span>
              )}
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
              Welcome, {currentUser?.name || 'Mariam Siyaka'}
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              Operational control for orders, live inventory, Abuja doorstep courier, and nationwide delivery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/products/new"
              className="px-4 py-2.5 rounded-2xl bg-white text-brand font-bold text-xs shadow-lg hover:bg-purple-50 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 text-orchid" />
              <span>Add Product</span>
            </Link>

            <button
              type="button"
              onClick={triggerSimulatedOrderAlert}
              disabled={isSimulating}
              className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs backdrop-blur-md border border-white/25 transition-all flex items-center gap-2"
            >
              <BellRing className={`w-4 h-4 ${isSimulating ? 'animate-spin text-yellow-300' : ''}`} />
              <span>Simulate Order Chime</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-md border border-white/15 transition-all flex items-center gap-1.5"
              title="Export executive metrics CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-md border border-white/15 transition-all flex items-center gap-1.5"
            >
              <span>Storefront</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* 4 Executive KPI Stat Cards with Catmull-Rom SVG Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Revenue"
          value="₦8,450,000"
          change="+18.4%"
          isPositive={true}
          subtitle="vs last month"
          icon={TrendingUp}
          accentColor="#7c3aed"
          sparklineData={[420, 480, 510, 490, 620, 680, 740, 810, 890, 940, 1020, 1150]}
        />
        <StatCard
          title="Total Orders"
          value="248"
          change="+12.5%"
          isPositive={true}
          subtitle="32 active this week"
          icon={ShoppingBag}
          accentColor="#c026d3"
          sparklineData={[18, 22, 25, 20, 28, 30, 32, 35, 40, 38, 44, 48]}
        />
        <StatCard
          title="Average Order Value"
          value="₦34,070"
          change="+5.2%"
          isPositive={true}
          subtitle="cart depth 2.4 items"
          icon={Package}
          accentColor="#10b981"
          sparklineData={[280, 290, 310, 305, 320, 315, 330, 325, 335, 340, 345, 350]}
        />
        <StatCard
          title="Delivery Success Rate"
          value="98.4%"
          change="+1.1%"
          isPositive={true}
          subtitle="Abuja & nationwide"
          icon={Truck}
          accentColor="#f59e0b"
          sparklineData={[94, 95, 96, 95, 96, 97, 97, 98, 97, 98, 98, 99]}
        />
      </div>

      {/* Main Charts Grid: 30-Day Revenue Area Curve (2 cols) & Category Sales Donut (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueGrowthChart />
        </div>
        <div>
          <CategorySalesDonut />
        </div>
      </div>

      {/* Secondary Charts Grid: Nigerian Geographic Distribution & Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <NigeriaStateDistribution />
        </div>
        <div>
          <ConversionFunnelChart />
        </div>
      </div>

      {/* Real-Time Orders Stream Feed */}
      <div>
        <RecentOrdersTicker />
      </div>
    </div>
  );
}
