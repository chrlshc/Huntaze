'use client';

import Link from 'next/link';
import { useDashboard, formatCurrency, formatPercentage, formatNumber } from '@/hooks/useDashboard';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard({
    range: '30d',
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
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

  const dashboard = data?.data;
  if (!dashboard) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Welcome to your unified Huntaze dashboard
      </p>
      
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
  );
}
