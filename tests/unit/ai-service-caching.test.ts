import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIService } from '@/lib/services/ai-service';

// Mock fetch
global.fetch = vi.fn();

describe('AI Service Caching', () => {
  let aiService: AIService;
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockFetch = vi.mocked(fetch);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Cache Configuration', () => {
    it('should initialize with cache enabled by default', () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
      });

      const cache = (service as any).cache;
      expect(cache.config.enabled).toBe(true);
      expect(cache.config.ttlSeconds).toBe(300); // 5 minutes
      expect(cache.config.maxSize).toBe(1000);
    });

    it('should respect custom cache configuration', () => {
      const customConfig = {
        enabled: false,
        ttlSeconds: 600,
        maxSize: 500,
      };

      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: customConfig,
      });

      const cache = (service as any).cache;
      expect(cache.config).toEqual(customConfig);
    });

    it('should disable cache when configured', () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: false, ttlSeconds: 300, maxSize: 100 },
      });

      const cache = (service as any).cache;
      expect(cache.config.enabled).toBe(false);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys for identical requests', () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 100 },
      });

      const cache = (service as any).cache;

      const request1 = {
        prompt: 'Test prompt',
        context: { userId: 'user-123', contentType: 'message' },
        options: { temperature: 0.7 },
      };

      const request2 = {
        prompt: 'Test prompt',
        context: { userId: 'user-123', contentType: 'message' },
        options: { temperature: 0.7 },
      };

      const key1 = cache.generateKey(request1);
      const key2 = cache.generateKey(request2);

      expect(key1).toBe(key2);
    });

    it('should generate different cache keys for different requests', () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 100 },
      });

      const cache = (service as any).cache;

      const request1 = {
        prompt: 'Test prompt 1',
        context: { userId: 'user-123', contentType: 'message' },
        options: { temperature: 0.7 },
      };

      const request2 = {
        prompt: 'Test prompt 2',
        context: { userId: 'user-123', contentType: 'message' },
        options: { temperature: 0.7 },
      };

      const key1 = cache.generateKey(request1);
      const key2 = cache.generateKey(request2);

      expect(key1).not.toBe(key2);
    });

    it('should include relevant parameters in cache key', () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 100 },
      });

      const cache = (service as any).cache;

      const baseRequest = {
        prompt: 'Test prompt',
        context: { userId: 'user-123', contentType: 'message' },
        options: { temperature: 0.7 },
      };

      // Different temperature should generate different key
      const differentTempRequest = {
        ...baseRequest,
        options: { temperature: 0.9 },
      };

      // Different content type should generate different key
      const differentTypeRequest = {
        ...baseRequest,
        context: { ...baseRequest.context, contentType: 'caption' },
      };

      const baseKey = cache.generateKey(baseRequest);
      const tempKey = cache.generateKey(differentTempRequest);
      const typeKey = cache.generateKey(differentTypeRequest);

      expect(baseKey).not.toBe(tempKey);
      expect(baseKey).not.toBe(typeKey);
      expect(tempKey).not.toBe(typeKey);
    });

    it('should ignore userId in cache key generation', () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 100 },
      });

      const cache = (service as any).cache;

      const request1 = {
        prompt: 'Test prompt',
        context: { userId: 'user-1', contentType: 'message' },
        options: { temperature: 0.7 },
      };

      const request2 = {
        prompt: 'Test prompt',
        context: { userId: 'user-2', contentType: 'message' },
        options: { temperature: 0.7 },
      };

      const key1 = cache.generateKey(request1);
      const key2 = cache.generateKey(request2);

      // Keys should be the same (userId not included in cache key)
      expect(key1).toBe(key2);
    });
  });

  describe('Cache Operations', () => {
    it('should cache and retrieve responses', async () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 100 },
      });

      const mockResponse = {
        choices: [{ message: { content: 'Cached response' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 },
        model: 'gpt-4o-mini',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true }) // Availability check
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const request = {
        prompt: 'Cache test prompt',
        context: { userId: 'user-123', contentType: 'message' },
        options: { temperature: 0.7 },
      };

      // First request - should hit API
      const result1 = await service.generateText(request);
      expect(result1.content).toBe('Cached response');

      // Second identical request - should use cache
      const result2 = await service.generateText(request);
      expect(result2.content).toBe('Cached response');
      expect(result1).toEqual(result2);

      // Should only have made 2 fetch calls (availability + first request)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not cache when disabled', async () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: false, ttlSeconds: 300, maxSize: 100 },
      });

      const mockResponse = {
        choices: [{ message: { content: 'Not cached' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 },
        model: 'gpt-4o-mini',
      };

      mockFetch
        .mockResolvedValue({ ok: true }) // Availability checks
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const request = {
        prompt: 'No cache test',
        context: { userId: 'user-123' },
        options: {},
      };

      // Make two identical requests
      await service.generateText(request);
      await service.generateText(request);

      // Should have made 4 fetch calls (2 availability + 2 requests)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should respect TTL and expire cached entries', async () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 1, maxSize: 100 }, // 1 second TTL
      });

      const mockResponse = {
        choices: [{ message: { content: 'TTL test' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 },
        model: 'gpt-4o-mini',
      };

      mockFetch
        .mockResolvedValue({ ok: true })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const request = {
        prompt: 'TTL test prompt',
        context: { userId: 'user-123' },
        options: {},
      };

      // First request
      await service.generateText(request);

      // Advance time beyond TTL
      vi.advanceTimersByTime(1500); // 1.5 seconds

      // Second request should hit API again due to expired cache
      await service.generateText(request);

      // Should have made 4 fetch calls (2 availability + 2 requests)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should enforce cache size limits', () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 2 },
      });

      const cache = (service as any).cache;

      const response = {
        content: 'Test response',
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        model: 'test-model',
        provider: 'openai' as const,
        finishReason: 'stop' as const,
      };

      // Add entries up to max size
      cache.set({ prompt: '1', context: { userId: 'user' }, options: {} }, response);
      cache.set({ prompt: '2', context: { userId: 'user' }, options: {} }, response);

      // Verify cache is at capacity
      expect(cache.cache.size).toBe(2);

      // Add third entry - should evict oldest
      cache.set({ prompt: '3', context: { userId: 'user' }, options: {} }, response);

      // Cache should still be at max size
      expect(cache.cache.size).toBe(2);

      // First entry should be evicted
      const firstEntry = cache.get({ prompt: '1', context: { userId: 'user' }, options: {} });
      expect(firstEntry).toBeNull();

      // Third entry should be present
      const thirdEntry = cache.get({ prompt: '3', context: { userId: 'user' }, options: {} });
      expect(thirdEntry).toEqual(response);
    });
  });

  describe('Cache Invalidation', () => {
    it('should clear entire cache', async () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 100 },
      });

      const mockResponse = {
        choices: [{ message: { content: 'Clear test' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 },
        model: 'gpt-4o-mini',
      };

      mockFetch
        .mockResolvedValue({ ok: true })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const request = {
        prompt: 'Clear cache test',
        context: { userId: 'user-123' },
        options: {},
      };

      // Cache a response
      await service.generateText(request);

      // Clear cache
      service.clearCache();

      // Next request should hit API again
      await service.generateText(request);

      // Should have made 4 fetch calls (2 availability + 2 requests)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should handle cache corruption gracefully', () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 100 },
      });

      const cache = (service as any).cache;

      // Manually corrupt cache by setting invalid data
      cache.cache.set('corrupted-key', { invalid: 'data', timestamp: Date.now() });

      const request = {
        prompt: 'Corruption test',
        context: { userId: 'user-123' },
        options: {},
      };

      // Should not throw error when encountering corrupted data
      expect(() => cache.get(request)).not.toThrow();
      expect(cache.get(request)).toBeNull();
    });
  });

  describe('Cache Performance', () => {
    it('should perform cache operations efficiently', () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 1000 },
      });

      const cache = (service as any).cache;
      const response = {
        content: 'Performance test',
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        model: 'test-model',
        provider: 'openai' as const,
        finishReason: 'stop' as const,
      };

      // Measure cache set performance
      const setStartTime = performance.now();
      for (let i = 0; i < 100; i++) {
        cache.set(
          { prompt: `test-${i}`, context: { userId: 'user' }, options: {} },
          response
        );
      }
      const setEndTime = performance.now();

      // Measure cache get performance
      const getStartTime = performance.now();
      for (let i = 0; i < 100; i++) {
        cache.get({ prompt: `test-${i}`, context: { userId: 'user' }, options: {} });
      }
      const getEndTime = performance.now();

      // Operations should be fast
      expect(setEndTime - setStartTime).toBeLessThan(100); // 100ms for 100 sets
      expect(getEndTime - getStartTime).toBeLessThan(50);  // 50ms for 100 gets
    });

    it('should handle large cache sizes efficiently', () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 10000 },
      });

      const cache = (service as any).cache;
      const response = {
        content: 'Large cache test',
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        model: 'test-model',
        provider: 'openai' as const,
        finishReason: 'stop' as const,
      };

      // Fill cache with many entries
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        cache.set(
          { prompt: `large-test-${i}`, context: { userId: 'user' }, options: {} },
          response
        );
      }
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
      expect(cache.cache.size).toBe(1000);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hit/miss statistics', async () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 100 },
      });

      const mockResponse = {
        choices: [{ message: { content: 'Stats test' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 },
        model: 'gpt-4o-mini',
      };

      mockFetch
        .mockResolvedValue({ ok: true })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const request1 = {
        prompt: 'Stats test 1',
        context: { userId: 'user-123' },
        options: {},
      };

      const request2 = {
        prompt: 'Stats test 2',
        context: { userId: 'user-123' },
        options: {},
      };

      // First request - cache miss
      await service.generateText(request1);

      // Second request (same) - cache hit
      await service.generateText(request1);

      // Third request (different) - cache miss
      await service.generateText(request2);

      // Fourth request (same as third) - cache hit
      await service.generateText(request2);

      // Should have made 4 fetch calls total:
      // 2 availability checks + 2 unique requests
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should provide cache usage information', () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 100 },
      });

      const cache = (service as any).cache;
      const response = {
        content: 'Usage test',
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        model: 'test-model',
        provider: 'openai' as const,
        finishReason: 'stop' as const,
      };

      // Add some entries
      for (let i = 0; i < 10; i++) {
        cache.set(
          { prompt: `usage-test-${i}`, context: { userId: 'user' }, options: {} },
          response
        );
      }

      // Verify cache size
      expect(cache.cache.size).toBe(10);

      // Verify cache capacity utilization
      const utilizationPercent = (cache.cache.size / cache.config.maxSize) * 100;
      expect(utilizationPercent).toBe(10); // 10/100 = 10%
    });
  });

  describe('Cache Edge Cases', () => {
    it('should handle undefined/null requests gracefully', () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 100 },
      });

      const cache = (service as any).cache;

      // Should not throw errors
      expect(() => cache.get(null)).not.toThrow();
      expect(() => cache.get(undefined)).not.toThrow();
      expect(() => cache.set(null, {})).not.toThrow();
      expect(() => cache.set(undefined, {})).not.toThrow();

      expect(cache.get(null)).toBeNull();
      expect(cache.get(undefined)).toBeNull();
    });

    it('should handle very large prompts', () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 100 },
      });

      const cache = (service as any).cache;
      const largePrompt = 'A'.repeat(100000); // 100KB prompt

      const request = {
        prompt: largePrompt,
        context: { userId: 'user-123' },
        options: {},
      };

      const response = {
        content: 'Large prompt response',
        usage: { promptTokens: 25000, completionTokens: 100, totalTokens: 25100 },
        model: 'test-model',
        provider: 'openai' as const,
        finishReason: 'stop' as const,
      };

      // Should handle large prompts without issues
      expect(() => cache.set(request, response)).not.toThrow();
      expect(cache.get(request)).toEqual(response);
    });

    it('should handle concurrent cache operations', async () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 100 },
      });

      const cache = (service as any).cache;
      const response = {
        content: 'Concurrent test',
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        model: 'test-model',
        provider: 'openai' as const,
        finishReason: 'stop' as const,
      };

      // Perform concurrent cache operations
      const operations = Array.from({ length: 50 }, (_, i) => {
        const request = { prompt: `concurrent-${i}`, context: { userId: 'user' }, options: {} };
        return Promise.resolve().then(() => {
          cache.set(request, response);
          return cache.get(request);
        });
      });

      const results = await Promise.all(operations);

      // All operations should complete successfully
      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result).toEqual(response);
      });
    });

    it('should handle cache operations during TTL expiration', async () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 0.1, maxSize: 100 }, // 100ms TTL
      });

      const cache = (service as any).cache;
      const response = {
        content: 'TTL expiration test',
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        model: 'test-model',
        provider: 'openai' as const,
        finishReason: 'stop' as const,
      };

      const request = {
        prompt: 'TTL expiration test',
        context: { userId: 'user-123' },
        options: {},
      };

      // Set cache entry
      cache.set(request, response);

      // Verify it's cached
      expect(cache.get(request)).toEqual(response);

      // Wait for TTL to expire
      vi.advanceTimersByTime(150); // 150ms

      // Should return null after expiration
      expect(cache.get(request)).toBeNull();

      // Cache should have cleaned up expired entry
      expect(cache.cache.size).toBe(0);
    });
  });
});