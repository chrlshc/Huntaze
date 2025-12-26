'use client';

/**
 * Dashboard Finance Page
 * 
 * Page Finance avec breakdown revenus, whale detector et métriques IA.
 * 
 * Requirements: 6.1, 7.1, 8.1, 13.1, 2.2
 * Feature: creator-analytics-dashboard
 */

import { useState } from 'react';
import useSWR from 'swr';
import { PageLayout } from '@/components/ui/PageLayout';
import { ShopifyCard } from '@/components/ui/shopify/ShopifyCard';
import { ShopifyEmptyState } from '@/components/ui/shopify/ShopifyEmptyState';
import { DateRangeSelector } from '../components/DateRangeSelector';
import { RevenueBreakdown } from '../components/RevenueBreakdown';
import { AIMetricsCard } from '../components/AIMetricsCard';
import { ExportButton, useExportPeriod } from '../components/ExportButton';
import { fetchFinanceData, getErrorMessage } from '@/lib/dashboard/api';
import { formatCurrency } from '@/lib/dashboard/formatters';
import { IndexTable, Column } from '@/components/ui/IndexTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { AlertTriangle, Users, Wallet } from 'lucide-react';
import type { DateRange } from '@/lib/dashboard/types';

interface Whale {
  fanId: string;
  name: string;
  totalSpent: number;
  lastPurchaseAt: string;
  isOnline: boolean;
  aiPriority: 'normal' | 'high';
}

type WhaleRow = Whale & Record<string, unknown>;

