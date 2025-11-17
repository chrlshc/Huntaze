/**
 * API Client - Unit Tests
 * 
 * Tests for the API client with:
 * - Retry logic
 * - Caching
 * - Request deduplication
 * - Error handling
 * - Timeout support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, clearCache } from '@/lib/api/client/api-client';
import { retryWithBackoff, isRetryableError, createApiError, ErrorCodes } from '@/lib/api/utils/errors';

// Mock fetch
global.fetch = vi.fn();

describe('API Client', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient('https://api.example.com');
    clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Requests', () => {
    it('should make GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockData }),
      });

      const response = await client.get('/users');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(response.data).toEqual(mockData);
    });

    it('should make POST request', async () => {
      const postData = { name: 'New User' };
      const mockResponse = { id: 1, ...postData };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: mockResponse }),
      });

      const response = await client.post('/users', postData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
      expect(response.data).toEqual(mockResponse);
    });

    it('should make PUT request', async () => {
      const updateData = { name: 'Updated User' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: updateData }),
      });

      await client.put('/users/1', updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    it('should make DELETE request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({ success: true }),
      });

      await client.delete('/users/1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error on HTTP error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Resource not found',
          },
        }),
      });

      await expect(client.get('/users/999')).rejects.toThrow();
    });

    it('should include correlation ID in errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'Server error',
          },
        }),
      });

      try {
        await client.get('/users');
      } catch (error: any) {
        expect(error.correlationId).toBeDefined();
      }
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(client.get('/users')).rejects.toThrow();
    });
  });

  describe('Retry Logic', () => {
    it('should retry on retryable error', async () => {
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: 'success' }),
        });

      const response = await client.get('/users', {
        retry: {
          maxRetries: 3,
          initialDelay: 10,
        },
      });

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(response.data).toBe('success');
    });

    it('should not retry on non-retryable error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Invalid input',
          },
        }),
      });

      await expect(client.get('/users')).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should respect maxRetries', async () => {
      (global.fetch as any).mockRejectedValue(new Error('ETIMEDOUT'));

      await expect(
        client.get('/users', {
          retry: {
            maxRetries: 2,
            initialDelay: 10,
          },
        })
      ).rejects.toThrow();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Caching', () => {
    it('should cache GET requests', async () => {
      const mockData = { id: 1, name: 'Test' };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockData }),
      });

      // First request
      await client.get('/users', { cache: true });

      // Second request (should use cache)
      await client.get('/users', { cache: true });

      // Only one fetch call
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should not cache POST requests', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ success: true }),
      });

      await client.post('/users', { name: 'Test' });
      await client.post('/users', { name: 'Test' });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should respect cache TTL', async () => {
      vi.useFakeTimers();

      const mockData = { id: 1, name: 'Test' };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockData }),
      });

      // First request
      await client.get('/users', { cache: true, cacheTTL: 1000 });

      // Advance time past TTL
      vi.advanceTimersByTime(1001);

      // Second request (cache expired)
      await client.get('/users', { cache: true, cacheTTL: 1000 });

      expect(global.fetch).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should clear cache manually', async () => {
      const mockData = { id: 1, name: 'Test' };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockData }),
      });

      await client.get('/users', { cache: true });

      clearCache();

      await client.get('/users', { cache: true });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Request Deduplication', () => {
    it('should deduplicate concurrent GET requests', async () => {
      const mockData = { id: 1, name: 'Test' };

      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({ success: true, data: mockData }),
                }),
              100
            )
          )
      );

      // Make 3 concurrent requests
      const [r1, r2, r3] = await Promise.all([
        client.get('/users'),
        client.get('/users'),
        client.get('/users'),
      ]);

      // Only one fetch call
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(r1.data).toEqual(mockData);
      expect(r2.data).toEqual(mockData);
      expect(r3.data).toEqual(mockData);
    });
  });

  describe('Timeout', () => {
    it('should timeout after specified duration', async () => {
      vi.useFakeTimers();

      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ ok: true }), 10000);
          })
      );

      const promise = client.get('/users', { timeout: 1000 });

      vi.advanceTimersByTime(1001);

      await expect(promise).rejects.toThrow('timeout');

      vi.useRealTimers();
    });
  });

  describe('Headers', () => {
    it('should include default headers', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await client.get('/users');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Correlation-Id': expect.any(String),
          }),
        })
      );
    });

    it('should merge custom headers', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await client.get('/users', {
        headers: {
          'X-Custom-Header': 'value',
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'value',
          }),
        })
      );
    });
  });
});

describe('Retry Utilities', () => {
  describe('isRetryableError', () => {
    it('should identify retryable network errors', () => {
      expect(isRetryableError({ code: 'ECONNREFUSED' })).toBe(true);
      expect(isRetryableError({ code: 'ETIMEDOUT' })).toBe(true);
      expect(isRetryableError({ code: 'ENOTFOUND' })).toBe(true);
      expect(isRetryableError({ code: 'ENETUNREACH' })).toBe(true);
    });

    it('should identify retryable Prisma errors', () => {
      expect(isRetryableError({ code: 'P2024' })).toBe(true);
      expect(isRetryableError({ code: 'P2034' })).toBe(true);
    });

    it('should not identify non-retryable errors', () => {
      expect(isRetryableError({ code: 'VALIDATION_ERROR' })).toBe(false);
      expect(isRetryableError({ message: 'Invalid input' })).toBe(false);
      expect(isRetryableError(null)).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    it('should retry with exponential backoff', async () => {
      vi.useFakeTimers();

      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelay: 100,
        backoffFactor: 2,
      });

      // First attempt fails immediately
      await vi.advanceTimersByTimeAsync(0);

      // Wait for first retry (100ms)
      await vi.advanceTimersByTimeAsync(100);

      // Wait for second retry (200ms)
      await vi.advanceTimersByTimeAsync(200);

      const result = await promise;

      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(result).toBe('success');

      vi.useRealTimers();
    });

    it('should respect maxDelay', async () => {
      vi.useFakeTimers();

      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 1500,
        backoffFactor: 2,
      });

      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000); // First retry
      await vi.advanceTimersByTimeAsync(1500); // Second retry (capped at maxDelay)

      await promise;

      vi.useRealTimers();
    });

    it('should throw after max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('ETIMEDOUT'));

      await expect(
        retryWithBackoff(mockFn, {
          maxRetries: 2,
          initialDelay: 10,
        })
      ).rejects.toThrow('ETIMEDOUT');

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('createApiError', () => {
    it('should create ApiError with correct properties', () => {
      const error = createApiError(
        ErrorCodes.NOT_FOUND,
        'Resource not found',
        404,
        { id: '123' }
      );

      expect(error.code).toBe(ErrorCodes.NOT_FOUND);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual({ id: '123' });
      expect(error.correlationId).toBeDefined();
    });

    it('should accept custom correlation ID', () => {
      const correlationId = 'custom-id-123';
      const error = createApiError(
        ErrorCodes.INTERNAL_ERROR,
        'Error',
        500,
        undefined,
        correlationId
      );

      expect(error.correlationId).toBe(correlationId);
    });
  });
});
