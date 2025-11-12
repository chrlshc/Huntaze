/**
 * SLO Monitoring Service
 * 
 * Collects metrics and tracks SLO compliance in real-time.
 * Integrates with the metrics registry and SLO tracker.
 * 
 * Features:
 * - Lazy metric initialization (build-time safe)
 * - Automatic error handling and graceful degradation
 * - Time-series caching for percentile calculations
 * - Type-safe API with full TypeScript support
 * - Retry logic for transient failures
 * 
 * @module lib/services/slo-monitoring
 */

import 'server-only';
import { 
  getOrCreateCounter, 
  getOrCreateHistogram, 
  getOrCreateGauge 
} from '@/lib/metrics-registry';
import { sloTracker, SLOMetrics } from '@/lib/slo-tracker';

/**
 * Metric value with timestamp for time-series tracking
 */
interface TimestampedValue {
  value: number;
  timestamp: number;
}

/**
 * Metric labels for categorization
 */
interface MetricLabels {
  route?: string;
  method?: string;
  status?: string;
  step?: string;
  [key: string]: string | undefined;
}

/**
 * Alert payload structure
 */
interface AlertPayload {
  title: string;
  severity: 'critical' | 'warning';
  current_value: number;
  target: number;
  threshold: number;
  compliance: number;
  error_budget_remaining: number;
  runbook: string;
  dashboard: string;
  timestamp: Date;
}

/**
 * SLO Monitoring Service
 * 
 * Provides real-time SLO tracking with:
 * - Automatic metric collection
 * - Error budget tracking
 * - Alert generation
 * - Graceful degradation on failures
 */
export class SLOMonitoringService {
  private metricsCache: Map<string, TimestampedValue[]> = new Map();
  private readonly CACHE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000; // Max values per metric
  
  // Lazy-initialized metrics (initialized on first use)
  private metrics: {
    latency?: InstanceType<typeof import('prom-client').Histogram>;
    errors?: InstanceType<typeof import('prom-client').Counter>;
    requests?: InstanceType<typeof import('prom-client').Counter>;
    gatingBlocked?: InstanceType<typeof import('prom-client').Counter>;
    cacheHits?: InstanceType<typeof import('prom-client').Counter>;
    cacheMisses?: InstanceType<typeof import('prom-client').Counter>;
    analyticsDrops?: InstanceType<typeof import('prom-client').Counter>;
    analyticsEvents?: InstanceType<typeof import('prom-client').Counter>;
    activeUsers?: InstanceType<typeof import('prom-client').Gauge>;
  } = {};

  /**
   * Track latency for an endpoint
   * 
   * @param route - API route path
   * @param method - HTTP method
   * @param latencyMs - Latency in milliseconds
   */
  async trackLatency(route: string, method: string, latencyMs: number): Promise<void> {
    try {
      // Lazy initialize histogram
      if (!this.metrics.latency) {
        this.metrics.latency = await getOrCreateHistogram(
          'onboarding_api_latency_ms',
          'API request latency in milliseconds',
          ['route', 'method'],
          [10, 50, 100, 200, 500, 1000, 2000, 5000] // Buckets in ms
        );
      }

      // Record metric
      this.metrics.latency.observe({ route, method }, latencyMs);

      // Cache for percentile calculation
      const key = `latency:${route}:${method}`;
      this.addToCache(key, latencyMs);
    } catch (error) {
      // Graceful degradation - log but don't fail
      console.error('[SLO Monitoring] Failed to track latency:', error);
    }
  }

  /**
   * Track error
   * 
   * @param route - API route path
   * @param method - HTTP method
   * @param statusCode - HTTP status code
   */
  async trackError(route: string, method: string, statusCode: number): Promise<void> {
    try {
      const statusCategory = this.getStatusCategory(statusCode);
      
      // Lazy initialize counter
      if (!this.metrics.errors) {
        this.metrics.errors = await getOrCreateCounter(
          'onboarding_api_errors_total',
          'Total API errors by status category',
          ['route', 'method', 'status']
        );
      }

      this.metrics.errors.inc({ route, method, status: statusCategory });
    } catch (error) {
      console.error('[SLO Monitoring] Failed to track error:', error);
    }
  }

