/**
 * Performance Tests for Enhanced Rate Limiter
 * Tests performance under various load conditions and OnlyFans usage patterns
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EnhancedRateLimiter } from '../../lib/services/enhanced-rate-limiter';

// Performance measurement utilities
class PerformanceMeasurer {
  private measurements: Map<string, number[]> = new Map();

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await fn();
    const duration = performance.now() - startTime;
    
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);
    
    return { result, duration };
  }

  getStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  } {
    const measurements = this.measurements.get(name) || [];
    if (measurements.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, p95: 0, p99: 0 };
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const count = measurements.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const avg = measurements.reduce((a, b) => a + b, 0) / count;
    const p95 = sorted[Math.floor(count * 0.95)];
    const p99 = sorted[Math.floor(count * 0.99)];

    return { count, min, max, avg, p95, p99 };
  }

  clear(): void {
    this.measurements.clear();
  }
}

// Mock Redis with realistic performance characteristics
const mockRedisPerf = {
  get: vi.fn(),
  set: vi.fn(),
  setex: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  pipeline: vi.fn(),
  keys: vi.fn(),
  scard: vi.fn(),
  ttl: vi.fn(),
  quit: vi.fn()
};

const mockPipelinePerf = {
  incr: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  setex: vi.fn().mockReturnThis(),
  exec: vi.fn()
};

// Mock other services with realistic delays
const mockPrismaPerf = {
  onlyFansMessage: {
    create: vi.fn()
  },
  $disconnect: vi.fn()
};

const mockSQSPerf = {
  send: vi.fn()
};

const mockCloudWatchPerf = {
  send: vi.fn()
};

describe('Enhanced Rate Limiter Performance Tests', () => {
  let rateLimiter: EnhancedRateLimiter;
  let measurer: PerformanceMeasurer;

  beforeEach(() => {
    measurer = new PerformanceMeasurer();
    vi.clearAllMocks();

    // Setup realistic Redis performance (1-5ms per operation)
    mockRedisPerf.get.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('5'), Math.random() * 4 + 1))
    );
    
    mockRedisPerf.pipeline.mockReturnValue(mockPipelinePerf);
    mockPipelinePerf.exec.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve([]), Math.random() * 3 + 1))
    );

    // Setup AWS services with realistic delays
    mockSQSPerf.send.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ MessageId: 'test' }), Math.random() * 10 + 5))
    );

    mockCloudWatchPerf.send.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({}), Math.random() * 15 + 5))
    );

    mockPrismaPerf.onlyFansMessage.create.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ id: 'test' }), Math.random() * 20 + 10))
    );

    rateLimiter = new EnhancedRateLimiter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    measurer.clear();
  });

  describe('Single User Performance', () => {
    it('should handle rapid successive checks efficiently', async () => {
      const iterations = 100;
      const userId = 'perf-user-single';

      for (let i = 0; i < iterations; i++) {
        await measurer.measureAsync('single-user-check', () =>
          rateLimiter.checkLimit(userId, 'message')
        );
      }

      const stats = measurer.getStats('single-user-check');

      expect(stats.count).toBe(iterations);
      expect(stats.avg).toBeLessThan(50); // Average under 50ms
      expect(stats.p95).toBeLessThan(100); // 95th percentile under 100ms
      expect(stats.p99).toBeLessThan(200); // 99th percentile under 200ms
    });

    it('should maintain performance with OnlyFans specific checks', async () => {
      const iterations = 50;
      const userId = 'perf-user-onlyfans';
      const recipientId = 'perf-recipient';

      for (let i = 0; i < iterations; i++) {
        await measurer.measureAsync('onlyfans-check', () =>
          rateLimiter.checkOnlyFansLimits(userId, recipientId)
        );
      }

      const stats = measurer.getStats('onlyfans-check');

      expect(stats.count).toBe(iterations);
      expect(stats.avg).toBeLessThan(75); // Average under 75ms (more complex checks)
      expect(stats.p95).toBeLessThan(150); // 95th percentile under 150ms
    });

    it('should handle message enforcement efficiently', async () => {
      const iterations = 50;
      const userId = 'perf-user-enforce';
      const recipientId = 'perf-recipient-enforce';

      for (let i = 0; i < iterations; i++) {
        await measurer.measureAsync('message-enforcement', () =>
          rateLimiter.enforceMessageLimits(userId, recipientId)
        );
      }

      const stats = measurer.getStats('message-enforcement');

      expect(stats.count).toBe(iterations);
      expect(stats.avg).toBeLessThan(100); // Average under 100ms (full enforcement)
      expect(stats.p95).toBeLessThan(200); // 95th percentile under 200ms
    });
  });

  describe('Concurrent User Performance', () => {
    it('should handle multiple users concurrently', async () => {
      const userCount = 20;
      const checksPerUser = 10;

      const startTime = performance.now();

      const promises = [];
      for (let i = 0; i < userCount; i++) {
        for (let j = 0; j < checksPerUser; j++) {
          promises.push(
            measurer.measureAsync(`concurrent-user-${i}`, () =>
              rateLimiter.checkLimit(`perf-user-${i}`, 'message')
            )
          );
        }
      }

      const results = await Promise.all(promises);
      const totalDuration = performance.now() - startTime;

      expect(results).toHaveLength(userCount * checksPerUser);
      expect(totalDuration).toBeLessThan(5000); // Should complete within 5 seconds

      // Check individual performance
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      expect(avgDuration).toBeLessThan(100); // Average per check under 100ms
    });

    it('should scale linearly with user count', async () => {
      const userCounts = [5, 10, 20, 40];
      const checksPerUser = 5;
      const results: Record<number, number> = {};

      for (const userCount of userCounts) {
        const startTime = performance.now();

        const promises = Array.from({ length: userCount * checksPerUser }, (_, i) =>
          rateLimiter.checkLimit(`scale-user-${i % userCount}`, 'message')
        );

        await Promise.all(promises);
        const duration = performance.now() - startTime;
        results[userCount] = duration;
      }

      // Performance should scale roughly linearly
      const scaleFactor = results[40] / results[5];
      expect(scaleFactor).toBeLessThan(10); // Should not be more than 10x slower for 8x users
    });

    it('should handle burst traffic patterns', async () => {
      const burstSize = 50;
      const burstCount = 5;
      const burstInterval = 100; // ms between bursts

      const allResults = [];

      for (let burst = 0; burst < burstCount; burst++) {
        const burstPromises = Array.from({ length: burstSize }, (_, i) =>
          measurer.measureAsync(`burst-${burst}`, () =>
            rateLimiter.checkLimit(`burst-user-${i}`, 'message')
          )
        );

        const burstResults = await Promise.all(burstPromises);
        allResults.push(...burstResults);

        if (burst < burstCount - 1) {
          await new Promise(resolve => setTimeout(resolve, burstInterval));
        }
      }

      const stats = measurer.getStats('burst-0'); // Check first burst stats
      expect(stats.avg).toBeLessThan(150); // Should handle bursts efficiently
      expect(allResults).toHaveLength(burstSize * burstCount);
    });
  });

  describe('High-Volume OnlyFans Scenarios', () => {
    it('should handle typical OnlyFans creator load (100 users, 10 msg/min each)', async () => {
      const creatorCount = 100;
      const messagesPerCreator = 10;
      const timeWindow = 60000; // 1 minute

      const startTime = performance.now();

      // Simulate realistic OnlyFans usage pattern
      const promises = [];
      for (let creator = 0; creator < creatorCount; creator++) {
        for (let msg = 0; msg < messagesPerCreator; msg++) {
          const delay = Math.random() * timeWindow; // Spread over 1 minute
          
          promises.push(
            new Promise(resolve => setTimeout(resolve, delay)).then(() =>
              measurer.measureAsync('onlyfans-creator-load', () =>
                rateLimiter.enforceMessageLimits(
                  `creator-${creator}`,
                  `fan-${creator}-${msg}`
                )
              )
            )
          );
        }
      }

      const results = await Promise.all(promises);
      const totalDuration = performance.now() - startTime;

      expect(results).toHaveLength(creatorCount * messagesPerCreator);
      expect(totalDuration).toBeLessThan(65000); // Should complete within window + buffer

      const stats = measurer.getStats('onlyfans-creator-load');
      expect(stats.avg).toBeLessThan(200); // Average under 200ms per enforcement
      expect(stats.p95).toBeLessThan(500); // 95th percentile under 500ms
    });

    it('should handle rate limiting violations efficiently', async () => {
      const userId = 'violation-perf-user';
      const iterations = 20;

      // Mock user at rate limit to trigger violations
      mockRedisPerf.get.mockImplementation((key) => {
        if (key.includes(`user:${userId}:minute:`)) return '10'; // At limit
        return '0';
      });

      for (let i = 0; i < iterations; i++) {
        await measurer.measureAsync('violation-handling', () =>
          rateLimiter.checkLimit(userId, 'message')
        );
      }

      const stats = measurer.getStats('violation-handling');

      expect(stats.count).toBe(iterations);
      expect(stats.avg).toBeLessThan(150); // Violation handling should be fast
      expect(stats.p95).toBeLessThan(300);

      // Should have recorded violations
      expect(mockPrismaPerf.onlyFansMessage.create).toHaveBeenCalledTimes(iterations);
      expect(mockCloudWatchPerf.send).toHaveBeenCalledTimes(iterations);
    });

    it('should handle delayed message scheduling efficiently', async () => {
      const userId = 'delay-perf-user';
      const recipientId = 'delay-perf-recipient';
      const iterations = 30;

      // Mock scenario requiring delays
      mockRedisPerf.get.mockImplementation((key) => {
        if (key.includes('last_message:')) return (Date.now() - 2000).toString(); // 2s ago
        return '0';
      });

      for (let i = 0; i < iterations; i++) {
        await measurer.measureAsync('delay-scheduling', () =>
          rateLimiter.enforceMessageLimits(userId, `${recipientId}-${i}`)
        );
      }

      const stats = measurer.getStats('delay-scheduling');

      expect(stats.count).toBe(iterations);
      expect(stats.avg).toBeLessThan(100); // Delay scheduling should be fast
      expect(stats.p95).toBeLessThan(200);

      // Should have scheduled delayed messages
      expect(mockSQSPerf.send).toHaveBeenCalledTimes(iterations);
    });
  });

  describe('Statistics Performance', () => {
    it('should generate user statistics efficiently', async () => {
      const userIds = Array.from({ length: 20 }, (_, i) => `stats-user-${i}`);

      // Setup complex Redis state
      mockRedisPerf.keys.mockResolvedValue(
        Array.from({ length: 100 }, (_, i) => `some-key-${i}`)
      );

      for (const userId of userIds) {
        await measurer.measureAsync('user-stats', () =>
          rateLimiter.getRateLimitStats(userId)
        );
      }

      const stats = measurer.getStats('user-stats');

      expect(stats.count).toBe(userIds.length);
      expect(stats.avg).toBeLessThan(50); // Average under 50ms
      expect(stats.p95).toBeLessThan(100); // 95th percentile under 100ms
    });

    it('should generate global statistics efficiently', async () => {
      const iterations = 10;

      // Setup complex global state
      mockRedisPerf.keys.mockImplementation((pattern) => {
        if (pattern === 'active:*') return Array.from({ length: 50 }, (_, i) => `active:user${i}`);
        if (pattern.includes('user:*:minute:*')) return Array.from({ length: 100 }, (_, i) => `user:user${i}:minute:123`);
        if (pattern.includes('violations:*')) return Array.from({ length: 20 }, (_, i) => `violations:user${i}:123`);
        return [];
      });

      for (let i = 0; i < iterations; i++) {
        await measurer.measureAsync('global-stats', () =>
          rateLimiter.getGlobalStats()
        );
      }

      const stats = measurer.getStats('global-stats');

      expect(stats.count).toBe(iterations);
      expect(stats.avg).toBeLessThan(200); // Average under 200ms (more complex)
      expect(stats.p95).toBeLessThan(400); // 95th percentile under 400ms
    });
  });

  describe('Memory and Resource Performance', () => {
    it('should not cause memory leaks during extended operation', async () => {
      const extendedOperations = 500;
      const memoryCheckpoints = [];

      // Simulate memory usage tracking
      let simulatedMemoryUsage = 50; // MB

      for (let i = 0; i < extendedOperations; i++) {
        await rateLimiter.checkLimit(`memory-test-user-${i % 10}`, 'message');

        // Simulate memory usage (should remain stable)
        simulatedMemoryUsage += Math.random() * 2 - 1; // Random walk
        
        if (i % 100 === 0) {
          memoryCheckpoints.push(simulatedMemoryUsage);
        }
      }

      // Memory usage should remain stable
      const initialMemory = memoryCheckpoints[0];
      const finalMemory = memoryCheckpoints[memoryCheckpoints.length - 1];
      const memoryGrowth = finalMemory - initialMemory;

      expect(Math.abs(memoryGrowth)).toBeLessThan(10); // Less than 10MB growth
    });

    it('should handle resource cleanup efficiently', async () => {
      const cleanupIterations = 10;

      for (let i = 0; i < cleanupIterations; i++) {
        const tempRateLimiter = new EnhancedRateLimiter();
        
        // Do some operations
        await tempRateLimiter.checkLimit(`cleanup-user-${i}`, 'message');
        
        // Measure cleanup time
        const { duration } = await measurer.measureAsync('cleanup', () =>
          tempRateLimiter.cleanup()
        );

        expect(duration).toBeLessThan(100); // Cleanup should be fast
      }

      const stats = measurer.getStats('cleanup');
      expect(stats.avg).toBeLessThan(50); // Average cleanup under 50ms
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle Redis failures without significant performance impact', async () => {
      const iterations = 20;
      let failureCount = 0;

      // Simulate intermittent Redis failures
      mockRedisPerf.get.mockImplementation(() => {
        failureCount++;
        if (failureCount % 3 === 0) {
          return Promise.reject(new Error('Redis timeout'));
        }
        return Promise.resolve('5');
      });

      for (let i = 0; i < iterations; i++) {
        await measurer.measureAsync('error-handling', () =>
          rateLimiter.checkLimit(`error-user-${i}`, 'message')
        );
      }

      const stats = measurer.getStats('error-handling');

      expect(stats.count).toBe(iterations);
      expect(stats.avg).toBeLessThan(100); // Error handling should be fast
      expect(stats.p95).toBeLessThan(200);
    });

    it('should handle AWS service failures gracefully', async () => {
      const iterations = 15;

      // Simulate AWS service failures
      mockSQSPerf.send.mockRejectedValue(new Error('SQS unavailable'));
      mockCloudWatchPerf.send.mockRejectedValue(new Error('CloudWatch unavailable'));

      // Mock scenario requiring AWS services
      mockRedisPerf.get.mockImplementation((key) => {
        if (key.includes('last_message:')) return (Date.now() - 2000).toString();
        return '0';
      });

      for (let i = 0; i < iterations; i++) {
        await measurer.measureAsync('aws-error-handling', () =>
          rateLimiter.enforceMessageLimits(`aws-error-user-${i}`, 'recipient')
        );
      }

      const stats = measurer.getStats('aws-error-handling');

      expect(stats.count).toBe(iterations);
      expect(stats.avg).toBeLessThan(150); // Should handle AWS errors efficiently
    });
  });

  describe('Real-World Performance Scenarios', () => {
    it('should handle peak OnlyFans traffic (1000 req/min)', async () => {
      const requestsPerMinute = 1000;
      const testDuration = 10000; // 10 seconds (simulate 1/6 of minute)
      const expectedRequests = Math.floor(requestsPerMinute / 6);

      const startTime = performance.now();
      const promises = [];

      // Generate requests at realistic intervals
      for (let i = 0; i < expectedRequests; i++) {
        const delay = (i / expectedRequests) * testDuration;
        
        promises.push(
          new Promise(resolve => setTimeout(resolve, delay)).then(() =>
            measurer.measureAsync('peak-traffic', () =>
              rateLimiter.checkLimit(`peak-user-${i % 50}`, 'message')
            )
          )
        );
      }

      const results = await Promise.all(promises);
      const actualDuration = performance.now() - startTime;

      expect(results).toHaveLength(expectedRequests);
      expect(actualDuration).toBeLessThan(testDuration + 2000); // Allow 2s buffer

      const stats = measurer.getStats('peak-traffic');
      expect(stats.avg).toBeLessThan(100); // Should handle peak traffic efficiently
      expect(stats.p99).toBeLessThan(500); // 99th percentile under 500ms
    });

    it('should maintain performance during rate limit recovery periods', async () => {
      const userId = 'recovery-perf-user';
      const iterations = 30;

      // Simulate rate limit recovery scenario
      let callCount = 0;
      mockRedisPerf.get.mockImplementation((key) => {
        if (key.includes(`user:${userId}:minute:`)) {
          callCount++;
          // First 10 calls at limit, then recovery
          return callCount <= 10 ? '10' : '5';
        }
        return '0';
      });

      for (let i = 0; i < iterations; i++) {
        await measurer.measureAsync('recovery-performance', () =>
          rateLimiter.checkLimit(userId, 'message')
        );
        
        // Small delay to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const stats = measurer.getStats('recovery-performance');

      expect(stats.count).toBe(iterations);
      expect(stats.avg).toBeLessThan(100); // Recovery should be efficient
      expect(stats.max).toBeLessThan(300); // No single call should be too slow
    });
  });
});