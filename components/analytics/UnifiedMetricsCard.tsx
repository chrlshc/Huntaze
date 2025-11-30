'use client';

/**
 * Unified Metrics Card Component
 * 
 * Displays aggregated metrics across all platforms
 */

import React from 'react';
import { Card } from '@/components/ui/card';

interface UnifiedMetricsCardProps {
  totalFollowers: number;
  totalEngagement: number;
  totalPosts: number;
  averageEngagementRate: number;
  loading?: boolean;
}

export function UnifiedMetricsCard({
  totalFollowers,
  totalEngagement,
  totalPosts,
  averageEngagementRate,
  loading = false,
}: UnifiedMetricsCardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Followers',
      value: formatNumber(totalFollowers),
    },
    {
      label: 'Total Engagement',
      value: formatNumber(totalEngagement),
    },
    {
      label: 'Total Posts',
      value: formatNumber(totalPosts),
    },
    {
      label: 'Avg Engagement Rate',
      value: `${averageEngagementRate.toFixed(2)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card
          key={index}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-600">{metric.label}</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{metric.value}</div>
        </Card>
      ))}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
