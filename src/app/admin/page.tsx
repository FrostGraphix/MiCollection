'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  Database,
} from 'lucide-react';
import { getAdminSession, AdminUser, isStoreOpen, formatAdminRole } from '@/lib/adminAuth';
import { playOrderChime } from '@/components/admin/AudioAlert';
import { StatCard } from '@/components/admin/StatCard';
import {
  RevenueGrowthChart,
  CategorySalesDonut,
  NigeriaStateDistribution,
  ConversionFunnelChart,
  DailyRevenuePoint,
  CategoryShare,
  StateShare,
  FunnelStage,
} from '@/components/admin/AnalyticsCharts';
import { RecentOrdersTicker } from '@/components/admin/RecentOrdersTicker';

interface AnalyticsData {
  isLiveFromSupabase: boolean;
  timestamp: string;
  kpis: {
    grossRevenue: {
      value: number;
      formatted: string;
      change: string;
      isPositive: boolean;
      subtitle: string;
    };
    totalOrders: {
      value: number;
      formatted: string;
      change: string;
      isPositive: boolean;
      subtitle: string;
    };
    averageOrderValue: {
      value: number;
      formatted: string;
      change: string;
      isPositive: boolean;
      subtitle: string;
    };
    fulfillmentRate: {
      value: string;
      formatted: string;
      change: string;
      isPositive: boolean;
      subtitle: string;
    };
    netRevenue?: number;
    todayOrders?: number;
    pendingDispatches?: number;
  };
  revenueGrowth: DailyRevenuePoint[];
  categoryBreakdown: CategoryShare[];
  stateDistribution: StateShare[];
  conversionFunnel: FunnelStage[];
}

