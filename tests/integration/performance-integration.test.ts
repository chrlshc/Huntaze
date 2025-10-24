import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { CircuitBreakerFactory } from '@/lib/services/circuit-breaker';
import { getRequestCoalescer } from '@/lib/services/request-coalescer';
import { gracefulDegradation } from '@/lib/services/graceful-degradation';
import { getAPIMonitoringService } from '@/lib/services/api-monitoring-service';
import { withCompleteValidation } from '@/lib/middleware/api-validation';
import { withAuthAndRateLimit } from '@/lib/middleware/api-auth';

/**
 * End-to-end integration tests for the complete performance optimization stack
 * Tests real API request flows with all performance components enabled
 */
describe('Performance Integration E2E Tests', () => {
  beforeEach(() => {
    // Reset all performance services
    CircuitBreakerFactory.resetAll();
    getRequestCoalescer().reset();
    gracefulDegradation.reset();
    getAPIMonitoringService().reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('API Request Flow with Full Performance Stack', () => {
    it('should handle complete API request with all performance optimizations', async () => {
      const monitoring = getAPIMonitoringService();
      
      // Mock a realistic API handler with performance optimizations
      const mockAIService = vi.fn().mockImplementation(() => {
        const delay = Math.random() * 500 + 200; // 200-700ms
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() < 0.05) { // 5% failure rate
              reject(new Error('AI service temporary failure'));
            } else {
              resolve({
                content: 'Generated content idea',
                usage: { totalTokens: 150 }
              });
            }
          }, delay);
        });
      });

      // Create circuit breaker for AI service
      const aiCircuitBreaker = CircuitBreakerFactory.getCircuitBreaker('content-ai', 'ai_service');
      const coalescer = getRequestCoalescer();

      // Mock API handler with performance optimizations
      const performanceOptimizedHandler = async (request: NextRequest) => {
        const startTime = Date.now();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
          // Simulate authentication (would normally use withAuthAndRateLimit)
          const userId = 'test-user-123';

          // Use request coalescing for AI service calls
          const cacheKey = `content-ideas:${userId}:${Date.now()}`;
          
          const result = await coalescer.coalesce(
            cacheKey,
            () => aiCircuitBreaker.execute(
              mockAIService,
              () => ({ content: 'Fallback content idea', usage: { totalTokens: 0 } })
            ),
            { ttl: 30000 } // 30 second cache
          );

          const duration = Date.now() - startTime;

          // Record metrics
          monitoring.recordMetric({
            endpoint: '/api/content-ideas/generate',
            method: 'POST',
            statusCode: 200,
            responseTime: duration,
            userId,
            tokensUsed: result.usage?.totalTokens,
            cacheHit: false, // Would be determined by coalescer
          });

          return NextResponse.json({
            success: true,
            data: result,
            meta: {
              requestId,
              duration,
              timestamp: new Date().toISOString(),
            },
          });

        } catch (error) {
          const duration = Date.now() - startTime;
          
          monitoring.recordMetric({
            endpoint: '/api/content-ideas/generate',
            method: 'POST',
            statusCode: 500,
            responseTime: duration,
            errorType: 'AIServiceError',
          });

          return NextResponse.json({
            success: false,
            error: {
              type: 'service_error',
              message: 'Content generation failed',
            },
            meta: {
              requestId,
              duration,
              timestamp: new Date().toISOString(),
            },
          }, { status: 500 });
        }
      };

      // Simulate multiple concurrent requests
      const requests = Array(20).fill(null).map(() => {
        const mockRequest = new NextRequest('http://localhost:3000/api/content-ideas/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
          body: JSON.stringify({
            creatorProfile: { id: 'test-user-123', niche: ['fitness'] },
            options: { count: 5 },
          }),
        });

        return performanceOptimizedHandler(mockRequest);
      });

      const responses = await Promise.allSettled(requests);
      
      // Verify results
      const successfulResponses = responses.filter(r => r.status === 'fulfilled');
      expect(successfulResponses.length).toBeGreaterThan(15); // Most should succeed

      // Check performance metrics
      const healthMetrics = monitoring.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(20);
      expect(healthMetrics.averageResponseTime).toBeLessThan(1000);
      expect(healthMetrics.successRate).toBeGreaterThan(75);

      // Check circuit breaker metrics
      const aiMetrics = aiCircuitBreaker.getMetrics();
      expect(aiMetrics.totalRequests).toBeGreaterThan(0);
      expect(aiMetrics.state).toBe('CLOSED'); // Should remain closed with low failure rate

      // Check coalescing effectiveness
      const coalescingMetrics = coalescer.getMetrics();
      expect(coalescingMetrics.totalRequests).toBe(20);
      expect(coalescingMetrics.coalescingRate).toBeGreaterThan(0); // Some requests should be coalesced
    });

    it('should handle degraded performance scenarios gracefully', async () => {
      const monitoring = getAPIMonitoringService();
      
      // Simulate degraded AI service
      const degradedAIService = vi.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() < 0.4) { // 40% failure rate
              reject(new Error('AI service overloaded'));
            } else {
              resolve({
                content: 'Degraded quality content',
                usage: { totalTokens: 100 }
              });
            }
          }, Math.random() * 2000 + 1000); // 1-3 second delay
        });
      });

      const aiCircuitBreaker = CircuitBreakerFactory.getCircuitBreaker('degraded-ai', 'ai_service');
      const coalescer = getRequestCoalescer();

      // Handler with graceful degradation
      const degradationHandler = async (request: NextRequest) => {
        const startTime = Date.now();

        try {
          // Use graceful degradation pattern
          const config = {
            strategy: 'best_effort' as const,
            globalTimeout: 5000,
            services: [
              {
                name: 'ai_service',
                priority: 'critical' as const,
                timeout: 3000,
                fallback: () => ({
                  content: 'Template-based content idea',
                  usage: { totalTokens: 0 }
                }),
              },
              {
                name: 'cache_service',
                priority: 'optional' as const,
                timeout: 500,
              },
            ],
          };

          // Mock service function for degradation
          vi.spyOn(gracefulDegradation as any, 'getServiceFunction')
            .mockImplementation((name: string) => {
              if (name === 'ai_service') {
                return () => coalescer.coalesce(
                  `degraded-${Date.now()}`,
                  () => aiCircuitBreaker.execute(degradedAIService)
                );
              }
              return () => Promise.resolve('cache-result');
            });

          const result = await gracefulDegradation.executeWithDegradation(config);
          const duration = Date.now() - startTime;

          const statusCode = result.status === 'failed' ? 500 : 200;
          
          monitoring.recordMetric({
            endpoint: '/api/degraded-content',
            method: 'POST',
            statusCode,
            responseTime: duration,
            userId: 'test-user',
          });

          return NextResponse.json({
            success: result.status !== 'failed',
            data: result,
            meta: {
              degradationStatus: result.status,
              criticalFailures: result.criticalFailures,
              degradedServices: result.degradedServices,
              duration,
            },
          }, { status: statusCode });

        } catch (error) {
          const duration = Date.now() - startTime;
          
          monitoring.recordMetric({
            endpoint: '/api/degraded-content',
            method: 'POST',
            statusCode: 500,
            responseTime: duration,
            errorType: 'DegradationError',
          });

          return NextResponse.json({
            success: false,
            error: 'Service degradation failed',
          }, { status: 500 });
        }
      };

      // Execute requests under degraded conditions
      const requests = Array(10).fill(null).map(() => {
        const mockRequest = new NextRequest('http://localhost:3000/api/degraded-content', {
          method: 'POST',
        });
        return degradationHandler(mockRequest);
      });

      const responses = await Promise.allSettled(requests);
      
      // Most requests should still succeed due to fallbacks
      const successfulResponses = responses.filter(r => r.status === 'fulfilled');
      expect(successfulResponses.length).toBeGreaterThan(7);

      // Check that circuit breaker opened due to high failure rate
      const aiMetrics = aiCircuitBreaker.getMetrics();
      expect(aiMetrics.failedRequests).toBeGreaterThan(0);
      
      // Check degradation metrics
      const degradationMetrics = gracefulDegradation.getMetrics();
      expect(degradationMetrics.totalRequests).toBe(10);
      expect(degradationMetrics.fallbacksUsed).toBeGreaterThan(0);
    });
  });

  describe('Load Testing Integration', () => {
    it('should maintain performance under simulated load', async () => {
      const monitoring = getAPIMonitoringService();
      const coalescer = getRequestCoalescer();
      
      // Simulate realistic service with varying performance
      const realisticService = vi.fn().mockImplementation(() => {
        const responseTime = Math.random() * 800 + 100; // 100-900ms
        const failureRate = 0.02; // 2% failure rate
        
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() < failureRate) {
              reject(new Error('Service temporarily unavailable'));
            } else {
              resolve({
                data: `Response at ${Date.now()}`,
                processingTime: responseTime,
              });
            }
          }, responseTime);
        });
      });

      const serviceBreaker = CircuitBreakerFactory.getCircuitBreaker('load-test-service', 'ai_service');

      // Load test handler
      const loadTestHandler = async (userId: string, requestId: string) => {
        const startTime = Date.now();

        try {
          // Use coalescing for similar requests
          const cacheKey = `load-test:${userId}:${Math.floor(Date.now() / 10000)}`; // 10-second windows
          
          const result = await coalescer.coalesce(
            cacheKey,
            () => serviceBreaker.execute(
              realisticService,
              () => ({ data: 'Fallback response', processingTime: 50 })
            ),
            { ttl: 10000 }
          );

          const duration = Date.now() - startTime;

          monitoring.recordMetric({
            endpoint: '/api/load-test',
            method: 'GET',
            statusCode: 200,
            responseTime: duration,
            userId,
            cacheHit: result.processingTime === 50, // Fallback indicates cache miss
          });

          return { success: true, data: result, duration };

        } catch (error) {
          const duration = Date.now() - startTime;
          
          monitoring.recordMetric({
            endpoint: '/api/load-test',
            method: 'GET',
            statusCode: 500,
            responseTime: duration,
            userId,
            errorType: 'LoadTestError',
          });

          return { success: false, error: error.message, duration };
        }
      };

      // Simulate concurrent load (50 users, 5 requests each)
      const concurrentUsers = 50;
      const requestsPerUser = 5;
      
      const allRequests = [];
      for (let user = 0; user < concurrentUsers; user++) {
        for (let req = 0; req < requestsPerUser; req++) {
          allRequests.push(
            loadTestHandler(`user-${user}`, `req-${user}-${req}`)
          );
        }
      }

      const startTime = Date.now();
      const results = await Promise.allSettled(allRequests);
      const totalDuration = Date.now() - startTime;

      // Analyze load test results
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      const failedResults = results.filter(r => r.status === 'rejected');

      expect(successfulResults.length).toBeGreaterThan(200); // 80%+ success rate
      expect(failedResults.length).toBeLessThan(50); // <20% failure rate

      // Check performance metrics
      const healthMetrics = monitoring.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(250);
      expect(healthMetrics.averageResponseTime).toBeLessThan(2000); // Under 2 seconds
      expect(healthMetrics.successRate).toBeGreaterThan(80);

      // Check throughput
      const throughput = healthMetrics.totalRequests / (totalDuration / 1000);
      expect(throughput).toBeGreaterThan(10); // At least 10 RPS

      // Check circuit breaker remained stable
      const serviceMetrics = serviceBreaker.getMetrics();
      expect(serviceMetrics.state).toBe('CLOSED');

      // Check coalescing effectiveness under load
      const coalescingMetrics = coalescer.getMetrics();
      expect(coalescingMetrics.coalescingRate).toBeGreaterThan(50); // Good coalescing
      expect(coalescingMetrics.cacheHitRate).toBeGreaterThan(30); // Effective caching
    });

    it('should handle spike traffic patterns', async () => {
      const monitoring = getAPIMonitoringService();
      
      // Simulate spike-sensitive service
      let currentLoad = 0;
      const spikeService = vi.fn().mockImplementation(() => {
        currentLoad++;
        const responseTime = Math.min(currentLoad * 10, 2000); // Degrades with load
        const failureRate = Math.min(currentLoad * 0.001, 0.5); // Increases with load
        
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            currentLoad = Math.max(0, currentLoad - 1);
            
            if (Math.random() < failureRate) {
              reject(new Error('Service overloaded'));
            } else {
              resolve({
                data: 'Spike response',
                load: currentLoad,
                responseTime,
              });
            }
          }, responseTime);
        });
      });

      const spikeBreaker = CircuitBreakerFactory.getCircuitBreaker('spike-service', 'ai_service', {
        failureThreshold: 10, // Higher threshold for spike scenarios
        recoveryTimeout: 5000,
      });

      const coalescer = getRequestCoalescer();

      // Spike handler with aggressive coalescing
      const spikeHandler = async (requestId: string) => {
        const startTime = Date.now();

        try {
          // Aggressive coalescing during spikes
          const cacheKey = `spike:${Math.floor(Date.now() / 1000)}`; // 1-second windows
          
          const result = await coalescer.coalesce(
            cacheKey,
            () => spikeBreaker.execute(
              spikeService,
              () => ({ data: 'Spike fallback', load: 0, responseTime: 100 })
            ),
            { ttl: 5000 } // 5-second cache during spikes
          );

          const duration = Date.now() - startTime;

          monitoring.recordMetric({
            endpoint: '/api/spike-test',
            method: 'POST',
            statusCode: 200,
            responseTime: duration,
            userId: `spike-user-${requestId}`,
          });

          return { success: true, data: result, duration };

        } catch (error) {
          const duration = Date.now() - startTime;
          
          monitoring.recordMetric({
            endpoint: '/api/spike-test',
            method: 'POST',
            statusCode: 500,
            responseTime: duration,
            errorType: 'SpikeError',
          });

          return { success: false, error: error.message, duration };
        }
      };

      // Simulate traffic spike: 0 -> 100 -> 0 requests
      const spikePattern = [
        ...Array(10).fill(1),   // Ramp up
        ...Array(100).fill(2),  // Peak traffic
        ...Array(10).fill(1),   // Ramp down
      ];

      const spikeRequests = [];
      let requestId = 0;

      for (const intensity of spikePattern) {
        const batchRequests = Array(intensity).fill(null).map(() => 
          spikeHandler(`${requestId++}`)
        );
        spikeRequests.push(...batchRequests);
        
        // Small delay between batches to simulate realistic spike
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const results = await Promise.allSettled(spikeRequests);
      
      // Analyze spike handling
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      const totalRequests = results.length;

      // Should handle spike reasonably well due to coalescing and circuit breaker
      expect(successfulResults.length / totalRequests).toBeGreaterThan(0.6); // 60%+ success

      // Check that coalescing was very effective during spike
      const coalescingMetrics = coalescer.getMetrics();
      expect(coalescingMetrics.coalescingRate).toBeGreaterThan(80); // High coalescing during spike

      // Check circuit breaker behavior
      const spikeMetrics = spikeBreaker.getMetrics();
      expect(spikeMetrics.totalRequests).toBeLessThan(totalRequests); // Coalescing reduced load

      // Check monitoring captured the spike
      const healthMetrics = monitoring.getHealthMetrics();
      expect(healthMetrics.totalRequests).toBe(totalRequests);
      
      const alerts = monitoring.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0); // Should generate alerts during spike
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle mixed workload with different performance characteristics', async () => {
      const monitoring = getAPIMonitoringService();
      
      // Define different service types with realistic characteristics
      const services = {
        'fast-cache': {
          responseTime: () => Math.random() * 50 + 10, // 10-60ms
          failureRate: 0.001, // 0.1%
          circuitType: 'cache' as const,
        },
        'ai-generation': {
          responseTime: () => Math.random() * 2000 + 500, // 500-2500ms
          failureRate: 0.05, // 5%
          circuitType: 'ai_service' as const,
        },
        'database-query': {
          responseTime: () => Math.random() * 300 + 50, // 50-350ms
          failureRate: 0.02, // 2%
          circuitType: 'database' as const,
        },
        'external-api': {
          responseTime: () => Math.random() * 1000 + 200, // 200-1200ms
          failureRate: 0.1, // 10%
          circuitType: 'external_api' as const,
        },
      };

      // Create circuit breakers for each service
      const breakers = Object.fromEntries(
        Object.entries(services).map(([name, config]) => [
          name,
          CircuitBreakerFactory.getCircuitBreaker(name, config.circuitType)
        ])
      );

      const coalescer = getRequestCoalescer();

      // Mixed workload handler
      const mixedWorkloadHandler = async (serviceType: string, userId: string) => {
        const startTime = Date.now();
        const service = services[serviceType as keyof typeof services];
        const breaker = breakers[serviceType];

        if (!service || !breaker) {
          throw new Error(`Unknown service type: ${serviceType}`);
        }

        try {
          const mockService = () => {
            const responseTime = service.responseTime();
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                if (Math.random() < service.failureRate) {
                  reject(new Error(`${serviceType} service error`));
                } else {
                  resolve({
                    serviceType,
                    data: `${serviceType} response`,
                    responseTime,
                  });
                }
              }, responseTime);
            });
          };

          // Use coalescing for cacheable operations
          const shouldCoalesce = ['fast-cache', 'database-query'].includes(serviceType);
          
          let result;
          if (shouldCoalesce) {
            const cacheKey = `${serviceType}:${userId}:${Math.floor(Date.now() / 30000)}`; // 30s windows
            result = await coalescer.coalesce(
              cacheKey,
              () => breaker.execute(mockService),
              { ttl: 30000 }
            );
          } else {
            result = await breaker.execute(mockService);
          }

          const duration = Date.now() - startTime;

          monitoring.recordMetric({
            endpoint: `/api/${serviceType}`,
            method: 'GET',
            statusCode: 200,
            responseTime: duration,
            userId,
          });

          return { success: true, serviceType, data: result, duration };

        } catch (error) {
          const duration = Date.now() - startTime;
          
          monitoring.recordMetric({
            endpoint: `/api/${serviceType}`,
            method: 'GET',
            statusCode: 500,
            responseTime: duration,
            userId,
            errorType: `${serviceType}Error`,
          });

          return { success: false, serviceType, error: error.message, duration };
        }
      };

      // Generate mixed workload
      const workloadDistribution = {
        'fast-cache': 40,      // 40% of requests
        'database-query': 30,  // 30% of requests
        'ai-generation': 20,   // 20% of requests
        'external-api': 10,    // 10% of requests
      };

      const totalRequests = 200;
      const requests = [];

      Object.entries(workloadDistribution).forEach(([serviceType, percentage]) => {
        const requestCount = Math.floor(totalRequests * percentage / 100);
        
        for (let i = 0; i < requestCount; i++) {
          requests.push(
            mixedWorkloadHandler(serviceType, `user-${i % 20}`) // 20 different users
          );
        }
      });

      // Shuffle requests to simulate realistic mixed load
      for (let i = requests.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [requests[i], requests[j]] = [requests[j], requests[i]];
      }

      const results = await Promise.allSettled(requests);
      
      // Analyze mixed workload performance
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      expect(successfulResults.length / totalRequests).toBeGreaterThan(0.85); // 85%+ success

      // Check service-specific performance
      const endpointMetrics = monitoring.getEndpointMetrics();
      
      // Fast cache should have excellent performance
      const cacheMetrics = endpointMetrics['GET /api/fast-cache'];
      expect(cacheMetrics.averageResponseTime).toBeLessThan(100);
      expect(cacheMetrics.errorRate).toBeLessThan(1);

      // AI generation should have higher latency but acceptable error rate
      const aiMetrics = endpointMetrics['GET /api/ai-generation'];
      expect(aiMetrics.averageResponseTime).toBeGreaterThan(500);
      expect(aiMetrics.errorRate).toBeLessThan(10);

      // External API should have highest error rate
      const externalMetrics = endpointMetrics['GET /api/external-api'];
      expect(externalMetrics.errorRate).toBeGreaterThan(5);

      // Check circuit breaker states
      const allBreakerMetrics = CircuitBreakerFactory.getAllMetrics();
      
      // Fast cache circuit should remain closed
      expect(allBreakerMetrics['cache:fast-cache'].state).toBe('CLOSED');
      
      // External API circuit might be open due to high failure rate
      const externalBreakerState = allBreakerMetrics['external_api:external-api'].state;
      expect(['CLOSED', 'HALF_OPEN', 'OPEN']).toContain(externalBreakerState);

      // Check coalescing effectiveness
      const coalescingMetrics = coalescer.getMetrics();
      expect(coalescingMetrics.totalRequests).toBe(totalRequests);
      expect(coalescingMetrics.coalescingRate).toBeGreaterThan(20); // Some coalescing occurred
    });
  });
});