  /**
   * Track successful request
   * 
   * @param route - API route path
   * @param method - HTTP method
   */
  async trackSuccess(route: string, method: string): Promise<void> {
    try {
      // Lazy initialize counter
      if (!this.metrics.requests) {
        this.metrics.requests = await getOrCreateCounter(
          'onboarding_api_requests_total',
          'Total API requests',
          ['route', 'method', 'status']
        );
      }

      this.metrics.requests.inc({ route, method, status: '2xx' });
    } catch (error) {
      console.error('[SLO Monitoring] Failed to track success:', error);
    }
  }

  /**
   * Track 409 gating response
   * 
   * @param route - API route path
   * @param step - Onboarding step that blocked the request
   */
  async track409Response(route: string, step: string): Promise<void> {
    try {
      // Lazy initialize counter
      if (!this.metrics.gatingBlocked) {
        this.metrics.gatingBlocked = await getOrCreateCounter(
          'onboarding_gating_blocked_total',
          'Total requests blocked by gating middleware',
          ['route', 'step']
        );
      }

      this.metrics.gatingBlocked.inc({ route, step });
    } catch (error) {
      console.error('[SLO Monitoring] Failed to track 409 response:', error);
    }
  }

  /**
   * Track cache hit/miss
   * 
   * @param hit - Whether the cache was hit
   */
  async trackCacheHit(hit: boolean): Promise<void> {
    try {
      if (hit) {
        if (!this.metrics.cacheHits) {
          this.metrics.cacheHits = await getOrCreateCounter(
            'onboarding_cache_hits_total',
            'Total cache hits'
          );
        }
        this.metrics.cacheHits.inc();
      } else {
        if (!this.metrics.cacheMisses) {
          this.metrics.cacheMisses = await getOrCreateCounter(
            'onboarding_cache_misses_total',
            'Total cache misses'
          );
        }
        this.metrics.cacheMisses.inc();
      }
    } catch (error) {
      console.error('[SLO Monitoring] Failed to track cache hit:', error);
    }
  }

  /**
   * Track analytics event
   * 
   * @param success - Whether the event was successfully recorded
   */
  async trackAnalyticsEvent(success: boolean): Promise<void> {
    try {
      if (!success) {
        if (!this.metrics.analyticsDrops) {
          this.metrics.analyticsDrops = await getOrCreateCounter(
            'onboarding_analytics_drops_total',
            'Total analytics events dropped'
          );
        }
        this.metrics.analyticsDrops.inc();
      }
      
      if (!this.metrics.analyticsEvents) {
        this.metrics.analyticsEvents = await getOrCreateCounter(
          'onboarding_analytics_events_total',
          'Total analytics events'
        );
      }
      this.metrics.analyticsEvents.inc();
    } catch (error) {
      console.error('[SLO Monitoring] Failed to track analytics event:', error);
    }
  }

  /**
   * Track active users
   * 
   * @param count - Number of active users
   */
  async setActiveUsers(count: number): Promise<void> {
    try {
      if (!this.metrics.activeUsers) {
        this.metrics.activeUsers = await getOrCreateGauge(
          'onboarding_active_users_gauge',
          'Number of active users in onboarding'
        );
      }

      this.metrics.activeUsers.set(count);
    } catch (error) {
      console.error('[SLO Monitoring] Failed to set active users:', error);
    }
  }

  /**
   * Calculate p95 latency from cached values
   * 
   * @param route - API route path
   * @param method - HTTP method
   * @returns P95 latency in milliseconds
   */
  calculateP95Latency(route: string, method: string): number {
    try {
      const key = `latency:${route}:${method}`;
      const values = this.metricsCache.get(key) || [];
      
      if (values.length === 0) return 0;

      // Extract values and sort
      const sorted = values
        .map(v => v.value)
        .sort((a, b) => a - b);
      
      const p95Index = Math.floor(sorted.length * 0.95);
      return sorted[p95Index] || 0;
    } catch (error) {
      console.error('[SLO Monitoring] Failed to calculate P95:', error);
      return 0;
    }
  }

