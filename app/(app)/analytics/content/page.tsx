'use client';

/**
 * Content Detail Page - Drill-down from main analytics
 * 
 * Shows detailed content performance with engagement metrics.
 */

import { useState } from 'react';
import useSWR from 'swr';
import { AnalyticsCard } from '../components/AnalyticsCard';
import { AnalyticsToolbar } from '../components/AnalyticsToolbar';
import { ShopifyCard } from '@/components/ui/shopify/ShopifyCard';
import { ShopifyEmptyState } from '@/components/ui/shopify/ShopifyEmptyState';
import { formatNumber, formatPercentage } from '@/lib/dashboard/formatters';
import { fetchAcquisitionData, getErrorMessage } from '@/lib/dashboard/api';
import type { DateRange } from '@/lib/dashboard/types';
import { AlertTriangle, FileText } from 'lucide-react';

function formatShortDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ContentDetailPage() {
  const [dateRange, setDateRange] = useState<DateRange>({ type: 'preset', preset: '30d' });

  const { data, error, isLoading, mutate } = useSWR(
    ['content-detail', dateRange],
    () => fetchAcquisitionData(dateRange),
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
          <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />
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

  const topContent = data?.topContent ?? [];

  if (!data || topContent.length === 0) {
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
              icon={FileText}
              title="No content data available"
              description="Try selecting a different date range."
              action={{ label: 'Retry', onClick: () => void mutate() }}
            />
          </ShopifyCard>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totals = topContent.reduce(
    (acc, c) => ({
      views: acc.views + c.views,
      linkTaps: acc.linkTaps + c.linkTaps,
    }),
    { views: 0, linkTaps: 0 }
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AnalyticsToolbar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        lastSyncAt={new Date().toISOString()}
        onExport={() => {}}
      />

      <div className="px-6 py-6 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Content Performance</h1>
        <p className="text-sm text-gray-600 mt-1">Detailed analysis of your top-performing content</p>
      </div>

      <div className="px-6 py-6">
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AnalyticsCard title="Total Content" padding="md">
              <div className="text-3xl font-bold text-gray-900 tabular-nums">
                {formatNumber(topContent.length)}
              </div>
            </AnalyticsCard>
            <AnalyticsCard title="Total Views" padding="md">
              <div className="text-3xl font-bold text-gray-900 tabular-nums">
                {formatNumber(totals.views)}
              </div>
            </AnalyticsCard>
            <AnalyticsCard title="Total Link Taps" padding="md">
              <div className="text-3xl font-bold text-gray-900 tabular-nums">
                {formatNumber(totals.linkTaps)}
              </div>
            </AnalyticsCard>
          </div>

          {/* Content List */}
          <AnalyticsCard
            title="Top Performing Content"
            subtitle="Ranked by engagement and conversion"
          >
            <div className="space-y-4">
              {topContent.map((content, index) => {
                const tapRate = content.views > 0 ? (content.linkTaps / content.views) * 100 : 0;

                return (
                  <div key={content.contentId} className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-4">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                        #{index + 1}
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 truncate">
                              {content.title || 'Untitled Content'}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                                {content.platform}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatShortDate(content.publishedAt)}
                              </span>
                            </div>
                          </div>
                          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                            tapRate >= 10
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              : tapRate >= 5
                              ? 'text-gray-700 bg-gray-50 border border-gray-200'
                              : 'text-gray-600 bg-gray-50 border border-gray-200'
                          }`}>
                            {formatPercentage(tapRate)} tap rate
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-white rounded border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Views</p>
                            <p className="text-lg font-semibold text-gray-900 tabular-nums">
                              {formatNumber(content.views)}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Link Taps</p>
                            <p className="text-lg font-semibold text-gray-900 tabular-nums">
                              {formatNumber(content.linkTaps)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AnalyticsCard>

          {/* Content Insights */}
          <AnalyticsCard
            title="Content Insights"
            subtitle="What's working best"
          >
            <div className="space-y-3">
              {topContent
                .slice(0, 3)
                .map((content, index) => {
                  const tapRate = content.views > 0 ? (content.linkTaps / content.views) * 100 : 0;
                  
                  return (
                    <div key={content.contentId} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">
                          {index === 0 ? '🏆' : index === 1 ? '⭐' : '✨'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {content.platform} content performing {index === 0 ? 'best' : 'well'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatNumber(content.views)} views with {formatPercentage(tapRate)} tap rate
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
