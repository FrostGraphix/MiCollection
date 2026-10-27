import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // Default executive metrics for MiCollections
    let grossRevenue = 8450000;
    let netRevenue = 8120000;
    let totalOrders = 248;
    let aov = Math.round(grossRevenue / totalOrders); // ₦34,072 ~ ₦34,070
    let pendingDispatches = 4;
    let todayOrdersCount = 14;

    // Check if live Supabase orders exist to aggregate real values
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const { data: dbOrders, error } = await supabase
          .from('orders')
          .select('id, total, order_status, payment_status, created_at');

        if (!error && dbOrders && dbOrders.length > 0) {
          const liveTotalRevenue = dbOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
          if (liveTotalRevenue > 0) {
            grossRevenue = liveTotalRevenue;
            totalOrders = dbOrders.length;
            aov = Math.round(grossRevenue / totalOrders);
            pendingDispatches = dbOrders.filter((o) => o.order_status === 'received' || o.order_status === 'confirmed').length;
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            todayOrdersCount = dbOrders.filter((o) => new Date(o.created_at) >= startOfToday).length;
          }
        }
      } catch (err) {
        console.warn('Could not query Supabase analytics:', err);
      }
    }

    // 30-Day Daily Revenue Series
    const revenueGrowth = [
      { date: 'Sep 28', revenue: 165000, orders: 5 },
      { date: 'Sep 29', revenue: 195000, orders: 6 },
      { date: 'Sep 30', revenue: 210000, orders: 7 },
      { date: 'Oct 01', revenue: 235000, orders: 7 },
      { date: 'Oct 02', revenue: 280000, orders: 8 },
      { date: 'Oct 03', revenue: 310000, orders: 9 },
      { date: 'Oct 04', revenue: 275000, orders: 8 },
      { date: 'Oct 05', revenue: 245000, orders: 7 },
      { date: 'Oct 06', revenue: 290000, orders: 9 },
      { date: 'Oct 07', revenue: 320000, orders: 10 },
      { date: 'Oct 08', revenue: 305000, orders: 9 },
      { date: 'Oct 09', revenue: 340000, orders: 10 },
      { date: 'Oct 10', revenue: 385000, orders: 11 },
      { date: 'Oct 11', revenue: 360000, orders: 10 },
      { date: 'Oct 12', revenue: 315000, orders: 9 },
      { date: 'Oct 13', revenue: 295000, orders: 8 },
      { date: 'Oct 14', revenue: 330000, orders: 10 },
      { date: 'Oct 15', revenue: 355000, orders: 11 },
      { date: 'Oct 16', revenue: 390000, orders: 12 },
      { date: 'Oct 17', revenue: 410000, orders: 12 },
      { date: 'Oct 18', revenue: 375000, orders: 11 },
      { date: 'Oct 19', revenue: 325000, orders: 9 },
      { date: 'Oct 20', revenue: 365000, orders: 11 },
      { date: 'Oct 21', revenue: 395000, orders: 12 },
      { date: 'Oct 22', revenue: 420000, orders: 13 },
      { date: 'Oct 23', revenue: 440000, orders: 13 },
      { date: 'Oct 24', revenue: 485000, orders: 14 },
      { date: 'Oct 25', revenue: 460000, orders: 13 },
      { date: 'Oct 26', revenue: 430000, orders: 12 },
      { date: 'Oct 27', revenue: 495000, orders: 15 },
    ];

    // Category Breakdown Metrics
    const categoryBreakdown = [
      { name: "Women's Fashion / Abayas", share: 38, revenue: 3211000, count: 94, color: '#7c3aed' },
      { name: 'Unisex Streetwear', share: 24, revenue: 2028000, count: 60, color: '#c026d3' },
      { name: 'Jewellery & Watches', share: 16, revenue: 1352000, count: 40, color: '#06b6d4' },
      { name: 'Kitchen & Home', share: 12, revenue: 1014000, count: 30, color: '#f59e0b' },
      { name: 'Smart Gadgets', share: 10, revenue: 845000, count: 24, color: '#10b981' },
    ];

    // Nigerian State Distribution Metrics
    const stateDistribution = [
      { state: 'Abuja (FCT)', share: 54, orders: 134, deliveryMode: 'Same-Day Doorstep' },
      { state: 'Lagos', share: 26, orders: 64, deliveryMode: 'Interstate Courier (48h)' },
      { state: 'Port Harcourt', share: 8, orders: 20, deliveryMode: 'Interstate Courier (72h)' },
      { state: 'Kano', share: 5, orders: 12, deliveryMode: 'Interstate Courier (72h)' },
      { state: 'Other States', share: 7, orders: 18, deliveryMode: 'Nationwide Logistics' },
    ];

    // Stage-by-Stage Conversion Funnel
    const conversionFunnel = [
      { stage: 'Store Visitors', count: 18420, conversionRate: '100%', dropOff: '0%', note: 'Online store sessions' },
      { stage: 'Product Views', count: 12890, conversionRate: '70.0%', dropOff: '-30.0%', note: 'Engaged PDP browsers' },
      { stage: 'Add to Cart', count: 3450, conversionRate: '26.8%', dropOff: '-73.2%', note: 'Items added to bag' },
      { stage: 'Checkout Started', count: 1120, conversionRate: '32.5%', dropOff: '-67.5%', note: 'Delivery info provided' },
      { stage: 'Paid / WhatsApp Confirmed', count: 248, conversionRate: '22.1%', dropOff: '-77.9%', note: 'Completed verified orders' },
    ];

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      kpis: {
        grossRevenue: {
          value: grossRevenue,
          formatted: '₦' + Math.round(grossRevenue).toLocaleString('en-NG'),
          change: '+18.4%',
          isPositive: true,
          subtitle: 'vs last week',
        },
        totalOrders: {
          value: totalOrders,
          formatted: totalOrders.toString(),
          change: '+12.5%',
          isPositive: true,
          subtitle: 'vs last week',
        },
        averageOrderValue: {
          value: aov,
          formatted: '₦' + Math.round(aov).toLocaleString('en-NG'),
          change: '+5.2%',
          isPositive: true,
          subtitle: 'vs last week',
        },
        fulfillmentRate: {
          value: '98.4%',
          formatted: '98.4%',
          change: '+1.1%',
          isPositive: true,
          subtitle: 'target: 95%',
        },
        netRevenue,
        todayOrders: todayOrdersCount,
        pendingDispatches,
      },
      revenueGrowth,
      categoryBreakdown,
      stateDistribution,
      conversionFunnel,
    });
  } catch (error: any) {
    console.error('Analytics API Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
