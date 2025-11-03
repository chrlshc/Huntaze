'use client';

/**
 * Advanced Analytics Dashboard Page
 * 
 * Displays unified analytics across all social platforms
 */

import React, { useState, useEffect } from 'react';
import { UnifiedMetricsCard } from '@/components/analytics/UnifiedMetricsCard';
import { PlatformComparisonChart } from '@/components/analytics/PlatformComparisonChart';
import { TopContentGrid } from '@/components/analytics/TopContentGrid';
import { InsightsPanel } from '@/components/analytics/InsightsPanel';

type TimeRange = '7d' | '30d' | '90d' | 'all';

export default function AdvancedAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [contentData, setContentData] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);

    try {
      // Fetch all analytics data in parallel
      const [overview, trends, content] = await Promise.all([
        fetch(`/api/analytics/overview?timeRange=${timeRange}`).then(r => r.json()),
        fetch(`/api/analytics/trends?timeRange=${timeRange}`).then(r => r.json()),
        fetch(`/api/analytics/content?limit=6`).then(r => r.json()),
      ]);

      if (overview.success) {
        setOverviewData(overview.data);
      }

      if (trends.success) {
        setTrendsData(trends.data);
      }

      if (content.success) {
        setContentData(content.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Advanced Analytics
          </h1>
          <p className="text-gray-600">
            Unified insights across all your social platforms
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {range === 'all' ? 'All Time' : `Last ${range.replace('d', ' days')}`}
            </button>
          ))}
          <button
            onClick={loadAnalytics}
            className="ml-auto px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-200"
          >
            Refresh
          </button>
        </div>

        {/* Unified Metrics */}
        <div className="mb-6">
          <UnifiedMetricsCard
            totalFollowers={overviewData?.totalFollowers || 0}
            totalEngagement={overviewData?.totalEngagement || 0}
            totalPosts={overviewData?.totalPosts || 0}
            averageEngagementRate={overviewData?.averageEngagementRate || 0}
            loading={loading}
          />
        </div>

        {/* Platform Breakdown & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PlatformComparisonChart
            platformBreakdown={overviewData?.platformBreakdown || {}}
            loading={loading}
          />
          
          <InsightsPanel
            insights={trendsData?.insights || {
              summary: '',
              significantChanges: [],
              recommendations: [],
            }}
            loading={loading}
          />
        </div>

        {/* Top Content */}
        <TopContentGrid content={contentData} loading={loading} />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
