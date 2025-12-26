'use client';

/**
 * Revenue Detail Page - Drill-down from main analytics
 * 
 * Shows detailed revenue breakdown with trends, comparisons, and insights.
 * Stripe/Shopify level polish with drill-down everywhere.
 */

import { useState } from 'react';
import useSWR from 'swr';
import { AnalyticsCard } from '../components/AnalyticsCard';
import { AnalyticsToolbar } from '../components/AnalyticsToolbar';
import { ShopifyCard } from '@/components/ui/shopify/ShopifyCard';
import { ShopifyEmptyState } from '@/components/ui/shopify/ShopifyEmptyState';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/dashboard/formatters';
import { fetchFinanceData, getErrorMessage } from '@/lib/dashboard/api';
import type { DateRange } from '@/lib/dashboard/types';
import { AlertTriangle, DollarSign } from 'lucide-react';

export default function RevenueDetailPage() {
  const [dateRange, setDateRange] = useState<DateRange>({ type: 'preset', preset: '30d' });

  const { data, error, isLoading, mutate } = useSWR(
    ['finance-detail', dateRange],
    () => fetchFinanceData(dateRange),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AnalyticsToolbar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          lastSyncAt={new Date().toISOString()}
          onExport={() => {}}
        />
        <div className="px-6 py-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[120px] bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AnalyticsToolbar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          lastSyncAt={new Date().toISOString()}
          onExport={() => {}}
        />
        <div className="px-6 py-6">
          <ShopifyCard>
            <ShopifyEmptyState
              icon={AlertTriangle}
              title="Data temporarily unavailable"
              description={getErrorMessage(error)}
              action={{ label: 'Retry', onClick: () => void mutate() }}
            />
          </ShopifyCard>
        </div>
      </div>
    );
  }

  const breakdown = data?.breakdown ?? null;
  const hasRevenue =
    breakdown &&
    (breakdown.total > 0 ||
      breakdown.subscriptions > 0 ||
      breakdown.ppv > 0 ||
      breakdown.tips > 0 ||
      breakdown.customs > 0);

  if (!data || !breakdown || !hasRevenue) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AnalyticsToolbar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          lastSyncAt={new Date().toISOString()}
          onExport={() => {}}
        />
        <div className="px-6 py-6">
          <ShopifyCard>
            <ShopifyEmptyState
              icon={DollarSign}
              title="No revenue data available"
              description="Try selecting a different date range."
              action={{ label: 'Retry', onClick: () => void mutate() }}
            />
          </ShopifyCard>
        </div>
      </div>
    );
  }
  const categories = [
    { key: 'subscriptions', label: 'Subscriptions', value: breakdown.subscriptions },
    { key: 'ppv', label: 'PPV', value: breakdown.ppv },
    { key: 'tips', label: 'Tips', value: breakdown.tips },
    { key: 'customs', label: 'Customs', value: breakdown.customs },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AnalyticsToolbar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        lastSyncAt={new Date().toISOString()}
        onExport={() => {}}
      />

      <div className="px-6 py-6 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Revenue Breakdown</h1>
        <p className="text-sm text-gray-600 mt-1">Detailed revenue analysis by source</p>
      </div>

      <div className="px-6 py-6">
        <div className="space-y-6">
          {/* Total Revenue Card */}
          <AnalyticsCard
            title="Total Revenue"
            subtitle="All revenue sources combined"
          >
            <div className="text-center py-8">
              <div className="text-5xl font-bold text-gray-900 tabular-nums">
                {formatCurrency(breakdown.total)}
              </div>
              <p className="text-sm text-gray-600 mt-2">Current period</p>
            </div>
          </AnalyticsCard>

          {/* Revenue by Source - Detailed */}
          <AnalyticsCard
            title="Revenue by Source"
            subtitle="Breakdown with percentages and trends"
          >
            <div className="space-y-4">
              {categories.map((category) => {
                const percentage = breakdown.total > 0 ? (category.value / breakdown.total) * 100 : 0;
                
                return (
                  <div key={category.key} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base font-semibold text-gray-900">{category.label}</h4>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 tabular-nums">
                          {formatCurrency(category.value)}
                        </div>
                        <div className="text-sm text-gray-600 tabular-nums">
                          {formatPercentage(percentage)} of total
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </AnalyticsCard>

          {/* Insights */}
          <AnalyticsCard
            title="Revenue Insights"
            subtitle="Key observations and recommendations"
          >
            <div className="space-y-3">
              {categories
                .sort((a, b) => b.value - a.value)
                .slice(0, 2)
                .map((category, index) => {
                  const percentage = breakdown.total > 0 ? (category.value / breakdown.total) * 100 : 0;
                  
                  return (
                    <div key={category.key} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{index === 0 ? '🏆' : '⭐'}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {category.label} {index === 0 ? 'is your top revenue source' : 'is performing well'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Contributing {formatPercentage(percentage)} of total revenue ({formatCurrency(category.value)})
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </AnalyticsCard>
        </div>
      </div>
    </div>
  );
}
