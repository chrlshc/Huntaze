'use client';

/**
 * AutomationAnalytics Component
 * Dashboard for automation execution metrics and trends
 * Requirements: 9.1, 9.3, 9.4
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';

interface ExecutionMetrics {
  totalExecutions: number;
  successCount: number;
  failedCount: number;
  partialCount: number;
  successRate: number;
  averageStepsExecuted: number;
}

interface TrendData {
  date: string;
  executions: number;
  successRate: number;
}

interface TriggerBreakdown {
  triggerType: string;
  count: number;
  percentage: number;
}

interface AutomationComparison {
  automationId: string;
  name: string;
  executions: number;
  successRate: number;
}

interface AnalyticsSummary {
  metrics: ExecutionMetrics;
  trends: TrendData[];
  triggerBreakdown: TriggerBreakdown[];
  topAutomations: AutomationComparison[];
}

interface AnalyticsSummaryApi extends Omit<AnalyticsSummary, 'topAutomations'> {
  topAutomations?: AutomationComparison[];
  topPerformers?: Array<{
    automationId: string;
    name: string;
    metrics: ExecutionMetrics;
    rank?: number;
  }>;
}

type TimeRange = '7d' | '30d' | '90d';

export function AutomationAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const emptyMetrics: ExecutionMetrics = {
          totalExecutions: 0,
          successCount: 0,
          failedCount: 0,
          partialCount: 0,
          successRate: 0,
          averageStepsExecuted: 0,
        };

        const endDate = new Date();
        const startDate = new Date(endDate);
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        startDate.setDate(endDate.getDate() - days);

        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: 'summary',
        });

        const data = await internalApiFetch<
          AnalyticsSummaryApi | { success: boolean; data?: AnalyticsSummaryApi; error?: string }
        >(`/api/automations/analytics?${params.toString()}`);

        const rawSummary =
          typeof data === 'object' && data !== null && 'success' in data ? data.data : data;

        if (!rawSummary) {
          setAnalytics(null);
          setError('Failed to load analytics');
          return;
        }

        if (typeof data === 'object' && data !== null && 'success' in data && !data.success) {
          setError(data.error || 'Failed to load analytics');
          return;
        }

        const topAutomations =
          rawSummary.topAutomations ??
          (rawSummary.topPerformers ?? []).map((automation) => ({
            automationId: automation.automationId,
            name: automation.name,
            executions: automation.metrics?.totalExecutions ?? 0,
            successRate: automation.metrics?.successRate ?? 0,
          }));

        setAnalytics({
          metrics: rawSummary.metrics ?? emptyMetrics,
          trends: rawSummary.trends ?? [],
          triggerBreakdown: rawSummary.triggerBreakdown ?? [],
          topAutomations,
        });
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to connect to analytics service');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  // Format percentage
  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Get trigger type label
  const getTriggerLabel = (type: string): string => {
    const labels: Record<string, string> = {
      new_subscriber: 'New Subscriber',
      message_received: 'Message Received',
      purchase_completed: 'Purchase Completed',
      subscription_expiring: 'Subscription Expiring',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Automation Analytics
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track performance and optimize your automations
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'primary' : 'secondary'}
              onClick={() => setTimeRange(range)}
              className="text-sm"
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Executions</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
            {analytics.metrics.totalExecutions.toLocaleString()}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Success Rate</div>
          <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
            {formatPercent(analytics.metrics.successRate)}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Failed</div>
          <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
            {analytics.metrics.failedCount.toLocaleString()}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Steps</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
            {analytics.metrics.averageStepsExecuted.toFixed(1)}
          </div>
        </Card>
      </div>

      {/* Execution Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card className="p-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">Execution Status</h3>
          <div className="space-y-3">
            {/* Success */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Success</span>
                <span className="text-gray-900 dark:text-white">{analytics.metrics.successCount}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${analytics.metrics.totalExecutions > 0 ? (analytics.metrics.successCount / analytics.metrics.totalExecutions) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            {/* Partial */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Partial</span>
                <span className="text-gray-900 dark:text-white">{analytics.metrics.partialCount}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${analytics.metrics.totalExecutions > 0 ? (analytics.metrics.partialCount / analytics.metrics.totalExecutions) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            {/* Failed */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Failed</span>
                <span className="text-gray-900 dark:text-white">{analytics.metrics.failedCount}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${analytics.metrics.totalExecutions > 0 ? (analytics.metrics.failedCount / analytics.metrics.totalExecutions) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Trigger Breakdown */}
        <Card className="p-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">Triggers by Type</h3>
          {analytics.triggerBreakdown.length > 0 ? (
            <div className="space-y-3">
              {analytics.triggerBreakdown.map((trigger) => (
                <div key={trigger.triggerType}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{getTriggerLabel(trigger.triggerType)}</span>
                    <span className="text-gray-900 dark:text-white">{trigger.count} ({formatPercent(trigger.percentage)})</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${trigger.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No trigger data available</p>
          )}
        </Card>
      </div>

      {/* Trends Chart (Simple Bar Representation) */}
      <Card className="p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">Execution Trends</h3>
        {analytics.trends.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-end gap-1 h-32">
              {analytics.trends.slice(-14).map((trend, index) => {
                const maxExecutions = Math.max(...analytics.trends.map(t => t.executions), 1);
                const height = (trend.executions / maxExecutions) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${trend.date}: ${trend.executions} executions`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{analytics.trends[0]?.date}</span>
              <span>{analytics.trends[analytics.trends.length - 1]?.date}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No trend data available</p>
        )}
      </Card>

      {/* Top Automations */}
      <Card className="p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">Top Performing Automations</h3>
        {analytics.topAutomations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 font-medium">Automation</th>
                  <th className="pb-2 font-medium text-right">Executions</th>
                  <th className="pb-2 font-medium text-right">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topAutomations.map((automation) => (
                  <tr key={automation.automationId} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td className="py-3 text-gray-900 dark:text-white">{automation.name}</td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                      {automation.executions.toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        automation.successRate >= 90 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : automation.successRate >= 70
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {formatPercent(automation.successRate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No automation data available</p>
        )}
      </Card>
    </div>
  );
}

export default AutomationAnalytics;
