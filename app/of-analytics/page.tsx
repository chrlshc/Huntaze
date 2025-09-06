'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, MessageSquare, 
  Clock, Target, Award, BarChart3, PieChart, Activity 
} from 'lucide-react';
import { analyticsManager, seedMockAnalytics } from '@/lib/of/analytics-manager';
import type { FanAnalytics } from '@/lib/types/onlyfans';

export default function OfAnalyticsPage() {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('30d');
  const [analytics, setAnalytics] = useState<FanAnalytics | null>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Seed mock data on first load
      if (period === '30d') {
        seedMockAnalytics('user123');
      }

      const data = await analyticsManager.getFanAnalytics('user123', period);
      setAnalytics(data);

      const segmentData = await analyticsManager.getFanSegments('user123');
      setSegments(segmentData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">Loading analytics...</div>
        </div>
      </div>
    );
  }

  const { metrics } = analytics;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              OnlyFans Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your performance and optimize your content strategy
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
            {(['24h', '7d', '30d', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {p === '24h' ? '24 Hours' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                +12.5%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${metrics.revenue.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
          </div>

          {/* Total Fans */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                +{metrics.newFans}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.totalFans.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Subscribers</p>
          </div>

          {/* Average Spend */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                +8.2%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${metrics.averageSpendPerFan.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Spend per Fan</p>
          </div>

          {/* Active Conversations */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <MessageSquare className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <span className="flex items-center gap-1 text-sm text-red-600">
                <TrendingDown className="w-4 h-4" />
                -5.1%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.activeConversations}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Conversations</p>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Revenue Breakdown
            </h3>
            
            <div className="space-y-4">
              {/* Subscriptions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subscriptions</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ${metrics.revenue.subscriptions.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${(metrics.revenue.subscriptions / metrics.revenue.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Tips */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tips</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ${metrics.revenue.tips.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full"
                    style={{ width: `${(metrics.revenue.tips / metrics.revenue.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* PPV */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">PPV Content</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ${metrics.revenue.ppv.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-purple-600 h-3 rounded-full"
                    style={{ width: `${(metrics.revenue.ppv / metrics.revenue.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Conversion Rates */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Conversion Rates</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.conversionRates.freeToSaid.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Free → Paid</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.conversionRates.subscriberToPurchaser.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Sub → Buyer</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.conversionRates.ppvOpenRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">PPV Open Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Spenders */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Spenders
            </h3>
            
            <div className="space-y-3">
              {metrics.topSpenders.slice(0, 5).map((spender, index) => (
                <div key={spender.username} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-orange-600' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {spender.username}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Last: {new Date(spender.lastPurchase).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    ${spender.totalSpent.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fan Segments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Fan Segments
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {segments.slice(0, 8).map(segment => (
              <div key={segment.segment} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {segment.segment}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {segment.count}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {segment.percentage.toFixed(1)}% • ${segment.avgSpend.toFixed(0)} avg
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}