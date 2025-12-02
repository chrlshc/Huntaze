/**
 * Azure Metrics Service
 * Comprehensive metrics emission for Azure OpenAI operations
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 32: Implement comprehensive metrics emission
 * Validates: Requirements 11.1
 */

import { AZURE_OPENAI_CONFIG } from './azure-openai.config';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  dimensions: Record<string, string>;
  unit?: MetricUnit;
}

export type MetricUnit = 
  | 'count'
  | 'milliseconds'
  | 'tokens'
  | 'dollars'
  | 'percentage'
  | 'bytes';

export interface RequestMetrics {
  requestId: string;
  correlationId: string;
  accountId?: string;
  deployment: string;
  model: string;
  tier: string;
  operation: string;
  region: string;
  startTime: Date;
  endTime?: Date;
  latencyMs?: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  circuitBreakerState?: CircuitBreakerState;
}

export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export interface AggregatedMetrics {
  period: string;
  startTime: Date;
  endTime: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  averageLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  byDeployment: Record<string, DeploymentMetrics>;
  byOperation: Record<string, OperationMetrics>;
}

export interface DeploymentMetrics {
  deployment: string;
  requests: number;
  tokens: number;
  cost: number;
  averageLatencyMs: number;
  errorRate: number;
}

export interface OperationMetrics {
  operation: string;
  requests: number;
  tokens: number;
  cost: number;
  averageLatencyMs: number;
}

export interface MetricsConfig {
  enabled: boolean;
  batchSize: number;
  flushIntervalMs: number;
  instrumentationKey?: string;
  connectionString?: string;
}

// ============================================================================
// Metrics Emitter Interface
// ============================================================================

export interface IMetricsEmitter {
  trackMetric(metric: MetricData): void;
  trackRequest(metrics: RequestMetrics): void;
  trackEvent(name: string, properties?: Record<string, string>): void;
  trackException(error: Error, properties?: Record<string, string>): void;
  flush(): Promise<void>;
}

// ============================================================================
// Azure Application Insights Emitter
// ============================================================================

