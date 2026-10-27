'use client';

import React, { useId } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  subtitle: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  sparklineData: number[];
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive,
  subtitle,
  icon: Icon,
  sparklineData,
  accentColor = '#7c3aed',
}) => {
  const gradientId = useId();

  // Generate smooth SVG Bezier path for the sparkline
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;

    const width = 120;
    const height = 42;
    const padding = 4;

    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;

    const points = sparklineData.map((val, idx) => {
      const x = padding + (idx / (sparklineData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return { x, y };
    });

    // Catmull-Rom to Cubic Bezier curve algorithm
    let linePath = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) * 0.18;
      const cp1y = p1.y + (p2.y - p0.y) * 0.18;
      const cp2x = p2.x - (p3.x - p1.x) * 0.18;
      const cp2y = p2.y - (p3.y - p1.y) * 0.18;

      linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }

    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const areaPath = `${linePath} L ${lastPoint.x.toFixed(1)},${height} L ${firstPoint.x.toFixed(1)},${height} Z`;

    const strokeColor = isPositive ? accentColor : '#ef4444';

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-24 sm:w-28 h-9 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`sparkGrad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Area fill under curve */}
        <path d={areaPath} fill={`url(#sparkGrad-${gradientId})`} />
        {/* Smooth curve line */}
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Animated pulsating marker at the newest data point */}
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="3"
          fill={strokeColor}
          className="animate-pulse"
        />
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="6"
          fill={strokeColor}
          opacity="0.25"
        />
      </svg>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl p-5 sm:p-6 backdrop-blur-xl bg-[var(--surface)]/80 border border-[var(--line)] shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
      {/* Subtle decorative glowing corner aura */}
      <div
        className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-15 transition-opacity group-hover:opacity-30 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      {/* Top row: Icon container + Trend pill */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm border border-[var(--line)] transition-transform duration-300 group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)`,
            color: accentColor,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Trend Indicator Pill */}
        <div
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-tight shadow-sm ${
            isPositive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
          <span>{change}</span>
        </div>
      </div>

      {/* Metric Title */}
      <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1">
        {title}
      </span>

      {/* Metric Value + Sparkline row */}
      <div className="flex items-end justify-between gap-2 mt-1">
        <div className="min-w-0">
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--ink)] tracking-tight truncate">
            {value}
          </div>
          <span className="block text-[11px] text-[var(--mute)] mt-1 font-medium">
            {subtitle}
          </span>
        </div>

        {/* Sparkline visualization */}
        <div className="flex-shrink-0 mb-0.5">{renderSparkline()}</div>
      </div>
    </div>
  );
};
