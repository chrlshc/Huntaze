'use client';
/**
 * Dashboard Page - Unified dashboard with design system components
 * Fetches real-time data from API or database
 * Requires dynamic rendering
 * Requirements: 2.1, 2.2
 * Phase 9: Refactored to use design system components (StatCard, Banner, EmptyState)
 */
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useDashboard, formatCurrency, formatPercentage, formatNumber } from '@/hooks/useDashboard';
import { useIntegrations } from '@/hooks/useIntegrations';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CenteredContainer } from '@/components/layout/CenteredContainer';
import { SkeletonScreen } from '@/components/layout/SkeletonScreen';
import { GamifiedOnboarding } from '@/components/dashboard/GamifiedOnboarding';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/StatCard';
import { Banner } from '@/components/ui/Banner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Zap, Link as LinkIcon, BarChart3, TrendingUp } from 'lucide-react';

/** Helper to determine trend direction */
function getTrendDirection(change: number): 'up' | 'down' | 'neutral' {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'neutral';
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data, isLoading, error } = useDashboard({
    range: '30d',
    refetchInterval: 60000,
  });
  const { integrations, loading: integrationsLoading } = useIntegrations();

  const hasConnectedIntegrations = integrations.some(i => i.isConnected);
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
        <Banner
          status="critical"
          title="Error Loading Dashboard"
          description="Failed to load dashboard data. Please try again."
          action={{
            label: 'Retry',
            onClick: () => window.location.reload()
          }}
        />
      </CenteredContainer>
    );
  }


  // Show empty state if no integrations are connected
  if (!hasConnectedIntegrations) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <CenteredContainer maxWidth="lg">
          <div>
            <h1 className="text-[var(--font-size-2xl)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
              Dashboard
            </h1>
            <p className="text-[var(--font-size-base)] text-[var(--color-text-secondary)] mt-[var(--space-2)]">
              Welcome to your unified Huntaze dashboard
            </p>

            {/* Empty State - Using design system EmptyState component */}
            <div className="mt-[var(--space-8)]">
              <EmptyState
                icon={<Zap className="w-16 h-16" />}
                title="Get Started with Huntaze"
                description="Connect your social media and content platform accounts to start managing your presence and growing your audience."
                action={{
                  label: 'Connect Your First Account',
                  onClick: () => router.push('/integrations')
                }}
              />
            </div>

            {/* Quick Start Guide - Using design system Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-4)] mt-[var(--space-8)]">
              <Card className="p-[var(--space-6)]">
                <div className="w-12 h-12 rounded-[var(--radius-base)] bg-[var(--color-action-primary-light)] flex items-center justify-center mb-[var(--space-4)]">
                  <LinkIcon className="w-6 h-6 text-[var(--color-action-primary)]" />
                </div>
                <h3 className="text-[var(--font-size-base)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] mb-[var(--space-2)]">
                  1. Connect Accounts
                </h3>
                <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
                  Link your OnlyFans, Instagram, TikTok, or Reddit accounts to get started.
                </p>
              </Card>

              <Card className="p-[var(--space-6)]">
                <div className="w-12 h-12 rounded-[var(--radius-base)] bg-[var(--color-action-primary-light)] flex items-center justify-center mb-[var(--space-4)]">
                  <BarChart3 className="w-6 h-6 text-[var(--color-action-primary)]" />
                </div>
                <h3 className="text-[var(--font-size-base)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] mb-[var(--space-2)]">
                  2. View Analytics
                </h3>
                <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
                  Track your performance and get insights across all your platforms.
                </p>
              </Card>

              <Card className="p-[var(--space-6)]">
                <div className="w-12 h-12 rounded-[var(--radius-base)] bg-[var(--color-action-primary-light)] flex items-center justify-center mb-[var(--space-4)]">
                  <TrendingUp className="w-6 h-6 text-[var(--color-action-primary)]" />
                </div>
                <h3 className="text-[var(--font-size-base)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] mb-[var(--space-2)]">
                  3. Grow Your Audience
                </h3>
                <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
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
          
          <div className="flex items-center justify-between mb-[var(--space-8)]">
            <div>
              <h1 className="text-[var(--font-size-2xl)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
                Dashboard
              </h1>
              <p className="text-[var(--font-size-base)] text-[var(--color-text-secondary)] mt-[var(--space-2)]">
                Welcome to your unified Huntaze dashboard
              </p>
            </div>
            {dashboard?.metadata?.hasRealData && (
              <Banner
                status="success"
                title="Real Data"
                className="py-[var(--space-2)] px-[var(--space-3)]"
              />
            )}
          </div>
        
          {/* Summary Cards - Using design system StatCard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--space-4)] mt-[var(--space-8)]">
            <StatCard
              label="Total Revenue"
              value={formatCurrency(dashboard.summary.totalRevenue.value)}
              trend={{
                direction: getTrendDirection(dashboard.summary.totalRevenue.change),
                value: `${formatPercentage(dashboard.summary.totalRevenue.change)} from last month`
              }}
              isEmpty={dashboard.summary.totalRevenue.value === 0}
              emptyMessage="No revenue data"
            />
            
            <StatCard
              label="Active Fans"
              value={formatNumber(dashboard.summary.activeFans.value)}
              trend={{
                direction: getTrendDirection(dashboard.summary.activeFans.change),
                value: `${formatPercentage(dashboard.summary.activeFans.change)} from last month`
              }}
              isEmpty={dashboard.summary.activeFans.value === 0}
              emptyMessage="No fans data"
            />
            
            <StatCard
              label="Messages"
              value={formatNumber(dashboard.summary.messages.total)}
              trend={{
                direction: dashboard.summary.messages.unread > 0 ? 'up' : 'neutral',
                value: `${dashboard.summary.messages.unread} unread`
              }}
              isEmpty={dashboard.summary.messages.total === 0}
              emptyMessage="No messages"
            />
            
            <StatCard
              label="Engagement"
              value={`${(dashboard.summary.engagement.value * 100).toFixed(0)}%`}
              trend={{
                direction: getTrendDirection(dashboard.summary.engagement.change),
                value: `${formatPercentage(dashboard.summary.engagement.change)} from last month`
              }}
              isEmpty={dashboard.summary.engagement.value === 0}
              emptyMessage="No engagement data"
            />
          </div>


          {/* Quick Actions */}
          {dashboard.quickActions && dashboard.quickActions.length > 0 && (
            <div className="mt-[var(--space-8)]">
              <h2 className="text-[var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] mb-[var(--space-4)]">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--space-4)]">
                {dashboard.quickActions.map((action: { id: string; href: string; icon: string; label: string }) => (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="p-[var(--space-4)] rounded-[var(--radius-base)] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] hover:border-[var(--color-action-primary)] transition-colors flex items-center gap-[var(--space-3)]"
                  >
                    <span className="text-[var(--font-size-xl)]">
                      {action.icon === 'plus' ? '➕' : action.icon === 'campaign' ? '📧' : action.icon === 'chart' ? '📊' : '💰'}
                    </span>
                    <span className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {dashboard.recentActivity && dashboard.recentActivity.length > 0 && (
            <div className="mt-[var(--space-8)]">
              <h2 className="text-[var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] mb-[var(--space-4)]">
                Recent Activity
              </h2>
              <Card className="p-0 overflow-hidden">
                {dashboard.recentActivity.slice(0, 5).map((activity: { id: string; type: string; title: string; createdAt: string }, index: number) => (
                  <div 
                    key={activity.id} 
                    className={`p-[var(--space-4)] hover:bg-[var(--color-bg-surface-hover)] transition-colors ${
                      index < dashboard.recentActivity.slice(0, 5).length - 1 ? 'border-b border-[var(--color-border-default)]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-[var(--space-3)]">
                      <span className="text-[var(--font-size-xl)]">
                        {activity.type === 'content_published' ? '📝' : 
                         activity.type === 'campaign_sent' ? '📧' : 
                         activity.type === 'fan_subscribed' ? '⭐' : '💬'}
                      </span>
                      <div className="flex-1">
                        <p className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
                          {activity.title}
                        </p>
                        <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mt-[var(--space-1)]">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>
      </CenteredContainer>
    </ProtectedRoute>
  );
}
