'use client';

import React, { useState, useId, useRef } from 'react';
import {
  TrendingUp,
  MapPin,
  Truck,
  Sparkles,
  Users,
  Eye,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  PieChart as PieIcon,
  Activity,
  Layers,
} from 'lucide-react';
import { money } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface DailyRevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface CategoryShare {
  name: string;
  share: number;
  revenue: number;
  count: number;
  color: string;
}

export interface StateShare {
  state: string;
  share: number;
  orders: number;
  deliveryMode: string;
}

export interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: string;
  dropOff: string;
  note?: string;
}

// Default 30-Day Revenue Data
export const DEFAULT_30_DAY_REVENUE: DailyRevenuePoint[] = [
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

// Default Category Breakdown
export const DEFAULT_CATEGORY_BREAKDOWN: CategoryShare[] = [
  { name: "Women's Fashion / Abayas", share: 38, revenue: 3211000, count: 94, color: '#7c3aed' },
  { name: 'Unisex Streetwear', share: 24, revenue: 2028000, count: 60, color: '#c026d3' },
  { name: 'Jewellery & Watches', share: 16, revenue: 1352000, count: 40, color: '#06b6d4' },
  { name: 'Kitchen & Home', share: 12, revenue: 1014000, count: 30, color: '#f59e0b' },
  { name: 'Smart Gadgets', share: 10, revenue: 845000, count: 24, color: '#10b981' },
];

// Default Nigeria State Distribution
export const DEFAULT_STATE_DISTRIBUTION: StateShare[] = [
  { state: 'Abuja (FCT)', share: 54, orders: 134, deliveryMode: 'Same-Day Doorstep' },
  { state: 'Lagos', share: 26, orders: 64, deliveryMode: 'Interstate Courier (48h)' },
  { state: 'Port Harcourt', share: 8, orders: 20, deliveryMode: 'Interstate Courier (72h)' },
  { state: 'Kano', share: 5, orders: 12, deliveryMode: 'Interstate Courier (72h)' },
  { state: 'Other States', share: 7, orders: 18, deliveryMode: 'Nationwide Logistics' },
];

// Default Conversion Funnel
export const DEFAULT_CONVERSION_FUNNEL: FunnelStage[] = [
  { stage: 'Store Visitors', count: 18420, conversionRate: '100%', dropOff: '0%', note: 'Online store sessions' },
  { stage: 'Product Views', count: 12890, conversionRate: '70.0%', dropOff: '-30.0%', note: 'Engaged PDP browsers' },
  { stage: 'Add to Cart', count: 3450, conversionRate: '26.8%', dropOff: '-73.2%', note: 'Items added to bag' },
  { stage: 'Checkout Started', count: 1120, conversionRate: '32.5%', dropOff: '-67.5%', note: 'Delivery info provided' },
  { stage: 'Paid / WhatsApp Confirmed', count: 248, conversionRate: '22.1%', dropOff: '-77.9%', note: 'Completed verified orders' },
];

// ============================================================================
// 1. Revenue Growth Area Chart (Pure React + SVG)
// ============================================================================

export interface RevenueGrowthChartProps {
  data?: DailyRevenuePoint[];
  title?: string;
  subtitle?: string;
}

export const RevenueGrowthChart: React.FC<RevenueGrowthChartProps> = ({
  data = DEFAULT_30_DAY_REVENUE,
  title = 'Revenue Velocity & Trajectory',
  subtitle = '30-day cumulative GMV performance across online & WhatsApp sales',
}) => {
  const gradientId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const width = 800;
  const height = 300;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 45;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const revenues = data.map((d) => d.revenue);
  const minVal = 0; // Baseline at 0 for accurate business scale
  const rawMax = Math.max(...revenues, 500000);
  const maxVal = Math.ceil(rawMax / 100000) * 100000;

  // Compute point coordinates
  const points = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * chartW;
    const y = padTop + chartH - (d.revenue / maxVal) * chartH;
    return { x, y, ...d };
  });

  // Smooth Catmull-Rom Bezier Spline
  let splinePath = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * 0.18;
    const cp1y = p1.y + (p2.y - p0.y) * 0.18;
    const cp2x = p2.x - (p3.x - p1.x) * 0.18;
    const cp2y = p2.y - (p3.y - p1.y) * 0.18;

    splinePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const areaPath = `${splinePath} L ${lastPoint.x.toFixed(1)},${padTop + chartH} L ${firstPoint.x.toFixed(1)},${padTop + chartH} Z`;

  // Y-axis grid levels (5 ticks: 0, 25%, 50%, 75%, 100%)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = Math.round(maxVal * ratio);
    const y = padTop + chartH - ratio * chartH;
    return { value, y };
  });

  // Selected or active point
  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];

  // Mouse move handler for interactive tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const scale = width / svgRect.width;
    const svgX = mouseX * scale;

    const clampedX = Math.max(padLeft, Math.min(padLeft + chartW, svgX));
    const ratio = (clampedX - padLeft) / chartW;
    const closestIdx = Math.round(ratio * (data.length - 1));
    setHoverIndex(Math.max(0, Math.min(data.length - 1, closestIdx)));
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const peakDay = points.reduce((prev, curr) => (curr.revenue > prev.revenue ? curr : prev), points[0]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl md:rounded-3xl p-5 sm:p-7 backdrop-blur-xl bg-[var(--surface)]/80 border border-[var(--line)] shadow-xl flex flex-col justify-between"
    >
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-brand/10 text-brand">
              <Activity className="w-4 h-4" />
            </span>
            <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--ink)]">
              {title}
            </h3>
          </div>
          <p className="text-xs text-[var(--mute)] max-w-md">{subtitle}</p>
        </div>

        {/* Quick Highlights Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--mute)]">
              30-Day Volume
            </span>
            <span className="font-display font-extrabold text-sm sm:text-base text-brand">
              {money(totalRevenue)}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-[var(--line)]" />
          <div className="text-right">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--mute)]">
              Peak Day
            </span>
            <span className="font-display font-extrabold text-sm sm:text-base text-emerald-500">
              {money(peakDay.revenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full aspect-[800/300] min-h-[240px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Rich purple/orchid area gradient */}
            <linearGradient id={`revGrad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#c026d3" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
            </linearGradient>

            {/* Stroke gradient */}
            <linearGradient id={`strokeGrad-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#c026d3" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            {/* Filter glow for active marker */}
            <filter id={`glow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#c026d3" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Horizontal Grid lines & Y-axis labels */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={padLeft + chartW}
                y2={tick.y}
                stroke="currentColor"
                className="text-[var(--line)]"
                strokeDasharray={idx === 0 ? 'none' : '4 4'}
                strokeWidth={idx === 0 ? '1.5' : '1'}
              />
              <text
                x={padLeft - 10}
                y={tick.y + 4}
                textAnchor="end"
                className="fill-[var(--mute)] text-[10px] font-medium"
              >
                {tick.value === 0 ? '₦0' : `₦${(tick.value / 1000).toFixed(0)}k`}
              </text>
            </g>
          ))}

          {/* X-axis labels (render every 5 days for clarity) */}
          {points.map((pt, idx) => {
            if (idx % 5 === 0 || idx === points.length - 1) {
              return (
                <text
                  key={idx}
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  className="fill-[var(--mute)] text-[10px] font-medium"
                >
                  {pt.date}
                </text>
              );
            }
            return null;
          })}

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#revGrad-${gradientId})`} />

          {/* Spline Curve Stroke */}
          <path
            d={splinePath}
            fill="none"
            stroke={`url(#strokeGrad-${gradientId})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Vertical Guide Line on Hover */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padTop}
              x2={activePoint.x}
              y2={padTop + chartH}
              stroke="#c026d3"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.8"
            />
          )}

          {/* Active Highlight Marker */}
          {activePoint && (
            <g>
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="7"
                fill="#ffffff"
                stroke="#c026d3"
                strokeWidth="3.5"
                filter={`url(#glow-${gradientId})`}
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="14"
                fill="#c026d3"
                opacity="0.2"
                className="animate-ping"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip HTML Overlay */}
        {activePoint && (
          <div
            className="absolute pointer-events-none transition-transform duration-75 ease-out z-20"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${(activePoint.y / height) * 100}%`,
              transform: `translate(${activePoint.x > width * 0.75 ? '-105%' : activePoint.x < width * 0.25 ? '5%' : '-50%'}, -120%)`,
            }}
          >
            <div className="backdrop-blur-md bg-[var(--surface)]/95 border border-brand/30 shadow-2xl rounded-xl p-2.5 min-w-[140px] text-left">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-semibold text-[var(--mute)]">
                  {activePoint.date}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand/10 text-brand font-bold">
                  {activePoint.orders} orders
                </span>
              </div>
              <div className="font-display font-black text-base text-[var(--ink)]">
                {money(activePoint.revenue)}
              </div>
              <div className="text-[9px] text-[var(--mute)] mt-0.5">
                Avg: {money(Math.round(activePoint.revenue / (activePoint.orders || 1)))}/order
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Indicator */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[var(--mute)] pt-3 border-t border-[var(--line)] mt-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand" />
            <span>Store Online (Card/Transfer)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orchid" />
            <span>WhatsApp Direct Sales</span>
          </div>
        </div>
        <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" /> +18.4% monthly expansion
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// 2. Category Sales Donut (Pure React + SVG)
// ============================================================================

export interface CategorySalesDonutProps {
  categories?: CategoryShare[];
  title?: string;
  subtitle?: string;
}

export const CategorySalesDonut: React.FC<CategorySalesDonutProps> = ({
  categories = DEFAULT_CATEGORY_BREAKDOWN,
  title = 'Category Revenue Share',
  subtitle = 'Sales distribution across MiCollections curated lines',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const radius = 70;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius; // ~439.82

  const totalRevenue = categories.reduce((acc, cat) => acc + cat.revenue, 0);

  // Calculate cumulative offsets for SVG stroke-dashoffset
  let cumulativeShare = 0;
  const arcs = categories.map((cat, idx) => {
    const strokeLength = (cat.share / 100) * circumference;
    const offset = (cumulativeShare / 100) * circumference;
    cumulativeShare += cat.share;
    return {
      ...cat,
      strokeLength,
      offset,
      idx,
    };
  });

  const activeCategory = hoveredIdx !== null ? categories[hoveredIdx] : null;

  return (
    <div className="rounded-2xl md:rounded-3xl p-5 sm:p-7 backdrop-blur-xl bg-[var(--surface)]/80 border border-[var(--line)] shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-orchid/10 text-orchid">
              <PieIcon className="w-4 h-4" />
            </span>
            <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--ink)]">
              {title}
            </h3>
          </div>
          <p className="text-xs text-[var(--mute)]">{subtitle}</p>
        </div>
      </div>

      {/* Donut Graphic + Center readout */}
      <div className="relative flex items-center justify-center my-4">
        <svg
          viewBox="0 0 200 200"
          className="w-48 sm:w-56 h-48 sm:h-56 transform -rotate-90 overflow-visible"
        >
          {/* Subtle background track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-[var(--line)] opacity-40"
            strokeWidth={strokeWidth - 4}
          />

          {/* Category Arcs */}
          {arcs.map((arc) => {
            const isHovered = hoveredIdx === arc.idx;
            return (
              <circle
                key={arc.idx}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${arc.strokeLength} ${circumference - arc.strokeLength}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer origin-center"
                style={{
                  filter: isHovered ? `drop-shadow(0 0 8px ${arc.color}80)` : 'none',
                }}
                onMouseEnter={() => setHoveredIdx(arc.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Donut Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
          {activeCategory ? (
            <div className="animate-in fade-in zoom-in-95 duration-150">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--mute)] truncate max-w-[110px]">
                {activeCategory.name.split('/')[0]}
              </span>
              <span className="block font-display font-black text-lg sm:text-xl text-[var(--ink)]">
                {activeCategory.share}%
              </span>
              <span className="block text-[11px] font-bold text-brand">
                {money(activeCategory.revenue)}
              </span>
            </div>
          ) : (
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--mute)]">
                Total GMV
              </span>
              <span className="block font-display font-black text-lg sm:text-xl text-[var(--ink)]">
                {money(totalRevenue)}
              </span>
              <span className="block text-[10px] text-[var(--mute)]">
                5 Product Lines
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown List */}
      <div className="flex flex-col gap-2 pt-3 border-t border-[var(--line)]">
        {categories.map((cat, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between text-xs p-1.5 rounded-xl cursor-pointer transition-all duration-200 ${
                isHovered
                  ? 'bg-brand/10 translate-x-1 shadow-sm'
                  : 'hover:bg-[var(--surface2)]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-200"
                  style={{
                    backgroundColor: cat.color,
                    transform: isHovered ? 'scale(1.4)' : 'scale(1)',
                  }}
                />
                <span className="text-[var(--ink)] font-medium truncate">
                  {cat.name}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-semibold text-[var(--mute)]">
                  {money(cat.revenue)}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: `${cat.color}1a`,
                    color: cat.color,
                  }}
                >
                  {cat.share}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 3. Nigeria State Distribution (Pure React + SVG / CSS Bars)
// ============================================================================

export interface NigeriaStateDistributionProps {
  distribution?: StateShare[];
  title?: string;
  subtitle?: string;
}

export const NigeriaStateDistribution: React.FC<NigeriaStateDistributionProps> = ({
  distribution = DEFAULT_STATE_DISTRIBUTION,
  title = 'Fulfillment by Nigerian State',
  subtitle = 'Order logistics share: Doorstep Abuja deliveries vs Interstate courier',
}) => {
  return (
    <div className="rounded-2xl md:rounded-3xl p-5 sm:p-7 backdrop-blur-xl bg-[var(--surface)]/80 border border-[var(--line)] shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <MapPin className="w-4 h-4" />
            </span>
            <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--ink)]">
              {title}
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand/10 text-brand border border-brand/20">
            <Truck className="w-3 h-3" /> 24-48h Delivery SLA
          </span>
        </div>
        <p className="text-xs text-[var(--mute)] mb-6">{subtitle}</p>
      </div>

      {/* State Progress Bars */}
      <div className="flex flex-col gap-4">
        {distribution.map((item, idx) => {
          const isTop = idx === 0;
          return (
            <div key={idx} className="group">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--ink)]">{item.state}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      isTop
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20'
                        : 'bg-[var(--surface2)] text-[var(--mute)]'
                    }`}
                  >
                    {item.deliveryMode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--mute)] font-medium">
                    {item.orders} orders
                  </span>
                  <span className="font-display font-extrabold text-[var(--ink)] w-9 text-right">
                    {item.share}%
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full h-3 rounded-full bg-[var(--surface2)] overflow-hidden p-0.5 border border-[var(--line)]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isTop
                      ? 'bg-gradient-to-r from-brand via-orchid to-emerald-400 shadow-sm'
                      : 'bg-gradient-to-r from-brand/70 to-orchid/70'
                  }`}
                  style={{ width: `${item.share}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Executive Callout */}
      <div className="mt-6 p-3.5 rounded-2xl bg-gradient-to-r from-brand/10 via-orchid/5 to-transparent border border-brand/15 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--ink2)] leading-relaxed">
          <strong className="text-brand font-semibold">Hub Advantage: </strong>
          Abuja (54%) & Lagos (26%) represent 80% of total revenue. Doorstep bike couriers in FCT maintain an average 3.2-hour same-day fulfillment SLA.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// 4. Conversion Funnel Chart (Pure React + SVG / HTML)