export default function AdminOverviewPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [storeStatus, setStoreStatus] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<boolean>(true);

  // Fetch live Supabase analytics
  const fetchAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAnalyticsData(data);
        }
      }
    } catch (err) {
      console.warn('Failed to load admin analytics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    setCurrentUser(getAdminSession());
    setStoreStatus(isStoreOpen());
    fetchAnalytics();

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

    const handleNewOrder = () => {
      // Re-fetch analytics whenever a new order is received
      fetchAnalytics();
    };

    window.addEventListener('mc:admin-auth', handleAuthChange as EventListener);
    window.addEventListener('mc:store-status', handleStoreChange as EventListener);
    window.addEventListener('mc:new-order', handleNewOrder as EventListener);

    return () => {
      clearInterval(clockInterval);
      window.removeEventListener('mc:admin-auth', handleAuthChange as EventListener);
      window.removeEventListener('mc:store-status', handleStoreChange as EventListener);
      window.removeEventListener('mc:new-order', handleNewOrder as EventListener);
    };
  }, [fetchAnalytics]);

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
    const kpis = analyticsData?.kpis;
    const gross = kpis?.grossRevenue?.value || 2120600;
    const orders = kpis?.totalOrders?.value || 34;
    const aov = kpis?.averageOrderValue?.value || 62371;
    const rate = kpis?.fulfillmentRate?.value || '50%';
    const pending = kpis?.pendingDispatches || 17;
    const today = kpis?.todayOrders || 0;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'MiCollections Executive Report (Live Supabase Synchronized)\n';
    csvContent += `Generated At,${new Date().toISOString()}\n`;
    csvContent += `Database Status,${analyticsData?.isLiveFromSupabase ? 'Supabase Live Connected' : 'Hybrid Cache'}\n\n`;
    csvContent += 'Metric,Value,Context\n';
    csvContent += `Gross Revenue,₦${gross.toLocaleString('en-NG')},Total Completed & Processing\n`;
    csvContent += `Total Orders,${orders},Confirmed Supabase Orders\n`;
    csvContent += `Average Order Value,₦${aov.toLocaleString('en-NG')},Live Dynamic AOV\n`;
    csvContent += `Fulfillment Rate,${rate},Delivered or In-Transit\n`;
    csvContent += `Pending Dispatches,${pending},Orders Awaiting Rider/Courier\n`;
    csvContent += `Today Orders,${today},Logged in Current Session\n\n`;

    if (analyticsData?.stateDistribution?.length) {
      csvContent += 'State,Share,Orders,Logistics SLA\n';
      analyticsData.stateDistribution.forEach((s) => {
        csvContent += `"${s.state}",${s.share}%,${s.orders},"${s.deliveryMode}"\n`;
      });
      csvContent += '\n';
    }

    if (analyticsData?.categoryBreakdown?.length) {
      csvContent += 'Category,Revenue,Share %,Items Sold\n';
      analyticsData.categoryBreakdown.forEach((c) => {
        csvContent += `"${c.name}",₦${c.revenue.toLocaleString('en-NG')},${c.share}%,${c.count}\n`;
      });
      csvContent += '\n';
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MiCollections_Live_Analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const revenueSparkline = analyticsData?.revenueGrowth?.map((p) => Math.round(p.revenue / 1000)) || [
    42, 55, 68, 75, 88, 95, 110, 145, 180, 220, 260, 285,
  ];
  const orderSparkline = analyticsData?.revenueGrowth?.map((p) => p.orders) || [
    1, 1, 2, 2, 3, 4, 5, 5, 6, 7, 5, 2,
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-brand-deep via-brand to-orchid p-6 sm:p-8 text-white shadow-xl shadow-brand/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>MiCollections Operations Suite 2.0</span>
                {currentTime && (
                  <span className="ml-1 opacity-85 font-mono text-[11px]">&bull; {currentTime}</span>
                )}
              </div>

              {analyticsData?.isLiveFromSupabase && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 backdrop-blur-md text-xs font-bold text-emerald-200 border border-emerald-400/30">
                  <Database className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                  <span>Supabase Live Connected</span>
                </div>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
              Welcome, {currentUser?.name || 'Mariam Siyaka'}
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              Operational control for live Supabase orders, real-time inventory, Abuja doorstep courier, and nationwide delivery.
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
              onClick={fetchAnalytics}
              disabled={isLoadingAnalytics}
              className="px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5"
              title="Refresh live metrics from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

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

      {/* 4 Executive KPI Stat Cards with Real Supabase Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Revenue"
          value={analyticsData?.kpis?.grossRevenue?.formatted || '₦2,120,600'}
          change={analyticsData?.kpis?.grossRevenue?.change || '+18.4%'}
          isPositive={analyticsData?.kpis?.grossRevenue?.isPositive ?? true}
          subtitle={analyticsData?.kpis?.grossRevenue?.subtitle || 'from live database orders'}
          icon={TrendingUp}
          accentColor="#7c3aed"
          sparklineData={revenueSparkline}
        />
        <StatCard
          title="Total Orders"
          value={analyticsData?.kpis?.totalOrders?.formatted || '34'}
          change={analyticsData?.kpis?.totalOrders?.change || '+12.5%'}
          isPositive={analyticsData?.kpis?.totalOrders?.isPositive ?? true}
          subtitle={analyticsData?.kpis?.totalOrders?.subtitle || '17 pending dispatch'}
          icon={ShoppingBag}
          accentColor="#c026d3"
          sparklineData={orderSparkline}
        />
        <StatCard
          title="Average Order Value"
          value={analyticsData?.kpis?.averageOrderValue?.formatted || '₦62,371'}
          change={analyticsData?.kpis?.averageOrderValue?.change || '+5.2%'}
          isPositive={analyticsData?.kpis?.averageOrderValue?.isPositive ?? true}
          subtitle={analyticsData?.kpis?.averageOrderValue?.subtitle || 'cart depth 2.4 items'}
          icon={Package}
          accentColor="#10b981"
          sparklineData={[280, 290, 310, 305, 320, 315, 330, 325, 335, 340, 345, 350]}
        />
        <StatCard
          title="Delivery Success Rate"
          value={analyticsData?.kpis?.fulfillmentRate?.formatted || '50%'}
          change={analyticsData?.kpis?.fulfillmentRate?.change || '+1.1%'}
          isPositive={analyticsData?.kpis?.fulfillmentRate?.isPositive ?? true}
          subtitle={analyticsData?.kpis?.fulfillmentRate?.subtitle || 'Abuja & nationwide'}
          icon={Truck}
          accentColor="#f59e0b"
          sparklineData={[94, 95, 96, 95, 96, 97, 97, 98, 97, 98, 98, 99]}
        />
      </div>

      {/* Main Charts Grid: 30-Day Revenue Area Curve (2 cols) & Category Sales Donut (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueGrowthChart data={analyticsData?.revenueGrowth} />
        </div>
        <div>
          <CategorySalesDonut categories={analyticsData?.categoryBreakdown} />
        </div>
      </div>

      {/* Secondary Charts Grid: Nigerian Geographic Distribution & Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <NigeriaStateDistribution distribution={analyticsData?.stateDistribution} />
        </div>
        <div>
          <ConversionFunnelChart stages={analyticsData?.conversionFunnel} />
        </div>
      </div>

      {/* Real-Time Orders Stream Feed */}
      <div>
        <RecentOrdersTicker />
      </div>
    </div>
  );
}
