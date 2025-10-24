import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoadTestingService, LoadTestConfigs } from '@/tests/load/load-testing-service';

// Mock fetch globally
global.fetch = vi.fn();

describe('LoadTestingService', () => {
  let loadTestService: LoadTestingService;

  beforeEach(() => {
    loadTestService = new LoadTestingService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    loadTestService.stop();
  });

  describe('Basic Load Testing', () => {
    it('should execute a simple load test', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
      } as Response);

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 2,
        duration: 1, // 1 second
        rampUpTime: 0.5,
        scenarios: [
          {
            name: 'simple_test',
            weight: 100,
            requests: [
              { method: 'GET' as const, path: '/api/health' },
            ],
          },
        ],
      };

      const result = await loadTestService.runLoadTest(config);

      expect(result.config).toEqual(config);
      expect(result.metrics.totalRequests).toBeGreaterThan(0);
      expect(result.metrics.concurrentUsers).toBe(2);
      expect(result.metrics.errorRate).toBeLessThanOrEqual(100);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should track response times correctly', async () => {
      const mockFetch = vi.mocked(fetch);
      
      // Mock different response times
      mockFetch
        .mockResolvedValueOnce(new Promise(resolve => 
          setTimeout(() => resolve({ status: 200, ok: true } as Response), 100)
        ))
        .mockResolvedValueOnce(new Promise(resolve => 
          setTimeout(() => resolve({ status: 200, ok: true } as Response), 200)
        ))
        .mockResolvedValueOnce(new Promise(resolve => 
          setTimeout(() => resolve({ status: 200, ok: true } as Response), 150)
        ));

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 1,
        duration: 1,
        rampUpTime: 0.1,
        scenarios: [
          {
            name: 'timing_test',
            weight: 100,
            requests: [
              { method: 'GET' as const, path: '/api/test' },
            ],
          },
        ],
      };

      const result = await loadTestService.runLoadTest(config);

      expect(result.metrics.averageResponseTime).toBeGreaterThan(0);
      expect(result.metrics.minResponseTime).toBeGreaterThan(0);
      expect(result.metrics.maxResponseTime).toBeGreaterThan(result.metrics.minResponseTime);
      expect(result.metrics.p50ResponseTime).toBeGreaterThan(0);
      expect(result.metrics.p95ResponseTime).toBeGreaterThan(0);
      expect(result.metrics.p99ResponseTime).toBeGreaterThan(0);
    });

    it('should handle HTTP errors correctly', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce({ status: 200, ok: true } as Response)
        .mockResolvedValueOnce({ status: 500, ok: false } as Response)
        .mockResolvedValueOnce({ status: 404, ok: false } as Response);

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 1,
        duration: 1,
        rampUpTime: 0.1,
        scenarios: [
          {
            name: 'error_test',
            weight: 100,
            requests: [
              { method: 'GET' as const, path: '/api/test', expectedStatus: 200 },
            ],
          },
        ],
      };

      const result = await loadTestService.runLoadTest(config);

      expect(result.metrics.failedRequests).toBeGreaterThan(0);
      expect(result.metrics.errorRate).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const statusErrors = result.errors.filter(e => e.error.includes('Unexpected status'));
      expect(statusErrors.length).toBeGreaterThan(0);
    });

    it('should handle network timeouts', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 1,
        duration: 0.5,
        rampUpTime: 0.1,
        scenarios: [
          {
            name: 'timeout_test',
            weight: 100,
            requests: [
              { method: 'GET' as const, path: '/api/slow', timeout: 50 },
            ],
          },
        ],
      };

      const result = await loadTestService.runLoadTest(config);

      expect(result.metrics.timeouts).toBeGreaterThan(0);
      expect(result.metrics.errorRate).toBeGreaterThan(0);
      
      const timeoutErrors = result.errors.filter(e => e.error.includes('timeout'));
      expect(timeoutErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Scenario Management', () => {
    it('should execute multiple scenarios based on weights', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({ status: 200, ok: true } as Response);

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 4,
        duration: 1,
        rampUpTime: 0.2,
        scenarios: [
          {
            name: 'scenario_a',
            weight: 70,
            requests: [
              { method: 'GET' as const, path: '/api/a' },
            ],
          },
          {
            name: 'scenario_b',
            weight: 30,
            requests: [
              { method: 'POST' as const, path: '/api/b', body: { test: 'data' } },
            ],
          },
        ],
      };

      const result = await loadTestService.runLoadTest(config);

      expect(result.metrics.totalRequests).toBeGreaterThan(0);
      
      // Check that both scenarios were executed
      const fetchCalls = mockFetch.mock.calls;
      const getRequests = fetchCalls.filter(call => call[1]?.method === 'GET');
      const postRequests = fetchCalls.filter(call => call[1]?.method === 'POST');
      
      expect(getRequests.length).toBeGreaterThan(0);
      expect(postRequests.length).toBeGreaterThan(0);
      
      // Scenario A should be called more often (70% weight)
      expect(getRequests.length).toBeGreaterThan(postRequests.length);
    });

    it('should handle complex scenarios with multiple requests', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({ status: 200, ok: true } as Response);

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 2,
        duration: 1,
        rampUpTime: 0.1,
        scenarios: [
          {
            name: 'complex_scenario',
            weight: 100,
            requests: [
              { method: 'GET' as const, path: '/api/login' },
              { method: 'POST' as const, path: '/api/data', body: { userId: 'test' } },
              { method: 'GET' as const, path: '/api/profile' },
            ],
          },
        ],
      };

      const result = await loadTestService.runLoadTest(config);

      expect(result.metrics.totalRequests).toBeGreaterThan(0);
      
      // Should have made requests to all three endpoints
      const fetchCalls = mockFetch.mock.calls;
      const loginCalls = fetchCalls.filter(call => call[0].includes('/api/login'));
      const dataCalls = fetchCalls.filter(call => call[0].includes('/api/data'));
      const profileCalls = fetchCalls.filter(call => call[0].includes('/api/profile'));
      
      expect(loginCalls.length).toBeGreaterThan(0);
      expect(dataCalls.length).toBeGreaterThan(0);
      expect(profileCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Metrics and Timeline', () => {
    it('should capture timeline metrics during test', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({ status: 200, ok: true } as Response);

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 3,
        duration: 2, // 2 seconds to capture multiple timeline points
        rampUpTime: 0.5,
        scenarios: [
          {
            name: 'timeline_test',
            weight: 100,
            requests: [
              { method: 'GET' as const, path: '/api/metrics' },
            ],
          },
        ],
      };

      const result = await loadTestService.runLoadTest(config);

      expect(result.timeline.length).toBeGreaterThan(0);
      
      result.timeline.forEach(point => {
        expect(point).toHaveProperty('timestamp');
        expect(point).toHaveProperty('activeUsers');
        expect(point).toHaveProperty('rps');
        expect(point).toHaveProperty('avgResponseTime');
        expect(point).toHaveProperty('errorRate');
        expect(point.timestamp).toBeGreaterThan(0);
      });
    });

    it('should calculate percentiles correctly', async () => {
      const mockFetch = vi.mocked(fetch);
      
      // Mock responses with known delays
      const delays = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
      delays.forEach(delay => {
        mockFetch.mockResolvedValueOnce(
          new Promise(resolve => 
            setTimeout(() => resolve({ status: 200, ok: true } as Response), delay)
          )
        );
      });

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 1,
        duration: 2,
        rampUpTime: 0.1,
        scenarios: [
          {
            name: 'percentile_test',
            weight: 100,
            requests: [
              { method: 'GET' as const, path: '/api/percentile' },
            ],
          },
        ],
      };

      const result = await loadTestService.runLoadTest(config);

      expect(result.metrics.p50ResponseTime).toBeGreaterThan(0);
      expect(result.metrics.p95ResponseTime).toBeGreaterThan(result.metrics.p50ResponseTime);
      expect(result.metrics.p99ResponseTime).toBeGreaterThan(result.metrics.p95ResponseTime);
      expect(result.metrics.maxResponseTime).toBeGreaterThanOrEqual(result.metrics.p99ResponseTime);
    });

    it('should calculate requests per second accurately', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({ status: 200, ok: true } as Response);

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 5,
        duration: 2,
        rampUpTime: 0.2,
        scenarios: [
          {
            name: 'rps_test',
            weight: 100,
            requests: [
              { method: 'GET' as const, path: '/api/rps' },
            ],
          },
        ],
      };

      const result = await loadTestService.runLoadTest(config);

      expect(result.metrics.requestsPerSecond).toBeGreaterThan(0);
      expect(result.metrics.requestsPerSecond).toBeLessThan(1000); // Reasonable upper bound
      
      // RPS should be roughly totalRequests / duration
      const expectedRPS = result.metrics.totalRequests / 2; // 2 second duration
      expect(result.metrics.requestsPerSecond).toBeCloseTo(expectedRPS, 0);
    });
  });

  describe('Recommendations', () => {
    it('should generate recommendations for high error rate', async () => {
      const mockFetch = vi.mocked(fetch);
      // Mock high error rate
      mockFetch
        .mockResolvedValue({ status: 500, ok: false } as Response)
        .mockResolvedValue({ status: 500, ok: false } as Response)
        .mockResolvedValue({ status: 200, ok: true } as Response);

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 1,
        duration: 1,
        rampUpTime: 0.1,
        scenarios: [
          {
            name: 'high_error_test',
            weight: 100,
            requests: [
              { method: 'GET' as const, path: '/api/error' },
            ],
          },
        ],
      };

      const result = await loadTestService.runLoadTest(config);

      expect(result.recommendations.length).toBeGreaterThan(0);
      
      const errorRecommendation = result.recommendations.find(r => 
        r.includes('error rate') || r.includes('scaling')
      );
      expect(errorRecommendation).toBeDefined();
    });

    it('should generate recommendations for high latency', async () => {
      const mockFetch = vi.mocked(fetch);
      // Mock high latency responses
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ status: 200, ok: true } as Response), 3000)
        )
      );

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 1,
        duration: 1,
        rampUpTime: 0.1,
        scenarios: [
          {
            name: 'high_latency_test',
            weight: 100,
            requests: [
              { method: 'GET' as const, path: '/api/slow' },
            ],
          },
        ],
      };

      const result = await loadTestService.runLoadTest(config);

      expect(result.recommendations.length).toBeGreaterThan(0);
      
      const latencyRecommendation = result.recommendations.find(r => 
        r.includes('latency') || r.includes('response time')
      );
      expect(latencyRecommendation).toBeDefined();
    });

    it('should generate positive recommendations for good performance', async () => {
      const mockFetch = vi.mocked(fetch);
      // Mock fast, successful responses
      mockFetch.mockResolvedValue({ status: 200, ok: true } as Response);

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 10,
        duration: 1,
        rampUpTime: 0.1,
        scenarios: [
          {
            name: 'good_performance_test',
            weight: 100,
            requests: [
              { method: 'GET' as const, path: '/api/fast' },
            ],
          },
        ],
      };

      const result = await loadTestService.runLoadTest(config);

      const positiveRecommendation = result.recommendations.find(r => 
        r.includes('Excellent') || r.includes('handles load well')
      );
      expect(positiveRecommendation).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should prevent concurrent test execution', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ status: 200, ok: true } as Response), 1000)
        )
      );

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 1,
        duration: 2,
        rampUpTime: 0.1,
        scenarios: [
          {
            name: 'concurrent_test',
            weight: 100,
            requests: [
              { method: 'GET' as const, path: '/api/test' },
            ],
          },
        ],
      };

      // Start first test
      const firstTest = loadTestService.runLoadTest(config);

      // Try to start second test immediately
      await expect(loadTestService.runLoadTest(config))
        .rejects.toThrow('Load test already running');

      // Wait for first test to complete
      await firstTest;
    });

    it('should handle fetch failures gracefully', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 2,
        duration: 1,
        rampUpTime: 0.1,
        scenarios: [
          {
            name: 'network_error_test',
            weight: 100,
            requests: [
              { method: 'GET' as const, path: '/api/fail' },
            ],
          },
        ],
      };

      const result = await loadTestService.runLoadTest(config);

      expect(result.metrics.failedRequests).toBeGreaterThan(0);
      expect(result.metrics.errorRate).toBe(100); // All requests should fail
      expect(result.errors.length).toBeGreaterThan(0);
      
      const networkErrors = result.errors.filter(e => e.error.includes('Network error'));
      expect(networkErrors.length).toBeGreaterThan(0);
    });

    it('should stop test when requested', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({ status: 200, ok: true } as Response);

      const config = {
        targetUrl: 'http://localhost:3000',
        concurrentUsers: 5,
        duration: 10, // Long duration
        rampUpTime: 1,
        scenarios: [
          {
            name: 'stop_test',
            weight: 100,
            requests: [
              { method: 'GET' as const, path: '/api/test' },
            ],
          },
        ],
      };

      // Start test
      const testPromise = loadTestService.runLoadTest(config);

      // Stop after short delay
      setTimeout(() => {
        loadTestService.stop();
      }, 500);

      const result = await testPromise;

      // Test should complete early
      expect(result.metrics.totalRequests).toBeGreaterThan(0);
      expect(result.timeline.length).toBeGreaterThan(0);
    });
  });});