export class ApplicationInsightsEmitter implements IMetricsEmitter {
  private buffer: MetricData[] = [];
  private requestBuffer: RequestMetrics[] = [];
  private config: MetricsConfig;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<MetricsConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? process.env.AZURE_METRICS_ENABLED === 'true',
      batchSize: config.batchSize ?? 100,
      flushIntervalMs: config.flushIntervalMs ?? 60000, // 1 minute
      instrumentationKey: config.instrumentationKey ?? process.env.APPLICATIONINSIGHTS_INSTRUMENTATION_KEY,
      connectionString: config.connectionString ?? process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    };

    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  /**
   * Track a custom metric
   */
  trackMetric(metric: MetricData): void {
    if (!this.config.enabled) return;

    this.buffer.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    });

    if (this.buffer.length >= this.config.batchSize) {
      this.flush().catch(console.error);
    }
  }

  /**
   * Track a request with full metrics
   * **Feature: huntaze-ai-azure-migration, Property 39: Metrics emission**
   * **Validates: Requirements 11.1**
   */
  trackRequest(metrics: RequestMetrics): void {
    if (!this.config.enabled) return;

    this.requestBuffer.push(metrics);

    // Emit individual metrics
    const dimensions = this.buildDimensions(metrics);

    // Latency metric
    if (metrics.latencyMs !== undefined) {
      this.trackMetric({
        name: 'azure_openai_latency',
        value: metrics.latencyMs,
        timestamp: metrics.endTime || new Date(),
        dimensions,
        unit: 'milliseconds',
      });
    }

    // Token metrics
    this.trackMetric({
      name: 'azure_openai_prompt_tokens',
      value: metrics.promptTokens,
      timestamp: metrics.endTime || new Date(),
      dimensions,
      unit: 'tokens',
    });

    this.trackMetric({
      name: 'azure_openai_completion_tokens',
      value: metrics.completionTokens,
      timestamp: metrics.endTime || new Date(),
      dimensions,
      unit: 'tokens',
    });

    this.trackMetric({
      name: 'azure_openai_total_tokens',
      value: metrics.totalTokens,
      timestamp: metrics.endTime || new Date(),
      dimensions,
      unit: 'tokens',
    });

    // Cost metric
    this.trackMetric({
      name: 'azure_openai_cost',
      value: metrics.estimatedCost,
      timestamp: metrics.endTime || new Date(),
      dimensions,
      unit: 'dollars',
    });

    // Success/failure metric
    this.trackMetric({
      name: metrics.success ? 'azure_openai_success' : 'azure_openai_failure',
      value: 1,
      timestamp: metrics.endTime || new Date(),
      dimensions,
      unit: 'count',
    });

    // Circuit breaker state metric
    if (metrics.circuitBreakerState) {
      this.trackMetric({
        name: 'azure_openai_circuit_breaker_state',
        value: this.circuitBreakerStateToValue(metrics.circuitBreakerState),
        timestamp: metrics.endTime || new Date(),
        dimensions: {
          ...dimensions,
          circuit_breaker_state: metrics.circuitBreakerState,
        },
        unit: 'count',
      });
    }

    if (this.requestBuffer.length >= this.config.batchSize) {
      this.flush().catch(console.error);
    }
  }

  /**
   * Track a custom event
   */
  trackEvent(name: string, properties?: Record<string, string>): void {
    if (!this.config.enabled) return;

    // In production, this would send to Application Insights
    console.log(`[AppInsights Event] ${name}`, properties);
  }

  /**
   * Track an exception
   */
  trackException(error: Error, properties?: Record<string, string>): void {
    if (!this.config.enabled) return;

    // In production, this would send to Application Insights
    console.error(`[AppInsights Exception] ${error.message}`, {
      stack: error.stack,
      ...properties,
    });
  }

  /**
   * Flush all buffered metrics
   */
  async flush(): Promise<void> {
    if (!this.config.enabled) return;

    const metricsToFlush = [...this.buffer];
    const requestsToFlush = [...this.requestBuffer];
    
    this.buffer = [];
    this.requestBuffer = [];

    if (metricsToFlush.length === 0 && requestsToFlush.length === 0) {
      return;
    }

    try {
      // In production, this would batch send to Application Insights
      // For now, we log the metrics
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[AppInsights] Flushing ${metricsToFlush.length} metrics, ${requestsToFlush.length} requests`);
      }
    } catch (error) {
      // Re-add failed metrics to buffer for retry
      this.buffer.push(...metricsToFlush);
      this.requestBuffer.push(...requestsToFlush);
      throw error;
    }
  }

  /**
   * Build dimensions from request metrics
   */
  private buildDimensions(metrics: RequestMetrics): Record<string, string> {
    const dimensions: Record<string, string> = {
      request_id: metrics.requestId,
      correlation_id: metrics.correlationId,
      deployment: metrics.deployment,
      model: metrics.model,
      tier: metrics.tier,
      operation: metrics.operation,
      region: metrics.region,
      success: String(metrics.success),
    };

    if (metrics.accountId) {
      dimensions.account_id = metrics.accountId;
    }

    if (metrics.errorCode) {
      dimensions.error_code = metrics.errorCode;
    }

    return dimensions;
  }

  /**
   * Convert circuit breaker state to numeric value
   */
  private circuitBreakerStateToValue(state: CircuitBreakerState): number {
    switch (state) {
      case 'closed': return 0;
      case 'half-open': return 1;
      case 'open': return 2;
      default: return -1;
    }
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushIntervalMs);
  }

  /**
   * Stop the flush timer
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get buffer sizes for testing
   */
  getBufferSizes(): { metrics: number; requests: number } {
    return {
      metrics: this.buffer.length,
      requests: this.requestBuffer.length,
    };
  }
}


// ============================================================================
// Azure Metrics Service (Main Service)
// ============================================================================

export class AzureMetricsService {
  private emitter: IMetricsEmitter;
  private static instance: AzureMetricsService | null = null;

  constructor(emitter?: IMetricsEmitter) {
    this.emitter = emitter || new ApplicationInsightsEmitter();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AzureMetricsService {
    if (!AzureMetricsService.instance) {
      AzureMetricsService.instance = new AzureMetricsService();
    }
    return AzureMetricsService.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    AzureMetricsService.instance = null;
  }

  /**
   * Generate a unique request ID
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate a correlation ID
   */
  generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Start tracking a request
   */
  startRequest(options: {
    correlationId?: string;
    accountId?: string;
    deployment: string;
    model: string;
    tier: string;
    operation: string;
    region?: string;
  }): RequestMetrics {
    return {
      requestId: this.generateRequestId(),
      correlationId: options.correlationId || this.generateCorrelationId(),
      accountId: options.accountId,
      deployment: options.deployment,
      model: options.model,
      tier: options.tier,
      operation: options.operation,
      region: options.region || AZURE_OPENAI_CONFIG.regions.primary,
      startTime: new Date(),
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
      success: false,
    };
  }

  /**
   * Complete a request with success
   */
  completeRequest(
    metrics: RequestMetrics,
    result: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      estimatedCost: number;
    }
  ): RequestMetrics {
    const endTime = new Date();
    const completed: RequestMetrics = {
      ...metrics,
      endTime,
      latencyMs: endTime.getTime() - metrics.startTime.getTime(),
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
      estimatedCost: result.estimatedCost,
      success: true,
    };

    this.emitter.trackRequest(completed);
    return completed;
  }

  /**
   * Fail a request with error
   */
  failRequest(
    metrics: RequestMetrics,
    error: {
      code: string;
      message: string;
    }
  ): RequestMetrics {
    const endTime = new Date();
    const failed: RequestMetrics = {
      ...metrics,
      endTime,
      latencyMs: endTime.getTime() - metrics.startTime.getTime(),
      success: false,
      errorCode: error.code,
      errorMessage: error.message,
    };

    this.emitter.trackRequest(failed);
    return failed;
  }

  /**
   * Track circuit breaker state change
   */
  trackCircuitBreakerStateChange(
    deployment: string,
    previousState: CircuitBreakerState,
    newState: CircuitBreakerState
  ): void {
    this.emitter.trackEvent('circuit_breaker_state_change', {
      deployment,
      previous_state: previousState,
      new_state: newState,
      timestamp: new Date().toISOString(),
    });

    this.emitter.trackMetric({
      name: 'azure_openai_circuit_breaker_transition',
      value: 1,
      timestamp: new Date(),
      dimensions: {
        deployment,
        from_state: previousState,
        to_state: newState,
      },
      unit: 'count',
    });
  }

  /**
   * Track model deployment health
   */
  trackDeploymentHealth(
    deployment: string,
    healthy: boolean,
    latencyMs?: number
  ): void {
    this.emitter.trackMetric({
      name: 'azure_openai_deployment_health',
      value: healthy ? 1 : 0,
      timestamp: new Date(),
      dimensions: {
        deployment,
        healthy: String(healthy),
      },
      unit: 'count',
    });

    if (latencyMs !== undefined) {
      this.emitter.trackMetric({
        name: 'azure_openai_deployment_latency',
        value: latencyMs,
        timestamp: new Date(),
        dimensions: { deployment },
        unit: 'milliseconds',
      });
    }
  }

  /**
   * Track quota usage
   */
  trackQuotaUsage(
    accountId: string,
    quotaUsed: number,
    quotaLimit: number
  ): void {
    const usagePercentage = quotaLimit > 0 ? (quotaUsed / quotaLimit) * 100 : 0;

    this.emitter.trackMetric({
      name: 'azure_openai_quota_usage',
      value: quotaUsed,
      timestamp: new Date(),
      dimensions: {
        account_id: accountId,
        quota_limit: String(quotaLimit),
      },
      unit: 'tokens',
    });

    this.emitter.trackMetric({
      name: 'azure_openai_quota_percentage',
      value: usagePercentage,
      timestamp: new Date(),
      dimensions: {
        account_id: accountId,
      },
      unit: 'percentage',
    });
  }

  /**
   * Track rate limit hit
   */
  trackRateLimitHit(
    deployment: string,
    accountId?: string
  ): void {
    this.emitter.trackMetric({
      name: 'azure_openai_rate_limit_hit',
      value: 1,
      timestamp: new Date(),
      dimensions: {
        deployment,
        ...(accountId && { account_id: accountId }),
      },
      unit: 'count',
    });

    this.emitter.trackEvent('rate_limit_exceeded', {
      deployment,
      ...(accountId && { account_id: accountId }),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track content filter trigger
   */
  trackContentFilterTrigger(
    deployment: string,
    filterCategory: string,
    severity: string
  ): void {
    this.emitter.trackMetric({
      name: 'azure_openai_content_filter_trigger',
      value: 1,
      timestamp: new Date(),
      dimensions: {
        deployment,
        filter_category: filterCategory,
        severity,
      },
      unit: 'count',
    });

    this.emitter.trackEvent('content_filter_triggered', {
      deployment,
      filter_category: filterCategory,
      severity,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Aggregate metrics for a time period
   */
  aggregateMetrics(
    requests: RequestMetrics[],
    period: string
  ): AggregatedMetrics {
    if (requests.length === 0) {
      return this.emptyAggregation(period);
    }

    const latencies = requests
      .filter(r => r.latencyMs !== undefined)
      .map(r => r.latencyMs!)
      .sort((a, b) => a - b);

    const successfulRequests = requests.filter(r => r.success);
    const failedRequests = requests.filter(r => !r.success);

    const byDeployment: Record<string, DeploymentMetrics> = {};
    const byOperation: Record<string, OperationMetrics> = {};

    for (const req of requests) {
      // Aggregate by deployment
      if (!byDeployment[req.deployment]) {
        byDeployment[req.deployment] = {
          deployment: req.deployment,
          requests: 0,
          tokens: 0,
          cost: 0,
          averageLatencyMs: 0,
          errorRate: 0,
        };
      }
      byDeployment[req.deployment].requests++;
      byDeployment[req.deployment].tokens += req.totalTokens;
      byDeployment[req.deployment].cost += req.estimatedCost;

      // Aggregate by operation
      if (!byOperation[req.operation]) {
        byOperation[req.operation] = {
          operation: req.operation,
          requests: 0,
          tokens: 0,
          cost: 0,
          averageLatencyMs: 0,
        };
      }
      byOperation[req.operation].requests++;
      byOperation[req.operation].tokens += req.totalTokens;
      byOperation[req.operation].cost += req.estimatedCost;
    }

    // Calculate averages and error rates
    for (const deployment of Object.keys(byDeployment)) {
      const deploymentRequests = requests.filter(r => r.deployment === deployment);
      const deploymentLatencies = deploymentRequests
        .filter(r => r.latencyMs !== undefined)
        .map(r => r.latencyMs!);
      
      byDeployment[deployment].averageLatencyMs = 
        deploymentLatencies.length > 0
          ? deploymentLatencies.reduce((a, b) => a + b, 0) / deploymentLatencies.length
          : 0;
      
      byDeployment[deployment].errorRate = 
        deploymentRequests.filter(r => !r.success).length / deploymentRequests.length;
    }

    for (const operation of Object.keys(byOperation)) {
      const operationRequests = requests.filter(r => r.operation === operation);
      const operationLatencies = operationRequests
        .filter(r => r.latencyMs !== undefined)
        .map(r => r.latencyMs!);
      
      byOperation[operation].averageLatencyMs = 
        operationLatencies.length > 0
          ? operationLatencies.reduce((a, b) => a + b, 0) / operationLatencies.length
          : 0;
    }

    const startTimes = requests.map(r => r.startTime.getTime());
    const endTimes = requests
      .filter(r => r.endTime)
      .map(r => r.endTime!.getTime());

    return {
      period,
      startTime: new Date(Math.min(...startTimes)),
      endTime: new Date(Math.max(...endTimes, ...startTimes)),
      totalRequests: requests.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      totalTokens: requests.reduce((sum, r) => sum + r.totalTokens, 0),
      totalCost: requests.reduce((sum, r) => sum + r.estimatedCost, 0),
      averageLatencyMs: latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0,
      p50LatencyMs: this.percentile(latencies, 50),
      p95LatencyMs: this.percentile(latencies, 95),
      p99LatencyMs: this.percentile(latencies, 99),
      errorRate: failedRequests.length / requests.length,
      byDeployment,
      byOperation,
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
   * Create empty aggregation
   */
  private emptyAggregation(period: string): AggregatedMetrics {
    const now = new Date();
    return {
      period,
      startTime: now,
      endTime: now,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      errorRate: 0,
      byDeployment: {},
      byOperation: {},
    };
  }

  /**
   * Flush all metrics
   */
  async flush(): Promise<void> {
    await this.emitter.flush();
  }

  /**
   * Get the emitter (for testing)
   */
  getEmitter(): IMetricsEmitter {
    return this.emitter;
  }
}

// Export singleton instance
export const azureMetricsService = AzureMetricsService.getInstance();
