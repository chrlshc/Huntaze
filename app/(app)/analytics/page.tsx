'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MetricsOverview } from '@/components/revenue/metrics/MetricsOverview';
import { ErrorBoundary } from '@/components/revenue/shared/ErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useIntegrations } from '@/hooks/useIntegrations';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const { integrations, loading: integrationsLoading } = useIntegrations();

  // Check if user has any connected integrations
  const hasConnectedIntegrations = integrations.some(i => i.isConnected);
  const hasOnlyFans = integrations.some(i => i.provider === 'onlyfans' && i.isConnected);

  useEffect(() => {
    const loadMetrics = async () => {
      if (!hasConnectedIntegrations) {
        setLoading(false);
        return;
      }

      try {
        // Fetch real metrics from connected integrations
        const response = await fetch('/api/analytics/overview?timeRange=30d');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMetrics(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!integrationsLoading) {
      loadMetrics();
    }
  }, [hasConnectedIntegrations, integrationsLoading]);

  const mockTrends = {
    arpu: 'up' as const,
    ltv: 'up' as const,
    churnRate: 'down' as const,
    activeSubscribers: 'up' as const,
    totalRevenue: 'up' as const,
  };

  const handleMetricClick = (metric: string) => {
    console.log('Metric clicked:', metric);
    // TODO: Navigate to detailed view or show modal
  };

  if (loading || integrationsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no integrations are connected
  if (!hasConnectedIntegrations) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <ErrorBoundary>
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your performance and optimize your revenue across all platforms
              </p>
            </div>

            {/* Empty State */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12">
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
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Connect Your Accounts
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  To view analytics, you need to connect at least one platform account. 
                  Connect your OnlyFans, Instagram, TikTok, or Reddit account to get started.
                </p>
                <Link
                  href="/integrations"
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
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
        </ErrorBoundary>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireOnboarding={false}>
      <ErrorBoundary>
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your performance and optimize your revenue across all platforms
          </p>
        </div>

        {/* Revenue Optimization Quick Links */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Revenue Optimization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link
              href="/analytics/pricing"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Pricing</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI recommendations</p>
                </div>
              </div>
            </Link>

            <Link
              href="/analytics/churn"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Churn Risk</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">At-risk fans</p>
                </div>
              </div>
            </Link>

            <Link
              href="/analytics/upsells"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Upsells</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Automation</p>
                </div>
              </div>
            </Link>

            <Link
              href="/analytics/forecast"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Forecast</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Predict & plan</p>
                </div>
              </div>
            </Link>

            <Link
              href="/analytics/payouts"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Payouts</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Schedule & tax</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Revenue Metrics Overview */}
        {metrics && (
          <div className="mb-8">
            <MetricsOverview
              metrics={metrics}
              trends={mockTrends}
              onMetricClick={handleMetricClick}
              loading={false}
            />
          </div>
        )}

        {/* Data Source Indicator */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Showing real data from your connected accounts</span>
        </div>

        {/* Performance Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Platform Performance</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Platform Analytics Coming Soon
              </h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Detailed performance metrics across OnlyFans, Instagram, TikTok, and Reddit.
              </p>
            </div>
          </div>
        </div>
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
