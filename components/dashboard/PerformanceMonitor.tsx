'use client';

import { useState, useEffect } from 'react';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMonitoring';
import { Activity, TrendingUp, Zap, MousePointer } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

/**
 * Performance Monitor Dashboard Component
 * 
 * Displays real-time performance metrics for development and debugging
 * Only visible in development mode
 * 
 * Requirements: 15.1, 15.2, 15.5
 */
export function PerformanceMonitorDashboard() {
  const { getMetrics, getSummary } = usePerformanceMetrics();
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState(getSummary());

  // Update summary every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(getSummary());
    }, 2000);

    return () => clearInterval(interval);
  }, [getSummary]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999] w-12 h-12 bg-[var(--color-indigo)] text-white rounded-full shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center"
        title="Performance Monitor"
      >
        <Activity className="w-6 h-6" />
      </button>

      {/* Dashboard Panel */}
      {isOpen && (
        <div
          className="fixed left-0 right-0 bottom-6 z-[9998] flex justify-center pointer-events-none"
          aria-live="polite"
        >
          <Card className="pointer-events-auto w-[420px] bg-[var(--bg-surface)] rounded-[var(--radius-card)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-[var(--color-indigo)] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                <h3 className="font-semibold">Performance Monitor</h3>
              </div>
              <Button 
                variant="primary" 
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Metrics */}
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {/* API Metrics */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-main)]">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  API Performance
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard
                    label="Total Requests"
                    value={summary?.totalAPIRequests ?? 0}
                    color="blue"
                  />
                  <MetricCard
                    label="Avg Response"
                    value={`${summary?.averageAPITime ?? 0}ms`}
                    color="blue"
                  />
                  <MetricCard
                    label="Slow Requests"
                    value={summary?.slowAPIRequests ?? 0}
                    color={Number(summary?.slowAPIRequests ?? 0) > 0 ? 'red' : 'green'}
                  />
                  <MetricCard
                    label="Failed"
                    value={summary?.failedAPIRequests ?? 0}
                    color={Number(summary?.failedAPIRequests ?? 0) > 0 ? 'red' : 'green'}
                  />
                </div>
              </div>

              {/* Scroll Performance */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-main)]">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Scroll Performance
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <MetricCard
                    label="Average FPS"
                    value={summary?.averageFPS ?? 0}
                    color={Number(summary?.averageFPS ?? 0) >= 50 ? 'green' : Number(summary?.averageFPS ?? 0) >= 30 ? 'yellow' : 'red'}
                    fullWidth
                  />
                </div>
              </div>

              {/* User Interactions */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-main)]">
                  <MousePointer className="w-4 h-4 text-purple-500" />
                  User Interactions
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <MetricCard
                    label="Total Interactions"
                    value={summary?.totalInteractions ?? 0}
                    color="purple"
                    fullWidth
                  />
                </div>
              </div>

              {/* Recent API Calls */}
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[var(--color-text-main)]">
                  Recent API Calls
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {getMetrics().api.slice(-5).reverse().map((api, index) => (
                    <div
                      key={index}
                      className="text-xs bg-gray-50 rounded p-2 font-mono"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{api.method}</span>
                        <span className={api.success ? 'text-green-600' : 'text-red-600'}>
                          {api.status}
                        </span>
                      </div>
                      <div className="text-gray-600 truncate">{api.endpoint}</div>
                      <div className="text-gray-500 mt-1">
                        {api.duration.toFixed(0)}ms
                      </div>
                    </div>
                  ))}
                  {getMetrics().api.length === 0 && (
                    <div className="text-xs text-gray-500 text-center py-4">
                      No API calls yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-xs text-gray-600">
              Development Mode Only
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({
  label,
  value,
  color,
  fullWidth = false,
}: {
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  fullWidth?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div
      className={`${colorClasses[color]} border rounded-lg p-3 ${fullWidth ? 'col-span-2' : ''}`}
    >
      <div className="text-xs opacity-75 mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
