'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProductivityMetrics } from '@/lib/services/productivityMetricsService';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface ProductivityDashboardProps {
  userId: string;
}

export default function ProductivityDashboard({ userId }: ProductivityDashboardProps) {
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/content/metrics?userId=${userId}&period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, period]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading metrics...</div>;
  }

  if (!metrics) {
    return <div className="text-center py-8 text-gray-500">No metrics available</div>;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Productivity Dashboard</h2>
        <div className="flex gap-2">
          {['7', '30', '90'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm ${
                period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Last {p} days
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Total Content</div>
          <div className="text-3xl font-bold text-blue-600">{metrics.contentCreated.total}</div>
          <div className="text-xs text-gray-500 mt-2">
            {metrics.productivity.contentPerDay.toFixed(1)} per day
          </div>
        </Card>

        <Card className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Avg. Creation Time</div>
          <div className="text-3xl font-bold text-green-600">
            {metrics.averageCreationTime.overall.toFixed(0)}m
          </div>
          <div className="text-xs text-gray-500 mt-2">minutes per content</div>
        </Card>

        <Card className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Media Uploads</div>
          <div className="text-3xl font-bold text-purple-600">{metrics.mediaUsage.totalUploads}</div>
          <div className="text-xs text-gray-500 mt-2">
            {formatBytes(metrics.mediaUsage.totalSize)}
          </div>
        </Card>

        <Card className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Published</div>
          <div className="text-3xl font-bold text-orange-600">
            {metrics.contentCreated.byStatus.published || 0}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {((metrics.contentCreated.byStatus.published || 0) / metrics.contentCreated.total * 100).toFixed(0)}% of total
          </div>
        </Card>
      </div>

      {/* Content by Period Chart */}
      <Card className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Content Creation Over Time</h3>
        <div className="space-y-2">
          {metrics.contentCreated.byPeriod.slice(0, 10).map((item) => {
            const maxCount = Math.max(...metrics.contentCreated.byPeriod.map(p => p.count));
            const percentage = (item.count / maxCount) * 100;
            
            return (
              <div key={item.date} className="flex items-center gap-3">
                <div className="w-24 text-sm text-gray-600">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1">
                  <div className="w-full h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 flex items-center justify-end pr-2"
                      style={{ width: `${percentage}%` }}
                    >
                      {item.count > 0 && (
                        <span className="text-white text-xs font-medium">{item.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platform Distribution */}
        <Card className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Platform Distribution</h3>
          <div className="space-y-3">
            {Object.entries(metrics.platformDistribution).map(([platform, count]) => {
              const total = Object.values(metrics.platformDistribution).reduce((a, b) => a + b, 0);
              const percentage = (count / total) * 100;
              
              return (
                <div key={platform} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{platform}</span>
                    <span className="text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Template Usage */}
        <Card className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Most Used Templates</h3>
          {metrics.templateUsage.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No templates used yet
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.templateUsage.map((template, idx) => (
                <div key={template.templateId} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-400">#{idx + 1}</span>
                    <span className="text-sm">{template.templateName}</span>
                  </div>
                  <span className="text-sm text-gray-600">{template.usageCount} uses</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Content by Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(metrics.contentCreated.byStatus).map(([status, count]) => (
            <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{status}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
