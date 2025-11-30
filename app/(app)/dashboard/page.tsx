'use client';
/**
 * Fetches real-time data from API or database
 * Requires dynamic rendering
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';


import Link from 'next/link';
import { useDashboard, formatCurrency, formatPercentage, formatNumber } from '@/hooks/useDashboard';
import { useIntegrations } from '@/hooks/useIntegrations';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CenteredContainer } from '@/components/layout/CenteredContainer';
import { SkeletonScreen } from '@/components/layout/SkeletonScreen';
import { GamifiedOnboarding } from '@/components/dashboard/GamifiedOnboarding';
import { Button } from '@/components/dashboard/Button';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data, isLoading, error } = useDashboard({
    range: '30d',
    refetchInterval: 60000, // Refresh every minute
  });
  const { integrations, loading: integrationsLoading } = useIntegrations();

  // Check if user has any connected integrations
  const hasConnectedIntegrations = integrations.some(i => i.isConnected);
  
  // Check if user has completed onboarding (for gamified onboarding display)
  const hasCompletedOnboarding = session?.user?.onboardingCompleted ?? true;
  const userName = session?.user?.name?.split(' ')[0] || 'there';

  if (isLoading || integrationsLoading) {
    return (
      <CenteredContainer maxWidth="lg">
        <SkeletonScreen variant="dashboard" />
      </CenteredContainer>
    );
  }

  if (error) {
    return (
      <CenteredContainer maxWidth="lg">
        <div 
          className="rounded-lg p-[var(--spacing-4)]"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)'
          }}
        >
          <h3 
            className="mb-[var(--spacing-2)]"
            style={{
              color: 'var(--color-error)',
              fontWeight: 'var(--font-weight-medium)',
              fontSize: 'var(--text-lg)'
            }}
          >
            Error Loading Home
          </h3>
          <p 
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Failed to load home data. Please try again.
          </p>
        </div>
      </CenteredContainer>
    );
  }

  // Show empty state if no integrations are connected
  if (!hasConnectedIntegrations) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <CenteredContainer maxWidth="lg">
          <div>
            <h1 className="huntaze-h1">
              Home
            </h1>
            <p 
              className="huntaze-body-secondary"
              style={{ marginTop: 'var(--spacing-sm)' }}
            >
              Welcome to your unified Huntaze dashboard
            </p>

            {/* Empty State */}
            <div 
              className="huntaze-card"
              style={{
                marginTop: 'var(--spacing-content-block-gap)',
                padding: 'var(--spacing-2xl)'
              }}
            >
              <div className="text-center max-w-md mx-auto">
                <svg
                  className="mx-auto"
                  style={{
                    height: '64px',
                    width: '64px',
                    color: 'var(--color-text-sub)',
                    marginBottom: 'var(--spacing-lg)'
                  }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <h3 
                  className="huntaze-h2"
                  style={{ marginBottom: 'var(--spacing-sm)' }}
                >
                  Get Started with Huntaze
                </h3>
                <p 
                  className="huntaze-body-secondary"
                  style={{ marginBottom: 'var(--spacing-xl)' }}
                >
                  Connect your social media and content platform accounts to start managing your presence and growing your audience.
                </p>
                <Link href="/integrations">
                  <Button variant="primary" size="large">
                    <svg
                      style={{
                        width: '20px',
                        height: '20px'
                      }}
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
                    Connect Your First Account
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Start Guide */}
            <div 
              className="huntaze-card-grid"
              style={{ marginTop: 'var(--spacing-content-block-gap)' }}
            >
              <Card>
                <div 
                  className="rounded-lg flex items-center justify-center"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'var(--color-indigo-fade)',
                    marginBottom: 'var(--spacing-lg)'
                  }}
                >
                  <svg 
                    style={{
                      width: '24px',
                      height: '24px',
                      color: 'var(--color-indigo)'
                    }}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 
                  className="huntaze-h3"
                  style={{ marginBottom: 'var(--spacing-sm)' }}
                >
                  1. Connect Accounts
                </h3>
                <p className="huntaze-body-secondary">
                  Link your OnlyFans, Instagram, TikTok, or Reddit accounts to get started.
                </p>
              </Card>

              <Card>
                <div 
                  className="rounded-lg flex items-center justify-center"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'var(--color-indigo-fade)',
                    marginBottom: 'var(--spacing-lg)'
                  }}
                >
                  <svg 
                    style={{
                      width: '24px',
                      height: '24px',
                      color: 'var(--color-indigo)'
                    }}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 
                  className="huntaze-h3"
                  style={{ marginBottom: 'var(--spacing-sm)' }}
                >
                  2. View Analytics
                </h3>
                <p className="huntaze-body-secondary">
                  Track your performance and get insights across all your platforms.
                </p>
              </Card>

              <Card>
                <div 
                  className="rounded-lg flex items-center justify-center"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'var(--color-indigo-fade)',
                    marginBottom: 'var(--spacing-lg)'
                  }}
                >
                  <svg 
                    style={{
                      width: '24px',
                      height: '24px',
                      color: 'var(--color-indigo)'
                    }}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 
                  className="huntaze-h3"
                  style={{ marginBottom: 'var(--spacing-sm)' }}
                >
                  3. Grow Your Audience
                </h3>
                <p className="huntaze-body-secondary">
                  Use AI-powered tools to create content and engage with your fans.
                </p>
              </Card>
            </div>
          </div>
        </CenteredContainer>
      </ProtectedRoute>
    );
  }

  const dashboard = data?.data;
  if (!dashboard) return null;

  return (
    <ProtectedRoute requireOnboarding={false}>
      <CenteredContainer maxWidth="lg">
        <div>
          {/* Show Gamified Onboarding for new users */}
          {!hasCompletedOnboarding && (
            <GamifiedOnboarding
              userName={userName}
              hasConnectedAccounts={hasConnectedIntegrations}
              onConnectAccount={() => router.push('/integrations')}
              onCreateContent={() => router.push('/content/create')}
            />
          )}
          
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-content-block-gap)' }}>
            <div>
              <h1 className="huntaze-h1">
                Home
              </h1>
              <p 
                className="huntaze-body-secondary"
                style={{ marginTop: 'var(--spacing-sm)' }}
              >
                Welcome to your unified Huntaze home
              </p>
            </div>
            {dashboard?.metadata?.hasRealData && (
              <div 
                className="flex items-center rounded-lg"
                style={{
                  gap: 'var(--spacing-sm)',
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid var(--color-success)'
                }}
              >
                <svg 
                  style={{
                    width: '16px',
                    height: '16px',
                    color: 'var(--color-success)'
                  }}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span 
                  className="huntaze-body-small"
                  style={{
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-success)'
                  }}
                >
                  Real Data
                </span>
              </div>
            )}
          </div>
        
        {/* Summary Cards - Using Shopify Design System */}
        <div 
          className="huntaze-card-grid"
          style={{ marginTop: 'var(--spacing-content-block-gap)' }}
        >
          <Card>
            <h3 
              className="huntaze-label"
              style={{ marginBottom: 'var(--spacing-sm)' }}
            >
              Total Revenue
            </h3>
            <p 
              className="huntaze-h1"
              style={{ marginTop: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}
            >
              {formatCurrency(dashboard.summary.totalRevenue.value)}
            </p>
            <p 
              className="huntaze-body-small"
              style={{
                color: dashboard.summary.totalRevenue.change >= 0 ? 'var(--color-success)' : 'var(--color-error)'
              }}
            >
              {formatPercentage(dashboard.summary.totalRevenue.change)} from last month
            </p>
          </Card>
          
          <Card>
            <h3 
              className="huntaze-label"
              style={{ marginBottom: 'var(--spacing-sm)' }}
            >
              Active Fans
            </h3>
            <p 
              className="huntaze-h1"
              style={{ marginTop: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}
            >
              {formatNumber(dashboard.summary.activeFans.value)}
            </p>
            <p 
              className="huntaze-body-small"
              style={{
                color: dashboard.summary.activeFans.change >= 0 ? 'var(--color-success)' : 'var(--color-error)'
              }}
            >
              {formatPercentage(dashboard.summary.activeFans.change)} from last month
            </p>
          </Card>
          
          <Card>
            <h3 
              className="huntaze-label"
              style={{ marginBottom: 'var(--spacing-sm)' }}
            >
              Messages
            </h3>
            <p 
              className="huntaze-h1"
              style={{ marginTop: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}
            >
              {formatNumber(dashboard.summary.messages.total)}
            </p>
            <p 
              className="huntaze-body-small"
              style={{ color: 'var(--color-indigo)' }}
            >
              {dashboard.summary.messages.unread} unread
            </p>
          </Card>
          
          <Card>
            <h3 
              className="huntaze-label"
              style={{ marginBottom: 'var(--spacing-sm)' }}
            >
              Engagement
            </h3>
            <p 
              className="huntaze-h1"
              style={{ marginTop: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}
            >
              {(dashboard.summary.engagement.value * 100).toFixed(0)}%
            </p>
            <p 
              className="huntaze-body-small"
              style={{
                color: dashboard.summary.engagement.change >= 0 ? 'var(--color-success)' : 'var(--color-error)'
              }}
            >
              {formatPercentage(dashboard.summary.engagement.change)} from last month
            </p>
          </Card>
        </div>

        {/* Quick Actions - Using Button Component */}
        {dashboard.quickActions && dashboard.quickActions.length > 0 && (
          <div style={{ marginTop: 'var(--spacing-content-block-gap)' }}>
            <h2 
              className="huntaze-h2"
              style={{ marginBottom: 'var(--spacing-lg)' }}
            >
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--spacing-lg)]">
              {dashboard.quickActions.map((action: any) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="huntaze-card flex items-center transition-all hover:shadow-[var(--shadow-card-hover)]"
                  style={{
                    gap: 'var(--spacing-md)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: 'var(--text-2xl)' }}>
                    {action.icon === 'plus' ? '➕' : action.icon === 'campaign' ? '📧' : action.icon === 'chart' ? '📊' : '💰'}
                  </div>
                  <span className="huntaze-body-small" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity - Using Design System */}
        {dashboard.recentActivity && dashboard.recentActivity.length > 0 && (
          <div style={{ marginTop: 'var(--spacing-content-block-gap)' }}>
            <h2 
              className="huntaze-h2"
              style={{ marginBottom: 'var(--spacing-lg)' }}
            >
              Recent Activity
            </h2>
            <div 
              className="huntaze-card"
              style={{ padding: 0, overflow: 'hidden' }}
            >
              {dashboard.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                <div 
                  key={activity.id} 
                  className="transition-colors hover:bg-[var(--bg-app)]"
                  style={{
                    padding: 'var(--spacing-lg)',
                    borderBottom: index < dashboard.recentActivity.slice(0, 5).length - 1 ? '1px solid var(--color-border-medium)' : 'none'
                  }}
                >
                  <div 
                    className="flex items-start"
                    style={{ gap: 'var(--spacing-md)' }}
                  >
                    <div style={{ fontSize: 'var(--text-2xl)' }}>
                      {activity.type === 'content_published' ? '📝' : 
                       activity.type === 'campaign_sent' ? '📧' : 
                       activity.type === 'fan_subscribed' ? '⭐' : '💬'}
                    </div>
                    <div className="flex-1">
                      <p className="huntaze-body-small" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                        {activity.title}
                      </p>
                      <p 
                        className="huntaze-body-small"
                        style={{
                          color: 'var(--color-text-sub)',
                          marginTop: 'var(--spacing-xs)'
                        }}
                      >
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </CenteredContainer>
    </ProtectedRoute>
  );
}