// ============================================================================

export interface ConversionFunnelChartProps {
  stages?: FunnelStage[];
  title?: string;
  subtitle?: string;
}

export const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({
  stages = DEFAULT_CONVERSION_FUNNEL,
  title = 'E-Commerce Conversion Funnel',
  subtitle = 'Progression through store discovery, cart building, and order fulfillment',
}) => {
  const stageIcons = [Users, Eye, ShoppingCart, CreditCard, CheckCircle2];
  const maxCount = stages[0]?.count || 1;

  return (
    <div className="rounded-2xl md:rounded-3xl p-5 sm:p-7 backdrop-blur-xl bg-[var(--surface)]/80 border border-[var(--line)] shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--ink)]">
              {title}
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            1.35% Overall CR
          </span>
        </div>
        <p className="text-xs text-[var(--mute)] mb-6">{subtitle}</p>
      </div>

      {/* Stage by stage funnel bars */}
      <div className="flex flex-col gap-3">
        {stages.map((stage, idx) => {
          const Icon = stageIcons[idx % stageIcons.length];
          const relativeWidth = Math.max(18, (stage.count / maxCount) * 100);
          const isFinal = idx === stages.length - 1;

          return (
            <div key={idx} className="relative">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <Icon className="w-3.5 h-3.5 text-[var(--mute)]" />
                  <span className="font-semibold text-[var(--ink)]">
                    {stage.stage}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-[var(--ink)]">
                    {stage.count.toLocaleString()}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      idx === 0
                        ? 'bg-[var(--surface2)] text-[var(--mute)]'
                        : isFinal
                        ? 'bg-emerald-500/15 text-emerald-500 font-extrabold'
                        : 'bg-brand/10 text-brand'
                    }`}
                  >
                    {stage.conversionRate}
                  </span>
                </div>
              </div>

              {/* Funnel Bar Container */}
              <div className="w-full h-4 rounded-xl bg-[var(--surface2)] p-0.5 overflow-hidden border border-[var(--line)]">
                <div
                  className={`h-full rounded-lg transition-all duration-700 ease-out ${
                    isFinal
                      ? 'bg-gradient-to-r from-brand via-orchid to-emerald-400'
                      : 'bg-gradient-to-r from-brand to-orchid'
                  }`}
                  style={{ width: `${relativeWidth}%` }}
                />
              </div>

              {/* Sub-note / drop-off indicator */}
              <div className="flex items-center justify-between text-[10px] text-[var(--mute)] mt-0.5 px-1">
                <span>{stage.note}</span>
                {idx > 0 && (
                  <span className="text-rose-500/80 font-medium">
                    {stage.dropOff} drop-off
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* WhatsApp Multiplier Note */}
      <div className="mt-5 pt-3 border-t border-[var(--line)] flex items-center justify-between text-xs">
        <span className="text-[var(--mute)]">WhatsApp Assisted Checkout:</span>
        <span className="font-semibold text-wa flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-wa animate-pulse" />
          +38% higher completion rate
        </span>
      </div>
    </div>
  );
};
