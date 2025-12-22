/**
 * Metrics Collector Service
 * Content & Trends AI Engine - Phase 6
 * 
 * Collects and aggregates metrics for AI model performance,
 * viral prediction accuracy, and content generation quality.
 */

import {
  MetricValue,
  MetricUnit,
  MetricsCollector,
  AIModelMetrics,
  ViralPredictionMetrics,
  ContentGenerationMetrics,
  PerformanceBaseline,
  AnomalyDetectionResult,
} from './types';

// ============================================================================
// Metrics Collector Implementation
// ============================================================================

export class ContentTrendsMetricsCollector implements MetricsCollector {
  private buffer: MetricValue[] = [];
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private flushCallback?: (metrics: MetricValue[]) => Promise<void>;
  private readonly BUFFER_SIZE = 1000;
  private readonly FLUSH_INTERVAL_MS = 10000;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(flushCallback?: (metrics: MetricValue[]) => Promise<void>) {
    this.flushCallback = flushCallback;
    this.startFlushInterval();
  }

  /**
   * Record a single metric value
   */
  recordMetric(metric: MetricValue): void {
    this.buffer.push(metric);

    if (this.buffer.length >= this.BUFFER_SIZE) {
      this.flush();
    }
  }

  /**
   * Record AI model performance metrics
   */
  recordAIModelMetrics(metrics: AIModelMetrics): void {
    const dimensions = {
      modelId: metrics.modelId,
      modelName: metrics.modelName,
    };

    this.recordMetric({
      name: 'ai.model.requests',
      value: metrics.requestCount,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'requests',
    });

    this.recordMetric({
      name: 'ai.model.success_rate',
      value: metrics.successCount / Math.max(metrics.requestCount, 1) * 100,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'percent',
    });

    this.recordMetric({
      name: 'ai.model.tokens.total',
      value: metrics.totalTokensConsumed,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'tokens',
    });

    this.recordMetric({
      name: 'ai.model.tokens.input',
      value: metrics.inputTokens,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'tokens',
    });

    this.recordMetric({
      name: 'ai.model.tokens.output',
      value: metrics.outputTokens,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'tokens',
    });

    this.recordMetric({
      name: 'ai.model.latency.avg',
      value: metrics.averageLatencyMs,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'milliseconds',
    });

    this.recordMetric({
      name: 'ai.model.latency.p95',
      value: metrics.p95LatencyMs,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'milliseconds',
    });

    this.recordMetric({
      name: 'ai.model.latency.p99',
      value: metrics.p99LatencyMs,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'milliseconds',
    });

    this.recordMetric({
      name: 'ai.model.cost',
      value: metrics.costUsd,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'count',
    });

    this.recordMetric({
      name: 'ai.model.error_rate',
      value: metrics.errorRate,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'percent',
    });
  }

  /**
   * Record viral prediction accuracy metrics
   */
  recordViralPredictionMetrics(metrics: ViralPredictionMetrics): void {
    const dimensions = { component: 'viral_prediction' };

    this.recordMetric({
      name: 'viral.predictions.total',
      value: metrics.totalPredictions,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'count',
    });

    this.recordMetric({
      name: 'viral.predictions.accuracy',
      value: metrics.accuracyRate * 100,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'percent',
    });

    this.recordMetric({
      name: 'viral.predictions.confidence.avg',
      value: metrics.averageConfidence * 100,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'percent',
    });

    this.recordMetric({
      name: 'viral.predictions.false_positive_rate',
      value: metrics.falsePositiveRate * 100,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'percent',
    });

    this.recordMetric({
      name: 'viral.predictions.false_negative_rate',
      value: metrics.falseNegativeRate * 100,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'percent',
    });

    // Record by category
    for (const [category, count] of Object.entries(metrics.predictionsByCategory)) {
      this.recordMetric({
        name: 'viral.predictions.by_category',
        value: count,
        timestamp: metrics.timestamp,
        dimensions: { ...dimensions, category },
        unit: 'count',
      });
    }
  }

