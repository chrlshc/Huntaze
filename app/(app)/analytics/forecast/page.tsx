'use client';

/**
 * Analytics - Forecast Page
 * Revenue and growth forecasting
 */

export const dynamic = 'force-dynamic';

import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import { 
  ShopifyMetricCard,
  ShopifyMetricGrid,
  ShopifyCard,
  ShopifyBanner,
  ShopifyEmptyState,
} from '@/components/ui/shopify';
import { useMemo } from 'react';
import useSWR from 'swr';
import { useAuthSession } from '@/hooks/useAuthSession';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { formatCurrency, formatPercentage } from '@/lib/dashboard/formatters';
import type { RevenueForecastResponse } from '@/lib/services/revenue/types';
import { TrendingDown, DollarSign, Target, TrendingUp } from 'lucide-react';

export default function ForecastAnalyticsPage() {
  const { user, isAuthenticated, isLoading: sessionLoading } = useAuthSession();

  const forecastKey = user?.id
    ? `/api/revenue/forecast?creatorId=${encodeURIComponent(user.id)}&months=12`
    : null;

  const { data, error, isLoading, mutate } = useSWR<RevenueForecastResponse>(
    forecastKey,
    (url: string) => internalApiFetch<RevenueForecastResponse>(url),
  );

  const series = useMemo(() => {
    const historical = (data?.historical ?? []).map((point) => ({
      month: point.month,
      value: point.revenue,
      type: 'Actual',
      range: null as { min: number; max: number } | null,
    }));
    const forecast = (data?.forecast ?? []).map((point) => ({
      month: point.month,
      value: point.predicted,
      type: 'Forecast',
      range: point.confidence,
    }));
    return [...historical, ...forecast];
  }, [data]);

  const quarterlyForecast = useMemo(() => {
    if (!data?.forecast?.length) return 0;
    return data.forecast.slice(0, 3).reduce((sum, point) => sum + point.predicted, 0);
  }, [data]);

  if (sessionLoading || isLoading) {
    return (
      <ShopifyPageLayout
        title="Revenue Forecast"
        subtitle="AI-powered predictions for future growth"
      >
        <div className="space-y-6">
          <ShopifyMetricGrid>
            <ShopifyMetricCard label="Current month projected" value="—" loading icon={DollarSign} />
            <ShopifyMetricCard label="Current month actual" value="—" loading icon={TrendingUp} />
            <ShopifyMetricCard label="Next month forecast" value="—" loading icon={Target} />
            <ShopifyMetricCard label="Model accuracy" value="—" loading icon={TrendingDown} />
          </ShopifyMetricGrid>
          <ShopifyCard>
            <ShopifyEmptyState
              icon={TrendingUp}
              title="Loading forecast data"
              description="Crunching your latest revenue trends."
            />
          </ShopifyCard>
        </div>
      </ShopifyPageLayout>
    );
  }

  if (!sessionLoading && !isAuthenticated) {
    return (
      <ShopifyPageLayout
        title="Revenue Forecast"
        subtitle="AI-powered predictions for future growth"
      >
        <div className="space-y-6">
          <ShopifyCard>
            <ShopifyEmptyState
              icon={TrendingDown}
              title="Sign in to view forecasts"
              description="Your revenue forecast will appear once you are authenticated."
            />
          </ShopifyCard>
        </div>
      </ShopifyPageLayout>
    );
  }

  if (error) {
    return (
      <ShopifyPageLayout
        title="Revenue Forecast"
        subtitle="AI-powered predictions for future growth"
      >
        <div className="space-y-6">
          <ShopifyCard>
            <ShopifyEmptyState
              icon={TrendingDown}
              title="Unable to load forecast"
              description={error instanceof Error ? error.message : 'Please try again.'}
              action={{ label: 'Retry', onClick: () => void mutate() }}
            />
          </ShopifyCard>
        </div>
      </ShopifyPageLayout>
    );
  }

  if (!data) {
    return (
      <ShopifyPageLayout
        title="Revenue Forecast"
        subtitle="AI-powered predictions for future growth"
      >
        <div className="space-y-6">
          <ShopifyCard>
            <ShopifyEmptyState
              icon={TrendingDown}
              title="No forecast data yet"
              description="Connect your revenue sources to generate a forecast."
            />
          </ShopifyCard>
        </div>
      </ShopifyPageLayout>
    );
  }

  const accuracyPct = data.metadata?.modelAccuracy !== undefined
    ? formatPercentage(data.metadata.modelAccuracy * 100)
    : '—';

  return (
    <ShopifyPageLayout
      title="Revenue Forecast"
      subtitle="AI-powered predictions for future growth"
    >
      <div className="space-y-6">
        {data.currentMonth && (
          <ShopifyBanner
            status={data.currentMonth.onTrack ? 'success' : 'warning'}
            title={data.currentMonth.onTrack ? 'On track this month' : 'Behind forecast this month'}
            description={`Projected ${formatCurrency(data.currentMonth.projected)} vs actual ${formatCurrency(data.currentMonth.actual)} (${data.currentMonth.completion}% complete).`}
          />
        )}

        <ShopifyMetricGrid>
          <ShopifyMetricCard
            label="Current month projected"
            value={formatCurrency(data.currentMonth.projected)}
            icon={DollarSign}
          />
          <ShopifyMetricCard
            label="Current month actual"
            value={formatCurrency(data.currentMonth.actual)}
            icon={TrendingUp}
          />
          <ShopifyMetricCard
            label="Next month forecast"
            value={formatCurrency(data.nextMonth.projected)}
            icon={Target}
          />
          <ShopifyMetricCard
            label="Model accuracy"
            value={accuracyPct}
            icon={TrendingDown}
          />
        </ShopifyMetricGrid>

        <ShopifyCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Forecast timeline</h3>
              <span className="text-sm text-gray-600">
                Next quarter projected: {formatCurrency(quarterlyForecast)}
              </span>
            </div>
            {series.length === 0 ? (
              <ShopifyEmptyState
                icon={TrendingDown}
                title="No forecast points yet"
                description="Generate a forecast once revenue data is available."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="pb-2">Month</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((row) => (
                      <tr key={`${row.type}-${row.month}`} className="border-t border-gray-200">
                        <td className="py-2 font-medium text-gray-900">{row.month}</td>
                        <td className="py-2 text-gray-600">{row.type}</td>
                        <td className="py-2 text-gray-900">{formatCurrency(row.value)}</td>
                        <td className="py-2 text-gray-600">
                          {row.range
                            ? `${formatCurrency(row.range.min)} - ${formatCurrency(row.range.max)}`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ShopifyCard>

        <ShopifyCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
            {data.recommendations?.length ? (
              <div className="space-y-3">
                {data.recommendations.map((rec, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{rec.action}</p>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <div className="font-medium text-gray-900">
                          +{formatCurrency(rec.impact)}
                        </div>
                        <div className="text-xs uppercase">{rec.effort} effort</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ShopifyEmptyState
                icon={Target}
                title="No recommendations yet"
                description="Recommendations will appear when the model has enough data."
              />
            )}
          </div>
        </ShopifyCard>
      </div>
    </ShopifyPageLayout>
  );
}
