'use client';

import { formatCurrency, formatPercentage } from '@/lib/dashboard/formatters';
import { AnalyticsCard } from './AnalyticsCard';
import { ShopifyEmptyState } from '@/components/ui/shopify/ShopifyEmptyState';
import { DollarSign } from 'lucide-react';

interface RevenueBreakdownData {
  subscriptions: number;
  ppv: number;
  tips: number;
  customs: number;
  total: number;
}

interface RevenueBreakdownProps {
  breakdown: RevenueBreakdownData;
  isLoading?: boolean;
}

const REVENUE_CATEGORIES = [
  { key: 'subscriptions', label: 'Subscriptions', color: 'bg-gray-600' },
  { key: 'ppv', label: 'PPV', color: 'bg-gray-500' },
  { key: 'tips', label: 'Tips', color: 'bg-gray-400' },
  { key: 'customs', label: 'Customs', color: 'bg-gray-300' },
] as const;

export function RevenueBreakdown({ breakdown, isLoading }: RevenueBreakdownProps) {
  if (isLoading) {
    return (
      <AnalyticsCard
        title="Revenue Breakdown"
        subtitle="Distribution across revenue sources"
        tooltip="See how your revenue is distributed across different monetization channels"
        drillDownUrl="/analytics/revenue/breakdown"
        drillDownLabel="View detailed breakdown"
      >
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </AnalyticsCard>
    );
  }

  if (!breakdown) {
    return (
      <AnalyticsCard
        title="Revenue Breakdown"
        subtitle="Distribution across revenue sources"
        tooltip="See how your revenue is distributed across different monetization channels"
        drillDownUrl="/analytics/revenue/breakdown"
        drillDownLabel="View detailed breakdown"
      >
        <ShopifyEmptyState
          icon={DollarSign}
          title="No revenue data available"
          variant="compact"
        />
      </AnalyticsCard>
    );
  }

  return (
    <AnalyticsCard
      title="Revenue Breakdown"
      subtitle="Distribution across revenue sources"
      tooltip="See how your revenue is distributed across different monetization channels"
      drillDownUrl="/analytics/revenue/breakdown"
      drillDownLabel="View detailed breakdown"
    >
      <div className="space-y-0">
        {/* Revenue items - Shopify list style */}
        {REVENUE_CATEGORIES.map((category, index) => {
          const value = breakdown[category.key as keyof RevenueBreakdownData];
          const percentage = breakdown.total > 0 ? (value / breakdown.total) * 100 : 0;

          return (
            <div
              key={category.key}
              className={`flex items-center justify-between py-3 ${
                index < REVENUE_CATEGORIES.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              {/* Label with color dot */}
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${category.color}`} />
                <span className="text-sm font-medium text-gray-700">{category.label}</span>
              </div>

              {/* Amount + Percentage - right aligned with tabular nums */}
              <div className="flex items-center gap-6">
                <span className="text-lg font-semibold text-gray-900 tabular-nums">
                  {formatCurrency(value)}
                </span>
                <span className="text-sm text-gray-500 w-12 text-right tabular-nums">
                  {formatPercentage(percentage)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Total row - emphasized */}
        <div className="flex items-center justify-between py-3 border-t-2 border-gray-200 mt-4">
          <span className="text-sm font-semibold text-gray-900">Total Revenue</span>
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold text-gray-900 tabular-nums">
              {formatCurrency(breakdown.total)}
            </span>
            <span className="text-sm font-semibold text-gray-900 w-12 text-right">100%</span>
          </div>
        </div>
      </div>
    </AnalyticsCard>
  );
}
