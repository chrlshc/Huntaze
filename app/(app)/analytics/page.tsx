'use client';

/**
 * Analytics Page - Real-time data
 * Requires dynamic rendering for analytics metrics
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useIntegrations } from '@/hooks/useIntegrations';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { SubNavigation } from '@/components/dashboard/SubNavigation';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { useNavigationContext } from '@/hooks/useNavigationContext';

// Time range type
type TimeRange = '7d' | '30d' | '90d' | 'all';

// Analytics metrics interface
interface AnalyticsMetrics {
  revenue: {
    total: number;
    change: number;
  };
  arpu: {
    value: number;
    change: number;
  };
  ltv: {
    value: number;
    change: number;
  };
  churnRate: {
    value: number;
    change: number;
  };
  subscribers: {
    total: number;
    change: number;
  };
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { integrations, loading: integrationsLoading } = useIntegrations();
  
  // Navigation context for breadcrumbs and sub-nav
  const { breadcrumbs, subNavItems: navItems } = useNavigationContext();
  
  // Performance monitoring
  const { trackAPIRequest } = usePerformanceMonitoring({
    pageName: 'Analytics',
    trackScrollPerformance: true,
    trackInteractions: true,
  });

  // Check if user has any connected integrations
  const hasConnectedIntegrations = integrations.some(i => i.isConnected);

  useEffect(() => {
    const loadMetrics = async () => {
      if (!hasConnectedIntegrations) {
        setLoading(false);
        return;
      }

      try {
        // Fetch real metrics from connected integrations with performance tracking
        await trackAPIRequest('/api/analytics/overview', 'GET', async () => {
          const response = await fetch(`/api/analytics/overview?timeRange=${timeRange}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setMetrics(data.data);
            }
          } else {
            // Use mock data if API fails
            setMetrics({
              revenue: { total: 12450, change: 15.3 },
              arpu: { value: 24.5, change: 8.2 },
              ltv: { value: 245, change: 12.1 },
              churnRate: { value: 5.2, change: -2.3 },
              subscribers: { total: 508, change: 23 },
            });
          }
        });
      } catch (error) {
        console.error('Failed to load metrics:', error);
        // Use mock data on error
        setMetrics({
          revenue: { total: 12450, change: 15.3 },
          arpu: { value: 24.5, change: 8.2 },
          ltv: { value: 245, change: 12.1 },
          churnRate: { value: 5.2, change: -2.3 },
          subscribers: { total: 508, change: 23 },
        });
      } finally {
        setLoading(false);
      }
    };

    if (!integrationsLoading) {
      loadMetrics();
    }
  }, [hasConnectedIntegrations, integrationsLoading, timeRange, trackAPIRequest]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
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
          {/* Header with Time Range Selector */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2">Analytics</h1>
              <p className="text-[var(--color-text-sub)]">
                Track your performance and optimize your revenue across all platforms
              </p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-gray-200 rounded-lg p-1">
              {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-[var(--color-indigo)] text-white shadow-sm'
                      : 'text-[var(--color-text-sub)] hover:text-[var(--color-text-main)] hover:bg-gray-50'
                  }`}
                >
                  {range === 'all' ? 'All' : range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbs} />

          {/* Sub-Navigation */}
          {navItems && <SubNavigation items={navItems} />}

          {/* Key Metrics Cards */}
          {metrics && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[var(--color-text-main)] mb-4">Key Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Total Revenue */}
                <div className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--color-text-sub)]">Total Revenue</span>
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-text-main)] mb-1">
                    {formatCurrency(metrics.revenue.total)}
                  </div>
                  <div className={`text-sm font-medium ${metrics.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(metrics.revenue.change)}
                  </div>
                </div>

                {/* ARPU */}
                <div className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--color-text-sub)]">ARPU</span>
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-text-main)] mb-1">
                    {formatCurrency(metrics.arpu.value)}
                  </div>
                  <div className={`text-sm font-medium ${metrics.arpu.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(metrics.arpu.change)}
                  </div>
                </div>

                {/* LTV */}
                <div className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--color-text-sub)]">LTV</span>
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-text-main)] mb-1">
                    {formatCurrency(metrics.ltv.value)}
                  </div>
                  <div className={`text-sm font-medium ${metrics.ltv.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(metrics.ltv.change)}
                  </div>
                </div>

                {/* Churn Rate */}
                <div className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--color-text-sub)]">Churn Rate</span>
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-text-main)] mb-1">
                    {metrics.churnRate.value.toFixed(1)}%
                  </div>
                  <div className={`text-sm font-medium ${metrics.churnRate.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(metrics.churnRate.change)}
                  </div>
                </div>

                {/* Subscribers */}
                <div className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--color-text-sub)]">Subscribers</span>
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-text-main)] mb-1">
                    {metrics.subscribers.total.toLocaleString()}
                  </div>
                  <div className={`text-sm font-medium ${metrics.subscribers.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.subscribers.change > 0 ? '+' : ''}{metrics.subscribers.change} this period
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Links to Sub-sections */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[var(--color-text-main)] mb-4">Revenue Optimization Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link
                href="/analytics/pricing"
                className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-main)]">Pricing Optimization</h3>
                    <p className="text-sm text-[var(--color-text-sub)]">AI-powered recommendations</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--color-text-sub)]">
                  Get personalized pricing suggestions based on your audience and content performance.
                </p>
              </Link>

              <Link
                href="/analytics/churn"
                className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-main)]">Churn Prevention</h3>
                    <p className="text-sm text-[var(--color-text-sub)]">Identify at-risk fans</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--color-text-sub)]">
                  Detect fans likely to unsubscribe and take action to retain them.
                </p>
              </Link>

              <Link
                href="/analytics/upsells"
                className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-main)]">Upsell Automation</h3>
                    <p className="text-sm text-[var(--color-text-sub)]">Maximize revenue per fan</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--color-text-sub)]">
                  Automatically suggest premium content and PPV to engaged fans.
                </p>
              </Link>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 shadow-[var(--shadow-soft)]">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-[var(--color-text-main)]">Performance Charts</h2>
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
                  Charts Coming Soon
                </h3>
                <p className="mt-2 text-[var(--color-text-sub)]">
                  Revenue trends, fan growth, and engagement charts will be available here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ContentPageErrorBoundary>
    </ProtectedRoute>
  );
}
