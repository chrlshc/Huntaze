'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DashboardMetrics {
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  fcp?: number;
  tti?: number;
}

export interface DashboardAlert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  severity: 'warning' | 'critical';
}

export interface HistoricalDataPoint {
  timestamp: Date;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
}

export interface PerformanceDashboardData {
  metrics: DashboardMetrics;
  alerts: DashboardAlert[];
  historical: HistoricalDataPoint[];
  grade: string;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function usePerformanceDashboard(
  refreshInterval: number = 30000
): PerformanceDashboardData {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0
  });
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [historical, setHistorical] = useState<HistoricalDataPoint[]>([]);
  const [grade, setGrade] = useState<string>('N/A');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch performance summary from API
      const response = await fetch('/api/performance/summary');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const data = await response.json();

      // Update metrics
      setMetrics({
        lcp: data.lcp || 0,
        fid: data.fid || 0,
        cls: data.cls || 0,
        ttfb: data.ttfb || 0,
        fcp: data.fcp,
        tti: data.tti
      });

      // Update alerts
      if (data.alerts && Array.isArray(data.alerts)) {
        setAlerts(data.alerts.map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp)
        })));
      }

      // Update historical data
      if (data.historical && Array.isArray(data.historical)) {
        setHistorical(data.historical.map((point: any) => ({
          ...point,
          timestamp: new Date(point.timestamp)
        })));
      }

      // Calculate performance grade
      const calculatedGrade = calculateGrade(data);
      setGrade(calculatedGrade);

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate performance grade based on Web Vitals
  function calculateGrade(data: any): string {
    const scores = {
      lcp: getMetricScore(data.lcp, 2500, 4000),
      fid: getMetricScore(data.fid, 100, 300),
      cls: getMetricScore(data.cls, 0.1, 0.25),
      ttfb: getMetricScore(data.ttfb, 800, 1800)
    };

    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;

    if (avgScore >= 0.9) return 'A';
    if (avgScore >= 0.75) return 'B';
    if (avgScore >= 0.5) return 'C';
    if (avgScore >= 0.25) return 'D';
    return 'F';
  }

  function getMetricScore(value: number, goodThreshold: number, poorThreshold: number): number {
    if (value <= goodThreshold) return 1;
    if (value >= poorThreshold) return 0;
    return 1 - ((value - goodThreshold) / (poorThreshold - goodThreshold));
  }

  // Initial fetch and setup interval
  useEffect(() => {
    fetchDashboardData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchDashboardData]);

  return {
    metrics,
    alerts,
    historical,
    grade,
    isLoading,
    error,
    refresh: fetchDashboardData
  };
}
