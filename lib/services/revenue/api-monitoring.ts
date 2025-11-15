/**
 * Revenue API Monitoring & Observability
 * 
 * Centralized monitoring for all revenue API calls
 */

interface APIMetrics {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  success: boolean;
  correlationId: string;
  timestamp: string;
  error?: string;
}

class RevenueAPIMonitor {
  private metrics: APIMetrics[] = [];
  private readonly MAX_METRICS = 1000;

  /**
   * Log API call metrics
   */
  logAPICall(metrics: APIMetrics): void {
    this.metrics.push(metrics);

    // Keep only last 1000 metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = metrics.success ? '✅' : '❌';
      console.log(
        `${emoji} [Revenue API] ${metrics.method} ${metrics.endpoint}`,
        {
          duration: `${metrics.duration}ms`,
          status: metrics.status,
          correlationId: metrics.correlationId,
          ...(metrics.error && { error: metrics.error }),
        }
      );
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(metrics);
    }
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalCalls: number;
    successRate: number;
    averageDuration: number;
    errorRate: number;
  } {
    const total = this.metrics.length;
    const successful = this.metrics.filter(m => m.success).length;
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / total;

    return {
      totalCalls: total,
      successRate: (successful / total) * 100,
      averageDuration: Math.round(avgDuration),
      errorRate: ((total - successful) / total) * 100,
    };
  }

  /**
   * Get slow queries (> 2s)
   */
  getSlowQueries(): APIMetrics[] {
    return this.metrics.filter(m => m.duration > 2000);
  }

  /**
   * Get failed requests
   */
  getFailedRequests(): APIMetrics[] {
    return this.metrics.filter(m => !m.success);
  }

  /**
   * Send metrics to monitoring service
   */
  private async sendToMonitoring(metrics: APIMetrics): Promise<void> {
    try {
      // TODO: Integrate with Sentry, DataDog, or custom monitoring
      // await fetch('/api/monitoring/revenue', {
      //   method: 'POST',
      //   body: JSON.stringify(metrics),
      // });
    } catch (error) {
      // Fail silently to not impact user experience
      console.error('[RevenueAPIMonitor] Failed to send metrics:', error);
    }
  }

  /**
   * Clear metrics (for testing)
   */
  clear(): void {
    this.metrics = [];
  }
}

export const revenueAPIMonitor = new RevenueAPIMonitor();
export type { APIMetrics };
