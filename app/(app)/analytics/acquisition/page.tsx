'use client';

/**
 * Dashboard Acquisition Page
 * 
 * Page Acquisition avec funnel de conversion, comparaison plateformes et top content.
 * 
 * Requirements: 9.1, 10.1, 11.1, 2.2
 * Feature: creator-analytics-dashboard
 */

import { useState } from 'react';
import useSWR from 'swr';
import { PageLayout } from '@/components/ui/PageLayout';
import { ShopifyCard } from '@/components/ui/shopify/ShopifyCard';
import { DateRangeSelector } from '../components/DateRangeSelector';
import { ConversionFunnel } from '../components/ConversionFunnel';
import { PlatformBattle } from '../components/PlatformBattle';
import { TopContent } from '../components/TopContent';
import { fetchAcquisitionData, getErrorMessage } from '@/lib/dashboard/api';
import type { DateRange } from '@/lib/dashboard/types';

export default function AcquisitionPage() {
  // State
  const [dateRange, setDateRange] = useState<DateRange>({ type: 'preset', preset: '30d' });
  
  // Platform Battle metric toggle
  const [platformMetric, setPlatformMetric] = useState<'views' | 'linkTaps' | 'newSubs'>('linkTaps');

  // Fetch data with SWR (Requirement 2.2)
  const { data, error, isLoading, mutate } = useSWR(
    ['acquisition', dateRange],
    () => fetchAcquisitionData(dateRange),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <PageLayout
        title="Acquisition"
        subtitle="ANALYTICS"
        actions={<DateRangeSelector value={dateRange} onChange={setDateRange} />}
      >
        <div className="space-y-6">
          {/* Top Row Skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <div className="h-[600px] bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div className="lg:col-span-5">
              <div className="h-[600px] bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Top Content Skeleton */}
          <div className="h-[500px] bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </PageLayout>
    );
  }

  // Error state (Requirement 12.4)
  if (error) {
    return (
      <PageLayout
        title="Acquisition"
        subtitle="ANALYTICS"
        actions={<DateRangeSelector value={dateRange} onChange={setDateRange} />}
      >
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Data temporarily unavailable
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {getErrorMessage(error)}
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
      </PageLayout>
    );
  }

  // Empty state
  if (!data) {
    return (
      <PageLayout
        title="Acquisition"
        subtitle="ANALYTICS"
        actions={<DateRangeSelector value={dateRange} onChange={setDateRange} />}
      >
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No data for selected period
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Try selecting a different date range
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
      </PageLayout>
    );
  }

  const { funnel, platformMetrics, topContent, insight } = data;

  return (
    <PageLayout
      title="Acquisition"
      subtitle="ANALYTICS"
      actions={<DateRangeSelector value={dateRange} onChange={setDateRange} />}
    >
      <div className="w-full space-y-6">
        {/* Conversion Funnel + Platform Battle */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Conversion Funnel (7 cols) */}
          <div className="lg:col-span-7">
            <ShopifyCard padding="lg">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Conversion Funnel</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Track your audience journey from views to subscribers
                </p>
              </div>
              <ConversionFunnel funnel={funnel} isLoading={false} />
            </ShopifyCard>
          </div>

          {/* Platform Battle (5 cols) */}
          <div className="lg:col-span-5">
            <ShopifyCard padding="lg">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Platform Performance</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Compare traffic quality across platforms
                </p>
              </div>
              <PlatformBattle
                platforms={platformMetrics}
                metric={platformMetric}
                onMetricChange={setPlatformMetric}
                insight={insight}
                isLoading={false}
              />
            </ShopifyCard>
          </div>
        </div>

        {/* Top Viral Content (12 cols) */}
        <div>
          <ShopifyCard padding="lg">
            <TopContent content={topContent} isLoading={false} />
          </ShopifyCard>
        </div>
      </div>
    </PageLayout>
  );
}
