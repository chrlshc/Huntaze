/**
 * Golden Signals Monitoring API
 * Exposes the 4 Golden Signals metrics and SLO status
 */

import { NextRequest, NextResponse } from 'next/server';
import { goldenSignals, getTelemetryHealth } from '@/lib/monitoring/telemetry';
import { alertManager } from '@/lib/monitoring/alerting';
import { withTelemetry } from '@/lib/monitoring/telemetry';

async function goldenSignalsHandler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '1h';
    const format = url.searchParams.get('format') || 'json';

    // Get current system metrics (Golden Signals)
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Simulate metrics (in production, these would come from your metrics backend)
    const goldenSignalsData = {
      // 1. LATENCY
      latency: {
        p50: Math.random() * 200 + 50, // 50-250ms
        p95: Math.random() * 500 + 200, // 200-700ms
        p99: Math.random() * 1000 + 500, // 500-1500ms
        avg: Math.random() * 150 + 75, // 75-225ms
      },
      
      // 2. TRAFFIC
      traffic: {
        requestsPerSecond: Math.random() * 50 + 10, // 10-60 RPS
        requestsTotal: Math.floor(Math.random() * 10000 + 5000), // 5k-15k total
        activeConnections: Math.floor(Math.random() * 100 + 20), // 20-120 connections
      },
      
      // 3. ERRORS
      errors: {
        errorRate: Math.random() * 5, // 0-5% error rate
        errorsTotal: Math.floor(Math.random() * 100), // 0-100 errors
        errorsByType: {
          '4xx': Math.floor(Math.random() * 50),
          '5xx': Math.floor(Math.random() * 20),
          timeout: Math.floor(Math.random() * 10),
          database: Math.floor(Math.random() * 5),
        },
      },
      
      // 4. SATURATION
      saturation: {
        cpu: {
          usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
          loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0],
        },
        memory: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          rss: memUsage.rss,
          external: memUsage.external,
          usagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        },
        database: {
          activeConnections: Math.floor(Math.random() * 20 + 5), // 5-25 connections
          maxConnections: 100,
          connectionPoolUsage: Math.random() * 50 + 10, // 10-60%
        },
        cache: {
          hitRate: Math.random() * 40 + 60, // 60-100% hit rate
          memoryUsage: Math.random() * 500 + 100, // 100-600MB
          evictions: Math.floor(Math.random() * 10), // 0-10 evictions
        },
      },
    };

    // Get SLO status
    const slos = alertManager.getSLOs();
    const sloStatus = await Promise.all(
      slos.map(async (slo) => ({
        name: slo.name,
        ...await alertManager.calculateSLOCompliance(slo.name),
        target: slo.target,
        window: slo.window,
      }))
    );

    // Get active alerts
    const activeAlerts = alertManager.getActiveAlerts();
    const alertSummary = {
      total: activeAlerts.length,
      critical: activeAlerts.filter(a => a.rule.severity === 'critical').length,
      warning: activeAlerts.filter(a => a.rule.severity === 'warning').length,
      info: activeAlerts.filter(a => a.rule.severity === 'info').length,
    };

    // Calculate overall health score
    const healthScore = calculateHealthScore(goldenSignalsData, sloStatus, activeAlerts);

    const response = {
      timestamp: new Date().toISOString(),
      timeRange,
      healthScore,
      goldenSignals: goldenSignalsData,
      slos: sloStatus,
      alerts: {
        summary: alertSummary,
        active: activeAlerts.map(alert => ({
          id: alert.id,
          name: alert.rule.name,
          severity: alert.rule.severity,
          description: alert.rule.description,
          value: alert.value,
          threshold: alert.rule.threshold,
          timestamp: alert.timestamp,
          runbook: alert.rule.runbook,
        })),
      },
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV,
      },
    };

    // Return Prometheus format if requested
    if (format === 'prometheus') {
      const prometheusMetrics = formatPrometheusMetrics(goldenSignalsData);
      return new NextResponse(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        },
      });
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Golden Signals API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch golden signals',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

function calculateHealthScore(
  goldenSignals: any,
  slos: any[],
  alerts: any[]
): { score: number; status: 'healthy' | 'degraded' | 'unhealthy' } {
  let score = 100;

  // Deduct points for high latency
  if (goldenSignals.latency.p95 > 1000) score -= 20;
  else if (goldenSignals.latency.p95 > 500) score -= 10;

  // Deduct points for high error rate
  if (goldenSignals.errors.errorRate > 5) score -= 30;
  else if (goldenSignals.errors.errorRate > 1) score -= 15;

  // Deduct points for high resource usage
  if (goldenSignals.saturation.memory.usagePercent > 90) score -= 25;
  else if (goldenSignals.saturation.memory.usagePercent > 80) score -= 10;

  // Deduct points for low cache hit rate
  if (goldenSignals.saturation.cache.hitRate < 70) score -= 15;
  else if (goldenSignals.saturation.cache.hitRate < 85) score -= 5;

  // Deduct points for SLO violations
  slos.forEach(slo => {
    if (slo.status === 'critical') score -= 20;
    else if (slo.status === 'warning') score -= 10;
  });

  // Deduct points for active alerts
  alerts.forEach(alert => {
    if (alert.rule.severity === 'critical') score -= 15;
    else if (alert.rule.severity === 'warning') score -= 5;
  });

  score = Math.max(0, Math.min(100, score));

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (score >= 80) status = 'healthy';
  else if (score >= 60) status = 'degraded';
  else status = 'unhealthy';

  return { score, status };
}

function formatPrometheusMetrics(goldenSignals: any): string {
  const timestamp = Date.now();
  
  return `
# HELP http_request_duration_seconds HTTP request latency
# TYPE http_request_duration_seconds histogram
http_request_duration_p50 ${goldenSignals.latency.p50 / 1000} ${timestamp}
http_request_duration_p95 ${goldenSignals.latency.p95 / 1000} ${timestamp}
http_request_duration_p99 ${goldenSignals.latency.p99 / 1000} ${timestamp}

# HELP http_requests_per_second HTTP request rate
# TYPE http_requests_per_second gauge
http_requests_per_second ${goldenSignals.traffic.requestsPerSecond} ${timestamp}

# HELP http_error_rate HTTP error rate percentage
# TYPE http_error_rate gauge
http_error_rate ${goldenSignals.errors.errorRate} ${timestamp}

# HELP memory_usage_bytes Memory usage in bytes
# TYPE memory_usage_bytes gauge
memory_usage_bytes{type="heap_used"} ${goldenSignals.saturation.memory.heapUsed} ${timestamp}
memory_usage_bytes{type="heap_total"} ${goldenSignals.saturation.memory.heapTotal} ${timestamp}
memory_usage_bytes{type="rss"} ${goldenSignals.saturation.memory.rss} ${timestamp}

# HELP cache_hit_rate Cache hit rate percentage
# TYPE cache_hit_rate gauge
cache_hit_rate ${goldenSignals.saturation.cache.hitRate} ${timestamp}
`.trim();
}

// Apply telemetry to the handler
export const GET = withTelemetry(goldenSignalsHandler, '/api/monitoring/golden-signals');