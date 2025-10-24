/**
 * Tests d'intégration pour l'API Integration Service
 * Teste tous les aspects de l'intégration API optimisée
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { APIIntegrationService, apiRequest, apiGet, apiPost } from '@/lib/services/api-integration-service';
import { APIError, RateLimitError, NetworkError, AuthenticationError } from '@/lib/types/api-errors';

// Mock fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Integration Service', () => {
  let service: APIIntegrationService;

  beforeEach(() => {
    service = APIIntegrationService.getInstance();
    service.clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Request Functionality', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test User' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: new Map(),
      });

      const response = await apiGet<typeof mockData>('/api/users/1');

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockData);
      expect(response.meta?.cacheHit).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: undefined,
        signal: expect.any(AbortSignal),
      });
    });

    it('should make successful POST request with data', async () => {
      const requestData = { name: 'New User', email: 'user@test.com' };
      const responseData = { id: 2, ...requestData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(responseData),
        headers: new Map(),
      });

      const response = await apiPost<typeof responseData>('/api/users', requestData);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: expect.any(AbortSignal),
      });
    });

    it('should handle request timeout', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100);
        })
      );

      await expect(
        apiRequest('/api/slow-endpoint', { timeout: 50 })
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Map(),
      });

      const response = await apiGet('/api/protected');

      expect(response.success).toBe(false);
      expect(response.error?.type).toBe('AuthenticationError');
      expect(response.error?.message).toContain('Authentication failed');
    });

    it('should handle 429 rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['retry-after', '60']]),
      });

      const response = await apiGet('/api/rate-limited');

      expect(response.success).toBe(false);
      expect(response.error?.type).toBe('RateLimitError');
      expect(response.error?.message).toContain('Rate limit exceeded');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const response = await apiGet('/api/unreachable');

      expect(response.success).toBe(false);
      expect(response.error?.message).toContain('Network error');
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry on retryable errors', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
          headers: new Map(),
        });

      const response = await apiRequest('/api/flaky-endpoint', {
        retryConfig: {
          maxAttempts: 3,
          baseDelay: 10, // Fast for testing
          maxDelay: 100,
          backoffMultiplier: 2,
          jitterFactor: 0,
        },
      });

      expect(response.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Map(),
      });

      const response = await apiRequest('/api/bad-request');

      expect(response.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should respect max retry attempts', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent error'));

      const response = await apiRequest('/api/always-fails', {
        retryConfig: {
          maxAttempts: 2,
          baseDelay: 10,
          maxDelay: 100,
          backoffMultiplier: 2,
          jitterFactor: 0,
        },
      });

      expect(response.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Caching', () => {
    it('should cache GET requests', async () => {
      const mockData = { id: 1, name: 'Cached User' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: new Map(),
      });

      // First request
      const response1 = await apiGet('/api/users/1', {
        cacheKey: 'user-1',
        cacheTTL: 60000,
      });

      // Second request should use cache
      const response2 = await apiGet('/api/users/1', {
        cacheKey: 'user-1',
        cacheTTL: 60000,
      });

      expect(response1.success).toBe(true);
      expect(response1.meta?.cacheHit).toBe(false);
      expect(response2.success).toBe(true);
      expect(response2.meta?.cacheHit).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not cache POST requests by default', async () => {
      const mockData = { id: 1, created: true };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockData),
        headers: new Map(),
      });

      await apiPost('/api/users', { name: 'Test' });
      await apiPost('/api/users', { name: 'Test' });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should respect cache TTL', async () => {
      const mockData = { id: 1, name: 'TTL User' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: new Map(),
      });

      // First request
      await apiGet('/api/users/1', {
        cacheKey: 'ttl-user',
        cacheTTL: 50, // 50ms TTL
      });

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 60));

      // Second request should not use cache
      await apiGet('/api/users/1', {
        cacheKey: 'ttl-user',
        cacheTTL: 50,
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Debouncing', () => {
    it('should debounce requests with same key', async () => {
      const mockData = { results: ['item1', 'item2'] };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: new Map(),
      });

      // Make multiple requests quickly
      const promises = [
        apiRequest('/api/search?q=test', {
          debounceKey: 'search-test',
          debounceDelay: 100,
        }),
        apiRequest('/api/search?q=test', {
          debounceKey: 'search-test',
          debounceDelay: 100,
        }),
        apiRequest('/api/search?q=test', {
          debounceKey: 'search-test',
          debounceDelay: 100,
        }),
      ];

      const results = await Promise.all(promises);

      // All should return the same result
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockData);
      });

      // But only one actual request should be made
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authentication Headers', () => {
    it('should include auth headers when available', async () => {
      // Mock token storage
      const mockToken = 'mock-jwt-token';
      vi.spyOn(service as any, 'getValidToken').mockResolvedValue(mockToken);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Map(),
      });

      await apiGet('/api/protected-resource');

      expect(mockFetch).toHaveBeenCalledWith('/api/protected-resource', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
        body: undefined,
        signal: expect.any(AbortSignal),
      });
    });

    it('should skip auth headers when skipAuth is true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Map(),
      });

      await apiGet('/api/public-resource', { skipAuth: true });

      expect(mockFetch).toHaveBeenCalledWith('/api/public-resource', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: undefined,
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('Rate Limit Headers', () => {
    it('should parse rate limit headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Map([
          ['x-ratelimit-remaining', '95'],
          ['x-ratelimit-limit', '100'],
        ]),
      });

      const response = await apiGet('/api/rate-limited-resource');

      expect(response.success).toBe(true);
      expect(response.meta?.rateLimitRemaining).toBe(95);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const health = await service.healthCheck();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('checks');
      expect(health).toHaveProperty('metrics');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', () => {
      // Add some cache entries
      (service as any).setCache('key1', 'data1', 60000);
      (service as any).setCache('key2', 'data2', 60000);

      const stats = service.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBeGreaterThan(0);
      expect(Array.isArray(stats.entries)).toBe(true);
      expect(stats.entries).toHaveLength(2);
    });

    it('should clear cache by pattern', () => {
      (service as any).setCache('user-1', 'data1', 60000);
      (service as any).setCache('user-2', 'data2', 60000);
      (service as any).setCache('post-1', 'data3', 60000);

      service.clearCache('user-.*');

      const stats = service.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries[0].key).toBe('post-1');
    });

    it('should clear all cache when no pattern provided', () => {
      (service as any).setCache('key1', 'data1', 60000);
      (service as any).setCache('key2', 'data2', 60000);

      service.clearCache();

      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Debug Logging', () => {
    it('should collect debug logs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Map(),
      });

      await apiGet('/api/test-logging');

      const logs = service.getDebugLogs('debug', 10);
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
      
      const requestLog = logs.find(log => log.message.includes('API request started'));
      expect(requestLog).toBeDefined();
      expect(requestLog?.context).toHaveProperty('url');
    });

    it('should filter logs by level', async () => {
      // Generate some error logs
      mockFetch.mockRejectedValueOnce(new Error('Test error'));
      
      try {
        await apiGet('/api/error-endpoint');
      } catch (error) {
        // Expected error
      }

      const errorLogs = service.getDebugLogs('error');
      const debugLogs = service.getDebugLogs('debug');

      expect(errorLogs.every(log => log.level === 'error')).toBe(true);
      expect(debugLogs.every(log => log.level === 'debug')).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should handle concurrent requests efficiently', async () => {
      const mockData = { id: 1, data: 'concurrent' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: new Map(),
      });

      const startTime = Date.now();
      
      // Make 10 concurrent requests
      const promises = Array(10).fill(null).map((_, i) => 
        apiGet(`/api/concurrent/${i}`)
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // All requests should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete reasonably quickly (less than 1 second)
      expect(duration).toBeLessThan(1000);
      expect(mockFetch).toHaveBeenCalledTimes(10);
    });

    it('should cleanup old cache entries when cache is full', () => {
      const maxSize = 5;
      const service = new (APIIntegrationService as any)();
      service.defaultCacheConfig.maxSize = maxSize;

      // Fill cache beyond max size
      for (let i = 0; i < maxSize + 3; i++) {
        (service as any).setCache(`key-${i}`, `data-${i}`, 60000);
      }

      const stats = service.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(maxSize);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from temporary network issues', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Network temporarily unavailable'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ recovered: true }),
          headers: new Map(),
        });
      });

      const response = await apiRequest('/api/recovery-test', {
        retryConfig: {
          maxAttempts: 3,
          baseDelay: 10,
          maxDelay: 100,
          backoffMultiplier: 2,
          jitterFactor: 0,
        },
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ recovered: true });
      expect(callCount).toBe(3);
    });

    it('should handle partial service degradation', async () => {
      // Simulate some endpoints working, others failing
      mockFetch.mockImplementation((url) => {
        if (url.includes('working')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ status: 'ok' }),
            headers: new Map(),
          });
        } else {
          return Promise.resolve({
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Map(),
          });
        }
      });

      const workingResponse = await apiGet('/api/working-endpoint');
      const failingResponse = await apiGet('/api/failing-endpoint');

      expect(workingResponse.success).toBe(true);
      expect(failingResponse.success).toBe(false);
      expect(failingResponse.error?.message).toContain('Service Unavailable');
    });
  });
});

describe('API Integration Edge Cases', () => {
  let service: APIIntegrationService;

  beforeEach(() => {
    service = APIIntegrationService.getInstance();
    vi.clearAllMocks();
  });

  it('should handle malformed JSON responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error('Invalid JSON')),
      headers: new Map(),
    });

    const response = await apiGet('/api/malformed-json');

    expect(response.success).toBe(false);
    expect(response.error?.message).toContain('Invalid JSON');
  });

  it('should handle empty responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204, // No Content
      json: () => Promise.resolve(null),
      headers: new Map(),
    });

    const response = await apiGet('/api/empty-response');

    expect(response.success).toBe(true);
    expect(response.data).toBeNull();
  });

  it('should handle very large responses', async () => {
    const largeData = {
      items: Array(10000).fill(null).map((_, i) => ({ id: i, data: `item-${i}` }))
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(largeData),
      headers: new Map(),
    });

    const startTime = Date.now();
    const response = await apiGet('/api/large-response');
    const duration = Date.now() - startTime;

    expect(response.success).toBe(true);
    expect(response.data.items).toHaveLength(10000);
    expect(duration).toBeLessThan(5000); // Should handle large data reasonably fast
  });

  it('should handle unicode and special characters', async () => {
    const unicodeData = {
      name: '测试用户',
      emoji: '🚀💡🎯',
      special: 'Special chars: àáâãäåæçèéêë',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(unicodeData),
      headers: new Map(),
    });

    const response = await apiPost('/api/unicode-test', unicodeData);

    expect(response.success).toBe(true);
    expect(response.data).toEqual(unicodeData);
  });
});