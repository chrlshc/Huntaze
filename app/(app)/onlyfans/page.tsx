'use client';

/**
 * OnlyFans Main Dashboard Page
 * Requirements: 1.1, 1.2, 3.1, 3.2
 * 
 * Main entry point for OnlyFans features with:
 * - Stats overview (messages, fans, PPV, revenue)
 * - AI billing usage and quota status
 * - Performance metrics
 * - Quick action buttons
 * - Navigation to sub-pages
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { 
  MessageSquare, 
  Users, 
  DollarSign, 
  TrendingUp,
  Send,
  Eye,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
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
    messages: {
      total: 0,
      unread: 0,
      responseRate: 0,
      avgResponseTime: 0,
    },
    fans: {
      total: 0,
      active: 0,
      new: 0,
    },
    ppv: {
      totalRevenue: 0,
      totalSales: 0,
      conversionRate: 0,
    },
    connection: {
      isConnected: false,
      lastSync: null,
      status: 'disconnected',
    },
  });

  const getDefaultQuota = (): AIQuotaInfo => ({
    limit: 10,
    spent: 0,
    remaining: 10,
    percentUsed: 0,
  });

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 dark:text-green-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getQuotaColor = (percentUsed: number) => {
    if (percentUsed >= 95) return 'text-red-600 dark:text-red-400';
    if (percentUsed >= 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  if (loading) {
    return (
      <ContentPageErrorBoundary pageName="OnlyFans Dashboard">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-indigo)] mx-auto mb-4"></div>
            <p className="text-[var(--color-text-sub)]">Loading OnlyFans dashboard...</p>
          </div>
        </div>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="OnlyFans Dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2">OnlyFans Dashboard</h1>
          <p className="text-[var(--color-text-sub)]">
            Manage your OnlyFans account with AI-powered tools
          </p>
        </div>

        {/* Connection Status Banner */}
        {stats && (
          <div className={`mb-6 p-4 rounded-lg border ${
            stats.connection.status === 'connected' 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={getConnectionStatusColor(stats.connection.status)}>
                  {getConnectionStatusIcon(stats.connection.status)}
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-main)]">
                    {stats.connection.status === 'connected' 
                      ? 'OnlyFans Connected' 
                      : 'OnlyFans Not Connected'}
                  </p>
                  <p className="text-sm text-[var(--color-text-sub)]">
                    {stats.connection.lastSync 
                      ? `Last synced: ${new Date(stats.connection.lastSync).toLocaleString()}`
                      : 'Connect your OnlyFans account to get started'}
                  </p>
                </div>
              </div>
              {!stats.connection.isConnected && (
                <Link
                  href="/onlyfans/settings"
                  className="px-4 py-2 bg-[var(--color-indigo)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Connect Account
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Messages Card */}
            <Card className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-main)]">Messages</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-sub)]">Total</span>
                  <span className="text-2xl font-bold text-[var(--color-text-main)]">
                    {stats.messages.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-sub)]">Unread</span>
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {stats.messages.unread}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--color-text-sub)]">Response Rate</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {stats.messages.responseRate}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Fans Card */}
            <Card className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-main)]">Fans</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-sub)]">Total</span>
                  <span className="text-2xl font-bold text-[var(--color-text-main)]">
                    {stats.fans.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-sub)]">Active</span>
                  <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {stats.fans.active}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--color-text-sub)]">New This Month</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      +{stats.fans.new}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* PPV Revenue Card */}
            <Card className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-main)]">PPV Revenue</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-sub)]">Total</span>
                  <span className="text-2xl font-bold text-[var(--color-text-main)]">
                    ${stats.ppv.totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-sub)]">Sales</span>
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {stats.ppv.totalSales}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--color-text-sub)]">Conversion</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {stats.ppv.conversionRate}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* AI Quota Card */}
            {quotaInfo && (
              <Card className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text-main)]">AI Quota</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-sub)]">Used</span>
                    <span className={`text-2xl font-bold ${getQuotaColor(quotaInfo.percentUsed)}`}>
                      {quotaInfo.percentUsed.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        quotaInfo.percentUsed >= 95 
                          ? 'bg-red-600' 
                          : quotaInfo.percentUsed >= 80 
                          ? 'bg-yellow-600' 
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(quotaInfo.percentUsed, 100)}%` }}
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--color-text-sub)]">Remaining</span>
                      <span className="font-medium text-[var(--color-text-main)]">
                        ${quotaInfo.remaining.toFixed(2)} / ${quotaInfo.limit}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--color-text-main)] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/onlyfans/messages"
              className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] hover:shadow-[0_12px_24px_rgba(0, 0, 0, 0.3)] hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Send className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-main)] mb-1">Send Message</h3>
                  <p className="text-sm text-[var(--color-text-sub)]">AI-powered messaging</p>
                </div>
              </div>
            </Link>

            <Link
              href="/onlyfans/fans"
              className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] hover:shadow-[0_12px_24px_rgba(0, 0, 0, 0.3)] hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-main)] mb-1">View Fans</h3>
                  <p className="text-sm text-[var(--color-text-sub)]">Manage subscribers</p>
                </div>
              </div>
            </Link>

            <Link
              href="/onlyfans/ppv"
              className="bg-[var(--bg-surface)] border border-gray-200 rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] hover:shadow-[0_12px_24px_rgba(0, 0, 0, 0.3)] hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-main)] mb-1">Create PPV</h3>
                  <p className="text-sm text-[var(--color-text-sub)]">New pay-per-view</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Navigation to Sub-Pages */}
        <Card className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 shadow-[var(--shadow-soft)]">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-[var(--color-text-main)]">OnlyFans Features</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/onlyfans/messages"
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-[var(--color-text-main)]">Messages</p>
                    <p className="text-sm text-[var(--color-text-sub)]">AI-powered messaging</p>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </Link>

              <Link
                href="/onlyfans/fans"
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="font-medium text-[var(--color-text-main)]">Fans</p>
                    <p className="text-sm text-[var(--color-text-sub)]">Subscriber management</p>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </Link>

              <Link
                href="/onlyfans/ppv"
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-[var(--color-text-main)]">PPV Content</p>
                    <p className="text-sm text-[var(--color-text-sub)]">Pay-per-view management</p>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </Link>

              <Link
                href="/onlyfans/settings"
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-[var(--color-text-main)]">Settings</p>
                    <p className="text-sm text-[var(--color-text-sub)]">Account & preferences</p>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </ContentPageErrorBoundary>
  );
}
