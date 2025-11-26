'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import Link from 'next/link';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useIntegrations } from '@/hooks/useIntegrations';
import { LazyLoadErrorBoundary } from '@/components/dashboard/LazyLoadErrorBoundary';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

// Lazy load heavy components to reduce initial bundle size
const MetricsOverview = lazy(() => import('@/components/revenue/metrics/MetricsOverview').then(mod => ({ default: mod.MetricsOverview })));

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const { integrations, loading: integrationsLoading } = useIntegrations();
  
  // Performance monitoring
  const { trackAPIRequest, trackNavigation } = usePerformanceMonitoring({
    pageName: 'Analytics',
    trackScrollPerformance: true,
    trackInteractions: true,
  });

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
        // Fetch real metrics from connected integrations with performance tracking
        await trackAPIRequest('/api/analytics/overview', 'GET', async () => {
          const response = await fetch('/api/analytics/overview?timeRange=30d');
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setMetrics(data.data);
            }
          }
        });
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
      <ProtectedRoute requireOnboarding={false}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-indigo)] mx-auto mb-4"></div>
            <p className="text-[var(--color-text-sub)]">Loading analytics...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show empty state if no integrations are connected
  if (!hasConnectedIntegrations) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <ContentPageErrorBoundary pageName="Analytics">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2">Analytics</h1>
              <p className="text-[var(--color-text-sub)]">
                Track your performance and optimize your revenue across all platforms
              </p>
            </div>

            {/* Empty State */}
            <div className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-12 shadow-[var(--shadow-soft)]">
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
                <h3 className="text-xl font-semibold text-[var(--color-text-main)] mb-2">
                  Connect Your Accounts
                </h3>
                <p className="text-[var(--color-text-sub)] mb-6">
                  To view analytics, you need to connect at least one platform account. 
                  Connect your OnlyFans, Instagram, TikTok, or Reddit account to get started.
                </p>
                <Link
                  href="/integrations"
                  className="inline-flex items-center px-6 py-3 bg-[var(--color-indigo)] text-white rounded-lg hover:opacity-90 transition-all font-medium"
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
        </ContentPageErrorBoundary>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireOnboarding={false}>
      <ContentPageErrorBoundary pageName="Analytics">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2">Analytics</h1>
          <p className="text-[var(--color-text-sub)]">
            Track your performance and optimize your revenue across all platforms
          </p>
        </div>

        {/* Revenue Optimization Quick Links */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--color-text-main)] mb-4">Revenue Optimization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Link
              href="/analytics/pricing"
              className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-main)]">Pricing</h3>
                  <p className="text-sm text-[var(--color-text-sub)]">AI recommendations</p>
                </div>
              </div>
            </Link>

            <Link
              href="/analytics/churn"
              className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-main)]">Churn Risk</h3>
                  <p className="text-sm text-[var(--color-text-sub)]">At-risk fans</p>
                </div>
              </div>
            </Link>

            <Link
              href="/analytics/upsells"
              className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-main)]">Upsells</h3>
                  <p className="text-sm text-[var(--color-text-sub)]">Automation</p>
                </div>
              </div>
            </Link>

            <Link
              href="/analytics/forecast"
              className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-main)]">Forecast</h3>
                  <p className="text-sm text-[var(--color-text-sub)]">Predict & plan</p>
                </div>
              </div>
            </Link>

            <Link
              href="/analytics/payouts"
              className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-main)]">Payouts</h3>
                  <p className="text-sm text-[var(--color-text-sub)]">Schedule & tax</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Revenue Metrics Overview */}
        {metrics && (
          <div className="mb-8">
            <LazyLoadErrorBoundary>
              <Suspense fallback={
                <div className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)]">
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
              }>
                <MetricsOverview
                  metrics={metrics}
                  trends={mockTrends}
                  onMetricClick={handleMetricClick}
                  loading={false}
                />
              </Suspense>
            </LazyLoadErrorBoundary>
          </div>
        )}

        {/* Data Source Indicator */}
        <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-text-sub)]">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Showing real data from your connected accounts</span>
        </div>

        {/* Performance Overview */}
        <div className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 shadow-[var(--shadow-soft)]">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-[var(--color-text-main)]">Platform Performance</h2>
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
              <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-main)]">
                Platform Analytics Coming Soon
              </h3>
              <p className="mt-2 text-[var(--color-text-sub)]">
                Detailed performance metrics across OnlyFans, Instagram, TikTok, and Reddit.
              </p>
            </div>
          </div>
        </div>
        </div>
      </ContentPageErrorBoundary>
    </ProtectedRoute>
  );
}
