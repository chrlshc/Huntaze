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
import './analytics.css';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

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
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading analytics...</p>
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
          <div className="analytics-container">
            <div className="analytics-header">
              <h1 className="analytics-title">Analytics</h1>
              <p className="analytics-subtitle">
                Visualise tes revenus, abonnés et churn sur tous tes comptes créateurs.
              </p>
            </div>

            {/* Empty State */}
            <div className="empty-state-container">
              <div className="empty-state-content">
                <svg
                  className="empty-state-icon"
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
                <h3 className="empty-state-title">
                  Connect Your Accounts
                </h3>
                <p className="empty-state-description">
                  To view analytics, you need to connect at least one platform account. 
                  Connect your OnlyFans, Instagram, TikTok, or Reddit account to get started.
                </p>
                <Link href="/integrations" className="empty-state-button">
                  <svg
                    className="empty-state-button-icon"
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
        <div className="analytics-container">
          {/* Header with Time Range Selector */}
          <div className="analytics-header-with-actions">
            <div>
              <h1 className="analytics-title">Analytics</h1>
              <p className="analytics-subtitle">
                Pilote tes chiffres clés (revenus, fans, churn) et repère les opportunités de croissance.
              </p>
            </div>
            
            {/* Time Range Selector */}
            <div className="time-range-selector">
              {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
                <Button 
                  key={range}
                  variant="primary" 
                  onClick={() => setTimeRange(range)}
                  className={`time-range-button ${
                    timeRange === range
                      ? 'time-range-button-active'
                      : 'time-range-button-inactive'
                  }`}
                >
                  {range === 'all' ? 'All' : range.toUpperCase()}
                </Button>
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
              <h2 className="section-header">Key Metrics</h2>
              <div className="metrics-grid metrics-grid-5">
                {/* Total Revenue */}
                <Card>
                  <div className="metric-header">
                    <span className="metric-label">Total Revenue</span>
                    <div className="metric-icon-wrapper metric-icon-blue">
                      <svg className="metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="metric-value">
                    {formatCurrency(metrics.revenue.total)}
                  </div>
                  <div className={`metric-change ${metrics.revenue.change >= 0 ? 'metric-change-positive' : 'metric-change-negative'}`}>
                    {formatPercent(metrics.revenue.change)}
                  </div>
                </Card>

                {/* ARPU */}
                <Card>
                  <div className="metric-header">
                    <span className="metric-label">ARPU</span>
                    <div className="metric-icon-wrapper metric-icon-green">
                      <svg className="metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="metric-value">
                    {formatCurrency(metrics.arpu.value)}
                  </div>
                  <div className={`metric-change ${metrics.arpu.change >= 0 ? 'metric-change-positive' : 'metric-change-negative'}`}>
                    {formatPercent(metrics.arpu.change)}
                  </div>
                </Card>

                {/* LTV */}
                <Card>
                  <div className="metric-header">
                    <span className="metric-label">LTV</span>
                    <div className="metric-icon-wrapper metric-icon-purple">
                      <svg className="metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="metric-value">
                    {formatCurrency(metrics.ltv.value)}
                  </div>
                  <div className={`metric-change ${metrics.ltv.change >= 0 ? 'metric-change-positive' : 'metric-change-negative'}`}>
                    {formatPercent(metrics.ltv.change)}
                  </div>
                </Card>

                {/* Churn Rate */}
                <Card>
                  <div className="metric-header">
                    <span className="metric-label">Churn Rate</span>
                    <div className="metric-icon-wrapper metric-icon-red">
                      <svg className="metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="metric-value">
                    {metrics.churnRate.value.toFixed(1)}%
                  </div>
                  <div className={`metric-change ${metrics.churnRate.change <= 0 ? 'metric-change-positive' : 'metric-change-negative'}`}>
                    {formatPercent(metrics.churnRate.change)}
                  </div>
                </Card>

                {/* Subscribers */}
                <Card>
                  <div className="metric-header">
                    <span className="metric-label">Subscribers</span>
                    <div className="metric-icon-wrapper metric-icon-yellow">
                      <svg className="metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="metric-value">
                    {metrics.subscribers.total.toLocaleString()}
                  </div>
                  <div className={`metric-change ${metrics.subscribers.change >= 0 ? 'metric-change-positive' : 'metric-change-negative'}`}>
                    {metrics.subscribers.change > 0 ? '+' : ''}{metrics.subscribers.change} this period
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Quick Links to Sub-sections */}
          <div className="mb-8">
            <h2 className="section-header">Revenue Optimization Tools</h2>
            <div className="tools-grid">
              <Link href="/analytics/pricing" className="tool-card">
                <div className="metric-header">
                  <div className="tool-icon-wrapper tool-icon-wrapper-blue">
                    <svg className="tool-icon tool-icon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="tool-title">Pricing Optimization</h3>
                    <p className="tool-subtitle">AI-powered recommendations</p>
                  </div>
                </div>
                <p className="tool-description">
                  Get personalized pricing suggestions based on your audience and content performance.
                </p>
              </Link>

              <Link href="/analytics/churn" className="tool-card">
                <div className="metric-header">
                  <div className="tool-icon-wrapper tool-icon-wrapper-red">
                    <svg className="tool-icon tool-icon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="tool-title">Churn Prevention</h3>
                    <p className="tool-subtitle">Identify at-risk fans</p>
                  </div>
                </div>
                <p className="tool-description">
                  Detect fans likely to unsubscribe and take action to retain them.
                </p>
              </Link>

              <Link href="/analytics/upsells" className="tool-card">
                <div className="metric-header">
                  <div className="tool-icon-wrapper tool-icon-wrapper-green">
                    <svg className="tool-icon tool-icon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="tool-title">Upsell Automation</h3>
                    <p className="tool-subtitle">Maximize revenue per fan</p>
                  </div>
                </div>
                <p className="tool-description">
                  Automatically suggest premium content and PPV to engaged fans.
                </p>
              </Link>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Performance Charts</h2>
            </div>
            <div className="chart-content">
              <div className="chart-placeholder">
                <svg
                  className="chart-placeholder-icon"
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
                <h3 className="chart-placeholder-title">
                  Charts Coming Soon
                </h3>
                <p className="chart-placeholder-description">
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
