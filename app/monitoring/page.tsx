'use client';

import { useEffect, useState } from 'react';

interface MetricData {
  timestamp: string;
  metric: string;
  value: number;
  tags?: Record<string, string>;
}

interface Alert {
  id: string;
  name: string;
  message: string;
  severity: 'warning' | 'error' | 'critical';
  timestamp: string;
  resolved: boolean;
}

interface MetricsSummary {
  oauth: {
    success: Record<string, number>;
    failure: Record<string, number>;
  };
  upload: {
    success: Record<string, number>;
    failure: Record<string, number>;
  };
  webhook: {
    received: Record<string, number>;
    processed: Record<string, number>;
    avgLatency: Record<string, number>;
  };
  tokenRefresh: {
    success: Record<string, number>;
    failure: Record<string, number>;
  };
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch metrics
      const metricsResponse = await fetch('/api/monitoring/metrics');
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData.metrics || []);
      setSummary(metricsData.summary || null);

      // Fetch alerts
      const alertsResponse = await fetch('/api/monitoring/alerts');
      const alertsData = await alertsResponse.json();
      setAlerts(alertsData.alerts || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const calculateSuccessRate = (success: number, failure: number): string => {
    const total = success + failure;
    if (total === 0) return 'N/A';
    return `${((success / total) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Monitoring Dashboard</h1>
          <p>Loading metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">🚨</span>
              Active Alerts ({alerts.length})
            </h2>
            <div className="space-y-3">
              {alerts.map((alert) => {
                const bgColor = {
                  warning: 'bg-yellow-50 border-yellow-200',
                  error: 'bg-red-50 border-red-200',
                  critical: 'bg-red-100 border-red-400',
                }[alert.severity];

                const textColor = {
                  warning: 'text-yellow-800',
                  error: 'text-red-800',
                  critical: 'text-red-900',
                }[alert.severity];

                return (
                  <div
                    key={alert.id}
                    className={`border-l-4 p-4 ${bgColor}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-semibold ${textColor}`}>
                          {alert.severity.toUpperCase()}: {alert.name}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {summary && (
          <div className="space-y-6">
            {/* OAuth Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">OAuth Flow</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.keys(summary.oauth.success).map((platform) => {
                  const success = summary.oauth.success[platform] || 0;
                  const failure = summary.oauth.failure[platform] || 0;
                  const rate = calculateSuccessRate(success, failure);
                  
                  return (
                    <div key={platform} className="border rounded p-4">
                      <h3 className="font-medium text-gray-700 capitalize mb-2">
                        {platform}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-green-600">Success: {success}</p>
                        <p className="text-red-600">Failure: {failure}</p>
                        <p className="font-semibold">Rate: {rate}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upload Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Success Rates</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.keys(summary.upload.success).map((platform) => {
                  const success = summary.upload.success[platform] || 0;
                  const failure = summary.upload.failure[platform] || 0;
                  const rate = calculateSuccessRate(success, failure);
                  
                  return (
                    <div key={platform} className="border rounded p-4">
                      <h3 className="font-medium text-gray-700 capitalize mb-2">
                        {platform}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-green-600">Success: {success}</p>
                        <p className="text-red-600">Failure: {failure}</p>
                        <p className="font-semibold">Rate: {rate}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Webhook Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Webhook Processing</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.keys(summary.webhook.received).map((platform) => {
                  const received = summary.webhook.received[platform] || 0;
                  const processed = summary.webhook.processed[platform] || 0;
                  const avgLatency = summary.webhook.avgLatency[platform] || 0;
                  
                  return (
                    <div key={platform} className="border rounded p-4">
                      <h3 className="font-medium text-gray-700 capitalize mb-2">
                        {platform}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p>Received: {received}</p>
                        <p>Processed: {processed}</p>
                        <p>Avg Latency: {avgLatency.toFixed(0)}ms</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Token Refresh Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Token Refresh</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.keys(summary.tokenRefresh.success).map((platform) => {
                  const success = summary.tokenRefresh.success[platform] || 0;
                  const failure = summary.tokenRefresh.failure[platform] || 0;
                  const rate = calculateSuccessRate(success, failure);
                  
                  return (
                    <div key={platform} className="border rounded p-4">
                      <h3 className="font-medium text-gray-700 capitalize mb-2">
                        {platform}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-green-600">Success: {success}</p>
                        <p className="text-red-600">Failure: {failure}</p>
                        <p className="font-semibold">Rate: {rate}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Timestamp
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Metric
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Value
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Tags
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metrics.slice(-20).reverse().map((metric, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {new Date(metric.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {metric.metric}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {metric.value}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {metric.tags ? JSON.stringify(metric.tags) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!summary && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">No metrics available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
