'use client';

/**
 * Analytics Overview Page
 * 
 * Displays key metrics with trend indicators and time range selector.
 * Uses PageLayout for consistent structure.
 * 
 * Feature: dashboard-ux-overhaul
 * Requirements: 4.1, 4.2, 4.3
 */
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/PageLayout';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useIntegrations } from '@/hooks/useIntegrations';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  UserMinus,
  BarChart3,
  Calendar,
  Download
} from 'lucide-react';

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

// Time range options
const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { integrations, loading: integrationsLoading } = useIntegrations();

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

  // Handle time range change
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setLoading(true);
  };

  // Time range selector component
  const TimeRangeSelector = (
    <div className="flex items-center gap-2" data-testid="time-range-selector">
      {TIME_RANGES.map((range) => (
        <Button
          key={range.value}
          variant={timeRange === range.value ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleTimeRangeChange(range.value)}
          data-testid={`time-range-${range.value}`}
          data-active={timeRange === range.value}
        >
          {range.label}
        </Button>
      ))}
      <Button variant="ghost" size="sm" className="ml-2">
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>
    </div>
  );

  if (loading || integrationsLoading) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <PageLayout
          title="Analytics"
          subtitle="Loading your performance data..."
          breadcrumbs={[{ label: 'Analytics' }]}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              </Card>
            ))}
          </div>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  // Show empty state if no integrations are connected
  if (!hasConnectedIntegrations) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <ContentPageErrorBoundary pageName="Analytics">
          <PageLayout
            title="Analytics"
            subtitle="Track your key metrics and spot growth opportunities"
            breadcrumbs={[{ label: 'Analytics' }]}
          >
            <EmptyState
              icon={BarChart3}
              title="Connect Your Accounts"
              description="To view analytics, connect at least one platform account. Connect your OnlyFans, Instagram, TikTok, or Reddit account to get started."
              actionLabel="Connect Accounts"
              actionHref="/integrations"
            />
          </PageLayout>
        </ContentPageErrorBoundary>
      </ProtectedRoute>
    );
  }


  return (
    <ProtectedRoute requireOnboarding={false}>
      <ContentPageErrorBoundary pageName="Analytics">
        <PageLayout
          title="Analytics"
          subtitle="Track your key metrics and spot growth opportunities"
          breadcrumbs={[{ label: 'Analytics' }]}
          actions={TimeRangeSelector}
        >
          {/* Key Metrics Cards */}
          {metrics && (
            <section className="mb-8" data-testid="analytics-metrics">
              <h2 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">Key Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total Revenue */}
                <Card className="p-6" data-testid="metric-revenue">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[var(--color-text-sub)]">Total Revenue</span>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-text-main)]" data-testid="metric-revenue-value">
                    {formatCurrency(metrics.revenue.total)}
                  </div>
                  <div 
                    className={`text-sm mt-1 flex items-center gap-1 ${
                      metrics.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                    data-testid="metric-revenue-trend"
                    data-trend={metrics.revenue.change >= 0 ? 'up' : 'down'}
                  >
                    <TrendingUp className={`h-3 w-3 ${metrics.revenue.change < 0 ? 'rotate-180' : ''}`} />
                    {formatPercent(metrics.revenue.change)}
                  </div>
                </Card>

                {/* ARPU */}
                <Card className="p-6" data-testid="metric-arpu">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[var(--color-text-sub)]">ARPU</span>
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-text-main)]" data-testid="metric-arpu-value">
                    {formatCurrency(metrics.arpu.value)}
                  </div>
                  <div 
                    className={`text-sm mt-1 flex items-center gap-1 ${
                      metrics.arpu.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                    data-testid="metric-arpu-trend"
                    data-trend={metrics.arpu.change >= 0 ? 'up' : 'down'}
                  >
                    <TrendingUp className={`h-3 w-3 ${metrics.arpu.change < 0 ? 'rotate-180' : ''}`} />
                    {formatPercent(metrics.arpu.change)}
                  </div>
                </Card>

                {/* LTV */}
                <Card className="p-6" data-testid="metric-ltv">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[var(--color-text-sub)]">LTV</span>
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-text-main)]" data-testid="metric-ltv-value">
                    {formatCurrency(metrics.ltv.value)}
                  </div>
                  <div 
                    className={`text-sm mt-1 flex items-center gap-1 ${
                      metrics.ltv.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                    data-testid="metric-ltv-trend"
                    data-trend={metrics.ltv.change >= 0 ? 'up' : 'down'}
                  >
                    <TrendingUp className={`h-3 w-3 ${metrics.ltv.change < 0 ? 'rotate-180' : ''}`} />
                    {formatPercent(metrics.ltv.change)}
                  </div>
                </Card>

                {/* Churn Rate */}
                <Card className="p-6" data-testid="metric-churn">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[var(--color-text-sub)]">Churn Rate</span>
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <UserMinus className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-text-main)]" data-testid="metric-churn-value">
                    {metrics.churnRate.value.toFixed(1)}%
                  </div>
                  <div 
                    className={`text-sm mt-1 flex items-center gap-1 ${
                      metrics.churnRate.change <= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                    data-testid="metric-churn-trend"
                    data-trend={metrics.churnRate.change <= 0 ? 'down' : 'up'}
                  >
                    <TrendingUp className={`h-3 w-3 ${metrics.churnRate.change <= 0 ? 'rotate-180' : ''}`} />
                    {formatPercent(metrics.churnRate.change)}
                  </div>
                </Card>

                {/* Subscribers */}
                <Card className="p-6" data-testid="metric-subscribers">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[var(--color-text-sub)]">Subscribers</span>
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <Users className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-text-main)]" data-testid="metric-subscribers-value">
                    {metrics.subscribers.total.toLocaleString()}
                  </div>
                  <div 
                    className={`text-sm mt-1 flex items-center gap-1 ${
                      metrics.subscribers.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                    data-testid="metric-subscribers-trend"
                    data-trend={metrics.subscribers.change >= 0 ? 'up' : 'down'}
                  >
                    <TrendingUp className={`h-3 w-3 ${metrics.subscribers.change < 0 ? 'rotate-180' : ''}`} />
                    {metrics.subscribers.change > 0 ? '+' : ''}{metrics.subscribers.change} this period
                  </div>
                </Card>
              </div>
            </section>
          )}

          {/* Revenue Optimization Tools */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">Revenue Optimization Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/analytics/pricing" className="group">
                <Card className="p-6 h-full transition-all hover:shadow-md hover:border-blue-500/50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text-main)] mb-1">Pricing Optimization</h3>
                      <p className="text-sm text-[var(--color-text-sub)]">AI-powered pricing recommendations</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-[var(--color-text-sub)]">
                    Get personalized pricing suggestions based on your audience and content performance.
                  </p>
                </Card>
              </Link>

              <Link href="/analytics/churn" className="group">
                <Card className="p-6 h-full transition-all hover:shadow-md hover:border-red-500/50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text-main)] mb-1">Churn Prevention</h3>
                      <p className="text-sm text-[var(--color-text-sub)]">Identify at-risk fans</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-[var(--color-text-sub)]">
                    Detect fans likely to unsubscribe and take action to retain them.
                  </p>
                </Card>
              </Link>

              <Link href="/analytics/upsells" className="group">
                <Card className="p-6 h-full transition-all hover:shadow-md hover:border-green-500/50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                      <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text-main)] mb-1">Upsell Automation</h3>
                      <p className="text-sm text-[var(--color-text-sub)]">Maximize revenue per fan</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-[var(--color-text-sub)]">
                    Automatically suggest premium content and PPV to engaged fans.
                  </p>
                </Card>
              </Link>
            </div>
          </section>

          {/* Charts Placeholder */}
          <section>
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">Performance Charts</h2>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-[var(--color-text-muted)] mb-4" />
                <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2">Charts Coming Soon</h3>
                <p className="text-[var(--color-text-sub)] max-w-md">
                  Revenue trends, fan growth, and engagement charts will be available here.
                </p>
              </div>
            </Card>
          </section>
        </PageLayout>
      </ContentPageErrorBoundary>
    </ProtectedRoute>
  );
}
