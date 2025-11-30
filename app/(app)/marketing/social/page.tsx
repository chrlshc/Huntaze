'use client';
/**
 * Social Media Management Page
 * Combines integrations management with social media marketing
 * Requirements: 4.3
 */
export const dynamic = 'force-dynamic';

import { lazy, Suspense } from 'react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ToastProvider } from '@/components/ui/toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Loader2, AlertCircle, TrendingUp, Users, MessageSquare, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

const SOCIAL_PROVIDERS = ['instagram', 'tiktok', 'reddit', 'onlyfans'] as const;

function SocialMediaContent() {
  const { integrations, loading, error, connect, disconnect, reconnect } = useIntegrations();

  // Calculate social media stats
  const connectedPlatforms = integrations.length;
  const totalFollowers = integrations.reduce((sum, int) => {
    return sum + (int.metadata?.followers || 0);
  }, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-semibold">Error Loading Social Media</h3>
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireOnboarding={false}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Social Media</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your social media accounts and track engagement across platforms
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/marketing"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back to Marketing
              </Link>
              <Link
                href="/marketing/calendar"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900"
              >
                <Calendar className="w-5 h-5" />
                Content Calendar
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Connected Platforms</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{connectedPlatforms}</p>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Followers</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalFollowers.toLocaleString()}
            </p>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Posts This Week</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Engagement Rate</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">4.2%</p>
          </Card>
        </div>

        {/* Connected Platforms Section */}
        <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connected Platforms</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SOCIAL_PROVIDERS.map((provider) => {
              const connectedAccounts = integrations.filter(
                (integration) => integration.provider === provider
              );

              if (connectedAccounts.length === 0) {
                return (
                  <IntegrationCard
                    key={provider}
                    provider={provider}
                    isConnected={false}
                    onConnect={() => connect(provider)}
                    onDisconnect={() => {}}
                    onReconnect={() => {}}
                  />
                );
              }

              return connectedAccounts.map((account) => (
                <IntegrationCard
                  key={`${provider}-${account.providerAccountId}`}
                  provider={provider}
                  isConnected={true}
                  account={{
                    providerAccountId: account.providerAccountId,
                    metadata: account.metadata,
                    expiresAt: account.expiresAt,
                    createdAt: account.createdAt,
                  }}
                  onConnect={() => connect(provider)}
                  onDisconnect={() => disconnect(provider, account.providerAccountId)}
                  onReconnect={() => reconnect(provider, account.providerAccountId)}
                  showAddAnother={true}
                />
              ));
            })}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/content"
              className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Create Post</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Schedule content across platforms</p>
              </div>
            </Link>

            <Link
              href="/marketing/calendar"
              className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">View Calendar</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">See your content schedule</p>
              </div>
            </Link>

            <Link
              href="/analytics"
              className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">View Analytics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track performance metrics</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function SocialMediaPage() {
  return (
    <ToastProvider>
      <ContentPageErrorBoundary pageName="Social Media">
        <SocialMediaContent />
      </ContentPageErrorBoundary>
    </ToastProvider>
  );
}
