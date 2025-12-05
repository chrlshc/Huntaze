/**
 * MetricsCollector - Canary deployment metrics collection service
 * 
 * Tracks error rate, latency percentiles, and cost per request.
 * Separates metrics by provider (foundry/legacy) for A/B comparison.
 * 
 * Requirements: 5.1, 5.4 - Monitoring and cost tracking
 */

export type ProviderType = 'foundry' | 'legacy';

export interface RequestMetric {
  /** Unique request identifier */
  requestId: string;
  /** Correlation ID for tracing */
  correlationId: string;
  /** Provider used */
  provider: ProviderType;
  /** Model used */
  model: string;
  /** Request latency in milliseconds */
  latencyMs: number;
  /** Cost in USD */
  costUsd: number;
  /** Whether request succeeded */
  success: boolean;
  /** Error message if failed */
  errorMessage?: string;
  /** Timestamp */
  timestamp: Date;
  /** User tier (for segmentation) */
  userTier?: string;
  /** Agent type */
  agentType?: string;
}

export interface ProviderMetrics {
  /** Provider name */
  provider: ProviderType;
  /** Total request count */
  requestCount: number;
  /** Error count */
  errorCount: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Latency p50 in ms */
  latencyP50: number;
  /** Latency p95 in ms */
  latencyP95: number;
  /** Latency p99 in ms */
  latencyP99: number;
  /** Average latency in ms */
  latencyAvg: number;
  /** Total cost in USD */
  totalCostUsd: number;
  /** Average cost per request in USD */
  avgCostPerRequest: number;
  /** Breakdown by model */
  modelBreakdown: Record<string, ModelMetrics>;
}

export interface ModelMetrics {
  /** Model name */
  model: string;
  /** Request count */
  requestCount: number;
  /** Average latency in ms */
  avgLatency: number;
  /** Average cost in USD */
  avgCost: number;
  /** Error rate (0-1) */
  errorRate: number;
}

export interface ComparisonMetrics {
  /** Foundry metrics */
  foundry: ProviderMetrics;
  /** Legacy metrics */
  legacy: ProviderMetrics;
  /** Comparison summary */
  comparison: {
    /** Error rate difference (foundry - legacy) */
    errorRateDiff: number;
    /** Latency p95 difference in ms */
    latencyP95Diff: number;
    /** Cost difference per request in USD */
    costDiff: number;
    /** Foundry is better overall */
    foundryBetter: boolean;
  };
  /** Window information */
  window: {
    startAt: Date;
    endAt: Date;
    durationMs: number;
  };
}

export interface MetricsCollectorConfig {
  /** Metrics window duration in milliseconds (default: 1 hour) */
  windowMs: number;
  /** Maximum metrics to keep in memory */
  maxMetrics: number;
}

const DEFAULT_CONFIG: MetricsCollectorConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxMetrics: 10000,
};

/**
 * MetricsCollector service for canary deployments
 * 
 * Features:
 * - Per-provider metrics tracking
 * - Latency percentile calculation
 * - Cost tracking and aggregation
 * - A/B comparison metrics
 */
export class MetricsCollector {
  private config: MetricsCollectorConfig;
  private metrics: RequestMetric[] = [];
  private windowStartAt: Date;
  private static instance: MetricsCollector | null = null;

