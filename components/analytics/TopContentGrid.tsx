'use client';

/**
 * Top Content Grid Component
 * 
 * Displays top performing posts
 */

import React from 'react';
import { Card } from '@/components/ui/card';

interface ContentItem {
  postId: string;
  platform: string;
  title: string;
  thumbnail?: string;
  publishedAt: Date;
  engagement: number;
  engagementRate: number;
  likes: number;
  comments: number;
  shares: number;
}

interface TopContentGridProps {
  content: ContentItem[];
  loading?: boolean;
}

export function TopContentGrid({ content, loading = false }: TopContentGridProps) {
  if (loading) {
    return (
      <Card className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (content.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Performing Content</h3>
        <p className="text-gray-500 text-center py-8">No content data available</p>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-6">Top Performing Content</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {content.map((item) => (
          <div
            key={`${item.platform}-${item.postId}`}
            className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            {item.thumbnail && (
              <div className="aspect-video bg-gray-100">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase">
                  {item.platform}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(item.publishedAt)}
                </span>
              </div>
              
              <h4 className="font-medium text-sm mb-3 line-clamp-2">
                {item.title}
              </h4>
              
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex space-x-3">
                  <span>{formatNumber(item.likes)} likes</span>
                  <span>{formatNumber(item.comments)} comments</span>
                  {item.shares > 0 && <span>{formatNumber(item.shares)} shares</span>}
                </div>
                <span className="font-semibold">
                  {item.engagementRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
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

function formatDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}
