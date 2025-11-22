/**
 * Example Monitoring Dashboard Component
 * 
 * Demonstrates how to use the useMonitoringMetrics hook to build
 * a real-time monitoring dashboard.
 * 
 * @example
 * ```typescript
 * import { MonitoringDashboard } from '@/app/api/monitoring/metrics/example-component';
 * 
 * export default function Page() {
 *   return <MonitoringDashboard />;
 * }
 * ```
 */

'use client';

import { useMonitoringMetrics } from '@/hooks/useMonitoringMetrics';
import { AlertCircle, Activity, Database, Zap, RefreshCw } from 'lucide-react';

/**
 * Monitoring Dashboard Component
 */
export function MonitoringDashboard() {
  const {
    metrics,
    alarms,
    isLoading,
    error,
    refresh,
    lastFetched,
    isRefreshing,
  } = useMonitoringMetrics({
    refreshInterval: 30000, // Refresh every 30 seconds
    onError: (error) => {
      console.error('Failed to fetch metrics:', error);
    },
  });

  if (isLoading) {
    return (
      <div className="monitoring-dashboard loading">
        <div className="loading-spinner">
          <RefreshCw className="animate-spin" />
          <p>Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="monitoring-dashboard error">
        <div className="error-card">
          <AlertCircle className="error-icon" />
          <h2>Failed to Load Metrics</h2>
          <p>{error.message}</p>
          {error.correlationId && (
            <p className="correlation-id">
              Correlation ID: {error.correlationId}
            </p>
          )}
          <button onClick={refresh} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="monitoring-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>System Monitoring</h1>
        <div className="header-actions">
          {lastFetched && (
            <span className="last-updated">
              Last updated: {lastFetched.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="btn-refresh"
          >
            <RefreshCw className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Alarms Section */}
      {alarms.length > 0 && (
        <div className="alarms-section">
          <h2>Active Alarms</h2>
          <div className="alarms-grid">
            {alarms.map((alarm, index) => (
              <div
                key={index}
                className={`alarm-card alarm-${alarm.state.toLowerCase()}`}
              >
                <div className="alarm-header">
                  <AlertCircle className="alarm-icon" />
                  <span className="alarm-name">{alarm.name}</span>
                  <span className={`alarm-state state-${alarm.state.toLowerCase()}`}>
                    {alarm.state}
                  </span>
                </div>
                <p className="alarm-reason">{alarm.reason}</p>
                <span className="alarm-time">
                  Updated: {new Date(alarm.updatedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="metrics-grid">
        {/* Requests Metrics */}
        <div className="metric-card">
          <div className="metric-header">
            <Activity className="metric-icon" />
            <h3>Requests</h3>
          </div>
          <div className="metric-stats">
            <div className="stat">
              <span className="stat-label">Total</span>
              <span className="stat-value">
                {metrics.requests.total.toLocaleString()}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Avg Latency</span>
              <span className="stat-value">
                {metrics.requests.averageLatency.toFixed(0)}ms
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Error Rate</span>
              <span
                className={`stat-value ${
                  metrics.requests.errorRate > 5 ? 'stat-error' : 'stat-success'
                }`}
              >
                {metrics.requests.errorRate.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Connections Metrics */}
        <div className="metric-card">
          <div className="metric-header">
            <Zap className="metric-icon" />
            <h3>Connections</h3>
          </div>
          <div className="metric-stats">
            <div className="stat">
              <span className="stat-label">Active</span>
              <span className="stat-value stat-large">
                {metrics.connections.active}
              </span>
            </div>
          </div>
        </div>

        {/* Cache Metrics */}
        <div className="metric-card">
          <div className="metric-header">
            <Database className="metric-icon" />
            <h3>Cache</h3>
          </div>
          <div className="metric-stats">
            <div className="stat">
              <span className="stat-label">Hits</span>
              <span className="stat-value stat-success">
                {metrics.cache.hits.toLocaleString()}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Misses</span>
              <span className="stat-value">
                {metrics.cache.misses.toLocaleString()}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Hit Rate</span>
              <span className="stat-value">
                {(
                  (metrics.cache.hits /
                    (metrics.cache.hits + metrics.cache.misses || 1)) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
          </div>
        </div>

        {/* Database Metrics */}
        <div className="metric-card">
          <div className="metric-header">
            <Database className="metric-icon" />
            <h3>Database</h3>
          </div>
          <div className="metric-stats">
            <div className="stat">
              <span className="stat-label">Queries</span>
              <span className="stat-value">
                {metrics.database.queries.toLocaleString()}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Avg Latency</span>
              <span className="stat-value">
                {metrics.database.averageLatency.toFixed(0)}ms
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Success Rate</span>
              <span
                className={`stat-value ${
                  metrics.database.successRate < 95
                    ? 'stat-error'
                    : 'stat-success'
                }`}
              >
                {metrics.database.successRate.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Metrics Widget
 * 
 * Smaller version for embedding in other pages
 */
export function MetricsWidget() {
  const { metrics, isLoading, error } = useMonitoringMetrics({
    refreshInterval: 60000, // Refresh every minute
  });

  if (isLoading || error || !metrics) {
    return null;
  }

  return (
    <div className="metrics-widget">
      <div className="widget-stat">
        <span className="widget-label">Requests</span>
        <span className="widget-value">{metrics.requests.total}</span>
      </div>
      <div className="widget-stat">
        <span className="widget-label">Latency</span>
        <span className="widget-value">
          {metrics.requests.averageLatency.toFixed(0)}ms
        </span>
      </div>
      <div className="widget-stat">
        <span className="widget-label">Errors</span>
        <span
          className={`widget-value ${
            metrics.requests.errorRate > 5 ? 'widget-error' : ''
          }`}
        >
          {metrics.requests.errorRate.toFixed(1)}%
        </span>
      </div>
      <div className="widget-stat">
        <span className="widget-label">Active</span>
        <span className="widget-value">{metrics.connections.active}</span>
      </div>
    </div>
  );
}

/**
 * Example CSS (add to your global styles or component CSS module)
 */
export const exampleStyles = `
.monitoring-dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.last-updated {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  border-color: var(--border-emphasis);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.alarms-section {
  margin-bottom: 2rem;
}

.alarms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.alarm-card {
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}

.alarm-card.alarm-alarm {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.alarm-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.alarm-state {
  margin-left: auto;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.state-alarm {
  background: #ef4444;
  color: white;
}

.state-ok {
  background: #22c55e;
  color: white;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.metric-icon {
  width: 24px;
  height: 24px;
  color: var(--brand-primary);
}

.metric-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-value.stat-large {
  font-size: 2rem;
}

.stat-value.stat-success {
  color: #22c55e;
}

.stat-value.stat-error {
  color: #ef4444;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
  text-align: center;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: #ef4444;
}

.btn-retry {
  padding: 0.75rem 1.5rem;
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
}

.metrics-widget {
  display: flex;
  gap: 1.5rem;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}

.widget-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.widget-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.widget-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.widget-value.widget-error {
  color: #ef4444;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
`;