  constructor(config: Partial<MetricsCollectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.windowStartAt = new Date();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<MetricsCollectorConfig>): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector(config);
    }
    return MetricsCollector.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    MetricsCollector.instance = null;
  }

  /**
   * Record a request metric
   */
  record(metric: Omit<RequestMetric, 'timestamp'>): void {
    this.maybeRotateWindow();
    this.pruneIfNeeded();

    this.metrics.push({
      ...metric,
      timestamp: new Date(),
    });
  }

  /**
   * Record a successful request
   */
  recordSuccess(params: {
    requestId: string;
    correlationId: string;
    provider: ProviderType;
    model: string;
    latencyMs: number;
    costUsd: number;
    userTier?: string;
    agentType?: string;
  }): void {
    this.record({
      ...params,
      success: true,
    });
  }

  /**
   * Record a failed request
   */
  recordFailure(params: {
    requestId: string;
    correlationId: string;
    provider: ProviderType;
    model: string;
    latencyMs: number;
    costUsd: number;
    errorMessage: string;
    userTier?: string;
    agentType?: string;
  }): void {
    this.record({
      ...params,
      success: false,
    });
  }

  /**
   * Get metrics for a specific provider
   */
  getProviderMetrics(provider: ProviderType): ProviderMetrics {
    const providerMetrics = this.metrics.filter(m => m.provider === provider);
    return this.calculateProviderMetrics(provider, providerMetrics);
  }

  /**
   * Get comparison metrics for both providers
   */
  getComparisonMetrics(): ComparisonMetrics {
    const foundry = this.getProviderMetrics('foundry');
    const legacy = this.getProviderMetrics('legacy');

    const errorRateDiff = foundry.errorRate - legacy.errorRate;
    const latencyP95Diff = foundry.latencyP95 - legacy.latencyP95;
    const costDiff = foundry.avgCostPerRequest - legacy.avgCostPerRequest;

    // Foundry is better if: lower error rate, similar latency, acceptable cost
    const foundryBetter = 
      errorRateDiff <= 0.01 && // Error rate not significantly worse
      latencyP95Diff <= 500 && // Latency not more than 500ms worse
      costDiff <= 0.01; // Cost not more than $0.01 worse per request

    return {
      foundry,
      legacy,
      comparison: {
        errorRateDiff,
        latencyP95Diff,
        costDiff,
        foundryBetter,
      },
      window: {
        startAt: this.windowStartAt,
        endAt: new Date(),
        durationMs: Date.now() - this.windowStartAt.getTime(),
      },
    };
  }

  /**
   * Get error rate for a provider
   */
  getErrorRate(provider: ProviderType): number {
    const providerMetrics = this.metrics.filter(m => m.provider === provider);
    if (providerMetrics.length === 0) return 0;
    
    const errorCount = providerMetrics.filter(m => !m.success).length;
    return errorCount / providerMetrics.length;
  }

  /**
   * Get latency p95 for a provider
   */
  getLatencyP95(provider: ProviderType): number {
    const latencies = this.metrics
      .filter(m => m.provider === provider)
      .map(m => m.latencyMs)
      .sort((a, b) => a - b);

    return this.percentile(latencies, 95);
  }

  /**
   * Get average cost per request for a provider
   */
  getAvgCost(provider: ProviderType): number {
    const providerMetrics = this.metrics.filter(m => m.provider === provider);
    if (providerMetrics.length === 0) return 0;

    const totalCost = providerMetrics.reduce((sum, m) => sum + m.costUsd, 0);
    return totalCost / providerMetrics.length;
  }

  /**
   * Get total request count
   */
  getTotalRequests(): number {
    return this.metrics.length;
  }

  /**
   * Get request count for a provider
   */
  getRequestCount(provider: ProviderType): number {
    return this.metrics.filter(m => m.provider === provider).length;
  }

  /**
   * Calculate provider metrics from raw data
   */
  private calculateProviderMetrics(
    provider: ProviderType, 
    metrics: RequestMetric[]
  ): ProviderMetrics {
    if (metrics.length === 0) {
      return this.emptyProviderMetrics(provider);
    }

    const errorCount = metrics.filter(m => !m.success).length;
    const latencies = metrics.map(m => m.latencyMs).sort((a, b) => a - b);
    const totalCost = metrics.reduce((sum, m) => sum + m.costUsd, 0);

    // Calculate model breakdown
    const modelBreakdown: Record<string, ModelMetrics> = {};
    const modelGroups = this.groupBy(metrics, m => m.model);

    for (const [model, modelMetrics] of Object.entries(modelGroups)) {
      const modelErrors = modelMetrics.filter(m => !m.success).length;
      const modelLatencies = modelMetrics.map(m => m.latencyMs);
      const modelCosts = modelMetrics.map(m => m.costUsd);

      modelBreakdown[model] = {
        model,
        requestCount: modelMetrics.length,
        avgLatency: this.average(modelLatencies),
        avgCost: this.average(modelCosts),
        errorRate: modelMetrics.length > 0 ? modelErrors / modelMetrics.length : 0,
      };
    }

    return {
      provider,
      requestCount: metrics.length,
      errorCount,
      errorRate: errorCount / metrics.length,
      latencyP50: this.percentile(latencies, 50),
      latencyP95: this.percentile(latencies, 95),
      latencyP99: this.percentile(latencies, 99),
      latencyAvg: this.average(latencies),
      totalCostUsd: totalCost,
      avgCostPerRequest: totalCost / metrics.length,
      modelBreakdown,
    };
  }

  /**
   * Create empty provider metrics
   */
  private emptyProviderMetrics(provider: ProviderType): ProviderMetrics {
    return {
      provider,
      requestCount: 0,
      errorCount: 0,
      errorRate: 0,
      latencyP50: 0,
      latencyP95: 0,
      latencyP99: 0,
      latencyAvg: 0,
      totalCostUsd: 0,
      avgCostPerRequest: 0,
      modelBreakdown: {},
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Calculate average
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Group array by key
   */
  private groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Rotate metrics window if needed
   */
  private maybeRotateWindow(): void {
    const now = Date.now();
    if (now - this.windowStartAt.getTime() >= this.config.windowMs) {
      this.metrics = [];
      this.windowStartAt = new Date();
    }
  }

  /**
   * Prune old metrics if over limit
   */
  private pruneIfNeeded(): void {
    if (this.metrics.length >= this.config.maxMetrics) {
      // Remove oldest 10%
      const removeCount = Math.floor(this.config.maxMetrics * 0.1);
      this.metrics = this.metrics.slice(removeCount);
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = [];
    this.windowStartAt = new Date();
  }

  /**
   * Get raw metrics (for debugging)
   */
  getRawMetrics(): RequestMetric[] {
    return [...this.metrics];
  }
}

/**
 * Convenience function to get metrics collector instance
 */
export function getMetricsCollector(
  config?: Partial<MetricsCollectorConfig>
): MetricsCollector {
  return MetricsCollector.getInstance(config);
}
