'use client';

import Link from 'next/link';
import { useDashboard, formatCurrency, formatPercentage, formatNumber } from '@/hooks/useDashboard';
import { useIntegrations } from '@/hooks/useIntegrations';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CenteredContainer } from '@/components/layout/CenteredContainer';
import { SkeletonScreen } from '@/components/layout/SkeletonScreen';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard({
    range: '30d',
    refetchInterval: 60000, // Refresh every minute
  });
  const { integrations, loading: integrationsLoading } = useIntegrations();

  // Check if user has any connected integrations
  const hasConnectedIntegrations = integrations.some(i => i.isConnected);

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
              fontSize: 'var(--font-size-lg)'
            }}
          >
            Error Loading Dashboard
          </h3>
          <p 
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Failed to load dashboard data. Please try again.
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
            <h1 
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-family-base)'
              }}
            >
              Dashboard
            </h1>
            <p 
              style={{
                marginTop: 'var(--spacing-4)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-base)'
              }}
            >
              Welcome to your unified Huntaze dashboard
            </p>

            {/* Empty State */}
            <div 
              className="rounded-lg"
              style={{
                marginTop: 'var(--spacing-8)',
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                padding: 'var(--spacing-12)'
              }}
            >
              <div className="text-center max-w-md mx-auto">
                <svg
                  className="mx-auto mb-[var(--spacing-4)]"
                  style={{
                    height: 'var(--spacing-16)',
                    width: 'var(--spacing-16)',
                    color: 'var(--color-text-muted)'
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
                  className="mb-[var(--spacing-2)]"
                  style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  Get Started with Huntaze
                </h3>
                <p 
                  className="mb-[var(--spacing-6)]"
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: 'var(--font-size-base)'
                  }}
                >
                  Connect your social media and content platform accounts to start managing your presence and growing your audience.
                </p>
                <Link
                  href="/integrations"
                  className="inline-flex items-center rounded-lg transition-colors"
                  style={{
                    padding: 'var(--spacing-3) var(--spacing-6)',
                    backgroundColor: 'var(--color-accent-primary)',
                    color: 'var(--color-text-inverse)',
                    fontWeight: 'var(--font-weight-medium)',
                    height: 'var(--button-height-standard)'
                  }}
                >
                  <svg
                    className="mr-[var(--spacing-2)]"
                    style={{
                      width: 'var(--spacing-5)',
                      height: 'var(--spacing-5)'
                    }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Connect Your First Account
                </Link>
              </div>
            </div>

            {/* Quick Start Guide */}
            <div 
              className="grid gap-[var(--spacing-6)] sm:grid-cols-2 lg:grid-cols-3"
              style={{ marginTop: 'var(--spacing-8)' }}
            >
              <div 
                className="rounded-lg"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  padding: 'var(--spacing-6)'
                }}
              >
                <div 
                  className="rounded-lg flex items-center justify-center mb-[var(--spacing-4)]"
                  style={{
                    width: 'var(--spacing-12)',
                    height: 'var(--spacing-12)',
                    backgroundColor: 'rgba(125, 87, 193, 0.1)'
                  }}
                >
                  <svg 
                    style={{
                      width: 'var(--spacing-6)',
                      height: 'var(--spacing-6)',
                      color: 'var(--color-accent-primary)'
                    }}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 
                  className="mb-[var(--spacing-2)]"
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  1. Connect Accounts
                </h3>
                <p 
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  Link your OnlyFans, Instagram, TikTok, or Reddit accounts to get started.
                </p>
              </div>

              <div 
                className="rounded-lg"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  padding: 'var(--spacing-6)'
                }}
              >
                <div 
                  className="rounded-lg flex items-center justify-center mb-[var(--spacing-4)]"
                  style={{
                    width: 'var(--spacing-12)',
                    height: 'var(--spacing-12)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)'
                  }}
                >
                  <svg 
                    style={{
                      width: 'var(--spacing-6)',
                      height: 'var(--spacing-6)',
                      color: 'var(--color-info)'
                    }}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 
                  className="mb-[var(--spacing-2)]"
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  2. View Analytics
                </h3>
                <p 
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  Track your performance and get insights across all your platforms.
                </p>
              </div>

              <div 
                className="rounded-lg"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  padding: 'var(--spacing-6)'
                }}
              >
                <div 
                  className="rounded-lg flex items-center justify-center mb-[var(--spacing-4)]"
                  style={{
                    width: 'var(--spacing-12)',
                    height: 'var(--spacing-12)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)'
                  }}
                >
                  <svg 
                    style={{
                      width: 'var(--spacing-6)',
                      height: 'var(--spacing-6)',
                      color: 'var(--color-success)'
                    }}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 
                  className="mb-[var(--spacing-2)]"
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  3. Grow Your Audience
                </h3>
                <p 
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  Use AI-powered tools to create content and engage with your fans.
                </p>
              </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-family-base)'
                }}
              >
                Dashboard
              </h1>
              <p 
                style={{
                  marginTop: 'var(--spacing-4)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-base)'
                }}
              >
                Welcome to your unified Huntaze dashboard
              </p>
            </div>
            {dashboard?.metadata?.hasRealData && (
              <div 
                className="flex items-center rounded-lg"
                style={{
                  gap: 'var(--spacing-2)',
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid var(--color-success)'
                }}
              >
                <svg 
                  style={{
                    width: 'var(--spacing-4)',
                    height: 'var(--spacing-4)',
                    color: 'var(--color-success)'
                  }}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span 
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-success)'
                  }}
                >
                  Real Data
                </span>
              </div>
            )}
          </div>
        
        {/* Summary Cards */}
        <div 
          className="grid gap-[var(--spacing-6)] sm:grid-cols-2 lg:grid-cols-4"
          style={{ marginTop: 'var(--spacing-8)' }}
        >
          <div 
            className="rounded-lg"
            style={{
              border: '1px solid var(--color-border-subtle)',
              backgroundColor: 'var(--color-bg-surface)',
              padding: 'var(--spacing-6)'
            }}
          >
            <h3 
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Total Revenue
            </h3>
            <p 
              style={{
                marginTop: 'var(--spacing-2)',
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-primary)'
              }}
            >
              {formatCurrency(dashboard.summary.totalRevenue.value)}
            </p>
            <p 
              style={{
                marginTop: 'var(--spacing-1)',
                fontSize: 'var(--font-size-sm)',
                color: dashboard.summary.totalRevenue.change >= 0 ? 'var(--color-success)' : 'var(--color-error)'
              }}
            >
              {formatPercentage(dashboard.summary.totalRevenue.change)} from last month
            </p>
          </div>
          
          <div 
            className="rounded-lg"
            style={{
              border: '1px solid var(--color-border-subtle)',
              backgroundColor: 'var(--color-bg-surface)',
              padding: 'var(--spacing-6)'
            }}
          >
            <h3 
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Active Fans
            </h3>
            <p 
              style={{
                marginTop: 'var(--spacing-2)',
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-primary)'
              }}
            >
              {formatNumber(dashboard.summary.activeFans.value)}
            </p>
            <p 
              style={{
                marginTop: 'var(--spacing-1)',
                fontSize: 'var(--font-size-sm)',
                color: dashboard.summary.activeFans.change >= 0 ? 'var(--color-success)' : 'var(--color-error)'
              }}
            >
              {formatPercentage(dashboard.summary.activeFans.change)} from last month
            </p>
          </div>
          
          <div 
            className="rounded-lg"
            style={{
              border: '1px solid var(--color-border-subtle)',
              backgroundColor: 'var(--color-bg-surface)',
              padding: 'var(--spacing-6)'
            }}
          >
            <h3 
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Messages
            </h3>
            <p 
              style={{
                marginTop: 'var(--spacing-2)',
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-primary)'
              }}
            >
              {formatNumber(dashboard.summary.messages.total)}
            </p>
            <p 
              style={{
                marginTop: 'var(--spacing-1)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-info)'
              }}
            >
              {dashboard.summary.messages.unread} unread
            </p>
          </div>
          
          <div 
            className="rounded-lg"
            style={{
              border: '1px solid var(--color-border-subtle)',
              backgroundColor: 'var(--color-bg-surface)',
              padding: 'var(--spacing-6)'
            }}
          >
            <h3 
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Engagement
            </h3>
            <p 
              style={{
                marginTop: 'var(--spacing-2)',
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-primary)'
              }}
            >
              {(dashboard.summary.engagement.value * 100).toFixed(0)}%
            </p>
            <p 
              style={{
                marginTop: 'var(--spacing-1)',
                fontSize: 'var(--font-size-sm)',
                color: dashboard.summary.engagement.change >= 0 ? 'var(--color-success)' : 'var(--color-error)'
              }}
            >
              {formatPercentage(dashboard.summary.engagement.change)} from last month
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        {dashboard.quickActions && dashboard.quickActions.length > 0 && (
          <div style={{ marginTop: 'var(--spacing-8)' }}>
            <h2 
              className="mb-[var(--spacing-4)]"
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-primary)'
              }}
            >
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--spacing-4)]">
              {dashboard.quickActions.map((action: any) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="flex items-center rounded-lg transition-all"
                  style={{
                    gap: 'var(--spacing-3)',
                    padding: 'var(--spacing-4)',
                    backgroundColor: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-subtle)'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-2xl)' }}>
                    {action.icon === 'plus' ? '➕' : action.icon === 'campaign' ? '📧' : action.icon === 'chart' ? '📊' : '💰'}
                  </div>
                  <span 
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {dashboard.recentActivity && dashboard.recentActivity.length > 0 && (
          <div style={{ marginTop: 'var(--spacing-8)' }}>
            <h2 
              className="mb-[var(--spacing-4)]"
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-primary)'
              }}
            >
              Recent Activity
            </h2>
            <div 
              className="rounded-lg divide-y"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderColor: 'var(--color-border-subtle)'
              }}
            >
              {dashboard.recentActivity.slice(0, 5).map((activity: any) => (
                <div 
                  key={activity.id} 
                  className="transition-colors"
                  style={{
                    padding: 'var(--spacing-4)'
                  }}
                >
                  <div 
                    className="flex items-start"
                    style={{ gap: 'var(--spacing-3)' }}
                  >
                    <div style={{ fontSize: 'var(--font-size-2xl)' }}>
                      {activity.type === 'content_published' ? '📝' : 
                       activity.type === 'campaign_sent' ? '📧' : 
                       activity.type === 'fan_subscribed' ? '⭐' : '💬'}
                    </div>
                    <div className="flex-1">
                      <p 
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        {activity.title}
                      </p>
                      <p 
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-secondary)',
                          marginTop: 'var(--spacing-1)'
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
