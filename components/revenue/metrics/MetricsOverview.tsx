'use client';

import { MetricCard } from './MetricCard';
import { RevenueMetrics, MetricTrends } from '@/lib/services/revenue/types';
import { LoadingState } from '@/components/revenue/shared/LoadingState';

interface MetricsOverviewProps {
  metrics: RevenueMetrics;
  trends: MetricTrends;
  onMetricClick: (metric: string) => void;
  loading?: boolean;
}

const seededRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) / 2147483647;
};

export function MetricsOverview({
  metrics,
  trends,
  onMetricClick,
  loading = false,
}: MetricsOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <LoadingState variant="card" count={6} />
      </div>
    );
  }

  // Calculate change percentages (mock data - in production would come from API)
  const calculateChange = (current: number, trend: string, key: string) => {
    // Mock calculation - in production this would be actual historical data
    const baseChange = seededRandom(`${key}-${trend}-${current}`) * 20 - 5; // -5% to +15%
    if (trend === 'up') return Math.abs(baseChange);
    if (trend === 'down') return -Math.abs(baseChange);
    return baseChange * 0.2; // Small change for stable
  };

  // Generate mock sparkline data
  const generateSparkline = (trend: string, key: string, points = 12) => {
    const data: number[] = [];
    let value = 100;
    
    for (let i = 0; i < points; i++) {
      const stepSeed = seededRandom(`${key}-${trend}-${i}`);
      if (trend === 'up') {
        value += stepSeed * 5 + 2;
      } else if (trend === 'down') {
        value -= stepSeed * 5 + 2;
      } else {
        value += (stepSeed - 0.5) * 3;
      }
      data.push(Math.max(0, value));
    }
    
    return data;
  };

  // Check if metric has significant change (>10%)
  const isSignificantChange = (change: number) => Math.abs(change) > 10;

  const arpuChange = calculateChange(metrics.arpu, trends.arpu, 'arpu');
  const ltvChange = calculateChange(metrics.ltv, trends.ltv, 'ltv');
  const churnChange = calculateChange(metrics.churnRate, trends.churnRate, 'churn');
  const subscribersChange = calculateChange(metrics.activeSubscribers, trends.activeSubscribers, 'subscribers');
  const revenueChange = calculateChange(metrics.totalRevenue, trends.totalRevenue, 'revenue');
  const growthChange = calculateChange(metrics.momGrowth, trends.totalRevenue, 'growth');

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Key Metrics</h2>
        <p className="text-gray-600">
          Overview of your revenue performance indicators
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ARPU */}
        <MetricCard
          title="Average Revenue Per User"
          value={metrics.arpu}
          trend={trends.arpu}
          changePercent={arpuChange}
          format="currency"
          sparklineData={generateSparkline(trends.arpu, 'arpu')}
          onClick={() => onMetricClick('arpu')}
          isHighlighted={isSignificantChange(arpuChange)}
        />

        {/* LTV */}
        <MetricCard
          title="Lifetime Value"
          value={metrics.ltv}
          trend={trends.ltv}
          changePercent={ltvChange}
          format="currency"
          sparklineData={generateSparkline(trends.ltv, 'ltv')}
          onClick={() => onMetricClick('ltv')}
          isHighlighted={isSignificantChange(ltvChange)}
        />

        {/* Churn Rate */}
        <MetricCard
          title="Churn Rate"
          value={metrics.churnRate}
          trend={trends.churnRate}
          changePercent={churnChange}
          format="percentage"
          sparklineData={generateSparkline(trends.churnRate, 'churn')}
          onClick={() => onMetricClick('churnRate')}
          isHighlighted={isSignificantChange(churnChange)}
        />

        {/* Active Subscribers */}
        <MetricCard
          title="Active Subscribers"
          value={metrics.activeSubscribers}
          trend={trends.activeSubscribers}
          changePercent={subscribersChange}
          format="number"
          sparklineData={generateSparkline(trends.activeSubscribers, 'subscribers')}
          onClick={() => onMetricClick('activeSubscribers')}
          isHighlighted={isSignificantChange(subscribersChange)}
        />

        {/* Total Revenue */}
        <MetricCard
          title="Total Revenue"
          value={metrics.totalRevenue}
          trend={trends.totalRevenue}
          changePercent={revenueChange}
          format="currency"
          sparklineData={generateSparkline(trends.totalRevenue, 'revenue')}
          onClick={() => onMetricClick('totalRevenue')}
          isHighlighted={isSignificantChange(revenueChange)}
        />

        {/* MoM Growth */}
        <MetricCard
          title="Month-over-Month Growth"
          value={metrics.momGrowth}
          trend={trends.totalRevenue}
          changePercent={growthChange}
          format="percentage"
          sparklineData={generateSparkline(trends.totalRevenue, 'growth')}
          onClick={() => onMetricClick('momGrowth')}
          isHighlighted={isSignificantChange(growthChange)}
        />
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Notable change (&gt;10%)</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>Increasing</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          <span>Decreasing</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
          <span>Stable</span>
        </div>
      </div>
    </div>
  );
}