  /**
   * Calculate error rate
   * 
   * Note: This is a simplified calculation based on cached metrics.
   * In production, query Prometheus directly for accurate rates.
   * 
   * @param statusCategory - Status category (4xx, 5xx)
   * @returns Error rate (0-1)
   */
  async calculateErrorRate(statusCategory: string): Promise<number> {
    try {
      // In a real implementation, query Prometheus for accurate counts
      // This is a placeholder that returns 0 for now
      console.warn('[SLO Monitoring] calculateErrorRate is a placeholder - implement Prometheus query');
      return 0;
    } catch (error) {
      console.error('[SLO Monitoring] Failed to calculate error rate:', error);
      return 0;
    }
  }

  /**
   * Calculate cache hit rate
   * 
   * Note: This is a simplified calculation.
   * In production, query Prometheus directly for accurate rates.
   * 
   * @returns Cache hit rate (0-1)
   */
  async calculateCacheHitRate(): Promise<number> {
    try {
      // Placeholder - implement Prometheus query
      console.warn('[SLO Monitoring] calculateCacheHitRate is a placeholder - implement Prometheus query');
      return 1.0; // Assume 100% if no data
    } catch (error) {
      console.error('[SLO Monitoring] Failed to calculate cache hit rate:', error);
      return 1.0;
    }
  }

  /**
   * Calculate analytics drop rate
   * 
   * @returns Analytics drop rate (0-1)
   */
  async calculateAnalyticsDropRate(): Promise<number> {
    try {
      // Placeholder - implement Prometheus query
      console.warn('[SLO Monitoring] calculateAnalyticsDropRate is a placeholder - implement Prometheus query');
      return 0;
    } catch (error) {
      console.error('[SLO Monitoring] Failed to calculate analytics drop rate:', error);
      return 0;
    }
  }

  /**
   * Calculate 409 rate
   * 
   * @param route - Optional route filter
   * @returns 409 response rate (0-1)
   */
  async calculate409Rate(route?: string): Promise<number> {
    try {
      // Placeholder - implement Prometheus query
      console.warn('[SLO Monitoring] calculate409Rate is a placeholder - implement Prometheus query');
      return 0;
    } catch (error) {
      console.error('[SLO Monitoring] Failed to calculate 409 rate:', error);
      return 0;
    }
  }

  /**
   * Get all SLO metrics
   * 
   * Collects current metrics and calculates SLO compliance.
   * 
   * @returns Array of SLO metrics
   */
  async getAllSLOMetrics(): Promise<SLOMetrics[]> {
    const metrics: SLOMetrics[] = [];

    try {
      // Latency SLOs
      const routes = [
        { route: '/api/onboarding', method: 'GET', slo: 'api_latency_get_onboarding' },
        { route: '/api/onboarding/steps/:id', method: 'PATCH', slo: 'api_latency_patch_step' },
        { route: '/api/onboarding/snooze', method: 'POST', slo: 'api_latency_snooze' }
      ];

      for (const { route, method, slo } of routes) {
        const p95 = this.calculateP95Latency(route, method);
        
        // Use cached request count (in production, query Prometheus)
        const totalRequests = 100; // Placeholder
        
        metrics.push(
          sloTracker.calculateCompliance(slo, p95, totalRequests)
        );
      }

      // Error rate SLOs
      const error5xxRate = await this.calculateErrorRate('5xx');
      const totalRequests = 100; // Placeholder
      
      metrics.push(
        sloTracker.calculateCompliance('error_rate_5xx', error5xxRate * totalRequests, totalRequests)
      );

      const error4xxRate = await this.calculateErrorRate('4xx');
      metrics.push(
        sloTracker.calculateCompliance('error_rate_4xx', error4xxRate * totalRequests, totalRequests)
      );

      // Cache hit rate SLO
      const cacheHitRate = await this.calculateCacheHitRate();
      metrics.push(
        sloTracker.calculateCompliance('cache_hit_rate', cacheHitRate, 1)
      );

      // 409 rate SLO
      const rate409 = await this.calculate409Rate();
      metrics.push(
        sloTracker.calculateCompliance('gating_409_rate', rate409, 1)
      );

      // Analytics drop rate SLO
      const analyticsDropRate = await this.calculateAnalyticsDropRate();
      metrics.push(
        sloTracker.calculateCompliance('analytics_drop_rate', analyticsDropRate, 1)
      );

    } catch (error) {
      console.error('[SLO Monitoring] Failed to get all SLO metrics:', error);
    }

    return metrics;
  }

