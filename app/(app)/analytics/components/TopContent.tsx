'use client';

import { formatNumber } from '@/lib/dashboard/formatters';
import { AnalyticsCard } from './AnalyticsCard';

interface TopContentItem {
  contentId: string;
  platform: 'TikTok' | 'Instagram' | 'Twitter';
  title: string;
  thumbnailUrl?: string;
  publishedAt: string;
  views: number;
  linkTaps: number;
  newSubs: number;
}

interface TopContentProps {
  content: TopContentItem[];
  isLoading?: boolean;
}

const PLATFORM_CONFIG = {
  TikTok: { icon: '🎵', color: 'bg-gray-100 text-gray-700 border border-gray-200' },
  Instagram: { icon: '📸', color: 'bg-gray-100 text-gray-700 border border-gray-200' },
  Twitter: { icon: '🐦', color: 'bg-gray-100 text-gray-700 border border-gray-200' },
};

const RANK_STYLES = [
  { badge: '🥇', bg: 'bg-white border-gray-200' },
  { badge: '🥈', bg: 'bg-white border-gray-200' },
  { badge: '🥉', bg: 'bg-white border-gray-200' },
];

export function TopContent({ content, isLoading }: TopContentProps) {
  if (isLoading) {
    return (
      <AnalyticsCard
        title="Top Viral Content"
        subtitle="Your best performing content ranked by new subscribers"
        tooltip="See which content drives the most subscriber growth"
        drillDownUrl="/analytics/content"
        drillDownLabel="View all content"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </AnalyticsCard>
    );
  }

  if (!content || content.length === 0) {
    return (
      <AnalyticsCard
        title="Top Viral Content"
        subtitle="Your best performing content ranked by new subscribers"
        tooltip="See which content drives the most subscriber growth"
        drillDownUrl="/analytics/content"
        drillDownLabel="View all content"
      >
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">📹</span>
          <p className="text-gray-500 mb-2">No viral content yet</p>
          <p className="text-sm text-gray-400">
            Your top performing content will appear here
          </p>
        </div>
      </AnalyticsCard>
    );
  }

  // Sort by newSubs and take top 3
  const topContent = [...content]
    .sort((a, b) => b.newSubs - a.newSubs)
    .slice(0, 3);

  return (
    <AnalyticsCard
      title="Top Viral Content"
      subtitle="Your best performing content ranked by new subscribers"
      tooltip="See which content drives the most subscriber growth"
      drillDownUrl="/analytics/content"
      drillDownLabel="View all content"
    >
      <div className="space-y-4">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topContent.map((item, index) => {
          const platformConfig = PLATFORM_CONFIG[item.platform];
          const rankStyle = RANK_STYLES[index] || RANK_STYLES[2];

          return (
            <div
              key={item.contentId}
              className={`relative rounded-xl border ${rankStyle.bg} p-4 hover:shadow-md transition-shadow`}
            >
              {/* Rank Badge */}
              <div className="absolute -top-3 -left-3 text-2xl">
                {rankStyle.badge}
              </div>

              {/* Platform Badge */}
              <div className="flex justify-end mb-3">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${platformConfig.color}`}
                >
                  {platformConfig.icon} {item.platform}
                </span>
              </div>

              {/* Thumbnail */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 mb-3">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {platformConfig.icon}
                  </div>
                )}
              </div>

              {/* Title */}
              <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-3">
                {item.title || 'Untitled Content'}
              </h4>

              {/* Stats - style neutre */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">Views</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCompactNumber(item.views)}
                  </div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">Taps</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCompactNumber(item.linkTaps)}
                  </div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg border border-emerald-200">
                  <div className="text-xs text-gray-600">Subs</div>
                  <div className="text-sm font-bold text-emerald-700">
                    +{formatNumber(item.newSubs)}
                  </div>
                </div>
              </div>

              {/* Published Date */}
              <div className="mt-3 text-xs text-gray-400 text-center">
                Published {formatRelativeDate(item.publishedAt)}
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      {content.length > 3 && (
        <div className="text-center pt-2">
          <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            View all {content.length} content pieces →
          </button>
        </div>
      )}
      </div>
    </AnalyticsCard>
  );
}

function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
