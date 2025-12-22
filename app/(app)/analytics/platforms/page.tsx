'use client';

/**
 * Platforms Detail Page - Drill-down from main analytics
 * 
 * Shows detailed platform comparison with traffic quality metrics.
 */

import { useState } from 'react';
import useSWR from 'swr';
import { AnalyticsCard } from '../components/AnalyticsCard';
import { AnalyticsToolbar } from '../components/AnalyticsToolbar';
import { formatNumber, formatPercentage } from '@/lib/dashboard/formatters';
import { fetchAcquisitionData, getErrorMessage } from '@/lib/dashboard/api';
import type { DateRange } from '@/lib/dashboard/types';

export default function PlatformsDetailPage() {
  const [dateRange, setDateRange] = useState<DateRange>({ type: 'preset', preset: '30d' });

  const { data, error, isLoading, mutate } = useSWR(
    ['platforms-detail', dateRange],
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
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Data temporarily unavailable
            </h3>
            <p className="text-sm text-gray-600 mb-4">{getErrorMessage(error)}</p>
            <button
              onClick={() => mutate()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const platformMetrics = data?.platformMetrics ?? [];

  if (!data || platformMetrics.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AnalyticsToolbar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          lastSyncAt={new Date().toISOString()}
          onExport={() => {}}
        />
        <div className="px-6 py-6">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No platform data available
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Try selecting a different date range.
            </p>
            <button
              onClick={() => mutate()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totals = platformMetrics.reduce(
    (acc, p) => ({
      views: acc.views + p.views,
      linkTaps: acc.linkTaps + p.linkTaps,
      newSubs: acc.newSubs + p.newSubs,
    }),
    { views: 0, linkTaps: 0, newSubs: 0 }
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
        <h1 className="text-2xl font-semibold text-gray-900">Platform Performance</h1>
        <p className="text-sm text-gray-600 mt-1">Detailed comparison of traffic sources</p>
      </div>

      <div className="px-6 py-6">
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <AnalyticsCard title="Total New Subs" padding="md">
              <div className="text-3xl font-bold text-gray-900 tabular-nums">
                {formatNumber(totals.newSubs)}
              </div>
            </AnalyticsCard>
          </div>

          {/* Platform Comparison */}
          <AnalyticsCard
            title="Platform Comparison"
            subtitle="Traffic quality and conversion metrics"
          >
            <div className="space-y-4">
              {platformMetrics
                .sort((a, b) => b.newSubs - a.newSubs)
                .map((platform) => {
                  const tapRate = platform.views > 0 ? (platform.linkTaps / platform.views) * 100 : 0;
                  const conversionRate = platform.linkTaps > 0 ? (platform.newSubs / platform.linkTaps) * 100 : 0;
                  const overallRate = platform.views > 0 ? (platform.newSubs / platform.views) * 100 : 0;

                  return (
                    <div key={platform.platform} className="p-6 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{platform.platform}</h3>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 tabular-nums">
                            {formatNumber(platform.newSubs)}
                          </div>
                          <p className="text-xs text-gray-600">new subscribers</p>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="p-3 bg-white rounded border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Views</p>
                          <p className="text-lg font-semibold text-gray-900 tabular-nums">
                            {formatNumber(platform.views)}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Link Taps</p>
                          <p className="text-lg font-semibold text-gray-900 tabular-nums">
                            {formatNumber(platform.linkTaps)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatPercentage(tapRate)} tap rate
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Conversion</p>
                          <p className="text-lg font-semibold text-gray-900 tabular-nums">
                            {formatPercentage(conversionRate)}
                          </p>
                        </div>
                      </div>

                      {/* Overall Performance */}
                      <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Overall Conversion (View → Sub)
                          </span>
                          <span className={`text-lg font-bold tabular-nums ${
                            overallRate >= 5
                              ? 'text-emerald-700'
                              : overallRate >= 2
                              ? 'text-gray-900'
                              : 'text-rose-700'
                          }`}>
                            {formatPercentage(overallRate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </AnalyticsCard>

          {/* Traffic Quality Insights */}
          <AnalyticsCard
            title="Traffic Quality Insights"
            subtitle="Which platforms drive the best results"
          >
            <div className="space-y-3">
              {platformMetrics
                .map((p) => ({
                  ...p,
                  quality: p.views > 0 ? (p.newSubs / p.views) * 100 : 0,
                }))
                .sort((a, b) => b.quality - a.quality)
                .slice(0, 3)
                .map((platform, index) => (
                  <div key={platform.platform} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {platform.platform} has the {index === 0 ? 'highest' : index === 1 ? 'second-highest' : 'third-highest'} quality traffic
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatPercentage(platform.quality)} of views convert to subscribers
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </AnalyticsCard>
        </div>
      </div>
    </div>
  );
}