  /**
   * Record content generation quality metrics
   */
  recordContentGenerationMetrics(metrics: ContentGenerationMetrics): void {
    const dimensions = { component: 'content_generation' };

    this.recordMetric({
      name: 'content.generations.total',
      value: metrics.totalGenerations,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'count',
    });

    this.recordMetric({
      name: 'content.quality.avg',
      value: metrics.averageQualityScore,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'count',
    });

    this.recordMetric({
      name: 'content.brand_alignment.avg',
      value: metrics.brandAlignmentScore,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'count',
    });

    this.recordMetric({
      name: 'content.generation_time.avg',
      value: metrics.averageGenerationTimeMs,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'milliseconds',
    });

    this.recordMetric({
      name: 'content.rejection_rate',
      value: metrics.rejectionRate * 100,
      timestamp: metrics.timestamp,
      dimensions,
      unit: 'percent',
    });

    // Record by type
    for (const [type, count] of Object.entries(metrics.generationsByType)) {
      this.recordMetric({
        name: 'content.generations.by_type',
        value: count,
        timestamp: metrics.timestamp,
        dimensions: { ...dimensions, type },
        unit: 'count',
      });
    }
  }

  /**
   * Flush buffered metrics
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const metrics = [...this.buffer];
    this.buffer = [];

    if (this.flushCallback) {
      await this.flushCallback(metrics);
    }
  }

  /**
   * Calculate performance baseline for a metric
   */
  calculateBaseline(metricName: string, values: number[]): PerformanceBaseline {
    if (values.length === 0) {
      throw new Error('Cannot calculate baseline from empty values');
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    const baseline: PerformanceBaseline = {
      metricName,
      baselineValue: mean,
      standardDeviation: stdDev,
      calculatedAt: new Date(),
      sampleCount: values.length,
      percentiles: {
        p50: this.percentile(sorted, 50),
        p75: this.percentile(sorted, 75),
        p90: this.percentile(sorted, 90),
        p95: this.percentile(sorted, 95),
        p99: this.percentile(sorted, 99),
      },
    };

    this.baselines.set(metricName, baseline);
    return baseline;
  }

  /**
   * Detect anomalies based on baseline
   */
  detectAnomaly(
    metricName: string,
    value: number,
    threshold: number = 2
  ): AnomalyDetectionResult {
    const baseline = this.baselines.get(metricName);

    if (!baseline) {
      return {
        metricName,
        timestamp: new Date(),
        actualValue: value,
        expectedValue: value,
        deviation: 0,
        isAnomaly: false,
        anomalyScore: 0,
        direction: 'normal',
      };
    }

    const deviation = (value - baseline.baselineValue) / baseline.standardDeviation;
    const isAnomaly = Math.abs(deviation) > threshold;

    return {
      metricName,
      timestamp: new Date(),
      actualValue: value,
      expectedValue: baseline.baselineValue,
      deviation,
      isAnomaly,
      anomalyScore: Math.abs(deviation),
      direction: deviation > threshold ? 'above' : deviation < -threshold ? 'below' : 'normal',
    };
  }

  /**
   * Get current baseline for a metric
   */
  getBaseline(metricName: string): PerformanceBaseline | undefined {
    return this.baselines.get(metricName);
  }

  /**
   * Get all baselines
   */
  getAllBaselines(): PerformanceBaseline[] {
    return Array.from(this.baselines.values());
  }

  /**
   * Stop the metrics collector
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  private percentile(sorted: number[], p: number): number {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}

// ============================================================================
// Metric Helpers
// ============================================================================

export function createMetric(
  name: string,
  value: number,
  unit: MetricUnit,
  dimensions: Record<string, string> = {}
): MetricValue {
  return {
    name,
    value,
    timestamp: new Date(),
    dimensions,
    unit,
  };
}

export function aggregateMetrics(
  metrics: MetricValue[],
  aggregation: 'sum' | 'average' | 'min' | 'max' | 'count'
): number {
  if (metrics.length === 0) return 0;

  const values = metrics.map(m => m.value);

  switch (aggregation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'average':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count':
      return values.length;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createMetricsCollector(
  flushCallback?: (metrics: MetricValue[]) => Promise<void>
): ContentTrendsMetricsCollector {
  return new ContentTrendsMetricsCollector(flushCallback);
}