export default function FinancePage() {
  // State
  const [dateRange, setDateRange] = useState<DateRange>({ type: 'preset', preset: '30d' });
  
  // Whale table state
  const [whaleSortBy, setWhaleSortBy] = useState<'totalSpent' | 'lastPurchase' | 'name'>('totalSpent');
  const [whaleSortOrder, setWhaleSortOrder] = useState<'asc' | 'desc'>('desc');

  // Export period formatting
  const exportPeriod = useExportPeriod(
    dateRange.type === 'custom' ? new Date(dateRange.from) : undefined,
    dateRange.type === 'custom' ? new Date(dateRange.to) : undefined
  );

  // Fetch data with SWR (Requirement 2.2)
  const { data, error, isLoading, mutate } = useSWR(
    ['finance', dateRange],
    () => fetchFinanceData(dateRange),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  // Handle whale targeting
  const handleWhaleTarget = (fanId: string) => {
    // TODO: API call to set AI priority to HIGH
    void fanId;
  };

  const handleWhaleUndoTarget = (fanId: string) => {
    // TODO: API call to revert AI priority
    void fanId;
  };

  // Handle whale table sort
  const handleWhaleSortChange = (column: 'totalSpent' | 'lastPurchase' | 'name') => {
    if (whaleSortBy === column) {
      // Toggle order if same column
      setWhaleSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to desc
      setWhaleSortBy(column);
      setWhaleSortOrder('desc');
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <PageLayout
        title="Finance"
        subtitle="ANALYTICS"
        actions={<DateRangeSelector value={dateRange} onChange={setDateRange} />}
      >
        <div className="space-y-6">
          {/* Top Row Skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <div className="h-[500px] bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div className="lg:col-span-5">
              <div className="h-[500px] bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Whale Table Skeleton */}
          <div className="h-[600px] bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </PageLayout>
    );
  }

  // Error state (Requirement 12.4)
  if (error) {
    return (
      <PageLayout
        title="Finance"
        subtitle="ANALYTICS"
        actions={<DateRangeSelector value={dateRange} onChange={setDateRange} />}
      >
        <div className="flex items-center justify-center h-[400px]">
          <ShopifyCard className="w-full max-w-2xl">
            <ShopifyEmptyState
              icon={AlertTriangle}
              title="Data temporarily unavailable"
              description={getErrorMessage(error)}
              action={{ label: 'Retry', onClick: () => void mutate() }}
            />
          </ShopifyCard>
        </div>
      </PageLayout>
    );
  }

  const breakdown = data?.breakdown ?? null;
  const whales = data?.whales ?? [];
  const aiMetrics = data?.aiMetrics ?? null;
  const hasFinanceData =
    Boolean(breakdown) && (breakdown.total > 0 || whales.length > 0);

  // Empty state
  if (!data || !breakdown || !hasFinanceData) {
    return (
      <PageLayout
        title="Finance"
        subtitle="ANALYTICS"
        actions={<DateRangeSelector value={dateRange} onChange={setDateRange} />}
      >
        <div className="flex items-center justify-center h-[400px]">
          <ShopifyCard className="w-full max-w-2xl">
            <ShopifyEmptyState
              icon={Wallet}
              title="No data for selected period"
              description="Try selecting a different date range"
              action={{ label: 'Retry', onClick: () => void mutate() }}
            />
          </ShopifyCard>
        </div>
      </PageLayout>
    );
  }

  // Prepare export data for breakdown
  const breakdownExportData = [
    { category: 'Subscriptions', amount: breakdown.subscriptions, percentage: (breakdown.subscriptions / breakdown.total) * 100 },
    { category: 'PPV', amount: breakdown.ppv, percentage: (breakdown.ppv / breakdown.total) * 100 },
    { category: 'Tips', amount: breakdown.tips, percentage: (breakdown.tips / breakdown.total) * 100 },
    { category: 'Customs', amount: breakdown.customs, percentage: (breakdown.customs / breakdown.total) * 100 },
    { category: 'Total', amount: breakdown.total, percentage: 100 },
  ];

  // Prepare export data for whales
  const whalesExportData = whales.map(whale => ({
    fanId: whale.fanId,
    name: whale.name,
    totalSpent: whale.totalSpent,
    lastPurchaseAt: whale.lastPurchaseAt,
    isOnline: whale.isOnline ? 'Yes' : 'No',
    aiPriority: whale.aiPriority,
  }));

  // Format relative date
  const formatRelativeDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Define columns for IndexTable
  const columns: Column<WhaleRow>[] = [
    {
      key: 'name',
      header: 'Fan',
      width: '200px',
      render: (_, row, index) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold">
              {(row.name as string).charAt(0).toUpperCase()}
            </div>
            {row.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{row.name as string}</p>
            <p className="truncate text-xs text-gray-500">#{(index ?? 0) + 1} Top Spender</p>
          </div>
        </div>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Total Spent',
      width: '140px',
      numeric: true,
      truncate: false,
      render: (value) => (
        <span className="text-lg font-semibold text-gray-900 tabular-nums">
          {formatCurrency(value as number)}
        </span>
      ),
    },
    {
      key: 'lastPurchaseAt',
      header: 'Last Purchase',
      width: '140px',
      truncate: false,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {formatRelativeDate(value as string)}
        </span>
      ),
    },
    {
      key: 'isOnline',
      header: 'Status',
      width: '180px',
      align: 'center',
      truncate: false,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-2">
          {row.isOnline && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Online
            </span>
          )}
          {row.aiPriority === 'high' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
              🎯 Priority
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'fanId',
      header: 'Action',
      width: '140px',
      align: 'right',
      truncate: false,
      render: (_, row) => (
        row.aiPriority === 'high' ? (
          <button
            onClick={() => handleWhaleUndoTarget(row.fanId as string)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Remove Priority
          </button>
        ) : (
          <button
            onClick={() => handleWhaleTarget(row.fanId as string)}
            className="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Set Priority
          </button>
        )
      ),
    },
  ];

  return (
    <PageLayout
      title="Finance"
      subtitle="ANALYTICS"
      actions={<DateRangeSelector value={dateRange} onChange={setDateRange} />}
    >
      <div className="w-full space-y-6">
        {/* Revenue Breakdown + AI Metrics */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue Breakdown (7 cols) */}
          <div className="lg:col-span-7 min-w-0">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Breakdown</h3>
                  <p className="text-sm text-gray-600 mt-1">Distribution across revenue sources</p>
                </div>
                <ExportButton
                  data={breakdownExportData}
                  filename="revenue-breakdown"
                  period={exportPeriod}
                  columnLabels={{
                    category: 'Category',
                    amount: 'Amount ($)',
                    percentage: 'Percentage (%)',
                  }}
                />
              </div>
              <RevenueBreakdown breakdown={breakdown} isLoading={false} />
            </div>
          </div>

          {/* AI Metrics Card (5 cols) */}
          <div className="lg:col-span-5 min-w-0">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <AIMetricsCard metrics={aiMetrics} isLoading={false} />
            </div>
          </div>
        </div>

        {/* Top Spenders Table */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Spenders</h3>
              <p className="text-sm text-gray-600 mt-1">{whales.length} high-value fans</p>
            </div>
            <ExportButton
              data={whalesExportData}
              filename="top-spenders"
              period={exportPeriod}
              columnLabels={{
                fanId: 'Fan ID',
                name: 'Name',
                totalSpent: 'Total Spent ($)',
                lastPurchaseAt: 'Last Purchase',
                isOnline: 'Online',
                aiPriority: 'AI Priority',
              }}
            />
          </div>

          <IndexTable<WhaleRow>
            data={whales as WhaleRow[]}
            columns={columns}
            keyField="fanId"
            loading={false}
            rowHeight="default"
            emptyState={
              <EmptyState
                icon={<Users className="w-12 h-12" />}
                title="No top spenders found"
                description="No high-value fans found for the selected period."
              />
            }
          />
        </div>
      </div>
    </PageLayout>
  );
}
