import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreakerFactory } from '@/lib/services/circuit-breaker';
import { getRequestCoalescer } from '@/lib/services/request-coalescer';
import { gracefulDegradation, DegradationConfigs } from '@/lib/services/graceful-degradation';
import { getAPIMonitoringService } from '@/lib/services/api-monitoring-service';

/**
 * Integration tests for the complete performance optimization system
 * Tests the interaction between all performance components as described in the guide
 */
describe('Performance Optimization Integration', () => {
  beforeEach(() => {
    // Reset all services
    CircuitBreakerFactory.resetAll();
    getRequestCoalescer().reset();
    gracefulDegradation.reset();
    getAPIMonitoringService().reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Circuit Breaker + Request Coalescing Integration', () => {
    it('should combine circuit breaker protection with request coalescing', async () => {
      const circuitBreaker = CircuitBreakerFactory.getCircuitBreaker('test-service', 'ai_service');
      const coalescer = getRequestCoalescer();
      
      let callCount = 0;
      const mockService = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          return Promise.reject(new Error('Service failure'));
        }
        return Promise.resolve(`success-${callCount}`);
      });

      // Multiple simultaneous requests that will be coalesced
      const coalescedOperation = () => coalescer.coalesce(
        'test-operation',
        () => circuitBreaker.execute(mockService)
      );

      // First batch - should fail and open circuit
      try {
        await Promise.all([
          coalescedOperation(),
          coalescedOperation(),
          coalescedOperation(),
        ]);
      } catch (error) {
        // Expected to fail
      }

      // Circuit should be open
      expect(circuitBreaker.getMetrics().state).toBe('OPEN');
      
      // Coalescer should have tracked the requests
      const coalescerMetrics = coalescer.getMetrics();
      expect(coalescerMetrics.totalRequests).toBe(3);
      expect(coalescerMetrics.coalescedRequests).toBe(2);
    });

    it('should handle circuit breaker fallbacks with coalescing', async () => {
      const circuitBreaker = CircuitBreakerFactory.getCircuitBreaker('fallback-service', 'ai_service');
      const coalescer = getRequestCoalescer();
      
      const failingService = vi.fn().mockRejectedValue(new Error('Service down'));
      const fallbackService = vi.fn().mockResolvedValue('fallback-result');

      // Open the circuit first
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(failingService);
        } catch (error) {
          // Expected to fail
        }
      }

      // Now use coalescing with fallback
      const coalescedFallbackOperation = () => coalescer.coalesce(
        'fallback-operation',
        () => circuitBreaker.execute(failingService, fallbackService)
      );

      const results = await Promise.all([
        coalescedFallbackOperation(),
        coalescedFallbackOperation(),
        coalescedFallbackOperation(),
      ]);

      expect(results).toEqual(['fallback-result', 'fallback-result', 'fallback-result']);
      expect(fallbackService).toHaveBeenCalledOnce(); // Coalesced
      expect(failingService).not.toHaveBeenCalled(); // Circuit was open
    });
  });

  describe('Graceful Degradation + Circuit Breaker Integration', () => {
    it('should use circuit breakers within degradation strategies', async () => {
      const criticalBreaker = CircuitBreakerFactory.getCircuitBreaker('critical-service', 'ai_service');
      const optionalBreaker = CircuitBreakerFactory.getCircuitBreaker('optional-service', 'external_api');

      const criticalService = vi.fn().mockResolvedValue('critical-success');
      const optionalService = vi.fn().mockRejectedValue(new Error('Optional failure'));

      // Mock service functions to use circuit breakers
      vi.spyOn(gracefulDegradation as any, 'getServiceFunction')
        .mockImplementation((name: string) => {
          switch (name) {
            case 'critical_service':
              return () => criticalBreaker.execute(criticalService);
            case 'optional_service':
              return () => optionalBreaker.execute(optionalService);
            default:
              return vi.fn().mockRejectedValue(new Error('Unknown service'));
          }
        });

      const config = DegradationConfigs.userDashboard();
      const result = await gracefulDegradation.executeWithDegradation(config);

      expect(result.status).toBe('partial');
      expect(criticalBreaker.getMetrics().successfulRequests).toBe(1);
      expect(optionalBreaker.getMetrics().failedRequests).toBeGreaterThan(0);
    });

    it('should handle circuit breaker states in degradation', async () => {
      const unstableBreaker = CircuitBreakerFactory.getCircuitBreaker('unstable-service', 'ai_service');
      
      const unstableService = vi.fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockRejectedValueOnce(new Error('Failure 3'))
        .mockRejectedValueOnce(new Error('Failure 4'))
        .mockRejectedValueOnce(new Error('Failure 5'));

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await unstableBreaker.execute(unstableService);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(unstableBreaker.getMetrics().state).toBe('OPEN');

      // Now use in degradation
      vi.spyOn(gracefulDegradation as any, 'getServiceFunction')
        .mockImplementation(() => () => unstableBreaker.execute(unstableService));

      const config = {
        strategy: 'best_effort' as const,
        globalTimeout: 5000,
        services: [
          { 
            name: 'unstable_service', 
            priority: 'important' as const, 
            timeout: 1000,
            fallback: () => 'degraded-result'
          },
        ],
      };

      const result = await gracefulDegradation.executeWithDegradation(config);

      expect(result.status).toBe('success');
      expect(result.degradedServices).toContain('unstable_service');
      
      const serviceResult = result.results.find(r => r.name === 'unstable_service');
      expect(serviceResult?.data).toBe('degraded-result');
      expect(serviceResult?.fallbackUsed).toBe(true);
    });
  });

  describe('Complete Performance Stack Integration', () => {
    it('should integrate all performance components in a realistic scenario', async () => {
      const monitoring = getAPIMonitoringService();
      const coalescer = getRequestCoalescer();
      
      // Simulate a complete API request flow
      const aiServiceBreaker = CircuitBreakerFactory.getCircuitBreaker('ai-service', 'ai_service');
      const dbServiceBreaker = CircuitBreakerFactory.getCircuitBreaker('database', 'database');
      
      let aiCallCount = 0;
      let dbCallCount = 0;
      
      const aiService = vi.fn().mockImplementation(() => {
        aiCallCount++;
        const responseTime = Math.random() * 1000 + 500; // 500-1500ms
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() < 0.1) { // 10% failure rate
              reject(new Error('AI service timeout'));
            } else {
              resolve(`ai-result-${aiCallCount}`);
            }
          }, responseTime);
        });
      });

      const dbService = vi.fn().mockImplementation(() => {
        dbCallCount++;
        const responseTime = Math.random() * 200 + 50; // 50-250ms
        return new Promise(resolve => {
          setTimeout(() => resolve(`db-result-${dbCallCount}`), responseTime);
        });
      });

      // Mock degradation service functions
      vi.spyOn(gracefulDegradation as any, 'getServiceFunction')
        .mockImplementation((name: string) => {
          switch (name) {
            case 'ai_service':
              return () => coalescer.coalesce(
                `ai-${Date.now()}`,
                () => aiServiceBreaker.execute(aiService)
              );
            case 'database':
              return () => coalescer.coalesce(
                `db-${Date.now()}`,
                () => dbServiceBreaker.execute(dbService)
              );
            default:
              return vi.fn().mockRejectedValue(new Error('Unknown service'));
          }
        });

      // Execute multiple concurrent requests
      const requests = Array(10).fill(null).map(async (_, i) => {
        const startTime = Date.now();
        
        try {
          const config = {
            strategy: 'best_effort' as const,
            globalTimeout: 10000,
            services: [
              { 
                name: 'ai_service', 
                priority: 'critical' as const, 
                timeout: 2000,
                fallback: () => 'ai-fallback'
              },
              { 
                name: 'database', 
                priority: 'critical' as const, 
                timeout: 1000,
                fallback: () => 'db-fallback'
              },
            ],
          };

          const result = await gracefulDegradation.executeWithDegradation(config);
          const responseTime = Date.now() - startTime;
          
          // Record metrics
          monitoring.recordMetric({
            endpoint: '/api/integrated-test',
            method: 'POST',
            statusCode: result.status === 'success' ? 200 : 500,
            responseTime,
            userId: `user-${i}`,
          });

          return result;
        } catch (error) {
          const responseTime = Date.now() - startTime;
          
          monitoring.recordMetric({
            endpoint: '/api/integrated-test',
            method: 'POST',
            statusCode: 500,
            responseTime,
            userId: `user-${i}`,
            errorType: 'IntegrationError',
          });

          throw error;
        }
      });

      const results = await Promise.allSettled(requests);
      
      // Verify integration results
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      expect(successfulResults.length).toBeGreaterThan(5); // Most should succeed

      // Check monitoring metrics
      const healthMetrics = monitoring.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(10);
      expect(healthMetrics.averageResponseTime).toBeGreaterThan(0);

      // Check circuit breaker metrics
      const aiMetrics = aiServiceBreaker.getMetrics();
      const dbMetrics = dbServiceBreaker.getMetrics();
      expect(aiMetrics.totalRequests).toBeGreaterThan(0);
      expect(dbMetrics.totalRequests).toBeGreaterThan(0);

      // Check coalescing metrics
      const coalescingMetrics = coalescer.getMetrics();
      expect(coalescingMetrics.totalRequests).toBeGreaterThan(0);

      // Check degradation metrics
      const degradationMetrics = gracefulDegradation.getMetrics();
      expect(degradationMetrics.totalRequests).toBe(10);
    });

    it('should handle cascading failures gracefully', async () => {
      const monitoring = getAPIMonitoringService();
      
      // Simulate cascading failure scenario
      const primaryBreaker = CircuitBreakerFactory.getCircuitBreaker('primary-service', 'ai_service');
      const secondaryBreaker = CircuitBreakerFactory.getCircuitBreaker('secondary-service', 'database');
      
      const primaryService = vi.fn().mockRejectedValue(new Error('Primary service down'));
      const secondaryService = vi.fn().mockRejectedValue(new Error('Secondary service down'));
      const fallbackService = vi.fn().mockResolvedValue('emergency-fallback');

      // Open both circuits
      for (let i = 0; i < 5; i++) {
        try {
          await primaryBreaker.execute(primaryService);
        } catch (error) {
          // Expected to fail
        }
      }

      for (let i = 0; i < 3; i++) {
        try {
          await secondaryBreaker.execute(secondaryService);
        } catch (error) {
          // Expected to fail
        }
      }

      // Mock degradation with cascading fallbacks
      vi.spyOn(gracefulDegradation as any, 'getServiceFunction')
        .mockImplementation((name: string) => {
          switch (name) {
            case 'primary_service':
              return () => primaryBreaker.execute(primaryService, () => 
                secondaryBreaker.execute(secondaryService, fallbackService)
              );
            default:
              return vi.fn().mockRejectedValue(new Error('Unknown service'));
          }
        });

      const config = {
        strategy: 'best_effort' as const,
        globalTimeout: 5000,
        services: [
          { 
            name: 'primary_service', 
            priority: 'critical' as const, 
            timeout: 1000
          },
        ],
      };

      const startTime = Date.now();
      const result = await gracefulDegradation.executeWithDegradation(config);
      const responseTime = Date.now() - startTime;

      expect(result.status).toBe('success');
      expect(result.results[0].data).toBe('emergency-fallback');
      expect(fallbackService).toHaveBeenCalledOnce();

      // Record the successful fallback
      monitoring.recordMetric({
        endpoint: '/api/cascading-test',
        method: 'POST',
        statusCode: 200,
        responseTime,
        userId: 'test-user',
      });

      const healthMetrics = monitoring.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(1);
      expect(healthMetrics.successRate).toBe(100);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track performance across all components', async () => {
      const monitoring = getAPIMonitoringService();
      const coalescer = getRequestCoalescer();
      
      // Simulate various performance scenarios
      const scenarios = [
        { name: 'fast-service', delay: 100, failRate: 0 },
        { name: 'slow-service', delay: 1000, failRate: 0.1 },
        { name: 'unreliable-service', delay: 200, failRate: 0.3 },
      ];

      for (const scenario of scenarios) {
        const breaker = CircuitBreakerFactory.getCircuitBreaker(scenario.name, 'ai_service');
        
        const service = vi.fn().mockImplementation(() => {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              if (Math.random() < scenario.failRate) {
                reject(new Error(`${scenario.name} failed`));
              } else {
                resolve(`${scenario.name}-success`);
              }
            }, scenario.delay);
          });
        });

        // Execute multiple requests
        for (let i = 0; i < 10; i++) {
          const startTime = Date.now();
          
          try {
            await coalescer.coalesce(
              `${scenario.name}-${i}`,
              () => breaker.execute(service)
            );
            
            const responseTime = Date.now() - startTime;
            monitoring.recordMetric({
              endpoint: `/api/${scenario.name}`,
              method: 'GET',
              statusCode: 200,
              responseTime,
              userId: `user-${i}`,
            });
          } catch (error) {
            const responseTime = Date.now() - startTime;
            monitoring.recordMetric({
              endpoint: `/api/${scenario.name}`,
              method: 'GET',
              statusCode: 500,
              responseTime,
              userId: `user-${i}`,
              errorType: 'ServiceError',
            });
          }
        }
      }

      // Verify comprehensive metrics
      const healthMetrics = monitoring.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(30);
      expect(healthMetrics.averageResponseTime).toBeGreaterThan(0);
      
      const endpointMetrics = monitoring.getEndpointMetrics();
      expect(Object.keys(endpointMetrics)).toHaveLength(3);
      
      // Fast service should have low response times
      const fastServiceMetrics = endpointMetrics['GET /api/fast-service'];
      expect(fastServiceMetrics.averageResponseTime).toBeLessThan(200);
      expect(fastServiceMetrics.errorRate).toBe(0);
      
      // Slow service should have high response times
      const slowServiceMetrics = endpointMetrics['GET /api/slow-service'];
      expect(slowServiceMetrics.averageResponseTime).toBeGreaterThan(800);
      
      // Unreliable service should have high error rate
      const unreliableServiceMetrics = endpointMetrics['GET /api/unreliable-service'];
      expect(unreliableServiceMetrics.errorRate).toBeGreaterThan(20);

      // Check circuit breaker states
      const allBreakerMetrics = CircuitBreakerFactory.getAllMetrics();
      expect(Object.keys(allBreakerMetrics)).toHaveLength(3);
      
      // Unreliable service circuit might be open
      const unreliableBreaker = allBreakerMetrics['ai_service:unreliable-service'];
      expect(unreliableBreaker.failedRequests).toBeGreaterThan(0);
    });

    it('should generate alerts based on performance thresholds', async () => {
      const monitoring = getAPIMonitoringService();
      
      // Configure alert thresholds
      monitoring.updateAlertThresholds({
        highLatency: 500,
        errorRate: 10,
        rateLimitRate: 5,
        tokenUsagePerHour: 1000,
      });

      // Simulate high latency scenario
      for (let i = 0; i < 10; i++) {
        monitoring.recordMetric({
          endpoint: '/api/slow-endpoint',
          method: 'POST',
          statusCode: 200,
          responseTime: 800, // Above threshold
          userId: `user-${i}`,
        });
      }

      // Simulate high error rate scenario
      for (let i = 0; i < 10; i++) {
        monitoring.recordMetric({
          endpoint: '/api/error-endpoint',
          method: 'POST',
          statusCode: i < 3 ? 500 : 200, // 30% error rate
          responseTime: 200,
          userId: `user-${i}`,
        });
      }

      const alerts = monitoring.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      
      const latencyAlert = alerts.find(a => a.type === 'high_latency');
      const errorAlert = alerts.find(a => a.type === 'error_rate');
      
      expect(latencyAlert).toBeDefined();
      expect(errorAlert).toBeDefined();
      
      if (latencyAlert) {
        expect(latencyAlert.currentValue).toBeGreaterThan(latencyAlert.threshold);
        expect(latencyAlert.severity).toMatch(/high|critical/);
      }
      
      if (errorAlert) {
        expect(errorAlert.currentValue).toBeGreaterThan(errorAlert.threshold);
      }
    });
  });

  describe('SLI/SLO Compliance', () => {
    it('should track SLI metrics according to performance guide', async () => {
      const monitoring = getAPIMonitoringService();
      
      // Simulate requests that meet SLO targets
      // Target: 99.9% availability, P95 < 500ms, < 0.1% error rate
      
      const totalRequests = 1000;
      const targetErrorRate = 0.1; // 0.1%
      const targetP95Latency = 500; // 500ms
      
      for (let i = 0; i < totalRequests; i++) {
        const shouldFail = i < (totalRequests * targetErrorRate / 100); // 0.1% failures
        const responseTime = shouldFail ? 
          Math.random() * 1000 + 2000 : // Failed requests are slow
          Math.random() * 400 + 50;     // Successful requests are fast
        
        monitoring.recordMetric({
          endpoint: '/api/sli-test',
          method: 'GET',
          statusCode: shouldFail ? 500 : 200,
          responseTime,
          userId: `user-${i}`,
        });
      }

      const healthMetrics = monitoring.getHealthMetrics();
      
      // Verify SLI compliance
      expect(healthMetrics.successRate).toBeGreaterThanOrEqual(99.9); // Availability SLI
      expect(healthMetrics.errorRate).toBeLessThanOrEqual(0.1); // Error rate SLI
      expect(healthMetrics.averageResponseTime).toBeLessThan(targetP95Latency); // Latency SLI
      
      const endpointMetrics = monitoring.getEndpointMetrics();
      const sliMetrics = endpointMetrics['GET /api/sli-test'];
      
      expect(sliMetrics.successRate).toBeGreaterThanOrEqual(99.9);
      expect(sliMetrics.errorRate).toBeLessThanOrEqual(0.1);
    });

    it('should detect SLO breaches and generate appropriate alerts', async () => {
      const monitoring = getAPIMonitoringService();
      
      // Simulate SLO breach scenario
      const totalRequests = 100;
      const highErrorRate = 5; // 5% error rate (above 0.1% target)
      
      for (let i = 0; i < totalRequests; i++) {
        const shouldFail = i < (totalRequests * highErrorRate / 100);
        
        monitoring.recordMetric({
          endpoint: '/api/slo-breach',
          method: 'POST',
          statusCode: shouldFail ? 500 : 200,
          responseTime: shouldFail ? 5000 : 200, // High latency on failures
          userId: `user-${i}`,
        });
      }

      const healthMetrics = monitoring.getHealthMetrics();
      const alerts = monitoring.getActiveAlerts();
      
      // Should breach SLO targets
      expect(healthMetrics.errorRate).toBeGreaterThan(0.1);
      expect(alerts.length).toBeGreaterThan(0);
      
      const errorRateAlert = alerts.find(a => a.type === 'error_rate');
      const latencyAlert = alerts.find(a => a.type === 'high_latency');
      
      expect(errorRateAlert).toBeDefined();
      expect(latencyAlert).toBeDefined();
      
      if (errorRateAlert) {
        expect(errorRateAlert.severity).toMatch(/high|critical/);
      }
    });
  });
});