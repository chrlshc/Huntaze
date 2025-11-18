'use client';

import Link from 'next/link';
import { useDashboard, formatCurrency, formatPercentage, formatNumber } from '@/hooks/useDashboard';
import { useIntegrations } from '@/hooks/useIntegrations';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 dark:text-red-300 text-sm">Failed to load dashboard data. Please try again.</p>
        </div>
      </div>
    );
  }

  // Show empty state if no integrations are connected
  if (!hasConnectedIntegrations) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Welcome to your unified Huntaze dashboard
          </p>

          {/* Empty State */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Get Started with Huntaze
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect your social media and content platform accounts to start managing your presence and growing your audience.
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
                Connect Your First Account
              </Link>
            </div>
          </div>

          {/* Quick Start Guide */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">1. Connect Accounts</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Link your OnlyFans, Instagram, TikTok, or Reddit accounts to get started.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2. View Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track your performance and get insights across all your platforms.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3. Grow Your Audience</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use AI-powered tools to create content and engage with your fans.
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const dashboard = data?.data;
  if (!dashboard) return null;

  return (
    <ProtectedRoute requireOnboarding={false}>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Welcome to your unified Huntaze dashboard
            </p>
          </div>
          {dashboard?.metadata?.hasRealData && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Real Data</span>
            </div>
          )}
        </div>
      
      {/* Summary Cards */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(dashboard.summary.totalRevenue.value)}
          </p>
          <p className={`mt-1 text-sm ${dashboard.summary.totalRevenue.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(dashboard.summary.totalRevenue.change)} from last month
          </p>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Fans</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {formatNumber(dashboard.summary.activeFans.value)}
          </p>
          <p className={`mt-1 text-sm ${dashboard.summary.activeFans.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(dashboard.summary.activeFans.change)} from last month
          </p>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Messages</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {formatNumber(dashboard.summary.messages.total)}
          </p>
          <p className="mt-1 text-sm text-blue-600">
            {dashboard.summary.messages.unread} unread
          </p>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Engagement</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {(dashboard.summary.engagement.value * 100).toFixed(0)}%
          </p>
          <p className={`mt-1 text-sm ${dashboard.summary.engagement.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(dashboard.summary.engagement.change)} from last month
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      {dashboard.quickActions && dashboard.quickActions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dashboard.quickActions.map((action: any) => (
              <Link
                key={action.id}
                href={action.href}
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all"
              >
                <div className="text-2xl">{action.icon === 'plus' ? '➕' : action.icon === 'campaign' ? '📧' : action.icon === 'chart' ? '📊' : '💰'}</div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {dashboard.recentActivity && dashboard.recentActivity.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
            {dashboard.recentActivity.slice(0, 5).map((activity: any) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {activity.type === 'content_published' ? '📝' : 
                     activity.type === 'campaign_sent' ? '📧' : 
                     activity.type === 'fan_subscribed' ? '⭐' : '💬'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
    </ProtectedRoute>
  );
}