d
escribe('LoadTestConfigs', () => {
  describe('Predefined Configurations', () => {
    it('should provide smoke test configuration', () => {
      const config = LoadTestConfigs.smokeTest('http://localhost:3000');

      expect(config.targetUrl).toBe('http://localhost:3000');
      expect(config.concurrentUsers).toBe(5);
      expect(config.duration).toBe(30);
      expect(config.rampUpTime).toBe(10);
      expect(config.scenarios).toHaveLength(1);
      expect(config.scenarios[0].name).toBe('basic_endpoints');
      expect(config.scenarios[0].weight).toBe(100);
      expect(config.scenarios[0].requests.length).toBeGreaterThan(0);
    });

    it('should provide load test configuration', () => {
      const config = LoadTestConfigs.loadTest('http://localhost:3000');

      expect(config.targetUrl).toBe('http://localhost:3000');
      expect(config.concurrentUsers).toBe(50);
      expect(config.duration).toBe(300); // 5 minutes
      expect(config.rampUpTime).toBe(60);
      expect(config.scenarios.length).toBeGreaterThan(1);
      
      // Check scenario weights sum to 100
      const totalWeight = config.scenarios.reduce((sum, scenario) => sum + scenario.weight, 0);
      expect(totalWeight).toBe(100);
      
      // Check for expected scenarios
      const scenarioNames = config.scenarios.map(s => s.name);
      expect(scenarioNames).toContain('content_generation');
      expect(scenarioNames).toContain('optimization');
      expect(scenarioNames).toContain('analytics');
      expect(scenarioNames).toContain('health_check');
    });

    it('should provide stress test configuration', () => {
      const config = LoadTestConfigs.stressTest('http://localhost:3000');

      expect(config.targetUrl).toBe('http://localhost:3000');
      expect(config.concurrentUsers).toBe(200);
      expect(config.duration).toBe(600); // 10 minutes
      expect(config.rampUpTime).toBe(120);
      expect(config.scenarios.length).toBeGreaterThan(0);
      
      // Should have heavy load scenarios
      const heavyScenario = config.scenarios.find(s => s.name.includes('heavy'));
      expect(heavyScenario).toBeDefined();
    });

    it('should provide spike test configuration', () => {
      const config = LoadTestConfigs.spikeTest('http://localhost:3000');

      expect(config.targetUrl).toBe('http://localhost:3000');
      expect(config.concurrentUsers).toBe(500);
      expect(config.duration).toBe(120); // 2 minutes
      expect(config.rampUpTime).toBe(10); // Very fast ramp up
      expect(config.scenarios).toHaveLength(1);
      expect(config.scenarios[0].weight).toBe(100);
    });
  });

  describe('Sample Data Generation', () => {
    it('should generate valid sample content request', () => {
      const config = LoadTestConfigs.loadTest('http://localhost:3000');
      const contentScenario = config.scenarios.find(s => s.name === 'content_generation');
      
      expect(contentScenario).toBeDefined();
      expect(contentScenario?.requests).toHaveLength(1);
      
      const request = contentScenario?.requests[0];
      expect(request?.method).toBe('POST');
      expect(request?.path).toBe('/api/content-ideas/generate');
      expect(request?.body).toBeDefined();
      expect(request?.body.creatorProfile).toBeDefined();
      expect(request?.body.options).toBeDefined();
    });

    it('should generate valid sample pricing request', () => {
      const config = LoadTestConfigs.loadTest('http://localhost:3000');
      const optimizationScenario = config.scenarios.find(s => s.name === 'optimization');
      
      expect(optimizationScenario).toBeDefined();
      
      const request = optimizationScenario?.requests[0];
      expect(request?.method).toBe('POST');
      expect(request?.path).toBe('/api/optimize/pricing');
      expect(request?.body).toBeDefined();
      expect(request?.body.contentId).toBeDefined();
      expect(request?.body.currentPrice).toBeGreaterThan(0);
      expect(request?.body.historicalPerformance).toBeDefined();
    });

    it('should generate consistent sample data', () => {
      const config1 = LoadTestConfigs.loadTest('http://localhost:3000');
      const config2 = LoadTestConfigs.loadTest('http://localhost:3000');
      
      // Sample data should be consistent across calls
      const scenario1 = config1.scenarios.find(s => s.name === 'content_generation');
      const scenario2 = config2.scenarios.find(s => s.name === 'content_generation');
      
      expect(scenario1?.requests[0].body).toEqual(scenario2?.requests[0].body);
    });
  });
});

