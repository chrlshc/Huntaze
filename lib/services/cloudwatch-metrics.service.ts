/**
 * CloudWatch Metrics Service
 * 
 * Service for sending custom metrics to AWS CloudWatch.
 * Used for monitoring OnlyFans rate limiter performance.
 * 
 * @module cloudwatch-metrics-service
 */

import { CloudWatchClient, PutMetricDataCommand, StandardUnit } from '@aws-sdk/client-cloudwatch';
import RATE_LIMITER_CONFIG from '../config/rate-limiter.config';

export interface MetricDimension {
  Name: string;
  Value: string;
}

export interface MetricData {
  MetricName: string;
  Value: number;
  Unit?: StandardUnit;
  Timestamp?: Date;
  Dimensions?: MetricDimension[];
}

/**
 * CloudWatch Metrics Service
 */
export class CloudWatchMetricsService {
  private readonly client: CloudWatchClient;
  private readonly namespace: string;
  private readonly enabled: boolean;

  constructor(region?: string) {
    this.client = new CloudWatchClient({
      region: region || process.env.AWS_REGION || 'us-east-1',
    });
    this.namespace = RATE_LIMITER_CONFIG.MONITORING.CLOUDWATCH_NAMESPACE;
    this.enabled = RATE_LIMITER_CONFIG.MONITORING.METRICS_ENABLED;
  }

  /**
   * Put a single metric to CloudWatch
   * 
   * @param metricName - Name of the metric
   * @param value - Metric value
   * @param dimensions - Optional dimensions (e.g., { priority: 'high' })
   * @param unit - Optional unit (default: Count)
   */
  async putMetric(
    metricName: string,
    value: number,
    dimensions?: Record<string, string>,
    unit: StandardUnit = 'Count'
  ): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const metricDimensions: MetricDimension[] = [
        {
          Name: 'Environment',
          Value: process.env.NODE_ENV || 'development',
        },
      ];

      // Add custom dimensions
      if (dimensions) {
        for (const [key, val] of Object.entries(dimensions)) {
          metricDimensions.push({
            Name: key,
            Value: val,
          });
        }
      }

      const command = new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Unit: unit,
            Timestamp: new Date(),
            Dimensions: metricDimensions,
          },
        ],
      });

      await this.client.send(command);

      console.debug('[CloudWatchMetrics] Metric sent', {
        namespace: this.namespace,
        metricName,
        value,
        unit,
        dimensions: metricDimensions,
      });
    } catch (error) {
      // Don't throw - metrics should not break the application
      console.error('[CloudWatchMetrics] Failed to send metric', {
        metricName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Put multiple metrics in a batch
   * 
   * @param metrics - Array of metric data
   */
  async putMetrics(metrics: MetricData[]): Promise<void> {
    if (!this.enabled || metrics.length === 0) {
      return;
    }

    try {
      const metricData = metrics.map((metric) => {
        const dimensions: MetricDimension[] = [
          {
            Name: 'Environment',
            Value: process.env.NODE_ENV || 'development',
          },
        ];

        if (metric.Dimensions) {
          dimensions.push(...metric.Dimensions);
        }

        return {
          MetricName: metric.MetricName,
          Value: metric.Value,
          Unit: metric.Unit || 'Count',
          Timestamp: metric.Timestamp || new Date(),
          Dimensions: dimensions,
        };
      });

      const command = new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: metricData,
      });

      await this.client.send(command);

      console.debug('[CloudWatchMetrics] Batch metrics sent', {
        namespace: this.namespace,
        count: metrics.length,
      });
    } catch (error) {
      console.error('[CloudWatchMetrics] Failed to send batch metrics', {
        count: metrics.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Track message queued
   */
  async trackMessageQueued(priority: string = 'medium'): Promise<void> {
    await this.putMetric('MessagesQueued', 1, { priority });
  }

  /**
   * Track message sent
   */
  async trackMessageSent(priority: string = 'medium'): Promise<void> {
    await this.putMetric('MessagesSent', 1, { priority });
  }

  /**
   * Track message failed
   */
  async trackMessageFailed(priority: string = 'medium', reason?: string): Promise<void> {
    const dimensions: Record<string, string> = { priority };
    if (reason) {
      dimensions.reason = reason;
    }
    await this.putMetric('MessagesFailed', 1, dimensions);
  }

  /**
   * Track rate limited message
   */
  async trackRateLimited(): Promise<void> {
    await this.putMetric('RateLimitedMessages', 1);
  }

  /**
   * Track queue latency
   */
  async trackQueueLatency(latencyMs: number): Promise<void> {
    await this.putMetric('QueueLatency', latencyMs, undefined, 'Milliseconds');
  }

  /**
   * Track API latency
   */
  async trackAPILatency(latencyMs: number, endpoint: string): Promise<void> {
    await this.putMetric('APILatency', latencyMs, { endpoint }, 'Milliseconds');
  }
}

/**
 * Singleton instance
 */
let metricsServiceInstance: CloudWatchMetricsService | null = null;

/**
 * Get CloudWatch metrics service instance
 */
export function getCloudWatchMetricsService(): CloudWatchMetricsService {
  if (!metricsServiceInstance) {
    metricsServiceInstance = new CloudWatchMetricsService();
  }
  return metricsServiceInstance;
}
