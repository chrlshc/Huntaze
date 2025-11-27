/**
 * Production-Safe Monitoring
 * Conditionally enables monitoring based on environment
 * Implements batching and sampling to reduce overhead
 */

export interface MonitoringConfig {
  enabled: boolean;
  sampling: number; // 0-1, percentage of requests to monitor
  batchSize: number;
  flushInterval: number; // ms
}

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

class ProductionSafeMonitoring {
  private config: MonitoringConfig;
  private metricBatch: MetricData[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionSampleDecision: boolean | null = null;

  constructor() {
    this.config = this.getConfig();
  }

  private getConfig(): MonitoringConfig {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isTest = process.env.NODE_ENV === 'test';

    return {
      enabled: isDevelopment && !isTest,
      sampling: isDevelopment ? 0.1 : 0, // 10% in dev, 0% in prod
      batchSize: 50,
      flushInterval: 10000, // 10 seconds
    };
  }

  /**
   * Check if monitoring should run for this request
   */
  shouldMonitor(): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // Use session-level sampling decision for consistency
    if (this.sessionSampleDecision === null) {
      this.sessionSampleDecision = Math.random() < this.config.sampling;
    }

    return this.sessionSampleDecision;
  }

  /**
   * Track a metric with batching
   */
  trackMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.shouldMonitor()) {
      return;
    }

    try {
      const metric: MetricData = {
        name,
        value,
        timestamp: Date.now(),
        tags,
      };

      this.metricBatch.push(metric);

      // Flush if batch is full
      if (this.metricBatch.length >= this.config.batchSize) {
        this.flush();
      } else if (!this.flushTimer) {
        // Schedule flush
        this.flushTimer = setTimeout(() => {
          this.flush();
        }, this.config.flushInterval);
      }
    } catch (error) {
      // Never let monitoring errors affect the application
      console.error('[Monitoring] Error tracking metric:', error);
    }
  }

  /**
   * Flush batched metrics
   */
  private flush(): void {
    if (this.metricBatch.length === 0) {
      return;
    }

    try {
      const batch = [...this.metricBatch];
      this.metricBatch = [];

      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }

      // Send batch asynchronously without blocking
      this.sendBatch(batch).catch((error) => {
        console.error('[Monitoring] Error sending batch:', error);
      });
    } catch (error) {
      console.error('[Monitoring] Error flushing metrics:', error);
    }
  }

  /**
   * Send batch to monitoring service
   */
  private async sendBatch(batch: MetricData[]): Promise<void> {
    if (typeof window === 'undefined') {
      // Server-side: log to console in development
      console.log('[Monitoring] Batch:', {
        count: batch.length,
        metrics: batch.map((m) => `${m.name}=${m.value}`),
      });
      return;
    }

    // Client-side: send to API endpoint
    try {
      await fetch('/api/metrics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: batch }),
      });
    } catch (error) {
      // Silently fail - monitoring should never break the app
      console.error('[Monitoring] Failed to send batch:', error);
    }
  }

  /**
   * Force flush all pending metrics
   */
  forceFlush(): void {
    this.flush();
  }

  /**
   * Get current config
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Reset session sampling decision
   */
  resetSession(): void {
    this.sessionSampleDecision = null;
  }
}

// Singleton instance
export const productionSafeMonitoring = new ProductionSafeMonitoring();

/**
 * Wrapper for monitoring code that should only run in development
 */
export function withMonitoring<T>(fn: () => T): T | undefined {
  if (!productionSafeMonitoring.shouldMonitor()) {
    return undefined;
  }

  try {
    return fn();
  } catch (error) {
    console.error('[Monitoring] Error in monitoring code:', error);
    return undefined;
  }
}

/**
 * Async wrapper for monitoring code
 */
export async function withMonitoringAsync<T>(
  fn: () => Promise<T>
): Promise<T | undefined> {
  if (!productionSafeMonitoring.shouldMonitor()) {
    return undefined;
  }

  try {
    return await fn();
  } catch (error) {
    console.error('[Monitoring] Error in monitoring code:', error);
    return undefined;
  }
}

/**
 * Track performance metric
 */
export function trackPerformance(
  name: string,
  value: number,
  tags?: Record<string, string>
): void {
  productionSafeMonitoring.trackMetric(name, value, tags);
}

/**
 * Measure and track execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - start;

    trackPerformance(name, duration, tags);

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    trackPerformance(name, duration, { ...tags, error: 'true' });
    throw error;
  }
}

/**
 * Measure and track sync execution time
 */
export function measure<T>(
  name: string,
  fn: () => T,
  tags?: Record<string, string>
): T {
  const start = performance.now();

  try {
    const result = fn();
    const duration = performance.now() - start;

    trackPerformance(name, duration, tags);

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    trackPerformance(name, duration, { ...tags, error: 'true' });
    throw error;
  }
}
