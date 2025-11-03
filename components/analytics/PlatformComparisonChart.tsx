'use client';

/**
 * Platform Comparison Chart Component
 * 
 * Displays side-by-side comparison of platform metrics
 */

import React from 'react';

interface PlatformData {
  followers: number;
  engagement: number;
  posts: number;
  engagementRate: number;
}

interface PlatformComparisonChartProps {
  platformBreakdown: {
    [platform: string]: PlatformData;
  };
  loading?: boolean;
}

export function PlatformComparisonChart({
  platformBreakdown,
  loading = false,
}: PlatformComparisonChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const platforms = Object.entries(platformBreakdown);

  if (platforms.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Platform Breakdown</h3>
        <p className="text-gray-500 text-center py-8">No platform data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-6">Platform Breakdown</h3>
      
      <div className="space-y-6">
        {platforms.map(([platform, data]) => (
          <div key={platform} className="border-b pb-4 last:border-b-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="font-medium capitalize">{platform}</span>
              </div>
              <span className="text-sm text-gray-500">
                {data.engagementRate.toFixed(2)}% engagement
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Followers</div>
                <div className="font-semibold">{formatNumber(data.followers)}</div>
              </div>
              <div>
                <div className="text-gray-500">Engagement</div>
                <div className="font-semibold">{formatNumber(data.engagement)}</div>
              </div>
              <div>
                <div className="text-gray-500">Posts</div>
                <div className="font-semibold">{data.posts}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
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
