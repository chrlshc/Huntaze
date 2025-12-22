'use client';

/**
 * Fans Detail Page - Drill-down from main analytics
 * 
 * Shows detailed top spenders analysis with spending patterns and engagement.
 */

import { useState } from 'react';
import useSWR from 'swr';
import { AnalyticsCard } from '../components/AnalyticsCard';
import { AnalyticsToolbar } from '../components/AnalyticsToolbar';
import { formatCurrency, formatNumber } from '@/lib/dashboard/formatters';
import { fetchFinanceData, getErrorMessage } from '@/lib/dashboard/api';
import type { DateRange } from '@/lib/dashboard/types';

export default function FansDetailPage() {
  const [dateRange, setDateRange] = useState<DateRange>({ type: 'preset', preset: '30d' });

  const { data, error, isLoading, mutate } = useSWR(
    ['fans-detail', dateRange],
    () => fetchFinanceData(dateRange),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AnalyticsToolbar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          lastSyncAt={new Date().toISOString()}
          onExport={() => {}}
        />
        <div className="px-6 py-6">
          <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AnalyticsToolbar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          lastSyncAt={new Date().toISOString()}
          onExport={() => {}}
        />
        <div className="px-6 py-6">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Data temporarily unavailable
            </h3>
            <p className="text-sm text-gray-600 mb-4">{getErrorMessage(error)}</p>
            <button
              onClick={() => mutate()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const whales = data?.whales ?? [];

  if (!data || whales.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AnalyticsToolbar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          lastSyncAt={new Date().toISOString()}
          onExport={() => {}}
        />
        <div className="px-6 py-6">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No fans data available
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Try selecting a different date range.
            </p>
            <button
              onClick={() => mutate()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalSpent = whales.reduce((sum, w) => sum + w.totalSpent, 0);
  const avgSpent = whales.length > 0 ? totalSpent / whales.length : 0;
  const onlineCount = whales.filter((w) => w.isOnline).length;
  const priorityCount = whales.filter((w) => w.aiPriority === 'high').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <AnalyticsToolbar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        lastSyncAt={new Date().toISOString()}
        onExport={() => {}}
      />

      <div className="px-6 py-6 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Top Spenders</h1>
        <p className="text-sm text-gray-600 mt-1">Detailed analysis of your highest-value fans</p>
      </div>

      <div className="px-6 py-6">
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <AnalyticsCard title="Total Fans" padding="md">
              <div className="text-3xl font-bold text-gray-900 tabular-nums">
                {formatNumber(whales.length)}
              </div>
            </AnalyticsCard>
            <AnalyticsCard title="Total Spent" padding="md">
              <div className="text-3xl font-bold text-gray-900 tabular-nums">
                {formatCurrency(totalSpent)}
              </div>
            </AnalyticsCard>
            <AnalyticsCard title="Average Spent" padding="md">
              <div className="text-3xl font-bold text-gray-900 tabular-nums">
                {formatCurrency(avgSpent)}
              </div>
            </AnalyticsCard>
            <AnalyticsCard title="Online Now" padding="md">
              <div className="text-3xl font-bold text-emerald-600 tabular-nums">
                {formatNumber(onlineCount)}
              </div>
            </AnalyticsCard>
          </div>

          {/* Top Spenders List */}
          <AnalyticsCard
            title="Top Spenders Ranking"
            subtitle="Ranked by total spending"
          >
            <div className="space-y-3">
              {whales.map((whale, index) => {
                const lastPurchaseAtMs = whale.lastPurchaseAt
                  ? new Date(whale.lastPurchaseAt).getTime()
                  : Number.NaN;
                const daysSinceLastPurchase = Number.isFinite(lastPurchaseAtMs)
                  ? Math.floor((Date.now() - lastPurchaseAtMs) / (1000 * 60 * 60 * 24))
                  : null;
                const lastPurchaseLabel =
                  daysSinceLastPurchase === null
                    ? '—'
                    : daysSinceLastPurchase === 0
                    ? 'Today'
                    : `${daysSinceLastPurchase} days ago`;

                return (
                  <div key={whale.fanId} className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-4">
                      {/* Rank Badge */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                          : index === 1
                          ? 'bg-gray-200 text-gray-700 border-2 border-gray-300'
                          : index === 2
                          ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        #{index + 1}
                      </div>

                      {/* Fan Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-gray-900">{whale.name}</h3>
                              {whale.isOnline && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                  Online
                                </span>
                              )}
                              {whale.aiPriority === 'high' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                                  🎯 Priority
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Last purchase: {lastPurchaseLabel}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900 tabular-nums">
                              {formatCurrency(whale.totalSpent)}
                            </div>
                            <p className="text-xs text-gray-600">total spent</p>
                          </div>
                        </div>

                        {/* Engagement Indicators */}
                        <div className="flex items-center gap-2 mt-3">
                          {daysSinceLastPurchase !== null && daysSinceLastPurchase <= 7 && (
                            <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                              🔥 Active
                            </span>
                          )}
                          {daysSinceLastPurchase !== null && daysSinceLastPurchase > 30 && (
                            <span className="text-xs px-2 py-1 bg-rose-50 text-rose-700 rounded border border-rose-200">
                              ⚠️ Inactive
                            </span>
                          )}
                          {whale.totalSpent >= avgSpent * 2 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200">
                              ⭐ High Value
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AnalyticsCard>

          {/* Insights */}
          <AnalyticsCard
            title="Fan Insights"
            subtitle="Key observations about your top spenders"
          >
            <div className="space-y-3">
              {/* Top spender insight */}
              {whales[0] && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🏆</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {whales[0].name} is your top spender
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Contributing {formatCurrency(whales[0].totalSpent)} in total revenue
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Online fans insight */}
              {onlineCount > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">💚</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {onlineCount} high-value {onlineCount === 1 ? 'fan is' : 'fans are'} online now
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Great time to engage with personalized messages
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Priority fans insight */}
              {priorityCount > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🎯</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {priorityCount} {priorityCount === 1 ? 'fan is' : 'fans are'} marked as priority
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        AI will prioritize responses to these high-value fans
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AnalyticsCard>
        </div>
      </div>
    </div>
  );
}
