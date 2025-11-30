/**
 * Golden Signals Dashboard Component
 * Real-time monitoring dashboard for the 4 Golden Signals
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  MemoryStick, 
  Server, 
  TrendingUp, 
  Users, 
  Zap,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface GoldenSignalsData {
  timestamp: string;
  healthScore: {
    score: number;
    status: 'healthy' | 'degraded' | 'unhealthy';
  };
  goldenSignals: {
    latency: {
      p50: number;
      p95: number;
      p99: number;
      avg: number;
    };
    traffic: {
      requestsPerSecond: number;
      requestsTotal: number;
      activeConnections: number;
    };
    errors: {
      errorRate: number;
      errorsTotal: number;
      errorsByType: Record<string, number>;
    };
    saturation: {
      cpu: {
        usage: number;
        loadAverage: number[];
      };
      memory: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
        external: number;
        usagePercent: number;
      };
      database: {
        activeConnections: number;
        maxConnections: number;
        connectionPoolUsage: number;
      };
      cache: {
        hitRate: number;
        memoryUsage: number;
        evictions: number;
      };
    };
  };
  slos: Array<{
    name: string;
    compliance: number;
    errorBudgetRemaining: number;
    status: 'healthy' | 'warning' | 'critical';
    target: number;
  }>;
  alerts: {
    summary: {
      total: number;
      critical: number;
      warning: number;
      info: number;
    };
    active: Array<{
      id: string;
      name: string;
      severity: 'critical' | 'warning' | 'info';
      description: string;
      value: number;
      threshold: number;
      timestamp: string;
    }>;
  };
}

export function GoldenSignalsDashboard() {
  const [data, setData] = useState<GoldenSignalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/monitoring/golden-signals');
      if (!response.ok) throw new Error('Failed to fetch monitoring data');
      
      const newData = await response.json();
      setData(newData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'critical': case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'warning': case 'degraded': return <AlertTriangle className="w-5 h-5" />;
      case 'critical': case 'unhealthy': return <XCircle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading monitoring data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">Error loading monitoring data: {error}</span>
          <Button variant="danger" onClick={fetchData}>
  Retry
</Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Golden Signals Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring of system health and performance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Auto-refresh</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
          </div>
          <Button variant="primary" onClick={fetchData}>
  <RefreshCw className="w-4 h-4" />
            Refresh
</Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Health Score</h2>
            <p className="text-sm text-gray-600">Overall system health based on Golden Signals</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{data.healthScore.score}/100</div>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(data.healthScore.status)}`}>
                {getStatusIcon(data.healthScore.status)}
                {data.healthScore.status.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Golden Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. LATENCY */}
        <Card className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Latency</h3>
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">P50</span>
              <span className="font-medium">{formatDuration(data.goldenSignals.latency.p50)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">P95</span>
              <span className="font-medium">{formatDuration(data.goldenSignals.latency.p95)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">P99</span>
              <span className="font-medium">{formatDuration(data.goldenSignals.latency.p99)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average</span>
              <span className="font-medium">{formatDuration(data.goldenSignals.latency.avg)}</span>
            </div>
          </div>
        </Card>

        {/* 2. TRAFFIC */}
        <Card className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Traffic</h3>
            <Globe className="w-6 h-6 text-green-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">RPS</span>
              <span className="font-medium">{data.goldenSignals.traffic.requestsPerSecond.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Requests</span>
              <span className="font-medium">{data.goldenSignals.traffic.requestsTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Connections</span>
              <span className="font-medium">{data.goldenSignals.traffic.activeConnections}</span>
            </div>
          </div>
        </Card>

        {/* 3. ERRORS */}
        <Card className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Errors</h3>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="font-medium">{data.goldenSignals.errors.errorRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Errors</span>
              <span className="font-medium">{data.goldenSignals.errors.errorsTotal}</span>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              {Object.entries(data.goldenSignals.errors.errorsByType).map(([type, count]) => (
                <div key={type} className="flex justify-between">
                  <span>{type}:</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 4. SATURATION */}
        <Card className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Saturation</h3>
            <Server className="w-6 h-6 text-purple-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Memory</span>
              <span className="font-medium">{data.goldenSignals.saturation.memory.usagePercent.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cache Hit Rate</span>
              <span className="font-medium">{data.goldenSignals.saturation.cache.hitRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">DB Connections</span>
              <span className="font-medium">{data.goldenSignals.saturation.database.activeConnections}/{data.goldenSignals.saturation.database.maxConnections}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* SLOs */}
      <Card className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Level Objectives (SLOs)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.slos.map((slo) => (
            <div key={slo.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{slo.name}</h4>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(slo.status)}`}>
                  {getStatusIcon(slo.status)}
                  {slo.status.toUpperCase()}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Compliance</span>
                  <span className="font-medium">{slo.compliance.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Target</span>
                  <span className="font-medium">{slo.target}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Error Budget</span>
                  <span className="font-medium">{slo.errorBudgetRemaining.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Active Alerts */}
      {data.alerts.summary.total > 0 && (
        <Card className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Total: {data.alerts.summary.total}</span>
              {data.alerts.summary.critical > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                  {data.alerts.summary.critical} Critical
                </span>
              )}
              {data.alerts.summary.warning > 0 && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                  {data.alerts.summary.warning} Warning
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {data.alerts.active.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-full ${getStatusColor(alert.severity)}`}>
                    {getStatusIcon(alert.severity)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{alert.name}</div>
                    <div className="text-sm text-gray-600">{alert.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{alert.value} / {alert.threshold}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
}