  /**
   * Generate SLO report
   * 
   * @returns SLO compliance report
   */
  async generateSLOReport() {
    try {
      const metrics = await this.getAllSLOMetrics();
      return sloTracker.generateReport(metrics);
    } catch (error) {
      console.error('[SLO Monitoring] Failed to generate SLO report:', error);
      throw error;
    }
  }

  /**
   * Check for SLO violations and trigger alerts
   * 
   * Implements retry logic for transient failures.
   */
  async checkAndAlert(): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const metrics = await this.getAllSLOMetrics();

        for (const metric of metrics) {
          const alertRule = sloTracker.shouldAlert(metric);
          
          if (alertRule) {
            await this.sendAlert(metric, alertRule);
          }
        }

        return; // Success
      } catch (error) {
        attempt++;
        console.error(`[SLO Monitoring] Alert check failed (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt >= maxRetries) {
          console.error('[SLO Monitoring] Max retries reached, giving up');
          throw error;
        }

        // Exponential backoff
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  /**
   * Send alert
   * 
   * @param metric - SLO metric that triggered the alert
   * @param alertRule - Alert rule configuration
   */
  private async sendAlert(metric: SLOMetrics, alertRule: any): Promise<void> {
    try {
      const slo = sloTracker.getSLO(metric.name);
      const docs = sloTracker.getDocumentation();

      const alert: AlertPayload = {
        title: `SLO ${metric.status.toUpperCase()}: ${metric.name}`,
        severity: slo?.severity || 'warning',
        current_value: metric.current_value,
        target: metric.target,
        threshold: metric.threshold,
        compliance: metric.compliance,
        error_budget_remaining: metric.error_budget_remaining,
        runbook: docs.runbook_url,
        dashboard: docs.dashboard_url,
        timestamp: metric.timestamp
      };

      // Log alert (in production, send to PagerDuty/Slack)
      console.error('[SLO ALERT]', JSON.stringify(alert, null, 2));

      // TODO: Integrate with actual alerting system
      // Example integrations:
      // - PagerDuty: await this.sendToPagerDuty(alert);
      // - Slack: await this.sendToSlack(alert);
      // - Email: await this.sendEmail(alert);
      
    } catch (error) {
      console.error('[SLO Monitoring] Failed to send alert:', error);
      // Don't throw - alerting failures shouldn't break monitoring
    }
  }

  /**
   * Helper: Add value to cache with time-based expiration
   * 
   * @param key - Cache key
   * @param value - Metric value
   */
  private addToCache(key: string, value: number): void {
    try {
      const values = this.metricsCache.get(key) || [];
      const now = Date.now();
      
      // Add new value with timestamp
      values.push({ value, timestamp: now });
      
      // Remove old values outside the window
      const cutoff = now - this.CACHE_WINDOW_MS;
      const filtered = values.filter(v => v.timestamp >= cutoff);
      
      // Limit cache size
      const limited = filtered.slice(-this.MAX_CACHE_SIZE);
      
      this.metricsCache.set(key, limited);
    } catch (error) {
      console.error('[SLO Monitoring] Failed to add to cache:', error);
    }
  }

  /**
   * Helper: Get status category from status code
   * 
   * @param statusCode - HTTP status code
   * @returns Status category (2xx, 4xx, 5xx)
   */
  private getStatusCategory(statusCode: number): string {
    if (statusCode >= 500) return '5xx';
    if (statusCode >= 400) return '4xx';
    return '2xx';
  }

  /**
   * Helper: Sleep for specified milliseconds
   * 
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.metricsCache.clear();
  }

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats(): { keys: number; totalValues: number } {
    let totalValues = 0;
    for (const values of this.metricsCache.values()) {
      totalValues += values.length;
    }
    
    return {
      keys: this.metricsCache.size,
      totalValues
    };
  }
}

// Export singleton instance
export const sloMonitoring = new SLOMonitoringService();
