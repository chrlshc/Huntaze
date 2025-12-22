'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ShopifyCard } from './ShopifyCard';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  LucideIcon 
} from 'lucide-react';

export interface ShopifyMetricCardProps {
  /** Label describing the metric (e.g., "Total Revenue") */
  label: string;
  /** The main value to display */
  value: string | number;
  /** Optional trend percentage (positive = up, negative = down) */
  trend?: number;
  /** Optional trend label (e.g., "vs last month") */
  trendLabel?: string;
  /** Optional icon to display */
  icon?: LucideIcon;
  /** Icon color (defaults to #6b7177) */
  iconColor?: string;
  /** Icon background color */
  iconBgColor?: string;
  /** Additional class names */
  className?: string;
  /** Loading state */
  loading?: boolean;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * ShopifyMetricCard - A metric display card following Shopify Admin design
 * 
 * Features:
 * - Label: 12-13px, secondary color (#6b7177)
 * - Value: 24-28px, bold, primary color (#1a1a1a)
 * - Optional trend indicator (green for positive, red for negative)
 * - Optional icon with customizable color
 */
export function ShopifyMetricCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
  iconColor = '#6b7177',
  iconBgColor,
  className,
  loading = false,
  'data-testid': testId,
}: ShopifyMetricCardProps) {
  // Determine trend direction and styling
  const getTrendConfig = () => {
    if (trend === undefined || trend === null) return null;
    
    if (trend > 0) {
      return {
        icon: TrendingUp,
        color: 'text-[#008060]', // Shopify green
        bgColor: 'bg-[#f1f8f5]',
        prefix: '+',
      };
    } else if (trend < 0) {
      return {
        icon: TrendingDown,
        color: 'text-[#d72c0d]', // Shopify red
        bgColor: 'bg-[#fef1f1]',
        prefix: '',
      };
    } else {
      return {
        icon: Minus,
        color: 'text-[#6b7177]',
        bgColor: 'bg-[#f6f6f7]',
        prefix: '',
      };
    }
  };

  const trendConfig = getTrendConfig();

  if (loading) {
    return (
      <ShopifyCard className={className} data-testid={testId}>
        <div className="animate-pulse">
          <div className="h-3 bg-[var(--color-border-light)] rounded w-24 mb-3" />
          <div className="h-7 bg-[var(--color-border-light)] rounded w-32 mb-2" />
          <div className="h-4 bg-[var(--color-border-light)] rounded w-20" />
        </div>
      </ShopifyCard>
    );
  }

  return (
    <ShopifyCard className={className} data-testid={testId}>
      <div className={cn('relative', Icon && 'pr-14')}>
        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              'absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl',
              iconBgColor || 'bg-[#f6f6f7]'
            )}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
        )}

        {/* Label - using CSS variable for consistency */}
        <p className="text-[var(--font-size-small)] font-medium text-[var(--color-text-sub)] mb-1 truncate">
          {label}
        </p>

        {/* Value - using CSS variable for consistency */}
        <p className="text-[var(--font-size-h1)] font-bold text-[var(--color-text-heading)] leading-tight mb-1 tabular-nums" style={{ fontSize: '28px' }}>
          {value}
        </p>

        {/* Trend indicator */}
        {trendConfig && trend !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[var(--font-size-small)] font-medium px-1.5 py-0.5 rounded tabular-nums',
                trendConfig.color,
                trendConfig.bgColor
              )}
            >
              <trendConfig.icon className="w-3.5 h-3.5" />
              {trendConfig.prefix}
              {Math.abs(trend)}%
            </span>
            {trendLabel && (
              <span className="text-[var(--font-size-label)] text-[var(--color-text-sub)] ml-1">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </ShopifyCard>
  );
}

/**
 * ShopifyMetricGrid - A responsive grid for metric cards
 * Displays 4 columns on desktop, 2 on tablet, 1 on mobile
 */
export interface ShopifyMetricGridProps {
  children: React.ReactNode;
  className?: string;
  /** Number of columns (default: 4) */
  columns?: 2 | 3 | 4;
}

export function ShopifyMetricGrid({
  children,
  className,
  columns = 4,
}: ShopifyMetricGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn(
      'grid gap-6',
      gridCols[columns],
      className
    )}>
      {children}
    </div>
  );
}

export default ShopifyMetricCard;