describe('Performance and Integration', () => {
  let loadTestService: LoadTestingService;

  beforeEach(() => {
    loadTestService = new LoadTestingService();
  });

  afterEach(() => {
    loadTestService.stop();
  });

  it('should handle realistic load test scenarios', async () => {
    const mockFetch = vi.mocked(fetch);
    
    // Mock realistic response patterns
    let requestCount = 0;
    mockFetch.mockImplementation(() => {
      requestCount++;
      const delay = Math.random() * 200 + 50; // 50-250ms response time
      const shouldFail = Math.random() < 0.05; // 5% error rate
      
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (shouldFail) {
            reject(new Error('Simulated server error'));
          } else {
            resolve({ 
              status: 200, 
              ok: true,
              headers: new Map([['content-length', '1024']]),
            } as Response);
          }
        }, delay);
      });
    });

    const config = {
      targetUrl: 'http://localhost:3000',
      concurrentUsers: 10,
      duration: 3,
      rampUpTime: 1,
      scenarios: [
        {
          name: 'realistic_scenario',
          weight: 60,
          requests: [
            { method: 'GET' as const, path: '/api/dashboard' },
            { method: 'POST' as const, path: '/api/content', body: { type: 'photo' } },
          ],
        },
        {
          name: 'analytics_scenario',
          weight: 40,
          requests: [
            { method: 'GET' as const, path: '/api/analytics' },
          ],
        },
      ],
    };

    const result = await loadTestService.runLoadTest(config);

    expect(result.metrics.totalRequests).toBeGreaterThan(10);
    expect(result.metrics.errorRate).toBeLessThan(20); // Should be around 5%
    expect(result.metrics.averageResponseTime).toBeGreaterThan(50);
    expect(result.metrics.averageResponseTime).toBeLessThan(500);
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should handle authentication headers correctly', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({ status: 200, ok: true } as Response);

    // Mock environment variable
    const originalEnv = process.env.LOAD_TEST_API_KEY;
    process.env.LOAD_TEST_API_KEY = 'test-auth-token';

    const config = {
      targetUrl: 'http://localhost:3000',
      concurrentUsers: 1,
      duration: 0.5,
      rampUpTime: 0.1,
      scenarios: [
        {
          name: 'auth_test',
          weight: 100,
          requests: [
            { method: 'GET' as const, path: '/api/protected' },
          ],
        },
      ],
    };

    await loadTestService.runLoadTest(config);

    // Check that authorization header was included
    const fetchCall = mockFetch.mock.calls[0];
    const headers = fetchCall[1]?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer test-auth-token');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['User-Agent']).toContain('LoadTest-User-');

    // Restore environment
    if (originalEnv) {
      process.env.LOAD_TEST_API_KEY = originalEnv;
    } else {
      delete process.env.LOAD_TEST_API_KEY;
    }
  });

  it('should handle ramp-up timing correctly', async () => {
    const mockFetch = vi.mocked(fetch);
    const requestTimes: number[] = [];
    
    mockFetch.mockImplementation(() => {
      requestTimes.push(Date.now());
      return Promise.resolve({ status: 200, ok: true } as Response);
    });

    const config = {
      targetUrl: 'http://localhost:3000',
      concurrentUsers: 4,
      duration: 2,
      rampUpTime: 1, // 1 second ramp up
      scenarios: [
        {
          name: 'ramp_test',
          weight: 100,
          requests: [
            { method: 'GET' as const, path: '/api/ramp' },
          ],
        },
      ],
    };

    const startTime = Date.now();
    await loadTestService.runLoadTest(config);

    // Check that requests were spread out during ramp-up
    const firstRequestTime = Math.min(...requestTimes) - startTime;
    const lastRampRequestTime = Math.max(...requestTimes.slice(0, 4)) - startTime;
    
    expect(firstRequestTime).toBeLessThan(500); // First request should start quickly
    expect(lastRampRequestTime).toBeGreaterThan(500); // Last ramp request should be delayed
    expect(lastRampRequestTime).toBeLessThan(1500); // But not too delayed
  });

  it('should handle memory efficiently with many requests', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({ status: 200, ok: true } as Response);

    const config = {
      targetUrl: 'http://localhost:3000',
      concurrentUsers: 20,
      duration: 2,
      rampUpTime: 0.5,
      scenarios: [
        {
          name: 'memory_test',
          weight: 100,
          requests: [
            { method: 'GET' as const, path: '/api/memory' },
          ],
        },
      ],
    };

    const initialMemory = process.memoryUsage().heapUsed;
    const result = await loadTestService.runLoadTest(config);
    const finalMemory = process.memoryUsage().heapUsed;

    expect(result.metrics.totalRequests).toBeGreaterThan(20);
    
    // Memory usage should not grow excessively
    const memoryGrowth = finalMemory - initialMemory;
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
  });

  it('should provide accurate throughput calculations', async () => {
    const mockFetch = vi.mocked(fetch);
    let requestCount = 0;
    
    mockFetch.mockImplementation(() => {
      requestCount++;
      return Promise.resolve({ status: 200, ok: true } as Response);
    });

    const config = {
      targetUrl: 'http://localhost:3000',
      concurrentUsers: 5,
      duration: 2,
      rampUpTime: 0.2,
      scenarios: [
        {
          name: 'throughput_test',
          weight: 100,
          requests: [
            { method: 'GET' as const, path: '/api/throughput' },
          ],
        },
      ],
    };

    const startTime = Date.now();
    const result = await loadTestService.runLoadTest(config);
    const actualDuration = (Date.now() - startTime) / 1000;

    expect(result.metrics.totalRequests).toBe(requestCount);
    expect(result.metrics.requestsPerSecond).toBeCloseTo(
      result.metrics.totalRequests / actualDuration, 
      1
    );
  });

  it('should handle edge cases gracefully', async () => {
    const mockFetch = vi.mocked(fetch);
    
    // Mix of different response types
    mockFetch
      .mockResolvedValueOnce({ status: 200, ok: true } as Response)
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce({ status: 404, ok: false } as Response)
      .mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )
      .mockResolvedValue({ status: 200, ok: true } as Response);

    const config = {
      targetUrl: 'http://localhost:3000',
      concurrentUsers: 2,
      duration: 1,
      rampUpTime: 0.1,
      scenarios: [
        {
          name: 'edge_case_test',
          weight: 100,
          requests: [
            { method: 'GET' as const, path: '/api/edge', timeout: 50 },
          ],
        },
      ],
    };

    const result = await loadTestService.runLoadTest(config);

    expect(result.metrics.totalRequests).toBeGreaterThan(0);
    expect(result.metrics.failedRequests).toBeGreaterThan(0);
    expect(result.errors.length).toBeGreaterThan(0);
    
    // Should have different types of errors
    const errorTypes = new Set(result.errors.map(e => e.error));
    expect(errorTypes.size).toBeGreaterThan(1);
  });
});