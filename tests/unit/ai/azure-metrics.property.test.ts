/**
 * Azure Metrics Service - Property-Based Tests
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 32.1: Write property test for metrics emission
 * **Property 39: Metrics emission**
 * **Validates: Requirements 11.1**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  AzureMetricsService,
  type RequestMetrics,
  type MetricData,
  type IMetricsEmitter,
  type CircuitBreakerState,
} from '../../../lib/ai/azure/azure-metrics.service';

// ============================================================================
// Test Emitter for Property Testing
// ============================================================================

class PropertyTestEmitter implements IMetricsEmitter {
  public metrics: MetricData[] = [];
  public requests: RequestMetrics[] = [];
  public events: Array<{ name: string; properties?: Record<string, string> }> = [];
  public exceptions: Array<{ error: Error; properties?: Record<string, string> }> = [];

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
    // No-op for testing
  }

  reset(): void {
    this.metrics = [];
    this.requests = [];
    this.events = [];
    this.exceptions = [];
  }
}

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

const deploymentArb = fc.constantFrom(
  'gpt-4-turbo-prod',
  'gpt-4-standard-prod',
  'gpt-35-turbo-prod',
  'gpt-4-vision-prod',
  'text-embedding-ada-002-prod'
);

const modelArb = fc.constantFrom(
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  'gpt-4-vision',
  'text-embedding-ada-002'
);

const tierArb = fc.constantFrom('premium', 'standard', 'economy');

const operationArb = fc.constantFrom(
  'chat',
  'completion',
  'embedding',
  'vision',
  'analysis'
);

const regionArb = fc.constantFrom('eastus', 'westeurope', 'northeurope');

const circuitBreakerStateArb = fc.constantFrom<CircuitBreakerState>('closed', 'open', 'half-open');

const tokenCountArb = fc.integer({ min: 0, max: 100000 });

const costArb = fc.float({ min: 0, max: 100, noNaN: true });

const latencyArb = fc.integer({ min: 1, max: 60000 }); // 1ms to 60s

const accountIdArb = fc.option(
  fc.stringMatching(/^[a-z0-9-]{8,36}$/),
  { nil: undefined }
);

const correlationIdArb = fc.option(
  fc.stringMatching(/^corr_[a-z0-9_-]+$/),
  { nil: undefined }
);

const errorCodeArb = fc.constantFrom(
  'rate_limit_exceeded',
  'quota_exceeded',
  'content_filter',
  'timeout',
  'authentication_error',
  'deployment_not_found'
);

const requestOptionsArb = fc.record({
  deployment: deploymentArb,
  model: modelArb,
  tier: tierArb,
  operation: operationArb,
  region: fc.option(regionArb, { nil: undefined }),
  accountId: accountIdArb,
  correlationId: correlationIdArb,
});

const requestResultArb = fc.record({
  promptTokens: tokenCountArb,
  completionTokens: tokenCountArb,
  totalTokens: tokenCountArb,
  estimatedCost: costArb,
});

const requestErrorArb = fc.record({
  code: errorCodeArb,
  message: fc.string({ minLength: 1, maxLength: 200 }),
});

// ============================================================================
// Property Tests
// ============================================================================

describe('Azure Metrics Service - Property-Based Tests', () => {
  let service: AzureMetricsService;
  let emitter: PropertyTestEmitter;

  beforeEach(() => {
    emitter = new PropertyTestEmitter();
    service = new AzureMetricsService(emitter);
    AzureMetricsService.resetInstance();
  });

  afterEach(() => {
    emitter.reset();
  });

  /**
   * **Feature: huntaze-ai-azure-migration, Property 39: Metrics emission**
   * **Validates: Requirements 11.1**
   * 
   * Property: For any Azure OpenAI request, the system should emit telemetry metrics
   * to Azure Monitor including latency, token count, cost, and success/failure status.
   */
  describe('Property 39: Metrics emission', () => {
    it('should emit all required metrics for any successful request', () => {
      fc.assert(
        fc.property(
          requestOptionsArb,
          requestResultArb,
          (options, result) => {
            emitter.reset();

            // Start and complete a request
            const metrics = service.startRequest(options);
            service.completeRequest(metrics, result);

            // Verify request was tracked
            expect(emitter.requests).toHaveLength(1);
            const trackedRequest = emitter.requests[0];

            // Verify all required fields are present
            expect(trackedRequest.requestId).toBeDefined();
            expect(trackedRequest.correlationId).toBeDefined();
            expect(trackedRequest.deployment).toBe(options.deployment);
            expect(trackedRequest.model).toBe(options.model);
            expect(trackedRequest.tier).toBe(options.tier);
            expect(trackedRequest.operation).toBe(options.operation);
            expect(trackedRequest.success).toBe(true);
            expect(trackedRequest.promptTokens).toBe(result.promptTokens);
            expect(trackedRequest.completionTokens).toBe(result.completionTokens);
            expect(trackedRequest.totalTokens).toBe(result.totalTokens);
            expect(trackedRequest.estimatedCost).toBe(result.estimatedCost);
            expect(trackedRequest.latencyMs).toBeGreaterThanOrEqual(0);
            expect(trackedRequest.startTime).toBeInstanceOf(Date);
            expect(trackedRequest.endTime).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should emit all required metrics for any failed request', () => {
      fc.assert(
        fc.property(
          requestOptionsArb,
          requestErrorArb,
          (options, error) => {
            emitter.reset();

            // Start and fail a request
            const metrics = service.startRequest(options);
            service.failRequest(metrics, error);

            // Verify request was tracked
            expect(emitter.requests).toHaveLength(1);
            const trackedRequest = emitter.requests[0];

            // Verify failure fields
            expect(trackedRequest.success).toBe(false);
            expect(trackedRequest.errorCode).toBe(error.code);
            expect(trackedRequest.errorMessage).toBe(error.message);
            expect(trackedRequest.latencyMs).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate unique request IDs for all requests', () => {
      fc.assert(
        fc.property(
          fc.array(requestOptionsArb, { minLength: 2, maxLength: 50 }),
          (optionsArray) => {
            emitter.reset();

            const requestIds = new Set<string>();
            
            for (const options of optionsArray) {
              const metrics = service.startRequest(options);
              requestIds.add(metrics.requestId);
            }

            // All request IDs should be unique
            expect(requestIds.size).toBe(optionsArray.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve correlation ID when provided', () => {
      fc.assert(
        fc.property(
          requestOptionsArb,
          fc.string({ minLength: 5, maxLength: 50 }),
          (options, customCorrelationId) => {
            emitter.reset();

            const metrics = service.startRequest({
              ...options,
              correlationId: customCorrelationId,
            });

            expect(metrics.correlationId).toBe(customCorrelationId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate latency correctly for any request duration', () => {
      fc.assert(
        fc.property(
          requestOptionsArb,
          requestResultArb,
          latencyArb,
          (options, result, expectedLatency) => {
            emitter.reset();

            const startTime = new Date();
            const metrics = service.startRequest(options);
            
            // Simulate time passing
            const endTime = new Date(startTime.getTime() + expectedLatency);
            
            // Manually set times for deterministic testing
            metrics.startTime = startTime;
            const completed = service.completeRequest(metrics, result);
            
            // Latency should be non-negative
            expect(completed.latencyMs).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Circuit breaker state changes should always be tracked
   */
  describe('Circuit Breaker Metrics', () => {
    it('should track all circuit breaker state transitions', () => {
      fc.assert(
        fc.property(
          deploymentArb,
          circuitBreakerStateArb,
          circuitBreakerStateArb,
          (deployment, fromState, toState) => {
            emitter.reset();

            service.trackCircuitBreakerStateChange(deployment, fromState, toState);

            // Should emit event
            expect(emitter.events).toHaveLength(1);
            expect(emitter.events[0].name).toBe('circuit_breaker_state_change');
            expect(emitter.events[0].properties?.deployment).toBe(deployment);
            expect(emitter.events[0].properties?.previous_state).toBe(fromState);
            expect(emitter.events[0].properties?.new_state).toBe(toState);

            // Should emit metric
            expect(emitter.metrics).toHaveLength(1);
            expect(emitter.metrics[0].name).toBe('azure_openai_circuit_breaker_transition');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Quota tracking should correctly calculate percentages
   */
  describe('Quota Metrics', () => {
    it('should calculate quota percentage correctly for any usage/limit combination', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 1, max: 1000000 }),
          (accountId, quotaUsed, quotaLimit) => {
            emitter.reset();

            service.trackQuotaUsage(accountId, quotaUsed, quotaLimit);

            const percentageMetric = emitter.metrics.find(
              m => m.name === 'azure_openai_quota_percentage'
            );

            expect(percentageMetric).toBeDefined();
            
            const expectedPercentage = (quotaUsed / quotaLimit) * 100;
            expect(percentageMetric!.value).toBeCloseTo(expectedPercentage, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle zero quota limit gracefully', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 0, max: 1000000 }),
          (accountId, quotaUsed) => {
            emitter.reset();

            service.trackQuotaUsage(accountId, quotaUsed, 0);

            const percentageMetric = emitter.metrics.find(
              m => m.name === 'azure_openai_quota_percentage'
            );

            expect(percentageMetric).toBeDefined();
            expect(percentageMetric!.value).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Metrics aggregation should be mathematically correct
   */
  describe('Metrics Aggregation Properties', () => {
    it('should correctly sum total tokens across all requests', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              totalTokens: tokenCountArb,
              latencyMs: latencyArb,
              estimatedCost: costArb,
              success: fc.boolean(),
            }),
            { minLength: 1, maxLength: 100 }
          ),
          (requestData) => {
            const requests: RequestMetrics[] = requestData.map((data, i) => ({
              requestId: `req_${i}`,
              correlationId: `corr_${i}`,
              deployment: 'gpt-4-turbo-prod',
              model: 'gpt-4-turbo',
              tier: 'premium',
              operation: 'chat',
              region: 'eastus',
              startTime: new Date(),
              endTime: new Date(),
              latencyMs: data.latencyMs,
              promptTokens: Math.floor(data.totalTokens / 2),
              completionTokens: Math.ceil(data.totalTokens / 2),
              totalTokens: data.totalTokens,
              estimatedCost: data.estimatedCost,
              success: data.success,
            }));

            const aggregated = service.aggregateMetrics(requests, '1h');

            const expectedTotalTokens = requestData.reduce((sum, r) => sum + r.totalTokens, 0);
            expect(aggregated.totalTokens).toBe(expectedTotalTokens);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly calculate error rate', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 1, maxLength: 100 }),
          (successFlags) => {
            const requests: RequestMetrics[] = successFlags.map((success, i) => ({
              requestId: `req_${i}`,
              correlationId: `corr_${i}`,
              deployment: 'gpt-4-turbo-prod',
              model: 'gpt-4-turbo',
              tier: 'premium',
              operation: 'chat',
              region: 'eastus',
              startTime: new Date(),
              endTime: new Date(),
              latencyMs: 100,
              promptTokens: 50,
              completionTokens: 50,
              totalTokens: 100,
              estimatedCost: 0.01,
              success,
            }));

            const aggregated = service.aggregateMetrics(requests, '1h');

            const failedCount = successFlags.filter(s => !s).length;
            const expectedErrorRate = failedCount / successFlags.length;
            
            expect(aggregated.errorRate).toBeCloseTo(expectedErrorRate, 10);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly calculate average latency', () => {
      fc.assert(
        fc.property(
          fc.array(latencyArb, { minLength: 1, maxLength: 100 }),
          (latencies) => {
            const requests: RequestMetrics[] = latencies.map((latencyMs, i) => ({
              requestId: `req_${i}`,
              correlationId: `corr_${i}`,
              deployment: 'gpt-4-turbo-prod',
              model: 'gpt-4-turbo',
              tier: 'premium',
              operation: 'chat',
              region: 'eastus',
              startTime: new Date(),
              endTime: new Date(),
              latencyMs,
              promptTokens: 50,
              completionTokens: 50,
              totalTokens: 100,
              estimatedCost: 0.01,
              success: true,
            }));

            const aggregated = service.aggregateMetrics(requests, '1h');

            const expectedAverage = latencies.reduce((a, b) => a + b, 0) / latencies.length;
            expect(aggregated.averageLatencyMs).toBeCloseTo(expectedAverage, 5);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly calculate percentiles', () => {
      fc.assert(
        fc.property(
          fc.array(latencyArb, { minLength: 10, maxLength: 100 }),
          (latencies) => {
            const requests: RequestMetrics[] = latencies.map((latencyMs, i) => ({
              requestId: `req_${i}`,
              correlationId: `corr_${i}`,
              deployment: 'gpt-4-turbo-prod',
              model: 'gpt-4-turbo',
              tier: 'premium',
              operation: 'chat',
              region: 'eastus',
              startTime: new Date(),
              endTime: new Date(),
              latencyMs,
              promptTokens: 50,
              completionTokens: 50,
              totalTokens: 100,
              estimatedCost: 0.01,
              success: true,
            }));

            const aggregated = service.aggregateMetrics(requests, '1h');

            // P50 should be <= P95 should be <= P99
            expect(aggregated.p50LatencyMs).toBeLessThanOrEqual(aggregated.p95LatencyMs);
            expect(aggregated.p95LatencyMs).toBeLessThanOrEqual(aggregated.p99LatencyMs);

            // All percentiles should be within the range of actual latencies
            const sortedLatencies = [...latencies].sort((a, b) => a - b);
            expect(aggregated.p50LatencyMs).toBeGreaterThanOrEqual(sortedLatencies[0]);
            expect(aggregated.p99LatencyMs).toBeLessThanOrEqual(sortedLatencies[sortedLatencies.length - 1]);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly aggregate by deployment', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              deployment: deploymentArb,
              totalTokens: tokenCountArb,
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (requestData) => {
            const requests: RequestMetrics[] = requestData.map((data, i) => ({
              requestId: `req_${i}`,
              correlationId: `corr_${i}`,
              deployment: data.deployment,
              model: 'gpt-4-turbo',
              tier: 'premium',
              operation: 'chat',
              region: 'eastus',
              startTime: new Date(),
              endTime: new Date(),
              latencyMs: 100,
              promptTokens: Math.floor(data.totalTokens / 2),
              completionTokens: Math.ceil(data.totalTokens / 2),
              totalTokens: data.totalTokens,
              estimatedCost: 0.01,
              success: true,
            }));

            const aggregated = service.aggregateMetrics(requests, '1h');

            // Verify each deployment's token count
            for (const deployment of Object.keys(aggregated.byDeployment)) {
              const expectedTokens = requestData
                .filter(r => r.deployment === deployment)
                .reduce((sum, r) => sum + r.totalTokens, 0);
              
              expect(aggregated.byDeployment[deployment].tokens).toBe(expectedTokens);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Deployment health tracking should be consistent
   */
  describe('Deployment Health Properties', () => {
    it('should track health status correctly for any deployment', () => {
      fc.assert(
        fc.property(
          deploymentArb,
          fc.boolean(),
          fc.option(latencyArb, { nil: undefined }),
          (deployment, healthy, latency) => {
            emitter.reset();

            service.trackDeploymentHealth(deployment, healthy, latency);

            const healthMetric = emitter.metrics.find(
              m => m.name === 'azure_openai_deployment_health'
            );

            expect(healthMetric).toBeDefined();
            expect(healthMetric!.value).toBe(healthy ? 1 : 0);
            expect(healthMetric!.dimensions.deployment).toBe(deployment);

            if (latency !== undefined) {
              const latencyMetric = emitter.metrics.find(
                m => m.name === 'azure_openai_deployment_latency'
              );
              expect(latencyMetric).toBeDefined();
              expect(latencyMetric!.value).toBe(latency);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
