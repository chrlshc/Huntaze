'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useWebVitals } from '@/hooks/useWebVitals';
import { Card } from '@/components/ui/card';

interface PerformanceMetric {
  name: string;
  value: number;
  threshold: number;
  unit: string;
  status: 'good' | 'needs-improvement' | 'poor';
}

interface Alert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  severity: 'warning' | 'critical';
}

interface HistoricalData {
  timestamp: Date;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
}

interface PerformanceDashboardProps {
  refreshInterval?: number; // in milliseconds
  showHistorical?: boolean;
}

function getMetricStatus(
  value: number,
  goodThreshold: number,
  poorThreshold: number
): 'good' | 'needs-improvement' | 'poor' {
  if (value <= goodThreshold) return 'good';
  if (value <= poorThreshold) return 'needs-improvement';
  return 'poor';
}

function calculatePerformanceGrade(metrics: PerformanceMetric[]): string {
  const goodCount = metrics.filter(m => m.status === 'good').length;
  const totalCount = metrics.length;
  const score = goodCount / totalCount;
  
  if (score >= 0.9) return 'A';
  if (score >= 0.75) return 'B';
  if (score >= 0.5) return 'C';
  if (score >= 0.25) return 'D';
  return 'F';
}

export function PerformanceDashboard({ 
  refreshInterval = 30000,
  showHistorical = true 
}: PerformanceDashboardProps) {
  const { vitals: webVitals } = useWebVitals();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [performanceGrade, setPerformanceGrade] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch metrics from CloudWatch
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/performance/summary');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      const data = await response.json();
      
      // Transform CloudWatch metrics to dashboard format
      const transformedMetrics: PerformanceMetric[] = [
        {
          name: 'LCP',
          value: data.lcp || webVitals.lcp || 0,
          threshold: 2500,
          unit: 'ms',
          status: getMetricStatus(data.lcp || webVitals.lcp || 0, 2500, 4000)
        },
        {
          name: 'FID',
          value: data.fid || webVitals.fid || 0,
          threshold: 100,
          unit: 'ms',
          status: getMetricStatus(data.fid || webVitals.fid || 0, 100, 300)
        },
        {
          name: 'CLS',
          value: data.cls || webVitals.cls || 0,
          threshold: 0.1,
          unit: '',
          status: getMetricStatus(data.cls || webVitals.cls || 0, 0.1, 0.25)
        },
        {
          name: 'TTFB',
          value: data.ttfb || webVitals.ttfb || 0,
          threshold: 800,
          unit: 'ms',
          status: getMetricStatus(data.ttfb || webVitals.ttfb || 0, 800, 1800)
        }
      ];
      
      setMetrics(transformedMetrics);
      
      // Calculate performance grade
      const grade = calculatePerformanceGrade(transformedMetrics);
      setPerformanceGrade(grade);
      
      // Fetch alerts
      if (data.alerts) {
        setAlerts(data.alerts);
      }
      
      // Fetch historical data
      if (showHistorical && data.historical) {
        setHistoricalData(data.historical);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      setIsLoading(false);
    }
  }, [showHistorical, webVitals]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  // Get color for metric status
  function getStatusColor(status: string): string {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  // Get color for performance grade
  function getGradeColor(grade: string): string {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Grade */}
      <Card className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <div className={`text-4xl font-bold px-6 py-3 rounded-lg ${getGradeColor(performanceGrade)}`}>
            {performanceGrade}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Real-time performance metrics from CloudWatch
        </p>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">{metric.name}</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(metric.status)}`}>
                {metric.status.replace('-', ' ')}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)}
              <span className="text-lg text-gray-500 ml-1">{metric.unit}</span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Threshold: {metric.threshold}{metric.unit}
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  metric.status === 'good' ? 'bg-green-500' :
                  metric.status === 'needs-improvement' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ 
                  width: `${Math.min((metric.value / (metric.threshold * 2)) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'critical' 
                    ? 'bg-red-50 border-red-500' 
                    : 'bg-yellow-50 border-yellow-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {alert.metric} exceeded threshold
                    </p>
                    <p className="text-sm text-gray-600">
                      Current: {alert.value} | Threshold: {alert.threshold}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Historical Trends */}
      {showHistorical && historicalData.length > 0 && (
        <Card className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Showing last {historicalData.length} data points
            </p>
            {/* Simple text-based trend visualization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded">
                <h4 className="text-sm font-medium text-gray-700 mb-2">LCP Trend</h4>
                <div className="text-xs text-gray-600">
                  {historicalData.slice(-5).map((data, idx) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span>{new Date(data.timestamp).toLocaleTimeString()}</span>
                      <span className="font-mono">{data.lcp.toFixed(0)}ms</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <h4 className="text-sm font-medium text-gray-700 mb-2">CLS Trend</h4>
                <div className="text-xs text-gray-600">
                  {historicalData.slice(-5).map((data, idx) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span>{new Date(data.timestamp).toLocaleTimeString()}</span>
                      <span className="font-mono">{data.cls.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
