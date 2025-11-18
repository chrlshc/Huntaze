'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SafeDateRenderer, SSRDataProvider } from '@/components/hydration';
import { UnifiedMetricsCard } from '@/components/analytics/UnifiedMetricsCard';
import { PlatformComparisonChart } from '@/components/analytics/PlatformComparisonChart';
import { TopContentGrid } from '@/components/analytics/TopContentGrid';
import { InsightsPanel } from '@/components/analytics/InsightsPanel';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useIntegrations } from '@/hooks/useIntegrations';

type TimeRange = '7d' | '30d' | '90d' | 'all';

export default function AdvancedAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [contentData, setContentData] = useState<any[]>([]);
  const { integrations, loading: integrationsLoading } = useIntegrations();

  // Check if user has any connected integrations
  const hasConnectedIntegrations = integrations.some(i => i.isConnected);

  useEffect(() => {
    if (!integrationsLoading) {
      loadAnalytics();
    }
  }, [timeRange, integrationsLoading]);

  const loadAnalytics = async () => {
    if (!hasConnectedIntegrations) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch all analytics data in parallel
      const [overview, trends, content] = await Promise.all([
        fetch(`/api/analytics/overview?timeRange=${timeRange}`).then(r => r.json()),
        fetch(`/api/analytics/trends?timeRange=${timeRange}`).then(r => r.json()),
        fetch(`/api/analytics/content?limit=6`).then(r => r.json()),
      ]);

      if (overview.success) {
        setOverviewData(overview.data);
      }

      if (trends.success) {
        setTrendsData(trends.data);
      }

      if (content.success) {
        setContentData(content.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show empty state if no integrations are connected
  if (!integrationsLoading && !hasConnectedIntegrations) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <SSRDataProvider hydrationId="analytics-advanced">
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Advanced Analytics
                </h1>
                <p className="text-gray-600">
                  Unified insights across all your social platforms
                </p>
              </div>

              {/* Empty State */}
              <div className="bg-white rounded-lg border border-gray-200 p-12">
                <div className="text-center max-w-md mx-auto">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Connect Your Accounts
                  </h3>
                  <p className="text-gray-600 mb-6">
                    To view advanced analytics, you need to connect at least one platform account. 
                    Connect your OnlyFans, Instagram, TikTok, or Reddit account to get started.
                  </p>
                  <Link
                    href="/integrations"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Connect Accounts
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </SSRDataProvider>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireOnboarding={false}>
      <SSRDataProvider hydrationId="analytics-advanced">
        <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Advanced Analytics
          </h1>
          <p className="text-gray-600">
            Unified insights across all your social platforms
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {range === 'all' ? 'All Time' : `Last ${range.replace('d', ' days')}`}
            </button>
          ))}
          <button
            onClick={loadAnalytics}
            className="ml-auto px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-200"
          >
            Refresh
          </button>
        </div>

        {/* Unified Metrics */}
        <div className="mb-6">
          <UnifiedMetricsCard
            totalFollowers={overviewData?.totalFollowers || 0}
            totalEngagement={overviewData?.totalEngagement || 0}
            totalPosts={overviewData?.totalPosts || 0}
            averageEngagementRate={overviewData?.averageEngagementRate || 0}
            loading={loading}
          />
        </div>

        {/* Platform Breakdown & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PlatformComparisonChart
            platformBreakdown={overviewData?.platformBreakdown || {}}
            loading={loading}
          />
          
          <InsightsPanel
            insights={trendsData?.insights || {
              summary: '',
              significantChanges: [],
              recommendations: [],
            }}
            loading={loading}
          />
        </div>

        {/* Top Content */}
        <TopContentGrid content={contentData} loading={loading} />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Last updated: {<SafeDateRenderer date={new Date()} format="full" />}</p>
        </div>
      </div>
        </div>
      </SSRDataProvider>
    </ProtectedRoute>
  );
}
