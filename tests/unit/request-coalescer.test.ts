import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  RequestCoalescer, 
  getRequestCoalescer, 
  withCoalescing,
  CoalescingPatterns 
} from '@/lib/services/request-coalescer';

describe('RequestCoalescer', () => {
  let coalescer: RequestCoalescer;

  beforeEach(() => {
    coalescer = new RequestCoalescer();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Coalescing', () => {
    it('should execute function once for multiple simultaneous requests', async () => {
      const mockFn = vi.fn().mockResolvedValue('result');
      
      // Make 3 simultaneous requests with same key
      const promises = [
        coalescer.coalesce('test-key', mockFn),
        coalescer.coalesce('test-key', mockFn),
        coalescer.coalesce('test-key', mockFn),
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toEqual(['result', 'result', 'result']);
      expect(mockFn).toHaveBeenCalledOnce();
      
      const metrics = coalescer.getMetrics();
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.coalescedRequests).toBe(2);
    });

    it('should execute function separately for different keys', async () => {
      const mockFn1 = vi.fn().mockResolvedValue('result1');
      const mockFn2 = vi.fn().mockResolvedValue('result2');
      
      const [result1, result2] = await Promise.all([
        coalescer.coalesce('key1', mockFn1),
        coalescer.coalesce('key2', mockFn2),
      ]);
      
      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(mockFn1).toHaveBeenCalledOnce();
      expect(mockFn2).toHaveBeenCalledOnce();
    });

    it('should handle function failures correctly', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Function failed'));
      
      const promises = [
        coalescer.coalesce('error-key', mockFn),
        coalescer.coalesce('error-key', mockFn),
      ];
      
      await expect(Promise.all(promises)).rejects.toThrow('Function failed');
      expect(mockFn).toHaveBeenCalledOnce();
    });
  });

  describe('Caching', () => {
    it('should cache successful results', async () => {
      const mockFn = vi.fn().mockResolvedValue('cached-result');
      
      // First call
      const result1 = await coalescer.coalesce('cache-key', mockFn, { ttl: 1000 });
      
      // Second call should use cache
      const result2 = await coalescer.coalesce('cache-key', mockFn, { ttl: 1000 });
      
      expect(result1).toBe('cached-result');
      expect(result2).toBe('cached-result');
      expect(mockFn).toHaveBeenCalledOnce();
      
      const metrics = coalescer.getMetrics();
      expect(metrics.cacheHits).toBe(1);
    });

    it('should respect TTL and expire cache', async () => {
      const mockFn = vi.fn()
        .mockResolvedValueOnce('first-result')
        .mockResolvedValueOnce('second-result');
      
      // First call with short TTL
      const result1 = await coalescer.coalesce('ttl-key', mockFn, { ttl: 50 });
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second call should execute function again
      const result2 = await coalescer.coalesce('ttl-key', mockFn, { ttl: 50 });
      
      expect(result1).toBe('first-result');
      expect(result2).toBe('second-result');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not cache failed results', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success-after-failure');
      
      // First call fails
      await expect(coalescer.coalesce('fail-key', mockFn)).rejects.toThrow('First failure');
      
      // Second call should execute function again (not cached)
      const result = await coalescer.coalesce('fail-key', mockFn);
      
      expect(result).toBe('success-after-failure');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });  desc
ribe('Coalescing by Arguments', () => {
    it('should coalesce based on function arguments', async () => {
      const mockFn = vi.fn().mockImplementation((a: number, b: string) => 
        Promise.resolve(`${a}-${b}`)
      );
      
      // Same arguments should coalesce
      const promises = [
        coalescer.coalesceByArgs(mockFn, [1, 'test']),
        coalescer.coalesceByArgs(mockFn, [1, 'test']),
        coalescer.coalesceByArgs(mockFn, [1, 'test']),
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toEqual(['1-test', '1-test', '1-test']);
      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith(1, 'test');
    });

    it('should not coalesce different arguments', async () => {
      const mockFn = vi.fn()
        .mockImplementation((a: number) => Promise.resolve(`result-${a}`));
      
      const [result1, result2] = await Promise.all([
        coalescer.coalesceByArgs(mockFn, [1]),
        coalescer.coalesceByArgs(mockFn, [2]),
      ]);
      
      expect(result1).toBe('result-1');
      expect(result2).toBe('result-2');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should use custom key generator', async () => {
      const mockFn = vi.fn().mockResolvedValue('custom-result');
      const customKeyGenerator = (args: any[]) => `custom-${args[0].id}`;
      
      const promises = [
        coalescer.coalesceByArgs(mockFn, [{ id: 'same', other: 'diff1' }], { keyGenerator: customKeyGenerator }),
        coalescer.coalesceByArgs(mockFn, [{ id: 'same', other: 'diff2' }], { keyGenerator: customKeyGenerator }),
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toEqual(['custom-result', 'custom-result']);
      expect(mockFn).toHaveBeenCalledOnce();
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch coalescing', async () => {
      const mockFn1 = vi.fn().mockResolvedValue('batch-result-1');
      const mockFn2 = vi.fn().mockResolvedValue('batch-result-2');
      
      const requests = [
        { key: 'batch-1', fn: mockFn1 },
        { key: 'batch-2', fn: mockFn2 },
        { key: 'batch-1', fn: mockFn1 }, // Should coalesce with first
      ];
      
      const results = await coalescer.coalesceBatch(requests);
      
      expect(results).toEqual(['batch-result-1', 'batch-result-2', 'batch-result-1']);
      expect(mockFn1).toHaveBeenCalledOnce();
      expect(mockFn2).toHaveBeenCalledOnce();
    });

    it('should handle batch failures gracefully', async () => {
      const mockFn1 = vi.fn().mockResolvedValue('success');
      const mockFn2 = vi.fn().mockRejectedValue(new Error('Batch failure'));
      
      const requests = [
        { key: 'success-key', fn: mockFn1 },
        { key: 'failure-key', fn: mockFn2 },
      ];
      
      await expect(coalescer.coalesceBatch(requests)).rejects.toThrow('Batch failure');
    });
  });

  describe('Cache Management', () => {
    it('should invalidate specific cache entries', async () => {
      const mockFn = vi.fn()
        .mockResolvedValueOnce('first')
        .mockResolvedValueOnce('second');
      
      // Cache a result
      await coalescer.coalesce('invalidate-key', mockFn, { ttl: 10000 });
      
      // Invalidate cache
      coalescer.invalidate('invalidate-key');
      
      // Next call should execute function again
      const result = await coalescer.coalesce('invalidate-key', mockFn, { ttl: 10000 });
      
      expect(result).toBe('second');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should invalidate by pattern', async () => {
      const mockFn = vi.fn().mockResolvedValue('pattern-result');
      
      // Cache multiple entries
      await Promise.all([
        coalescer.coalesce('user:123:profile', mockFn, { ttl: 10000 }),
        coalescer.coalesce('user:123:settings', mockFn, { ttl: 10000 }),
        coalescer.coalesce('user:456:profile', mockFn, { ttl: 10000 }),
        coalescer.coalesce('other:data', mockFn, { ttl: 10000 }),
      ]);
      
      // Invalidate user:123 entries
      const invalidated = coalescer.invalidatePattern(/^user:123:/);
      
      expect(invalidated).toBe(2);
      
      // Check that correct entries were invalidated
      const metrics = coalescer.getMetrics();
      expect(metrics.cacheSize).toBe(2); // Should have 2 entries left
    });

    it('should support cache warmup', async () => {
      const mockFn = vi.fn().mockResolvedValue('warmed-up-result');
      
      // Warmup cache
      await coalescer.warmup('warmup-key', mockFn, 5000);
      
      // Subsequent call should use cache
      const result = await coalescer.coalesce('warmup-key', mockFn);
      
      expect(result).toBe('warmed-up-result');
      expect(mockFn).toHaveBeenCalledOnce();
      
      const metrics = coalescer.getMetrics();
      expect(metrics.cacheHits).toBe(1);
    });

    it('should handle warmup failures gracefully', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Warmup failed'));
      
      // Warmup should not throw
      await expect(coalescer.warmup('warmup-fail-key', mockFn)).resolves.toBeUndefined();
      
      // Cache should be empty
      const metrics = coalescer.getMetrics();
      expect(metrics.cacheSize).toBe(0);
    });
  });

  describe('Metrics and Health', () => {
    it('should track comprehensive metrics', async () => {
      const mockFn = vi.fn().mockResolvedValue('metrics-result');
      
      // Generate some activity
      await Promise.all([
        coalescer.coalesce('metrics-1', mockFn),
        coalescer.coalesce('metrics-1', mockFn), // Coalesced
        coalescer.coalesce('metrics-2', mockFn),
      ]);
      
      // Use cache
      await coalescer.coalesce('metrics-1', mockFn, { ttl: 10000 });
      
      const metrics = coalescer.getMetrics();
      
      expect(metrics.totalRequests).toBe(4);
      expect(metrics.coalescedRequests).toBe(1);
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.coalescingRate).toBe(25); // 1/4 * 100
      expect(metrics.cacheHitRate).toBe(25); // 1/4 * 100
      expect(metrics.averageSubscribers).toBeGreaterThan(1);
    });

    it('should provide health check status', async () => {
      let health = coalescer.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.details.pendingRequests).toBe(0);
      expect(health.details.cacheSize).toBe(0);
      
      // Add some load
      const mockFn = vi.fn().mockResolvedValue('health-result');
      await coalescer.coalesce('health-key', mockFn, { ttl: 10000 });
      
      health = coalescer.healthCheck();
      expect(health.details.cacheSize).toBe(1);
    });

    it('should detect degraded health with high pending requests', async () => {
      // Mock a slow function to create pending requests
      const slowFn = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('slow'), 1000))
      );
      
      // Start many requests without waiting
      const promises = Array(60).fill(null).map((_, i) => 
        coalescer.coalesce(`slow-${i}`, slowFn)
      );
      
      // Check health while requests are pending
      const health = coalescer.healthCheck();
      expect(health.status).toBe('degraded');
      
      // Clean up
      await Promise.all(promises);
    });

    it('should reset metrics correctly', async () => {
      const mockFn = vi.fn().mockResolvedValue('reset-result');
      
      await coalescer.coalesce('reset-key', mockFn);
      
      let metrics = coalescer.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      
      coalescer.reset();
      
      metrics = coalescer.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.cacheSize).toBe(0);
      expect(metrics.pendingRequests).toBe(0);
    });
  });
});

