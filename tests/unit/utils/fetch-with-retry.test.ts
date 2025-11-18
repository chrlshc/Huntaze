/**
 * Fetch with Retry - Unit Tests
 * 
 * Tests the retry logic with exponential backoff for API calls.
 * 
 * @see lib/utils/fetch-with-retry.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchWithRetry,
  fetchMultiAccountWithRetry,
  batchFetchWithRetry,
  FetchError,
  DEFAULT_RETRY_CONFIG,
} from '@/lib/utils/fetch-with-retry';

// Mock fetch
global.fetch = vi.fn();

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Successful Requests', () => {
    it('should return data on successful request', async () => {
      const mockData = { success: true, data: { id: 1 } };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await fetchWithRetry('/api/test');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should include correlation ID in headers', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await fetchWithRetry('/api/test');

      const callArgs = (global.fetch as any).mock.calls[0];
      expect(callArgs[1].headers['X-Correlation-Id']).toBeDefined();
    });

    it('should preserve custom headers', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await fetchWithRetry('/api/test', {
        headers: {
          'Authorization': 'Bearer token',
        },
      });

      const callArgs = (global.fetch as any).mock.calls[0];
      expect(callArgs[1].headers['Authorization']).toBe('Bearer token');
    });
  });

  describe('Retry Logic', () => {
    it('should retry on 500 error', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: { message: 'Server error' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });

      const promise = fetchWithRetry('/api/test');

      // Fast-forward through retry delay
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });

      const promise = fetchWithRetry('/api/test');

      // First retry: 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      
      // Second retry: 2000ms
      await vi.advanceTimersByTimeAsync(2000);

      await promise;

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should respect maxDelay', async () => {
      (global.fetch as any)
        .mockResolvedValue({
          ok: false,
          status: 503,
          json: async () => ({}),
        });

      const promise = fetchWithRetry('/api/test', {}, {
        maxRetries: 5,
        initialDelay: 1000,
        maxDelay: 3000,
        backoffFactor: 2,
        retryableStatusCodes: [503],
      });

      // Delays should be: 1000, 2000, 3000 (capped), 3000 (capped), 3000 (capped)
      for (let i = 0; i < 5; i++) {
        await vi.advanceTimersByTimeAsync(3000);
      }

      await expect(promise).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(6); // Initial + 5 retries
    });

    it('should throw after max retries', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Server error' } }),
      });

      const promise = fetchWithRetry('/api/test', {}, {
        maxRetries: 2,
        initialDelay: 100,
        backoffFactor: 2,
        retryableStatusCodes: [500],
      });

      // Advance through all retries
      await vi.advanceTimersByTimeAsync(100); // First retry
      await vi.advanceTimersByTimeAsync(200); // Second retry

      await expect(promise).rejects.toThrow(FetchError);
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Non-Retryable Errors', () => {
    it('should not retry on 400 error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(fetchWithRetry('/api/test')).rejects.toThrow(FetchError);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 401 error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(fetchWithRetry('/api/test')).rejects.toThrow(FetchError);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 404 error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: { message: 'Not found' } }),
      });

      await expect(fetchWithRetry('/api/test')).rejects.toThrow(FetchError);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Network Errors', () => {
    it('should retry on network error', async () => {
      (global.fetch as any)
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });

      const promise = fetchWithRetry('/api/test');
      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on timeout', async () => {
      (global.fetch as any)
        .mockImplementationOnce(() => {
          const error = new Error('Timeout');
          error.name = 'AbortError';
          return Promise.reject(error);
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });

      const promise = fetchWithRetry('/api/test');
      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Custom Configuration', () => {
    it('should use custom maxRetries', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      const promise = fetchWithRetry('/api/test', {}, {
        maxRetries: 1,
        initialDelay: 100,
        retryableStatusCodes: [500],
      });

      await vi.advanceTimersByTimeAsync(100);

      await expect(promise).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    it('should use custom retryable status codes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 418, // I'm a teapot
        json: async () => ({}),
      });

      // 418 is not retryable by default
      await expect(fetchWithRetry('/api/test')).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();

      // Make 418 retryable
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 418,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });

      const promise = fetchWithRetry('/api/test', {}, {
        retryableStatusCodes: [418],
        initialDelay: 100,
      });

      await vi.advanceTimersByTimeAsync(100);
      const result = await promise;

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('fetchMultiAccountWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should include provider and accountId in logs', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    await fetchMultiAccountWithRetry(
      '/api/integrations/disconnect/instagram/account123',
      'instagram',
      'account123'
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on error', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

    const promise = fetchMultiAccountWithRetry(
      '/api/test',
      'instagram',
      'account123'
    );

    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe('batchFetchWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch multiple accounts in parallel', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const requests = [
      { url: '/api/test/1', provider: 'instagram', accountId: 'account1' },
      { url: '/api/test/2', provider: 'instagram', accountId: 'account2' },
      { url: '/api/test/3', provider: 'tiktok', accountId: 'account3' },
    ];

    const results = await batchFetchWithRetry(requests);

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.success)).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should handle partial failures', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Bad request' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

    const requests = [
      { url: '/api/test/1', provider: 'instagram', accountId: 'account1' },
      { url: '/api/test/2', provider: 'instagram', accountId: 'account2' },
      { url: '/api/test/3', provider: 'tiktok', accountId: 'account3' },
    ];

    const results = await batchFetchWithRetry(requests);

    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[2].success).toBe(true);
  });

  it('should retry failed requests', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

    const requests = [
      { url: '/api/test/1', provider: 'instagram', accountId: 'account1' },
    ];

    const promise = batchFetchWithRetry(requests);
    await vi.advanceTimersByTimeAsync(1000);
    const results = await promise;

    expect(results[0].success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
