'use client';

import { formatNumber } from '@/lib/dashboard/formatters';
import { AnalyticsCard } from './AnalyticsCard';

interface PlatformMetrics {
  platform: 'TikTok' | 'Instagram' | 'Twitter';
  views: number;
  profileClicks: number;
  linkTaps: number;
  newSubs: number;
}

interface PlatformBattleProps {
  platforms: PlatformMetrics[];
  metric: 'views' | 'linkTaps' | 'newSubs';
  onMetricChange: (metric: 'views' | 'linkTaps' | 'newSubs') => void;
  insight?: string;
  isLoading?: boolean;
}

const PLATFORM_CONFIG = {
  TikTok: {
    color: 'bg-gray-100 border border-gray-200',
    textColor: 'text-gray-900',
    icon: '🎵',
    barColor: 'bg-gray-600',
  },
  Instagram: {
    color: 'bg-gray-100 border border-gray-200',
    textColor: 'text-gray-900',
    icon: '📸',
    barColor: 'bg-gray-600',
  },
  Twitter: {
    color: 'bg-gray-100 border border-gray-200',
    textColor: 'text-gray-900',
    icon: '🐦',
    barColor: 'bg-gray-600',
  },
};

const METRIC_LABELS = {
  views: 'Views',
  linkTaps: 'Link Taps',
  newSubs: 'New Subs',
};

export function PlatformBattle({
  platforms,
  metric,
  onMetricChange,
  insight,
  isLoading,
}: PlatformBattleProps) {
  if (isLoading) {
    return (
      <AnalyticsCard
        title="Platform Performance"
        subtitle="Compare traffic quality across platforms"
        tooltip="See which platforms drive the most valuable traffic"
        drillDownUrl="/analytics/platforms"
        drillDownLabel="View platform details"
      >
        <div className="space-y-4">
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </AnalyticsCard>
    );
  }

  if (!platforms || platforms.length === 0) {
    return (
      <AnalyticsCard
        title="Platform Performance"
        subtitle="Compare traffic quality across platforms"
        tooltip="See which platforms drive the most valuable traffic"
        drillDownUrl="/analytics/platforms"
        drillDownLabel="View platform details"
      >
        <div className="h-full flex flex-col items-center justify-center text-center p-6">
          <span className="text-4xl mb-4">📊</span>
          <p className="text-gray-500 mb-2">No platform data available</p>
          <p className="text-sm text-gray-400">
            Connect your social accounts to see performance comparison
          </p>
        </div>
      </AnalyticsCard>
    );
  }

  // Sort platforms by selected metric
  const sortedPlatforms = [...platforms].sort((a, b) => b[metric] - a[metric]);
  const maxValue = Math.max(...platforms.map((p) => p[metric]), 1);

  // Metric Toggle Actions
  const metricToggle = (
    <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
      {(Object.keys(METRIC_LABELS) as Array<keyof typeof METRIC_LABELS>).map((m) => (
        <button
          key={m}
          onClick={() => onMetricChange(m)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            metric === m
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {METRIC_LABELS[m]}
        </button>
      ))}
    </div>
  );

  return (
    <AnalyticsCard
      title="Platform Performance"
      subtitle="Compare traffic quality across platforms"
      tooltip="See which platforms drive the most valuable traffic"
      actions={metricToggle}
      drillDownUrl="/analytics/platforms"
      drillDownLabel="View platform details"
    >
      <div className="space-y-4">

      {/* Platform Bars - Monochrome total */}
      <div className="space-y-3">
        {sortedPlatforms.map((platform, index) => {
          const config = PLATFORM_CONFIG[platform.platform];
          const value = platform[metric];
          const widthPercent = (value / maxValue) * 100;
          const isWinner = index === 0;

          return (
            <div key={platform.platform} className="flex items-center gap-3">
              {/* Platform label */}
              <div className="flex items-center gap-2 w-32 flex-shrink-0">
                <span className="text-lg">{config.icon}</span>
                <span className="text-sm font-medium text-gray-700">{platform.platform}</span>
                {isWinner && <span className="text-sm">🏆</span>}
              </div>

              {/* Bar - GRIS UNIQUEMENT */}
              <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                <div
                  className="h-full bg-gray-600 rounded-full transition-all duration-500"
                  style={{ width: `${widthPercent}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-end pr-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(value)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Insight - style neutre */}
      {insight && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-sm font-medium text-gray-900">AI Insight</p>
              <p className="text-sm text-gray-600 mt-1">{insight}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {sortedPlatforms.map((platform) => {
          const config = PLATFORM_CONFIG[platform.platform];
          const conversionRate =
            platform.linkTaps > 0
              ? ((platform.newSubs / platform.linkTaps) * 100).toFixed(1)
              : '0';

          return (
            <div
              key={platform.platform}
              className="p-3 bg-gray-50 rounded-lg text-center"
            >
              <span className="text-lg">{config.icon}</span>
              <div className="text-xs text-gray-500 mt-1">Conv. Rate</div>
              <div className="text-sm font-semibold text-gray-900">{conversionRate}%</div>
            </div>
          );
        })}
      </div>
    </div>
    </AnalyticsCard>
  );
}
