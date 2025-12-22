'use client';

/**
 * Funnel Detail Page - Drill-down from main analytics
 * 
 * Shows detailed conversion funnel with platform breakdown and optimization tips.
 */

import { useState } from 'react';
import useSWR from 'swr';
import { AnalyticsCard } from '../components/AnalyticsCard';
import { AnalyticsToolbar } from '../components/AnalyticsToolbar';
import { formatNumber, formatPercentage } from '@/lib/dashboard/formatters';
import { fetchAcquisitionData, getErrorMessage } from '@/lib/dashboard/api';
import type { DateRange } from '@/lib/dashboard/types';

export default function FunnelDetailPage() {
  const [dateRange, setDateRange] = useState<DateRange>({ type: 'preset', preset: '30d' });

  const { data, error, isLoading, mutate } = useSWR(
    ['acquisition-detail', dateRange],
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
              type="button"
              onClick={() => void mutate()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const funnel = data?.funnel ?? null;
  const platformMetrics = data?.platformMetrics ?? [];

  if (!data || !funnel) {
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
            <div className="text-4xl mb-4">📉</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No funnel data available
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Try selecting a different date range.
            </p>
            <button
              type="button"
              onClick={() => void mutate()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate conversion steps
  const steps = [];
  if (funnel.views !== null && funnel.profileClicks !== null && funnel.views > 0) {
    steps.push({
      from: 'Views',
      to: 'Profile Clicks',
      fromValue: funnel.views,
      toValue: funnel.profileClicks,
      rate: funnel.profileClicks / funnel.views,
    });
  }
  if (funnel.profileClicks !== null && funnel.linkTaps !== null && funnel.profileClicks > 0) {
    steps.push({
      from: 'Profile Clicks',
      to: 'Link Taps',
      fromValue: funnel.profileClicks,
      toValue: funnel.linkTaps,
      rate: funnel.linkTaps / funnel.profileClicks,
    });
  }
  if (funnel.linkTaps !== null && funnel.newSubs > 0 && funnel.linkTaps > 0) {
    steps.push({
      from: 'Link Taps',
      to: 'New Subscribers',
      fromValue: funnel.linkTaps,
      toValue: funnel.newSubs,
      rate: funnel.newSubs / funnel.linkTaps,
    });
  }

  if (steps.length === 0 && platformMetrics.length === 0) {
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
            <div className="text-4xl mb-4">📉</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No funnel data available
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Try selecting a different date range.
            </p>
            <button
              type="button"
              onClick={() => void mutate()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnalyticsToolbar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        lastSyncAt={new Date().toISOString()}
        onExport={() => {}}
      />

      <div className="px-6 py-6 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Conversion Funnel</h1>
        <p className="text-sm text-gray-600 mt-1">Detailed conversion analysis with platform breakdown</p>
      </div>

      <div className="px-6 py-6">
        <div className="space-y-6">
          {/* Conversion Steps Detail */}
          <AnalyticsCard
            title="Conversion Steps"
            subtitle="Step-by-step conversion rates"
          >
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">
                        {step.from} → {step.to}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatNumber(step.fromValue)} → {formatNumber(step.toValue)}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-lg font-bold ${
                      step.rate >= 0.8
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : step.rate >= 0.6
                        ? 'text-gray-700 bg-gray-50 border border-gray-200'
                        : 'text-rose-700 bg-rose-50 border border-rose-300'
                    }`}>
                      {formatPercentage(step.rate * 100)}
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        step.rate >= 0.8
                          ? 'bg-emerald-600'
                          : step.rate >= 0.6
                          ? 'bg-gray-600'
                          : 'bg-rose-600'
                      }`}
                      style={{ width: `${step.rate * 100}%` }}
                    />
                  </div>
                  
                  {/* Optimization tip */}
                  {step.rate < 0.8 && (
                    <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">💡 Optimization tip:</span>{' '}
                        {step.to === 'Profile Clicks' && 'Improve your content thumbnails and captions to drive more profile visits'}
                        {step.to === 'Link Taps' && 'Enhance your profile bio and highlight your link to increase clicks'}
                        {step.to === 'New Subscribers' && 'Optimize your landing page and subscription offer to convert more visitors'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AnalyticsCard>

          {/* Platform Breakdown */}
          {platformMetrics.length > 0 && (
            <AnalyticsCard
              title="Platform Performance"
              subtitle="Conversion rates by traffic source"
            >
              <div className="space-y-3">
                {platformMetrics.map((platform) => {
                  const conversionRate = platform.linkTaps > 0 
                    ? (platform.newSubs / platform.linkTaps) * 100 
                    : 0;
                  
                  return (
                    <div key={platform.platform} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">{platform.platform}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatNumber(platform.linkTaps)} link taps → {formatNumber(platform.newSubs)} subs
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 tabular-nums">
                            {formatPercentage(conversionRate)}
                          </div>
                          <p className="text-xs text-gray-600">conversion</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AnalyticsCard>
          )}
        </div>
      </div>
    </div>
  );
}
