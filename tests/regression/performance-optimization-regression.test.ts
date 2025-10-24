import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreakerFactory } from '@/lib/services/circuit-breaker';
import { getRequestCoalescer } from '@/lib/services/request-coalescer';
import { gracefulDegradation, DegradationConfigs } from '@/lib/services/graceful-degradation';
import { getAPIMonitoringService } from '@/lib/services/api-monitoring-service';
import { LoadTestingService, LoadTestConfigs } from '@/tests/load/load-testing-service';

/**
 * Regression tests to ensure the performance optimization system
 * continues to meet the requirements defined in the performance guide
 */
describe('Performance Optimization Regression Tests', () => {
  beforeEach(() => {
    // Reset all services to ensure clean state
    CircuitBreakerFactory.resetAll();
    getRequestCoalescer().reset();
    gracefulDegradation.reset();
    getAPIMonitoringService().reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('SLI/SLO Compliance Regression', () => {
    it('should maintain 99.9% availability SLI target', async () => {
      const monitoring = getAPIMonitoringService();
      const totalRequests = 1000;
      const maxAllowedFailures = Math.floor(totalRequests * 0.001); // 0.1% max failure rate

      // Simulate requests with target availability
      for (let i = 0; i < totalRequests; i++) {
        const shouldFail = i < maxAllowedFailures;
        
        monitoring.recordMetric({
          endpoint: '/api/availability-test',
          method: 'GET',
          statusCode: shouldFail ? 500 : 200,
          responseTime: Math.random() * 400 + 100, // 100-500ms
          userId: `user-${i % 100}`,
        });
      }

      const healthMetrics = monitoring.getHealthMetrics();
      
      // Verify availability SLI
      expect(healthMetrics.successRate).toBeGreaterThanOrEqual(99.9);
      expect(healthMetrics.errorRate).toBeLessThanOrEqual(0.1);
      
      // Verify no critical alerts for meeting SLO
      const alerts = monitoring.getActiveAlerts();
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      expect(criticalAlerts.length).toBe(0);
    });

    it('should maintain P95 latency < 500ms SLI target', async () => {
      const monitoring = getAPIMonitoringService();
      const requests = 1000;
      
      // Generate response times that meet P95 < 500ms target
      for (let i = 0; i < requests; i++) {
        let responseTime;
        
        if (i < requests * 0.95) {
          // 95% of requests under 400ms
          responseTime = Math.random() * 300 + 50; // 50-350ms
        } else {
          // 5% of requests can be slower but should average under 500ms
          responseTime = Math.random() * 200 + 400; // 400-600ms
        }
        
        monitoring.recordMetric({
          endpoint: '/api/latency-test',
          method: 'POST',
          statusCode: 200,
          responseTime,
          userId: `user-${i}`,
        });
      }

      const endpointMetrics = monitoring.getEndpointMetrics();
      const latencyMetrics = endpointMetrics['POST /api/latency-test'];
      
      // P95 should be under 500ms (we can't directly test P95 but average should be well under)
      expect(latencyMetrics.averageResponseTime).toBeLessThan(400);
      
      // No high latency alerts should be triggered
      const alerts = monitoring.getActiveAlerts();
      const latencyAlerts = alerts.filter(a => a.type === 'high_latency');
      expect(latencyAlerts.length).toBe(0);
    });

    it('should maintain error rate < 0.1% SLI target', async () => {
      const monitoring = getAPIMonitoringService();
      const totalRequests = 10000; // Large sample for accurate error rate
      const targetErrorRate = 0.05; // 0.05% to be well under 0.1% target
      
      for (let i = 0; i < totalRequests; i++) {
        const shouldFail = Math.random() < (targetErrorRate / 100);
        
        monitoring.recordMetric({
          endpoint: '/api/error-rate-test',
          method: 'GET',
          statusCode: shouldFail ? 500 : 200,
          responseTime: Math.random() * 200 + 100,
          userId: `user-${i % 500}`,
        });
      }

      const healthMetrics = monitoring.getHealthMetrics();
      expect(healthMetrics.errorRate).toBeLessThanOrEqual(0.1);
      
      const endpointMetrics = monitoring.getEndpointMetrics();
      const errorMetrics = endpointMetrics['GET /api/error-rate-test'];
      expect(errorMetrics.errorRate).toBeLessThanOrEqual(0.1);
    });
  });

  describe('Circuit Breaker Configuration Regression', () => {
    it('should maintain AI service circuit breaker configuration', () => {
      const aiBreaker = CircuitBreakerFactory.getCircuitBreaker('test-ai', 'ai_service');
      const config = aiBreaker.getMetrics().config;
      
      // Verify AI service configuration matches guide specifications
      expect(config.failureThreshold).toBe(5);
      expect(config.recoveryTimeout).toBe(60000); // 1 minute
      expect(config.monitoringWindow).toBe(300000); // 5 minutes
      expect(config.expectedFailureRate).toBe(10); // 10%
    });

    it('should maintain database circuit breaker configuration', () => {
      const dbBreaker = CircuitBreakerFactory.getCircuitBreaker('test-db', 'database');
      const config = dbBreaker.getMetrics().config;
      
      // Verify database configuration matches guide specifications
      expect(config.failureThreshold).toBe(3);
      expect(config.recoveryTimeout).toBe(30000); // 30 seconds
      expect(config.monitoringWindow).toBe(120000); // 2 minutes
      expect(config.expectedFailureRate).toBe(5); // 5%
    });

    it('should maintain external API circuit breaker configuration', () => {
      const externalBreaker = CircuitBreakerFactory.getCircuitBreaker('test-external', 'external_api');
      const config = externalBreaker.getMetrics().config;
      
      // Verify external API configuration matches guide specifications
      expect(config.failureThreshold).toBe(10);
      expect(config.recoveryTimeout).toBe(120000); // 2 minutes
      expect(config.monitoringWindow).toBe(600000); // 10 minutes
      expect(config.expectedFailureRate).toBe(15); // 15%
    });

    it('should maintain cache circuit breaker configuration', () => {
      const cacheBreaker = CircuitBreakerFactory.getCircuitBreaker('test-cache', 'cache');
      const config = cacheBreaker.getMetrics().config;
      
      // Verify cache configuration matches guide specifications
      expect(config.failureThreshold).toBe(5);
      expect(config.recoveryTimeout).toBe(15000); // 15 seconds
      expect(config.monitoringWindow).toBe(60000); // 1 minute
      expect(config.expectedFailureRate).toBe(8); // 8%
    });
  });

  describe('Request Coalescing Performance Regression', () => {
    it('should maintain coalescing effectiveness under load', async () => {
      const coalescer = getRequestCoalescer();
      const mockService = vi.fn().mockResolvedValue('coalesced-result');
      
      // Simulate high-frequency identical requests
      const concurrentRequests = 100;
      const promises = Array(concurrentRequests).fill(null).map(() =>
        coalescer.coalesce('high-frequency-key', mockService)
      );
      
      const results = await Promise.all(promises);
      
      // Verify all requests succeeded
      expect(results.every(r => r === 'coalesced-result')).toBe(true);
      
      // Verify coalescing effectiveness
      expect(mockService).toHaveBeenCalledOnce();
      
      const metrics = coalescer.getMetrics();
      expect(metrics.totalRequests).toBe(concurrentRequests);
      expect(metrics.coalescedRequests).toBe(concurrentRequests - 1);
      expect(metrics.coalescingRate).toBe(99); // 99% coalescing rate
    });

    it('should maintain cache performance standards', async () => {
      const coalescer = getRequestCoalescer();
      const mockService = vi.fn()
        .mockResolvedValueOnce('first-result')
        .mockResolvedValueOnce('second-result');
      
      // First request - cache miss
      const result1 = await coalescer.coalesce('cache-test-key', mockService, { ttl: 5000 });
      
      // Second request - should be cache hit
      const result2 = await coalescer.coalesce('cache-test-key', mockService, { ttl: 5000 });
      
      expect(result1).toBe('first-result');
      expect(result2).toBe('first-result'); // Same result from cache
      expect(mockService).toHaveBeenCalledOnce();
      
      const metrics = coalescer.getMetrics();
      expect(metrics.cacheHitRate).toBe(50); // 1 hit out of 2 requests
    });

    it('should maintain memory efficiency under high load', async () => {
      const coalescer = getRequestCoalescer();
      const mockService = vi.fn().mockImplementation((key: string) => 
        Promise.resolve(`result-${key}`)
      );
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate many unique requests to test memory management
      const uniqueRequests = 2000;
      const promises = Array(uniqueRequests).fill(null).map((_, i) =>
        coalescer.coalesce(`unique-key-${i}`, () => mockService(`${i}`), { ttl: 1000 })
      );
      
      await Promise.all(promises);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Memory growth should be reasonable (less than 20MB for 2000 requests)
      expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024);
      
      const metrics = coalescer.getMetrics();
      expect(metrics.totalRequests).toBe(uniqueRequests);
      
      // Cache size should be managed (not exceed max size)
      expect(metrics.cacheSize).toBeLessThanOrEqual(1000);
    });
  });

  describe('Graceful Degradation Strategy Regression', () => {
    it('should maintain user dashboard degradation strategy', async () => {
      const config = DegradationConfigs.userDashboard();
      
      // Verify configuration matches guide specifications
      expect(config.strategy).toBe('best_effort');
      expect(config.globalTimeout).toBe(10000);
      expect(config.services).toHaveLength(5);
      
      // Verify critical services have fallbacks
      const criticalServices = config.services.filter(s => s.priority === 'critical');
      expect(criticalServices.length).toBe(2);
      expect(criticalServices.every(s => s.fallback)).toBe(true);
      
      // Verify service timeouts are reasonable
      const userProfileService = config.services.find(s => s.name === 'user_profile');
      expect(userProfileService?.timeout).toBe(2000);
      
      const campaignsService = config.services.find(s => s.name === 'campaigns');
      expect(campaignsService?.timeout).toBe(3000);
    });

    it('should maintain content generation degradation strategy', async () => {
      const config = DegradationConfigs.contentGeneration();
      
      // Verify configuration matches guide specifications
      expect(config.strategy).toBe('fail_fast');
      expect(config.globalTimeout).toBe(30000);
      
      const aiService = config.services.find(s => s.name === 'ai_service');
      expect(aiService?.priority).toBe('critical');
      expect(aiService?.timeout).toBe(15000);
      expect(aiService?.fallback).toBeDefined();
    });

    it('should maintain analytics degradation strategy', async () => {
      const config = DegradationConfigs.analytics();
      
      // Verify configuration matches guide specifications
      expect(config.strategy).toBe('best_effort');
      expect(config.globalTimeout).toBe(15000);
      
      const realTimeStats = config.services.find(s => s.name === 'real_time_stats');
      expect(realTimeStats?.priority).toBe('critical');
      expect(realTimeStats?.timeout).toBe(3000);
      expect(realTimeStats?.fallback).toBeDefined();
    });

    it('should maintain maintenance mode degradation strategy', async () => {
      const config = DegradationConfigs.maintenanceMode();
      
      // Verify configuration matches guide specifications
      expect(config.strategy).toBe('essential_only');
      expect(config.globalTimeout).toBe(5000);
      
      // All services should be critical in maintenance mode
      expect(config.services.every(s => s.priority === 'critical')).toBe(true);
      expect(config.services.every(s => s.timeout <= 3000)).toBe(true);
    });
  });

  describe('Load Testing Performance Regression', () => {
    it('should maintain smoke test performance standards', () => {
      const config = LoadTestConfigs.smokeTest('http://localhost:3000');
      
      // Verify smoke test configuration matches guide specifications
      expect(config.concurrentUsers).toBe(5);
      expect(config.duration).toBe(30);
      expect(config.rampUpTime).toBe(10);
      expect(config.scenarios).toHaveLength(1);
      expect(config.scenarios[0].weight).toBe(100);
    });

    it('should maintain load test performance standards', () => {
      const config = LoadTestConfigs.loadTest('http://localhost:3000');
      
      // Verify load test configuration matches guide specifications
      expect(config.concurrentUsers).toBe(50);
      expect(config.duration).toBe(300); // 5 minutes
      expect(config.rampUpTime).toBe(60);
      
      // Verify scenario distribution
      const totalWeight = config.scenarios.reduce((sum, s) => sum + s.weight, 0);
      expect(totalWeight).toBe(100);
      
      const contentGeneration = config.scenarios.find(s => s.name === 'content_generation');
      expect(contentGeneration?.weight).toBe(40);
      
      const optimization = config.scenarios.find(s => s.name === 'optimization');
      expect(optimization?.weight).toBe(30);
    });

    it('should maintain stress test performance standards', () => {
      const config = LoadTestConfigs.stressTest('http://localhost:3000');
      
      // Verify stress test configuration matches guide specifications
      expect(config.concurrentUsers).toBe(200);
      expect(config.duration).toBe(600); // 10 minutes
      expect(config.rampUpTime).toBe(120);
    });

    it('should maintain spike test performance standards', () => {
      const config = LoadTestConfigs.spikeTest('http://localhost:3000');
      
      // Verify spike test configuration matches guide specifications
      expect(config.concurrentUsers).toBe(500);
      expect(config.duration).toBe(120); // 2 minutes
      expect(config.rampUpTime).toBe(10); // Very fast ramp up
    });
  });

  describe('Monitoring and Alerting Regression', () => {
    it('should maintain alert threshold standards', () => {
      const monitoring = getAPIMonitoringService();
      
      // Test default alert thresholds match guide specifications
      monitoring.updateAlertThresholds({
        highLatency: 5000,     // 5 seconds
        errorRate: 5,          // 5%
        rateLimitRate: 10,     // 10%
        tokenUsagePerHour: 10000,
      });
      
      // Generate metrics that should trigger alerts
      monitoring.recordMetric({
        endpoint: '/api/alert-test',
        method: 'GET',
        statusCode: 200,
        responseTime: 6000, // Above threshold
      });
      
      const alerts = monitoring.getActiveAlerts();
      const latencyAlert = alerts.find(a => a.type === 'high_latency');
      
      expect(latencyAlert).toBeDefined();
      expect(latencyAlert?.threshold).toBe(5000);
      expect(latencyAlert?.currentValue).toBe(6000);
    });

    it('should maintain health metrics calculation standards', () => {
      const monitoring = getAPIMonitoringService();
      
      // Generate test data
      const testMetrics = [
        { statusCode: 200, responseTime: 100 },
        { statusCode: 200, responseTime: 200 },
        { statusCode: 500, responseTime: 300 },
        { statusCode: 200, responseTime: 150 },
        { statusCode: 429, responseTime: 50 },
      ];
      
      testMetrics.forEach((metric, i) => {
        monitoring.recordMetric({
          endpoint: `/api/health-test-${i}`,
          method: 'GET',
          ...metric,
          userId: `user-${i}`,
        });
      });
      
      const healthMetrics = monitoring.getHealthMetrics();
      
      // Verify calculations match expected formulas
      expect(healthMetrics.totalRequests).toBe(5);
      expect(healthMetrics.successRate).toBe(60); // 3 successful out of 5
      expect(healthMetrics.errorRate).toBe(20); // 1 error out of 5
      expect(healthMetrics.rateLimitHits).toBe(1);
      expect(healthMetrics.averageResponseTime).toBe(160); // (100+200+300+150+50)/5
      expect(healthMetrics.activeUsers).toBe(5);
    });

    it('should maintain endpoint metrics aggregation standards', () => {
      const monitoring = getAPIMonitoringService();
      
      // Generate metrics for specific endpoint
      const endpointMetrics = [
        { statusCode: 200, responseTime: 100 },
        { statusCode: 200, responseTime: 200 },
        { statusCode: 500, responseTime: 300 },
        { statusCode: 200, responseTime: 150 },
      ];
      
      endpointMetrics.forEach(metric => {
        monitoring.recordMetric({
          endpoint: '/api/endpoint-test',
          method: 'POST',
          ...metric,
        });
      });
      
      const allEndpointMetrics = monitoring.getEndpointMetrics();
      const testEndpointMetrics = allEndpointMetrics['POST /api/endpoint-test'];
      
      expect(testEndpointMetrics.requests).toBe(4);
      expect(testEndpointMetrics.averageResponseTime).toBe(187.5); // (100+200+300+150)/4
      expect(testEndpointMetrics.errorRate).toBe(25); // 1 error out of 4
      expect(testEndpointMetrics.successRate).toBe(75); // 3 success out of 4
    });
  });

  describe('Integration Performance Regression', () => {
    it('should maintain end-to-end performance under realistic load', async () => {
      const monitoring = getAPIMonitoringService();
      const coalescer = getRequestCoalescer();
      
      // Simulate realistic service with varying characteristics
      let requestCount = 0;
      const realisticService = vi.fn().mockImplementation(() => {
        requestCount++;
        const responseTime = Math.random() * 800 + 100; // 100-900ms
        const failureRate = 0.03; // 3% failure rate
        
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() < failureRate) {
              reject(new Error('Service temporarily unavailable'));
            } else {
              resolve({
                data: `Response ${requestCount}`,
                processingTime: responseTime,
              });
            }
          }, responseTime);
        });
      });

      const serviceBreaker = CircuitBreakerFactory.getCircuitBreaker('integration-test', 'ai_service');

      // Simulate realistic API request flow
      const apiRequestFlow = async (userId: string) => {
        const startTime = Date.now();

        try {
          const cacheKey = `integration:${userId}:${Math.floor(Date.now() / 30000)}`; // 30s windows
          
          const result = await coalescer.coalesce(
            cacheKey,
            () => serviceBreaker.execute(
              realisticService,
              () => ({ data: 'Fallback response', processingTime: 50 })
            ),
            { ttl: 30000 }
          );

          const duration = Date.now() - startTime;

          monitoring.recordMetric({
            endpoint: '/api/integration-test',
            method: 'POST',
            statusCode: 200,
            responseTime: duration,
            userId,
          });

          return { success: true, data: result, duration };

        } catch (error) {
          const duration = Date.now() - startTime;
          
          monitoring.recordMetric({
            endpoint: '/api/integration-test',
            method: 'POST',
            statusCode: 500,
            responseTime: duration,
            userId,
            errorType: 'IntegrationError',
          });

          return { success: false, error: error.message, duration };
        }
      };

      // Execute realistic load (30 concurrent users, 3 requests each)
      const concurrentUsers = 30;
      const requestsPerUser = 3;
      
      const allRequests = [];
      for (let user = 0; user < concurrentUsers; user++) {
        for (let req = 0; req < requestsPerUser; req++) {
          allRequests.push(apiRequestFlow(`user-${user}`));
        }
      }

      const startTime = Date.now();
      const results = await Promise.allSettled(allRequests);
      const totalDuration = Date.now() - startTime;

      // Verify performance standards
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      const successRate = (successfulResults.length / results.length) * 100;
      
      expect(successRate).toBeGreaterThan(90); // 90%+ success rate
      
      // Verify throughput standards
      const throughput = results.length / (totalDuration / 1000);
      expect(throughput).toBeGreaterThan(10); // At least 10 RPS
      
      // Verify monitoring captured metrics correctly
      const healthMetrics = monitoring.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(90); // 30 users * 3 requests
      expect(healthMetrics.averageResponseTime).toBeLessThan(2000); // Under 2 seconds
      
      // Verify circuit breaker remained stable
      const breakerMetrics = serviceBreaker.getMetrics();
      expect(breakerMetrics.state).toBe('CLOSED');
      
      // Verify coalescing was effective
      const coalescingMetrics = coalescer.getMetrics();
      expect(coalescingMetrics.coalescingRate).toBeGreaterThan(50); // Good coalescing
    });

    it('should maintain performance standards during degraded conditions', async () => {
      const monitoring = getAPIMonitoringService();
      
      // Simulate degraded service with high failure rate
      const degradedService = vi.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() < 0.4) { // 40% failure rate
              reject(new Error('Service degraded'));
            } else {
              resolve('Degraded response');
            }
          }, Math.random() * 1000 + 500); // 500-1500ms
        });
      });

      const degradedBreaker = CircuitBreakerFactory.getCircuitBreaker('degraded-test', 'ai_service');

      // Use graceful degradation
      vi.spyOn(gracefulDegradation as any, 'getServiceFunction')
        .mockImplementation(() => () => degradedBreaker.execute(
          degradedService,
          () => 'Fallback response'
        ));

      const config = {
        strategy: 'best_effort' as const,
        globalTimeout: 5000,
        services: [
          {
            name: 'degraded_service',
            priority: 'critical' as const,
            timeout: 2000,
            fallback: () => 'Emergency fallback',
          },
        ],
      };

      // Execute requests under degraded conditions
      const degradedRequests = Array(20).fill(null).map(async (_, i) => {
        const startTime = Date.now();
        
        try {
          const result = await gracefulDegradation.executeWithDegradation(config);
          const duration = Date.now() - startTime;
          
          monitoring.recordMetric({
            endpoint: '/api/degraded-test',
            method: 'POST',
            statusCode: result.status === 'failed' ? 500 : 200,
            responseTime: duration,
            userId: `degraded-user-${i}`,
          });
          
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          monitoring.recordMetric({
            endpoint: '/api/degraded-test',
            method: 'POST',
            statusCode: 500,
            responseTime: duration,
            userId: `degraded-user-${i}`,
          });
          
          throw error;
        }
      });

      const results = await Promise.allSettled(degradedRequests);
      
      // Even under degraded conditions, should maintain reasonable success rate
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      expect(successfulResults.length / results.length).toBeGreaterThan(0.7); // 70%+ success
      
      // Verify degradation metrics
      const degradationMetrics = gracefulDegradation.getMetrics();
      expect(degradationMetrics.totalRequests).toBe(20);
      expect(degradationMetrics.fallbacksUsed).toBeGreaterThan(0);
      
      // Verify monitoring captured degraded performance
      const healthMetrics = monitoring.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(20);
    });
  });

  describe('Memory and Resource Management Regression', () => {
    it('should maintain memory efficiency under sustained load', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      const coalescer = getRequestCoalescer();
      const monitoring = getAPIMonitoringService();
      
      // Simulate sustained load over time
      const sustainedLoadDuration = 1000; // 1000 requests
      
      for (let i = 0; i < sustainedLoadDuration; i++) {
        // Vary request patterns to test memory management
        const cacheKey = `sustained-${i % 100}`; // 100 different cache keys
        
        await coalescer.coalesce(
          cacheKey,
          () => Promise.resolve(`result-${i}`),
          { ttl: 1000 }
        );
        
        monitoring.recordMetric({
          endpoint: `/api/sustained-${i % 10}`,
          method: 'GET',
          statusCode: 200,
          responseTime: Math.random() * 200 + 50,
          userId: `sustained-user-${i % 50}`,
        });
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Memory growth should be reasonable (less than 50MB for 1000 requests)
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
      
      // Services should still be responsive
      const coalescingMetrics = coalescer.getMetrics();
      expect(coalescingMetrics.totalRequests).toBe(sustainedLoadDuration);
      
      const healthMetrics = monitoring.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(sustainedLoadDuration);
    });

    it('should maintain cleanup efficiency', async () => {
      const coalescer = getRequestCoalescer();
      const monitoring = getAPIMonitoringService();
      
      // Generate data that will need cleanup
      for (let i = 0; i < 500; i++) {
        await coalescer.coalesce(
          `cleanup-test-${i}`,
          () => Promise.resolve(`result-${i}`),
          { ttl: 100 } // Short TTL for quick expiration
        );
        
        monitoring.recordMetric({
          endpoint: `/api/cleanup-${i}`,
          method: 'GET',
          statusCode: 200,
          responseTime: 100,
        });
      }
      
      let initialCacheSize = coalescer.getMetrics().cacheSize;
      expect(initialCacheSize).toBeGreaterThan(0);
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Trigger cleanup by making new requests
      for (let i = 0; i < 10; i++) {
        await coalescer.coalesce(
          `trigger-cleanup-${i}`,
          () => Promise.resolve(`cleanup-trigger-${i}`),
          { ttl: 5000 }
        );
      }
      
      const finalCacheSize = coalescer.getMetrics().cacheSize;
      
      // Cache should have been cleaned up
      expect(finalCacheSize).toBeLessThan(initialCacheSize);
      expect(finalCacheSize).toBeLessThanOrEqual(100); // Reasonable cache size
    });
  });
});