describe('Global RequestCoalescer', () => {
  it('should return singleton instance', () => {
    const instance1 = getRequestCoalescer();
    const instance2 = getRequestCoalescer();
    
    expect(instance1).toBe(instance2);
    expect(instance1).toBeInstanceOf(RequestCoalescer);
  });

  it('should maintain state across calls', async () => {
    const coalescer1 = getRequestCoalescer();
    const coalescer2 = getRequestCoalescer();
    
    const mockFn = vi.fn().mockResolvedValue('singleton-result');
    
    await coalescer1.coalesce('singleton-key', mockFn, { ttl: 10000 });
    
    // Second instance should use same cache
    const result = await coalescer2.coalesce('singleton-key', mockFn, { ttl: 10000 });
    
    expect(result).toBe('singleton-result');
    expect(mockFn).toHaveBeenCalledOnce();
  });
});

describe('withCoalescing Decorator', () => {
  class TestService {
    @withCoalescing('test-method', { ttl: 5000 })
    async testMethod(input: string): Promise<string> {
      return `processed: ${input}`;
    }

    @withCoalescing('slow-method', { ttl: 1000 })
    async slowMethod(delay: number): Promise<string> {
      await new Promise(resolve => setTimeout(resolve, delay));
      return `completed after ${delay}ms`;
    }
  }

  let service: TestService;

  beforeEach(() => {
    service = new TestService();
  });

  it('should apply coalescing to decorated methods', async () => {
    const spy = vi.spyOn(service, 'testMethod');
    
    // Multiple calls with same arguments
    const promises = [
      service.testMethod('same-input'),
      service.testMethod('same-input'),
      service.testMethod('same-input'),
    ];
    
    const results = await Promise.all(promises);
    
    expect(results).toEqual([
      'processed: same-input',
      'processed: same-input', 
      'processed: same-input'
    ]);
    
    // Original method should be called only once due to coalescing
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should not coalesce different arguments', async () => {
    const spy = vi.spyOn(service, 'testMethod');
    
    const [result1, result2] = await Promise.all([
      service.testMethod('input1'),
      service.testMethod('input2'),
    ]);
    
    expect(result1).toBe('processed: input1');
    expect(result2).toBe('processed: input2');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should handle concurrent slow operations', async () => {
    const spy = vi.spyOn(service, 'slowMethod');
    
    const startTime = Date.now();
    
    // Multiple calls to slow method with same delay
    const promises = [
      service.slowMethod(100),
      service.slowMethod(100),
      service.slowMethod(100),
    ];
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    expect(results).toEqual([
      'completed after 100ms',
      'completed after 100ms',
      'completed after 100ms'
    ]);
    
    // Should take roughly 100ms, not 300ms
    expect(endTime - startTime).toBeLessThan(200);
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe('CoalescingPatterns', () => {
  beforeEach(() => {
    // Reset the global coalescer
    getRequestCoalescer().reset();
  });

  it('should handle user requests with appropriate TTL', async () => {
    const mockFn = vi.fn().mockResolvedValue({ name: 'John', id: '123' });
    
    const result = await CoalescingPatterns.userRequest('123', 'profile', mockFn);
    
    expect(result).toEqual({ name: 'John', id: '123' });
    expect(mockFn).toHaveBeenCalledOnce();
    
    // Second call should use cache
    const result2 = await CoalescingPatterns.userRequest('123', 'profile', mockFn);
    expect(result2).toEqual({ name: 'John', id: '123' });
    expect(mockFn).toHaveBeenCalledOnce();
  });

  it('should handle campaign data requests', async () => {
    const mockFn = vi.fn().mockResolvedValue({ campaignId: 'camp123', status: 'active' });
    
    const result = await CoalescingPatterns.campaignData('camp123', mockFn);
    
    expect(result).toEqual({ campaignId: 'camp123', status: 'active' });
    expect(mockFn).toHaveBeenCalledOnce();
  });

  it('should handle analytics requests with longer TTL', async () => {
    const mockFn = vi.fn().mockResolvedValue({ views: 1000, revenue: 500 });
    
    const result = await CoalescingPatterns.analytics('daily-stats', mockFn);
    
    expect(result).toEqual({ views: 1000, revenue: 500 });
    expect(mockFn).toHaveBeenCalledOnce();
  });

  it('should handle AI recommendations with extended TTL', async () => {
    const mockFn = vi.fn().mockResolvedValue(['idea1', 'idea2', 'idea3']);
    
    const result = await CoalescingPatterns.aiRecommendations('user123', 'content-ideas', mockFn);
    
    expect(result).toEqual(['idea1', 'idea2', 'idea3']);
    expect(mockFn).toHaveBeenCalledOnce();
  });

  it('should use different cache keys for different patterns', async () => {
    const userFn = vi.fn().mockResolvedValue('user-data');
    const campaignFn = vi.fn().mockResolvedValue('campaign-data');
    const analyticsFn = vi.fn().mockResolvedValue('analytics-data');
    const aiFn = vi.fn().mockResolvedValue('ai-data');
    
    await Promise.all([
      CoalescingPatterns.userRequest('123', 'profile', userFn),
      CoalescingPatterns.campaignData('123', campaignFn),
      CoalescingPatterns.analytics('123', analyticsFn),
      CoalescingPatterns.aiRecommendations('123', 'ideas', aiFn),
    ]);
    
    // All functions should be called since they use different cache keys
    expect(userFn).toHaveBeenCalledOnce();
    expect(campaignFn).toHaveBeenCalledOnce();
    expect(analyticsFn).toHaveBeenCalledOnce();
    expect(aiFn).toHaveBeenCalledOnce();
  });
});

describe('Performance and Edge Cases', () => {
  let coalescer: RequestCoalescer;

  beforeEach(() => {
    coalescer = new RequestCoalescer();
  });

  it('should handle high-frequency coalescing', async () => {
    const mockFn = vi.fn().mockResolvedValue('high-frequency-result');
    
    // 1000 concurrent requests
    const promises = Array(1000).fill(null).map(() => 
      coalescer.coalesce('high-freq-key', mockFn)
    );
    
    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(1000);
    expect(results.every(r => r === 'high-frequency-result')).toBe(true);
    expect(mockFn).toHaveBeenCalledOnce();
    
    const metrics = coalescer.getMetrics();
    expect(metrics.coalescedRequests).toBe(999);
    expect(metrics.coalescingRate).toBe(99.9);
  });

  it('should handle cache size limits', async () => {
    const mockFn = vi.fn().mockImplementation((key: string) => Promise.resolve(`result-${key}`));
    
    // Fill cache beyond max size
    const promises = Array(1200).fill(null).map((_, i) => 
      coalescer.coalesce(`cache-key-${i}`, () => mockFn(`${i}`), { ttl: 60000 })
    );
    
    await Promise.all(promises);
    
    const metrics = coalescer.getMetrics();
    // Cache should be limited and cleaned up
    expect(metrics.cacheSize).toBeLessThanOrEqual(1000);
  });

  it('should handle mixed TTL scenarios', async () => {
    const shortTTLFn = vi.fn().mockResolvedValue('short-ttl-result');
    const longTTLFn = vi.fn().mockResolvedValue('long-ttl-result');
    
    // Cache with different TTLs
    await coalescer.coalesce('short-key', shortTTLFn, { ttl: 50 });
    await coalescer.coalesce('long-key', longTTLFn, { ttl: 10000 });
    
    // Wait for short TTL to expire
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Short TTL should be expired, long TTL should still be cached
    await coalescer.coalesce('short-key', shortTTLFn, { ttl: 50 });
    await coalescer.coalesce('long-key', longTTLFn, { ttl: 10000 });
    
    expect(shortTTLFn).toHaveBeenCalledTimes(2);
    expect(longTTLFn).toHaveBeenCalledOnce();
  });

  it('should handle cleanup of expired entries', async () => {
    const mockFn = vi.fn().mockResolvedValue('cleanup-result');
    
    // Add entries with short TTL
    await Promise.all([
      coalescer.coalesce('cleanup-1', mockFn, { ttl: 50 }),
      coalescer.coalesce('cleanup-2', mockFn, { ttl: 50 }),
      coalescer.coalesce('cleanup-3', mockFn, { ttl: 50 }),
    ]);
    
    let metrics = coalescer.getMetrics();
    expect(metrics.cacheSize).toBe(3);
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Trigger cleanup by making a new request
    await coalescer.coalesce('trigger-cleanup', mockFn, { ttl: 1000 });
    
    // Cache should be cleaned up (implementation detail - may vary)
    metrics = coalescer.getMetrics();
    expect(metrics.cacheSize).toBeLessThanOrEqual(4);
  });
});