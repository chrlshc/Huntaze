'use client';

import { formatNumber, formatPercentage } from '@/lib/dashboard/formatters';
import { AnalyticsCard } from './AnalyticsCard';

interface FunnelData {
  views: number | null;
  profileClicks: number | null;
  linkTaps: number | null;
  newSubs: number;
}

interface ConversionFunnelProps {
  funnel: FunnelData;
  isLoading?: boolean;
}

const FUNNEL_STAGES = [
  { key: 'views', label: 'Views', icon: '👁️' },
  { key: 'profileClicks', label: 'Profile Clicks', icon: '👤' },
  { key: 'linkTaps', label: 'Link Taps', icon: '🔗' },
  { key: 'newSubs', label: 'New Subscribers', icon: '⭐' },
] as const;

// Helper: Calculate conversion steps with friction detection
interface ConversionStep {
  fromStage: string;
  toStage: string;
  fromValue: number;
  toValue: number;
  rate: number;
  isFriction: boolean;
}

function calculateConversionSteps(funnel: FunnelData): ConversionStep[] {
  const steps: ConversionStep[] = [];
  
  // Views → Profile Clicks
  if (funnel.views !== null && funnel.profileClicks !== null && funnel.views > 0) {
    steps.push({
      fromStage: 'Views',
      toStage: 'Profile Clicks',
      fromValue: funnel.views,
      toValue: funnel.profileClicks,
      rate: funnel.profileClicks / funnel.views,
      isFriction: false,
    });
  }
  
  // Profile Clicks → Link Taps
  if (funnel.profileClicks !== null && funnel.linkTaps !== null && funnel.profileClicks > 0) {
    steps.push({
      fromStage: 'Profile Clicks',
      toStage: 'Link Taps',
      fromValue: funnel.profileClicks,
      toValue: funnel.linkTaps,
      rate: funnel.linkTaps / funnel.profileClicks,
      isFriction: false,
    });
  }
  
  // Link Taps → New Subs
  if (funnel.linkTaps !== null && funnel.newSubs > 0 && funnel.linkTaps > 0) {
    steps.push({
      fromStage: 'Link Taps',
      toStage: 'New Subscribers',
      fromValue: funnel.linkTaps,
      toValue: funnel.newSubs,
      rate: funnel.newSubs / funnel.linkTaps,
      isFriction: false,
    });
  }
  
  // Mark worst step as friction point
  if (steps.length > 0) {
    const worstStep = steps.reduce((worst, current) => 
      current.rate < worst.rate ? current : worst
    );
    worstStep.isFriction = true;
  }
  
  return steps;
}

// Helper: Get actionable insight for friction point
function getFrictionInsight(toStage: string): string {
  if (toStage === 'Profile Clicks') {
    return 'Optimize your content thumbnails and captions to drive more profile visits';
  }
  if (toStage === 'Link Taps') {
    return 'Improve your profile bio and highlight your link to increase clicks';
  }
  if (toStage === 'New Subscribers') {
    return 'Optimize your landing page and subscription offer to convert more visitors';
  }
  return '';
}

export function ConversionFunnel({ funnel, isLoading }: ConversionFunnelProps) {
  if (isLoading) {
    return (
      <AnalyticsCard
        title="Conversion Funnel"
        subtitle="Track your audience journey from views to subscribers"
        tooltip="See how your audience converts through each stage"
        drillDownUrl="/analytics/funnel"
        drillDownLabel="View detailed funnel"
      >
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </AnalyticsCard>
    );
  }

  if (!funnel) {
    return (
      <AnalyticsCard
        title="Conversion Funnel"
        subtitle="Track your audience journey from views to subscribers"
        tooltip="See how your audience converts through each stage"
        drillDownUrl="/analytics/funnel"
        drillDownLabel="View detailed funnel"
      >
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-gray-500">No funnel data available</p>
        </div>
      </AnalyticsCard>
    );
  }

  // Calculate conversion steps with friction detection
  const conversionSteps = calculateConversionSteps(funnel);
  const frictionStep = conversionSteps.find(step => step.isFriction);
  
  // Get max value for width calculation
  const values = FUNNEL_STAGES.map(stage => funnel[stage.key as keyof FunnelData] ?? 0);
  const maxValue = Math.max(...values.filter(v => v !== null && v > 0), 1);
  
  // Calculate overall conversion rate (first to last)
  const firstValue = funnel.views ?? funnel.profileClicks ?? funnel.linkTaps ?? 0;
  const lastValue = funnel.newSubs;
  const overallRate = firstValue > 0 ? (lastValue / firstValue) * 100 : 0;

  return (
    <AnalyticsCard
      title="Conversion Funnel"
      subtitle="Track your audience journey from views to subscribers"
      tooltip="See how your audience converts through each stage"
      drillDownUrl="/analytics/funnel"
      drillDownLabel="View detailed funnel"
    >
      <div className="space-y-2">
        {FUNNEL_STAGES.map((stage, index) => {
          const value = funnel[stage.key as keyof FunnelData];
          const isNull = value === null;
          const widthPercent = isNull ? 0 : Math.max((value / maxValue) * 100, 10);

          return (
            <div key={stage.key} className="relative">
              {/* Stage bar */}
              <div className="relative">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{stage.icon}</span>
                      <span className="font-medium text-gray-900">{stage.label}</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 tabular-nums">
                      {isNull ? 'N/A' : formatNumber(value)}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Conversion arrow with rate */}
              {index < FUNNEL_STAGES.length - 1 && conversionSteps[index] && (
                <div className="flex flex-col items-center py-2">
                  {/* Conversion rate badge */}
                  <div className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                    conversionSteps[index].isFriction
                      ? 'text-rose-700 bg-rose-50 border-rose-300'
                      : conversionSteps[index].rate >= 0.8
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-gray-700 bg-gray-50 border-gray-200'
                  }`}>
                    {conversionSteps[index].isFriction && '⚠️ '}
                    {formatPercentage(conversionSteps[index].rate * 100)} convert
                  </div>
                  
                  {/* Arrow */}
                  <svg className="w-6 h-6 text-gray-300 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}

        {/* Overall Conversion Rate */}
        {firstValue > 0 && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Overall Conversion Rate
              </span>
              <span className="text-lg font-bold text-gray-900 tabular-nums">
                {formatPercentage(overallRate)}
              </span>
            </div>
          </div>
        )}

        {/* Friction Point Insight */}
        {frictionStep && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm font-semibold text-rose-900">
                  Friction Point: {frictionStep.fromStage} → {frictionStep.toStage}
                </p>
                <p className="text-sm text-rose-700 mt-1">
                  {getFrictionInsight(frictionStep.toStage)}
                </p>
                <p className="text-xs text-rose-600 mt-2">
                  Only {formatPercentage(frictionStep.rate * 100)} of users complete this step
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No tracking warning */}
        {(funnel.views === null || funnel.profileClicks === null) && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Limited tracking data
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Connect Instagram/TikTok tracking to see full funnel metrics
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnalyticsCard>
  );
}
