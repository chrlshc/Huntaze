'use client';

/**
 * OnlyFans Main Dashboard Page - Shopify Design
 * Requirements: 1.1-10.4 - OnlyFans Overview with Shopify aesthetic
 * Feature: onlyfans-shopify-design
 * 
 * Main entry point for OnlyFans features with:
 * - ShopifyPageLayout with light gray background
 * - ShopifyMetricCard grid (4 columns)
 * - ShopifyBanner for connection status
 * - ShopifyQuickAction grid (3 columns)
 * - ShopifyFeatureCard grid (2 columns)
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import {
  ShopifyMetricCard,
  ShopifyMetricGrid,
  ShopifyBanner,
  ShopifyQuickAction,
  ShopifyFeatureCard,
  ShopifySectionHeader,
  ShopifyButton,
  ShopifyCard,
} from '@/components/ui/shopify';
import { 
  MessageSquare, 
  Users, 
  DollarSign, 
  Zap,
  Send,
  Eye,
  Settings,
  RefreshCw
} from 'lucide-react';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

interface OnlyFansStats {
  messages: {
    total: number;
    unread: number;
    responseRate: number;
    avgResponseTime: number;
  };
  fans: {
    total: number;
    active: number;
    new: number;
  };
  ppv: {
    totalRevenue: number;
    totalSales: number;
    conversionRate: number;
  };
  connection: {
    isConnected: boolean;
    lastSync: Date | null;
    status: 'connected' | 'disconnected' | 'error';
  };
}

interface AIQuotaInfo {
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}


export default function OnlyFansPage() {
  const [stats, setStats] = useState<OnlyFansStats | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<AIQuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  // Performance monitoring
  const { trackAPIRequest } = usePerformanceMonitoring({
    pageName: 'OnlyFans Dashboard',
    trackScrollPerformance: true,
    trackInteractions: true,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch OnlyFans stats
      await trackAPIRequest('/api/onlyfans/stats', 'GET', async () => {
        const response = await fetch('/api/onlyfans/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats || getDefaultStats());
        } else {
          setStats(getDefaultStats());
        }
      });

      // Fetch AI quota info
      await trackAPIRequest('/api/ai/quota', 'GET', async () => {
        const quotaResponse = await fetch('/api/ai/quota');
        if (quotaResponse.ok) {
          const quotaData = await quotaResponse.json();
          setQuotaInfo(quotaData.quota || getDefaultQuota());
        } else {
          setQuotaInfo(getDefaultQuota());
        }
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setStats(getDefaultStats());
      setQuotaInfo(getDefaultQuota());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultStats = (): OnlyFansStats => ({
    messages: { total: 0, unread: 0, responseRate: 0, avgResponseTime: 0 },
    fans: { total: 0, active: 0, new: 0 },
    ppv: { totalRevenue: 0, totalSales: 0, conversionRate: 0 },
    connection: { isConnected: false, lastSync: null, status: 'disconnected' },
  });

  const getDefaultQuota = (): AIQuotaInfo => ({
    limit: 10, spent: 0, remaining: 10, percentUsed: 0,
  });

  const handleRefresh = () => {
    setLoading(true);
    loadDashboardData();
  };

  // Loading state with Shopify skeleton
  if (loading) {
    return (
      <ContentPageErrorBoundary pageName="OnlyFans Dashboard">
        <ShopifyPageLayout
          title="OnlyFans Dashboard"
          subtitle="Track your messages, fans, PPV revenue, and AI usage at a glance."
        >
          <ShopifyMetricGrid columns={4}>
            {[1, 2, 3, 4].map((i) => (
              <ShopifyCard key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </ShopifyCard>
            ))}
          </ShopifyMetricGrid>
        </ShopifyPageLayout>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="OnlyFans Dashboard">
      <ShopifyPageLayout
        title="OnlyFans Dashboard"
        subtitle="Track your messages, fans, PPV revenue, and AI usage at a glance."
        actions={
          <div className="flex items-center gap-2">
            <ShopifyButton variant="secondary" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </ShopifyButton>
            <Link href="/onlyfans/settings">
              <ShopifyButton variant="secondary" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </ShopifyButton>
            </Link>
          </div>
        }
      >
        {/* Connection Status Banner */}
        {stats && showBanner && (
          <ShopifyBanner
            status={stats.connection.status === 'connected' ? 'success' : 'warning'}
            title={stats.connection.status === 'connected' 
              ? 'OnlyFans Connected' 
              : 'OnlyFans Not Connected'}
            description={stats.connection.lastSync 
              ? `Last synced: ${new Date(stats.connection.lastSync).toLocaleString()}`
              : 'Connect your OnlyFans account to get started'}
            action={!stats.connection.isConnected ? {
              label: 'Connect Account',
              onClick: () => window.location.href = '/onlyfans/settings',
            } : undefined}
            onDismiss={() => setShowBanner(false)}
          />
        )}

        {/* Metrics Grid - 4 columns */}
        {stats && (
          <ShopifyMetricGrid columns={4} data-testid="onlyfans-metrics-grid">
            <ShopifyMetricCard
              label="Messages"
              value={stats.messages.total.toLocaleString()}
              icon={MessageSquare}
              iconColor="#2c6ecb"
              trend={stats.messages.unread > 0 ? stats.messages.unread : undefined}
              trendLabel={stats.messages.unread > 0 ? 'unread' : undefined}
              data-testid="metric-card-messages"
            />
            <ShopifyMetricCard
              label="Fans"
              value={stats.fans.total.toLocaleString()}
              icon={Users}
              iconColor="#7c3aed"
              trend={stats.fans.new > 0 ? stats.fans.new : undefined}
              trendLabel={stats.fans.new > 0 ? 'new this month' : undefined}
              data-testid="metric-card-fans"
            />
            <ShopifyMetricCard
              label="PPV Revenue"
              value={`$${stats.ppv.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              iconColor="#008060"
              trend={stats.ppv.conversionRate > 0 ? stats.ppv.conversionRate : undefined}
              trendLabel={stats.ppv.conversionRate > 0 ? 'conversion' : undefined}
              data-testid="metric-card-revenue"
            />
            {quotaInfo && (
              <ShopifyMetricCard
                label="AI Quota"
                value={`${quotaInfo.percentUsed.toFixed(0)}%`}
                icon={Zap}
                iconColor="#b98900"
                trend={quotaInfo.percentUsed < 80 ? (100 - quotaInfo.percentUsed) : -(quotaInfo.percentUsed - 80)}
                trendLabel={`$${quotaInfo.remaining.toFixed(2)} left`}
                data-testid="metric-card-ai-quota"
              />
            )}
          </ShopifyMetricGrid>
        )}

        {/* Quick Actions Section */}
        <section>
          <ShopifySectionHeader title="Quick Actions" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ShopifyQuickAction
              icon={<Send />}
              iconColor="#2c6ecb"
              title="Send Message"
              description="AI-powered messaging"
              href="/onlyfans/messages"
            />
            <ShopifyQuickAction
              icon={<Eye />}
              iconColor="#7c3aed"
              title="View Fans"
              description="Manage subscribers"
              href="/onlyfans/fans"
            />
            <ShopifyQuickAction
              icon={<DollarSign />}
              iconColor="#008060"
              title="Create PPV"
              description="New pay-per-view"
              href="/onlyfans/ppv"
            />
          </div>
        </section>

        {/* Features Section */}
        <section>
          <ShopifySectionHeader title="OnlyFans Features" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ShopifyFeatureCard
              icon={<MessageSquare />}
              iconColor="#2c6ecb"
              title="Messages"
              description="AI-powered messaging"
              href="/onlyfans/messages"
            />
            <ShopifyFeatureCard
              icon={<Users />}
              iconColor="#7c3aed"
              title="Fans"
              description="Subscriber management"
              href="/onlyfans/fans"
            />
            <ShopifyFeatureCard
              icon={<DollarSign />}
              iconColor="#008060"
              title="PPV Content"
              description="Pay-per-view management"
              href="/onlyfans/ppv"
            />
            <ShopifyFeatureCard
              icon={<Settings />}
              iconColor="#6b7177"
              title="Settings"
              description="Account & preferences"
              href="/onlyfans/settings"
            />
          </div>
        </section>
      </ShopifyPageLayout>
    </ContentPageErrorBoundary>
  );
}
