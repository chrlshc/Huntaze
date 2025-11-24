/**
 * Integrations Service Unit Tests
 * 
 * Tests for error handling, retry strategies, and token management
 * 
 * Requirements: 11.1, 11.2, 11.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntegrationsService } from '@/lib/services/integrations/integrations.service';
import type { Provider, IntegrationsServiceError } from '@/lib/services/integrations/types';

// Mock dependencies
vi.mock('@prisma/client');
vi.mock('@/lib/services/integrations/encryption');
vi.mock('@/lib/services/integrations/csrf-protection');
vi.mock('@/lib/services/integrations/audit-logger');
vi.mock('@/lib/services/integrations/cache');

describe('IntegrationsService', () => {
  let service: IntegrationsService;

  beforeEach(() => {
    service = new IntegrationsService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should create typed error with metadata', () => {
      const error = (service as any).createError(
        'OAUTH_INIT_ERROR',
        'Test error',
        'instagram' as Provider,
        { test: 'metadata' }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('OAUTH_INIT_ERROR');
      expect(error.provider).toBe('instagram');
      expect(error.retryable).toBe(false);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.correlationId).toMatch(/^int-\d+-[a-z0-9]+$/);
      expect(error.metadata).toEqual({ test: 'metadata' });
    });

    it('should mark network errors as retryable', () => {
      const error = (service as any).createError(
        'NETWORK_ERROR',
        'Network failed',
        'instagram' as Provider
      );

      expect(error.retryable).toBe(true);
    });

    it('should mark API errors as retryable', () => {
      const error = (service as any).createError(
        'API_ERROR',
        'API failed',
        'tiktok' as Provider
      );

      expect(error.retryable).toBe(true);
    });

    it('should mark validation errors as non-retryable', () => {
      const error = (service as any).createError(
        'INVALID_STATE',
        'Invalid state',
        'reddit' as Provider
      );

      expect(error.retryable).toBe(false);
    });
  });

  // ============================================================================
  // Retry Strategy Tests
  // ============================================================================

  describe('Retry Strategy', () => {
    it('should retry on network errors', async () => {
      let attempts = 0;
      const mockFn = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('ECONNREFUSED');
          (error as any).code = 'ECONNREFUSED';
          throw error;
        }
        return 'success';
      });

      const result = await (service as any).retryWithBackoff(
        mockFn,
        3,
        'Test operation',
        'test-correlation-id'
      );

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should retry on 503 Service Unavailable', async () => {
      let attempts = 0;
      const mockFn = vi.fn(async () => {
        attempts++;
        if (attempts < 2) {
          const error = new Error('Service Unavailable');
          (error as any).status = 503;
          throw error;
        }
        return 'success';
      });

      const result = await (service as any).retryWithBackoff(
        mockFn,
        3,
        'Test operation',
        'test-correlation-id'
      );

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry on 429 Rate Limit', async () => {
      let attempts = 0;
      const mockFn = vi.fn(async () => {
        attempts++;
        if (attempts < 2) {
          const error = new Error('Rate Limited');
          (error as any).status = 429;
          throw error;
        }
        return 'success';
      });

      const result = await (service as any).retryWithBackoff(
        mockFn,
        3,
        'Test operation',
        'test-correlation-id'
      );

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on validation errors', async () => {
      const mockFn = vi.fn(async () => {
        throw new Error('Invalid input');
      });

      await expect(
        (service as any).retryWithBackoff(
          mockFn,
          3,
          'Test operation',
          'test-correlation-id'
        )
      ).rejects.toThrow('Invalid input');

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries', async () => {
      const mockFn = vi.fn(async () => {
        const error = new Error('ETIMEDOUT');
        (error as any).code = 'ETIMEDOUT';
        throw error;
      });

      await expect(
        (service as any).retryWithBackoff(
          mockFn,
          3,
          'Test operation',
          'test-correlation-id'
        )
      ).rejects.toThrow('ETIMEDOUT');

      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should apply exponential backoff', async () => {
      const delays: number[] = [];
      let attempts = 0;

      const mockFn = vi.fn(async () => {
        attempts++;
        if (attempts < 4) {
          const error = new Error('ECONNREFUSED');
          (error as any).code = 'ECONNREFUSED';
          throw error;
        }
        return 'success';
      });

      // Mock setTimeout to capture delays
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: any, delay: number) => {
        delays.push(delay);
        return originalSetTimeout(fn, 0);
      }) as any;

      await (service as any).retryWithBackoff(
        mockFn,
        4,
        'Test operation',
        'test-correlation-id'
      );

      global.setTimeout = originalSetTimeout;

      // Verify exponential backoff pattern
      expect(delays.length).toBe(3); // 3 retries = 3 delays
      expect(delays[0]).toBeGreaterThanOrEqual(100); // First retry: ~100ms
      expect(delays[0]).toBeLessThan(300);
      expect(delays[1]).toBeGreaterThanOrEqual(200); // Second retry: ~200ms
      expect(delays[1]).toBeLessThan(400);
      expect(delays[2]).toBeGreaterThanOrEqual(400); // Third retry: ~400ms
      expect(delays[2]).toBeLessThan(600);
    });
  });

  // ============================================================================
  // Token Management Tests
  // ============================================================================

  describe('Token Management', () => {
    it('should detect expired tokens', () => {
      const expiredDate = new Date(Date.now() - 1000);
      expect(service.isTokenExpired(expiredDate)).toBe(true);
    });

    it('should detect valid tokens', () => {
      const futureDate = new Date(Date.now() + 3600000);
      expect(service.isTokenExpired(futureDate)).toBe(false);
    });

    it('should handle null expiry dates', () => {
      expect(service.isTokenExpired(null)).toBe(false);
    });

    it('should detect tokens needing refresh', () => {
      // Token expires in 4 minutes (should refresh)
      const soonExpiry = new Date(Date.now() + 4 * 60 * 1000);
      expect(service.shouldRefreshToken(soonExpiry)).toBe(true);
    });

    it('should not refresh tokens with long validity', () => {
      // Token expires in 1 hour (no refresh needed)
      const longExpiry = new Date(Date.now() + 3600000);
      expect(service.shouldRefreshToken(longExpiry)).toBe(false);
    });

    it('should handle null expiry in shouldRefreshToken', () => {
      expect(service.shouldRefreshToken(null)).toBe(false);
    });
  });

  // ============================================================================
  // Provider Validation Tests
  // ============================================================================

  describe('Provider Validation', () => {
    it('should accept valid providers', () => {
      const validProviders: Provider[] = ['instagram', 'tiktok', 'reddit', 'onlyfans'];
      
      validProviders.forEach(provider => {
        expect(() => {
          (service as any).getAdapter(provider);
        }).not.toThrow();
      });
    });

    it('should reject invalid providers', () => {
      expect(() => {
        (service as any).getAdapter('invalid' as Provider);
      }).toThrow('Unsupported provider: invalid');
    });
  });

  // ============================================================================
  // Correlation ID Tests
  // ============================================================================

  describe('Correlation IDs', () => {
    it('should generate unique correlation IDs', () => {
      const error1 = (service as any).createError('TEST_ERROR', 'Test 1');
      const error2 = (service as any).createError('TEST_ERROR', 'Test 2');

      expect(error1.correlationId).toBeDefined();
      expect(error2.correlationId).toBeDefined();
      expect(error1.correlationId).not.toBe(error2.correlationId);
    });

    it('should use consistent correlation ID format', () => {
      const error = (service as any).createError('TEST_ERROR', 'Test');
      
      expect(error.correlationId).toMatch(/^int-\d+-[a-z0-9]+$/);
    });
  });

  // ============================================================================
  // Type Safety Tests
  // ============================================================================

  describe('Type Safety', () => {
    it('should return typed errors', () => {
      const error = (service as any).createError(
        'OAUTH_INIT_ERROR',
        'Test error',
        'instagram' as Provider
      ) as IntegrationsServiceError;

      // TypeScript should recognize these properties
      expect(error.code).toBeDefined();
      expect(error.provider).toBeDefined();
      expect(error.retryable).toBeDefined();
      expect(error.timestamp).toBeDefined();
      expect(error.correlationId).toBeDefined();
    });
  });

  // ============================================================================
  // Batch Processing Tests
  // ============================================================================

  describe('Batch Processing', () => {
    it('should process requests in batches', async () => {
      // Mock refreshToken to track calls
      const refreshTokenSpy = vi.spyOn(service as any, 'refreshToken')
        .mockResolvedValue({
          provider: 'instagram',
          providerAccountId: '123',
          isConnected: true,
          status: 'connected',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const requests = Array(12).fill(null).map((_, i) => ({
        provider: 'instagram' as Provider,
        accountId: `account-${i}`,
      }));

      await service.batchRefreshTokens(requests);

      // Should be called 12 times (all requests)
      expect(refreshTokenSpy).toHaveBeenCalledTimes(12);
    });

    it('should handle partial failures in batch', async () => {
      let callCount = 0;
      vi.spyOn(service as any, 'refreshToken').mockImplementation(async () => {
        callCount++;
        if (callCount % 2 === 0) {
          throw new Error('Refresh failed');
        }
        return {
          provider: 'instagram',
          providerAccountId: '123',
          isConnected: true,
          status: 'connected',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      const requests = Array(4).fill(null).map((_, i) => ({
        provider: 'instagram' as Provider,
        accountId: `account-${i}`,
      }));

      const results = await service.batchRefreshTokens(requests);

      // Should return only successful results (2 out of 4)
      expect(results).toHaveLength(2);
    });
  });
});
