/**
 * Metrics Collection Utility
 * Tracks key metrics for monitoring and observability
 */

interface MetricData {
  timestamp: string;
  metric: string;
  value: number;
  tags?: Record<string, string>;
}

class Metrics {
  private metrics: MetricData[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics in memory

  /**
   * Record a metric
   */
  private record(metric: string, value: number, tags?: Record<string, string>): void {
    const data: MetricData = {
      timestamp: new Date().toISOString(),
      metric,
      value,
      tags,
    };

    this.metrics.push(data);

    // Keep only last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // In production, you would send this to a metrics service
    // (e.g., CloudWatch, Datadog, Prometheus)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to metrics service
      console.log(JSON.stringify({ type: 'metric', ...data }));
    }
  }

  /**
   * Increment a counter
   */
  increment(metric: string, tags?: Record<string, string>): void {
    this.record(metric, 1, tags);
  }

  /**
   * Record a gauge value
   */
  gauge(metric: string, value: number, tags?: Record<string, string>): void {
    this.record(metric, value, tags);
  }

  /**
   * Record a timing/duration
   */
  timing(metric: string, durationMs: number, tags?: Record<string, string>): void {
    this.record(metric, durationMs, { ...tags, unit: 'ms' });
  }

  /**
   * OAuth metrics
   */
  oauthSuccess(platform: string): void {
    this.increment('oauth.success', { platform });
  }

  oauthFailure(platform: string, errorCode?: string): void {
    this.increment('oauth.failure', { platform, errorCode: errorCode || 'unknown' });
  }

  /**
   * Upload metrics
   */
  uploadSuccess(platform: string): void {
    this.increment('upload.success', { platform });
  }

  uploadFailure(platform: string, errorCode?: string): void {
    this.increment('upload.failure', { platform, errorCode: errorCode || 'unknown' });
  }

  /**
   * Webhook metrics
   */
  webhookReceived(platform: string, eventType: string): void {
    this.increment('webhook.received', { platform, eventType });
  }

  webhookProcessed(platform: string, eventType: string, success: boolean): void {
    this.increment('webhook.processed', { 
      platform, 
      eventType, 
      status: success ? 'success' : 'failure' 
    });
  }

  webhookLatency(platform: string, latencyMs: number): void {
    this.timing('webhook.latency', latencyMs, { platform });
  }

  /**
   * Token refresh metrics
   */
  tokenRefreshSuccess(platform: string): void {
    this.increment('token.refresh.success', { platform });
  }

  tokenRefreshFailure(platform: string): void {
    this.increment('token.refresh.failure', { platform });
  }

  /**
   * API call metrics
   */
  apiCall(endpoint: string, method: string, statusCode: number, latencyMs: number): void {
    this.increment('api.call', { endpoint, method, status: String(statusCode) });
    this.timing('api.latency', latencyMs, { endpoint, method });
  }

  /**
   * Worker metrics
   */
  workerRun(workerName: string, success: boolean, durationMs: number): void {
    this.increment('worker.run', { 
      workerName, 
      status: success ? 'success' : 'failure' 
    });
    this.timing('worker.duration', durationMs, { workerName });
  }

  /**
   * OnlyFans metrics
   */
  onlyFansMessageQueued(userId: string): void {
    this.increment('onlyfans.message.queued', { userId });
  }

  onlyFansMessageProcessed(userId: string, success: boolean): void {
    this.increment('onlyfans.message.processed', { 
      userId, 
      status: success ? 'success' : 'failure' 
    });
  }

  onlyFansMessageFailed(userId: string, errorType: string): void {
    this.increment('onlyfans.message.failed', { userId, errorType });
  }

  onlyFansQueueDepth(depth: number): void {
    this.gauge('onlyfans.queue.depth', depth);
  }

  onlyFansDLQCount(count: number): void {
    this.gauge('onlyfans.dlq.count', count);
  }

  onlyFansProcessingTime(durationMs: number): void {
    this.timing('onlyfans.processing.time', durationMs);
  }

  onlyFansBulkCampaign(recipientCount: number, success: boolean): void {
    this.increment('onlyfans.bulk.campaign', { 
      status: success ? 'success' : 'failure' 
    });
    this.gauge('onlyfans.bulk.recipients', recipientCount);
  }

  /**
   * Get recent metrics (for debugging/monitoring)
   */
  getRecentMetrics(limit: number = 100): MetricData[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get metrics summary
   */
  getSummary(): Record<string, number> {
    const summary: Record<string, number> = {};

    for (const metric of this.metrics) {
      const key = metric.tags 
        ? `${metric.metric}.${Object.values(metric.tags).join('.')}`
        : metric.metric;
      
      summary[key] = (summary[key] || 0) + metric.value;
    }

    return summary;
  }

  /**
   * Clear metrics (for testing)
   */
  clear(): void {
    this.metrics = [];
  }
}

// Export singleton instance
export const metrics = new Metrics();
