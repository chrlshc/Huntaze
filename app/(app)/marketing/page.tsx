'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMarketingCampaigns } from '@/hooks/marketing/useMarketingCampaigns';
import { Plus, Filter, TrendingUp, Send, Eye, MousePointer } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function MarketingPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  
  const creatorId = 'creator_123';
  
  const { campaigns, isLoading, error } = useMarketingCampaigns({
    creatorId,
    status: statusFilter === 'all' ? undefined : statusFilter,
    channel: channelFilter === 'all' ? undefined : channelFilter,
  });

  // Calculate stats
  const stats = {
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalSent: campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0),
    avgOpenRate: campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + (c.stats?.openRate || 0), 0) / campaigns.length
      : 0,
    conversions: campaigns.reduce((sum, c) => sum + (c.stats?.converted || 0), 0),
  };

  if (isLoading) {
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
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Campaigns</h3>
          <p className="text-red-600 dark:text-red-300 text-sm">{error.message || 'Failed to load campaigns.'}</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireOnboarding={false}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Marketing & Social</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage campaigns and social media presence</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/marketing/social"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Social Media
            </Link>
            <Link
              href="/marketing/calendar"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Calendar
            </Link>
            <Link
              href="/marketing/campaigns/new"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900"
            >
              <Plus className="w-5 h-5" />
              Create Campaign
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Campaigns</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCampaigns}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Send className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sent</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSent}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Open Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{(stats.avgOpenRate * 100).toFixed(1)}%</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <MousePointer className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversions</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.conversions}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="all">All Channels</option>
          <option value="email">Email</option>
          <option value="dm">DM</option>
          <option value="sms">SMS</option>
          <option value="push">Push</option>
        </select>
      </div>

      {/* Campaigns List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaigns</h2>
          
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No campaigns yet</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Get started by creating your first campaign.</p>
              <Link
                href="/marketing/campaigns/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900"
              >
                <Plus className="w-5 h-5" />
                Create Campaign
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/marketing/campaigns/${campaign.id}`}
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{campaign.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          campaign.status === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                          campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {campaign.status}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {campaign.channel}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {campaign.goal}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Audience: {campaign.audience.segment} ({campaign.audience.size} people)
                      </p>
                    </div>
                    
                    {campaign.stats && (
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Sent</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{campaign.stats.sent}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Open Rate</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{(campaign.stats.openRate * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Conversions</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{campaign.stats.converted}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
