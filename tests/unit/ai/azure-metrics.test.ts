/**
 * Azure Metrics Service - Unit Tests
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 32: Implement comprehensive metrics emission
 * Validates: Requirements 11.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AzureMetricsService,
  ApplicationInsightsEmitter,
  type RequestMetrics,
  type MetricData,
  type IMetricsEmitter,
} from '../../../lib/ai/azure/azure-metrics.service';

// Mock emitter for testing
class MockMetricsEmitter implements IMetricsEmitter {
  public metrics: MetricData[] = [];
  public requests: RequestMetrics[] = [];
  public events: Array<{ name: string; properties?: Record<string, string> }> = [];
  public exceptions: Array<{ error: Error; properties?: Record<string, string> }> = [];
  public flushCount = 0;

  trackMetric(metric: MetricData): void {
    this.metrics.push(metric);
  }

  trackRequest(metrics: RequestMetrics): void {
    this.requests.push(metrics);
  }

  trackEvent(name: string, properties?: Record<string, string>): void {
    this.events.push({ name, properties });
  }

  trackException(error: Error, properties?: Record<string, string>): void {
    this.exceptions.push({ error, properties });
  }

  async flush(): Promise<void> {
    this.flushCount++;
  }

  reset(): void {
    this.metrics = [];
    this.requests = [];
    this.events = [];
    this.exceptions = [];
    this.flushCount = 0;
  }
}

describe('AzureMetricsService', () => {
  let service: AzureMetricsService;
  let mockEmitter: MockMetricsEmitter;

  beforeEach(() => {
    mockEmitter = new MockMetricsEmitter();
    service = new AzureMetricsService(mockEmitter);
    AzureMetricsService.resetInstance();
  });

  afterEach(() => {
    mockEmitter.reset();
  });

  describe('Request ID Generation', () => {
    it('should generate unique request IDs', () => {
      const id1 = service.generateRequestId();
      const id2 = service.generateRequestId();

      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should generate unique correlation IDs', () => {
      const id1 = service.generateCorrelationId();
      const id2 = service.generateCorrelationId();

      expect(id1).toMatch(/^corr_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^corr_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Request Tracking', () => {
    it('should start a request with correct initial values', () => {
      const metrics = service.startRequest({
        deployment: 'gpt-4-turbo-prod',
        model: 'gpt-4-turbo',
        tier: 'premium',
        operation: 'chat',
      });

      expect(metrics.requestId).toMatch(/^req_/);
      expect(metrics.correlationId).toMatch(/^corr_/);
      expect(metrics.deployment).toBe('gpt-4-turbo-prod');
      expect(metrics.model).toBe('gpt-4-turbo');
      expect(metrics.tier).toBe('premium');
      expect(metrics.operation).toBe('chat');
      expect(metrics.success).toBe(false);
      expect(metrics.promptTokens).toBe(0);
      expect(metrics.completionTokens).toBe(0);
      expect(metrics.totalTokens).toBe(0);
      expect(metrics.estimatedCost).toBe(0);
      expect(metrics.startTime).toBeInstanceOf(Date);
    });

    it('should use provided correlation ID', () => {
      const metrics = service.startRequest({
        correlationId: 'custom-corr-id',
        deployment: 'gpt-4-turbo-prod',
        model: 'gpt-4-turbo',
        tier: 'premium',
        operation: 'chat',
      });

      expect(metrics.correlationId).toBe('custom-corr-id');
    });

    it('should complete a request with success', () => {
      const startMetrics = service.startRequest({
        deployment: 'gpt-4-turbo-prod',
        model: 'gpt-4-turbo',
        tier: 'premium',
        operation: 'chat',
      });

      const completedMetrics = service.completeRequest(startMetrics, {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        estimatedCost: 0.005,
      });

      expect(completedMetrics.success).toBe(true);
      expect(completedMetrics.promptTokens).toBe(100);
      expect(completedMetrics.completionTokens).toBe(50);
      expect(completedMetrics.totalTokens).toBe(150);
      expect(completedMetrics.estimatedCost).toBe(0.005);
      expect(completedMetrics.endTime).toBeInstanceOf(Date);
      expect(completedMetrics.latencyMs).toBeGreaterThanOrEqual(0);
      expect(mockEmitter.requests).toHaveLength(1);
    });

    it('should fail a request with error', () => {
      const startMetrics = service.startRequest({
        deployment: 'gpt-4-turbo-prod',
        model: 'gpt-4-turbo',
        tier: 'premium',
        operation: 'chat',
      });

      const failedMetrics = service.failRequest(startMetrics, {
        code: 'rate_limit_exceeded',
        message: 'Too many requests',
      });

      expect(failedMetrics.success).toBe(false);
      expect(failedMetrics.errorCode).toBe('rate_limit_exceeded');
      expect(failedMetrics.errorMessage).toBe('Too many requests');
      expect(failedMetrics.endTime).toBeInstanceOf(Date);
      expect(failedMetrics.latencyMs).toBeGreaterThanOrEqual(0);
      expect(mockEmitter.requests).toHaveLength(1);
    });
  });

  describe('Circuit Breaker Tracking', () => {
    it('should track circuit breaker state changes', () => {
      service.trackCircuitBreakerStateChange(
        'gpt-4-turbo-prod',
        'closed',
        'open'
      );

      expect(mockEmitter.events).toHaveLength(1);
      expect(mockEmitter.events[0].name).toBe('circuit_breaker_state_change');
      expect(mockEmitter.events[0].properties?.deployment).toBe('gpt-4-turbo-prod');
      expect(mockEmitter.events[0].properties?.previous_state).toBe('closed');
      expect(mockEmitter.events[0].properties?.new_state).toBe('open');

      expect(mockEmitter.metrics).toHaveLength(1);
      expect(mockEmitter.metrics[0].name).toBe('azure_openai_circuit_breaker_transition');
    });
  });

  describe('Deployment Health Tracking', () => {
    it('should track healthy deployment', () => {
      service.trackDeploymentHealth('gpt-4-turbo-prod', true, 150);

      expect(mockEmitter.metrics).toHaveLength(2);
      
      const healthMetric = mockEmitter.metrics.find(m => m.name === 'azure_openai_deployment_health');
      expect(healthMetric?.value).toBe(1);
      expect(healthMetric?.dimensions.deployment).toBe('gpt-4-turbo-prod');

      const latencyMetric = mockEmitter.metrics.find(m => m.name === 'azure_openai_deployment_latency');
      expect(latencyMetric?.value).toBe(150);
    });

    it('should track unhealthy deployment', () => {
      service.trackDeploymentHealth('gpt-4-turbo-prod', false);

      expect(mockEmitter.metrics).toHaveLength(1);
      const healthMetric = mockEmitter.metrics[0];
      expect(healthMetric.value).toBe(0);
      expect(healthMetric.dimensions.healthy).toBe('false');
    });
  });

  describe('Quota Tracking', () => {
    it('should track quota usage', () => {
      service.trackQuotaUsage('account-123', 75000, 100000);

      expect(mockEmitter.metrics).toHaveLength(2);

      const usageMetric = mockEmitter.metrics.find(m => m.name === 'azure_openai_quota_usage');
      expect(usageMetric?.value).toBe(75000);
      expect(usageMetric?.dimensions.account_id).toBe('account-123');

      const percentageMetric = mockEmitter.metrics.find(m => m.name === 'azure_openai_quota_percentage');
      expect(percentageMetric?.value).toBe(75);
    });

    it('should handle zero quota limit', () => {
      service.trackQuotaUsage('account-123', 0, 0);

      const percentageMetric = mockEmitter.metrics.find(m => m.name === 'azure_openai_quota_percentage');
      expect(percentageMetric?.value).toBe(0);
    });
  });

  describe('Rate Limit Tracking', () => {
    it('should track rate limit hits', () => {
      service.trackRateLimitHit('gpt-4-turbo-prod', 'account-123');

      expect(mockEmitter.metrics).toHaveLength(1);
      expect(mockEmitter.metrics[0].name).toBe('azure_openai_rate_limit_hit');
      expect(mockEmitter.metrics[0].dimensions.deployment).toBe('gpt-4-turbo-prod');
      expect(mockEmitter.metrics[0].dimensions.account_id).toBe('account-123');

      expect(mockEmitter.events).toHaveLength(1);
      expect(mockEmitter.events[0].name).toBe('rate_limit_exceeded');
    });
  });

  describe('Content Filter Tracking', () => {
    it('should track content filter triggers', () => {
      service.trackContentFilterTrigger('gpt-4-turbo-prod', 'hate', 'high');

      expect(mockEmitter.metrics).toHaveLength(1);
      expect(mockEmitter.metrics[0].name).toBe('azure_openai_content_filter_trigger');
      expect(mockEmitter.metrics[0].dimensions.filter_category).toBe('hate');
      expect(mockEmitter.metrics[0].dimensions.severity).toBe('high');

      expect(mockEmitter.events).toHaveLength(1);
      expect(mockEmitter.events[0].name).toBe('content_filter_triggered');
    });
  });

  describe('Metrics Aggregation', () => {
    it('should aggregate metrics correctly', () => {
      const requests: RequestMetrics[] = [
        createMockRequest({ latencyMs: 100, totalTokens: 100, estimatedCost: 0.01, success: true }),
        createMockRequest({ latencyMs: 200, totalTokens: 200, estimatedCost: 0.02, success: true }),
        createMockRequest({ latencyMs: 300, totalTokens: 150, estimatedCost: 0.015, success: false }),
      ];

      const aggregated = service.aggregateMetrics(requests, '1h');

      expect(aggregated.period).toBe('1h');
      expect(aggregated.totalRequests).toBe(3);
      expect(aggregated.successfulRequests).toBe(2);
      expect(aggregated.failedRequests).toBe(1);
      expect(aggregated.totalTokens).toBe(450);
      expect(aggregated.totalCost).toBe(0.045);
      expect(aggregated.averageLatencyMs).toBe(200);
      expect(aggregated.errorRate).toBeCloseTo(0.333, 2);
    });

    it('should calculate percentiles correctly', () => {
      const requests: RequestMetrics[] = [];
      for (let i = 1; i <= 100; i++) {
        requests.push(createMockRequest({ latencyMs: i * 10 }));
      }

      const aggregated = service.aggregateMetrics(requests, '1h');

      expect(aggregated.p50LatencyMs).toBe(500);
      expect(aggregated.p95LatencyMs).toBe(950);
      expect(aggregated.p99LatencyMs).toBe(990);
    });

    it('should handle empty requests array', () => {
      const aggregated = service.aggregateMetrics([], '1h');

      expect(aggregated.totalRequests).toBe(0);
      expect(aggregated.averageLatencyMs).toBe(0);
      expect(aggregated.errorRate).toBe(0);
    });

    it('should aggregate by deployment', () => {
      const requests: RequestMetrics[] = [
        createMockRequest({ deployment: 'gpt-4-turbo-prod', totalTokens: 100 }),
        createMockRequest({ deployment: 'gpt-4-turbo-prod', totalTokens: 200 }),
        createMockRequest({ deployment: 'gpt-35-turbo-prod', totalTokens: 50 }),
      ];

      const aggregated = service.aggregateMetrics(requests, '1h');

      expect(aggregated.byDeployment['gpt-4-turbo-prod'].requests).toBe(2);
      expect(aggregated.byDeployment['gpt-4-turbo-prod'].tokens).toBe(300);
      expect(aggregated.byDeployment['gpt-35-turbo-prod'].requests).toBe(1);
      expect(aggregated.byDeployment['gpt-35-turbo-prod'].tokens).toBe(50);
    });

    it('should aggregate by operation', () => {
      const requests: RequestMetrics[] = [
        createMockRequest({ operation: 'chat', totalTokens: 100 }),
        createMockRequest({ operation: 'chat', totalTokens: 200 }),
        createMockRequest({ operation: 'embedding', totalTokens: 50 }),
      ];

      const aggregated = service.aggregateMetrics(requests, '1h');

      expect(aggregated.byOperation['chat'].requests).toBe(2);
      expect(aggregated.byOperation['chat'].tokens).toBe(300);
      expect(aggregated.byOperation['embedding'].requests).toBe(1);
      expect(aggregated.byOperation['embedding'].tokens).toBe(50);
    });
  });

  describe('Flush', () => {
    it('should flush metrics', async () => {
      await service.flush();
      expect(mockEmitter.flushCount).toBe(1);
    });
  });
});

describe('ApplicationInsightsEmitter', () => {
  let emitter: ApplicationInsightsEmitter;

  beforeEach(() => {
    emitter = new ApplicationInsightsEmitter({ enabled: true, batchSize: 10 });
  });

  afterEach(() => {
    emitter.stopFlushTimer();
  });

  it('should buffer metrics', () => {
    emitter.trackMetric({
      name: 'test_metric',
      value: 100,
      timestamp: new Date(),
      dimensions: { test: 'value' },
    });

    const sizes = emitter.getBufferSizes();
    expect(sizes.metrics).toBe(1);
  });

  it('should buffer requests and emit metrics', () => {
    const request: RequestMetrics = createMockRequest({});
    emitter.trackRequest(request);

    const sizes = emitter.getBufferSizes();
    expect(sizes.requests).toBe(1);
    // trackRequest also emits individual metrics
    expect(sizes.metrics).toBeGreaterThan(0);
  });

  it('should auto-flush when batch size reached', async () => {
    const flushSpy = vi.spyOn(emitter, 'flush');

    for (let i = 0; i < 15; i++) {
      emitter.trackMetric({
        name: 'test_metric',
        value: i,
        timestamp: new Date(),
        dimensions: {},
      });
    }

    // Wait for async flush
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(flushSpy).toHaveBeenCalled();
  });
});

// Helper function to create mock request metrics
function createMockRequest(overrides: Partial<RequestMetrics>): RequestMetrics {
  const now = new Date();
  return {
    requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    correlationId: `corr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    deployment: 'gpt-4-turbo-prod',
    model: 'gpt-4-turbo',
    tier: 'premium',
    operation: 'chat',
    region: 'eastus',
    startTime: now,
    endTime: new Date(now.getTime() + (overrides.latencyMs || 100)),
    latencyMs: 100,
    promptTokens: 50,
    completionTokens: 50,
    totalTokens: 100,
    estimatedCost: 0.01,
    success: true,
    ...overrides,
  };
}
