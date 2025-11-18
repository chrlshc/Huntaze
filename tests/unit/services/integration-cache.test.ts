/**
 * Unit Tests: Integration Cache
 * 
 * Tests caching logic for integration status with TTL support.
 * Requirements: 10.1
 * 
 * Test Coverage:
 * - Cache hit/miss scenarios
 * - Cache invalidation
 * - TTL expiration
 * - Automatic cleanup
 * - Cache statistics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  integrationCache,
  getCachedIntegrations,
  CACHE_TTL,
} from '@/lib/services/integrations/cache';
import type { Integration } from '@/lib/services/integrations/types';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockIntegration1: Integration = {
  id: 1,
  provider: 'instagram',
  providerAccountId: '123456',
  isConnected: true,
  status: 'connected',
  expiresAt: new Date('2025-12-31T23:59:59Z'),
  metadata: { username: '@creator' },
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-15T00:00:00Z'),
};

const mockIntegration2: Integration = {
  id: 2,
  provider: 'tiktok',
  providerAccountId: '789012',
  isConnected: true,
  status: 'connected',
  expiresAt: new Date('2025-12-31T23:59:59Z'),
  metadata: { username: '@tiktoker' },
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-15T00:00:00Z'),
};

const mockIntegrations: Integration[] = [mockIntegration1, mockIntegration2];

// ============================================================================
// Test Suite
// ============================================================================

describe('IntegrationCache', () => {
  beforeEach(() => {
    // Clear cache before each test
    integrationCache.clear();
    
    // Reset timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers
    vi.useRealTimers();
  });

  // ==========================================================================
  // Cache Hit/Miss Scenarios
  // ==========================================================================

  describe('Cache Hit/Miss Scenarios', () => {
    it('should return null on cache miss', () => {
      const result = integrationCache.get(1);
      expect(result).toBeNull();
    });

    it('should return cached data on cache hit', () => {
      integrationCache.set(1, mockIntegrations);
      
      const result = integrationCache.get(1);
      
      expect(result).toEqual(mockIntegrations);
      expect(result).toHaveLength(2);
      expect(result![0].provider).toBe('instagram');
    });

    it('should handle multiple users independently', () => {
      const user1Integrations = [mockIntegration1];
      const user2Integrations = [mockIntegration2];
      
      integrationCache.set(1, user1Integrations);
      integrationCache.set(2, user2Integrations);
      
      expect(integrationCache.get(1)).toEqual(user1Integrations);
      expect(integrationCache.get(2)).toEqual(user2Integrations);
    });

    it('should return null for non-existent user', () => {
      integrationCache.set(1, mockIntegrations);
      
      expect(integrationCache.get(999)).toBeNull();
    });

    it('should handle empty integration arrays', () => {
      integrationCache.set(1, []);
      
      const result = integrationCache.get(1);
      
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should not share data between users', () => {
      integrationCache.set(1, [mockIntegration1]);
      integrationCache.set(2, [mockIntegration2]);
      
      const user1Data = integrationCache.get(1);
      const user2Data = integrationCache.get(2);
      
      expect(user1Data).not.toEqual(user2Data);
      expect(user1Data![0].provider).toBe('instagram');
      expect(user2Data![0].provider).toBe('tiktok');
    });
  });

  // ==========================================================================
  // Cache Invalidation
  // ==========================================================================

  describe('Cache Invalidation', () => {
    it('should invalidate cache for specific user', () => {
      integrationCache.set(1, mockIntegrations);
      integrationCache.set(2, [mockIntegration2]);
      
      integrationCache.invalidate(1);
      
      expect(integrationCache.get(1)).toBeNull();
      expect(integrationCache.get(2)).toEqual([mockIntegration2]);
    });

    it('should handle invalidation of non-existent user', () => {
      integrationCache.set(1, mockIntegrations);
      
      // Should not throw
      expect(() => integrationCache.invalidate(999)).not.toThrow();
      
      // Original cache should remain
      expect(integrationCache.get(1)).toEqual(mockIntegrations);
    });

    it('should clear all cache entries', () => {
      integrationCache.set(1, [mockIntegration1]);
      integrationCache.set(2, [mockIntegration2]);
      integrationCache.set(3, mockIntegrations);
      
      integrationCache.clear();
      
      expect(integrationCache.get(1)).toBeNull();
      expect(integrationCache.get(2)).toBeNull();
      expect(integrationCache.get(3)).toBeNull();
      expect(integrationCache.size()).toBe(0);
    });

    it('should allow re-caching after invalidation', () => {
      integrationCache.set(1, [mockIntegration1]);
      integrationCache.invalidate(1);
      integrationCache.set(1, [mockIntegration2]);
      
      const result = integrationCache.get(1);
      
      expect(result).toEqual([mockIntegration2]);
      expect(result![0].provider).toBe('tiktok');
    });
  });

  // ==========================================================================
  // TTL Expiration
  // ==========================================================================

  describe('TTL Expiration', () => {
    it('should return null when cache entry expires', () => {
      integrationCache.set(1, mockIntegrations);
      
      // Fast-forward time past TTL (5 minutes + 1ms)
      vi.advanceTimersByTime(CACHE_TTL + 1);
      
      const result = integrationCache.get(1);
      
      expect(result).toBeNull();
    });

    it('should return cached data before TTL expires', () => {
      integrationCache.set(1, mockIntegrations);
      
      // Fast-forward time to just before TTL (5 minutes - 1ms)
      vi.advanceTimersByTime(CACHE_TTL - 1);
      
      const result = integrationCache.get(1);
      
      expect(result).toEqual(mockIntegrations);
    });

    it('should respect custom TTL', () => {
      const customTTL = 60 * 1000; // 1 minute
      integrationCache.set(1, mockIntegrations, customTTL);
      
      // Fast-forward to just before custom TTL
      vi.advanceTimersByTime(customTTL - 1);
      expect(integrationCache.get(1)).toEqual(mockIntegrations);
      
      // Fast-forward past custom TTL
      vi.advanceTimersByTime(2);
      expect(integrationCache.get(1)).toBeNull();
    });

    it('should handle zero TTL', () => {
      integrationCache.set(1, mockIntegrations, 0);
      
      // Should expire immediately
      const result = integrationCache.get(1);
      
      expect(result).toBeNull();
    });

    it('should remove expired entry from cache on access', () => {
      integrationCache.set(1, mockIntegrations);
      
      expect(integrationCache.size()).toBe(1);
      
      // Fast-forward past TTL
      vi.advanceTimersByTime(CACHE_TTL + 1);
      
      // Access should remove expired entry
      integrationCache.get(1);
      
      expect(integrationCache.size()).toBe(0);
    });

    it('should handle multiple entries with different expiry times', () => {
      integrationCache.set(1, [mockIntegration1], 60 * 1000); // 1 minute
      integrationCache.set(2, [mockIntegration2], 120 * 1000); // 2 minutes
      
      // Fast-forward 90 seconds
      vi.advanceTimersByTime(90 * 1000);
      
      expect(integrationCache.get(1)).toBeNull(); // Expired
      expect(integrationCache.get(2)).toEqual([mockIntegration2]); // Still valid
    });
  });

  // ==========================================================================
  // Cache Statistics
  // ==========================================================================

  describe('Cache Statistics', () => {
    it('should return correct cache size', () => {
      expect(integrationCache.size()).toBe(0);
      
      integrationCache.set(1, mockIntegrations);
      expect(integrationCache.size()).toBe(1);
      
      integrationCache.set(2, [mockIntegration2]);
      expect(integrationCache.size()).toBe(2);
    });

    it('should return correct cache statistics', () => {
      integrationCache.set(1, [mockIntegration1], 60 * 1000);
      integrationCache.set(2, [mockIntegration2], 120 * 1000);
      
      // Fast-forward 90 seconds (first entry expired)
      vi.advanceTimersByTime(90 * 1000);
      
      const stats = integrationCache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.expired).toBe(1);
      expect(stats.active).toBe(1);
    });

    it('should return zero stats for empty cache', () => {
      const stats = integrationCache.getStats();
      
      expect(stats.size).toBe(0);
      expect(stats.expired).toBe(0);
      expect(stats.active).toBe(0);
    });

    it('should track time to expiry', () => {
      integrationCache.set(1, mockIntegrations);
      
      const ttl = integrationCache.getTimeToExpiry(1);
      
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(CACHE_TTL);
    });

    it('should return null for time to expiry on cache miss', () => {
      const ttl = integrationCache.getTimeToExpiry(999);
      
      expect(ttl).toBeNull();
    });

    it('should return zero for expired entries', () => {
      integrationCache.set(1, mockIntegrations);
      
      // Fast-forward past TTL
      vi.advanceTimersByTime(CACHE_TTL + 1);
      
      const ttl = integrationCache.getTimeToExpiry(1);
      
      expect(ttl).toBe(0);
    });
  });

  // ==========================================================================
  // has() Method
  // ==========================================================================

  describe('has() Method', () => {
    it('should return false for cache miss', () => {
      expect(integrationCache.has(1)).toBe(false);
    });

    it('should return true for cache hit', () => {
      integrationCache.set(1, mockIntegrations);
      
      expect(integrationCache.has(1)).toBe(true);
    });

    it('should return false for expired entry', () => {
      integrationCache.set(1, mockIntegrations);
      
      // Fast-forward past TTL
      vi.advanceTimersByTime(CACHE_TTL + 1);
      
      expect(integrationCache.has(1)).toBe(false);
    });

    it('should remove expired entry when checking', () => {
      integrationCache.set(1, mockIntegrations);
      
      expect(integrationCache.size()).toBe(1);
      
      // Fast-forward past TTL
      vi.advanceTimersByTime(CACHE_TTL + 1);
      
      integrationCache.has(1);
      
      expect(integrationCache.size()).toBe(0);
    });
  });

  // ==========================================================================
  // Automatic Cleanup
  // ==========================================================================

  describe('Automatic Cleanup', () => {
    it('should clean up expired entries', () => {
      integrationCache.set(1, [mockIntegration1], 60 * 1000);
      integrationCache.set(2, [mockIntegration2], 120 * 1000);
      
      expect(integrationCache.size()).toBe(2);
      
      // Fast-forward 90 seconds (first entry expired)
      vi.advanceTimersByTime(90 * 1000);
      
      const removed = integrationCache.cleanupExpired();
      
      expect(removed).toBe(1);
      expect(integrationCache.size()).toBe(1);
      expect(integrationCache.get(1)).toBeNull();
      expect(integrationCache.get(2)).toEqual([mockIntegration2]);
    });

    it('should return zero when no entries to clean', () => {
      integrationCache.set(1, mockIntegrations);
      
      const removed = integrationCache.cleanupExpired();
      
      expect(removed).toBe(0);
      expect(integrationCache.size()).toBe(1);
    });

    it('should handle cleanup of empty cache', () => {
      const removed = integrationCache.cleanupExpired();
      
      expect(removed).toBe(0);
    });
  });

  // ==========================================================================
  // getCachedIntegrations Helper
  // ==========================================================================

  describe('getCachedIntegrations Helper', () => {
    it('should return cached data on cache hit', async () => {
      integrationCache.set(1, mockIntegrations);
      
      const fetchFn = vi.fn();
      
      const result = await getCachedIntegrations(1, fetchFn);
      
      expect(result).toEqual(mockIntegrations);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache on cache miss', async () => {
      const fetchFn = vi.fn().mockResolvedValue(mockIntegrations);
      
      const result = await getCachedIntegrations(1, fetchFn);
      
      expect(result).toEqual(mockIntegrations);
      expect(fetchFn).toHaveBeenCalledOnce();
      
      // Verify data was cached
      expect(integrationCache.get(1)).toEqual(mockIntegrations);
    });

    it('should fetch fresh data after cache expiry', async () => {
      const fetchFn = vi.fn().mockResolvedValue(mockIntegrations);
      
      // First call - cache miss
      await getCachedIntegrations(1, fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      
      // Second call - cache hit
      await getCachedIntegrations(1, fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      
      // Fast-forward past TTL
      vi.advanceTimersByTime(CACHE_TTL + 1);
      
      // Third call - cache expired, should fetch again
      await getCachedIntegrations(1, fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it('should propagate fetch errors', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('Fetch failed'));
      
      await expect(getCachedIntegrations(1, fetchFn)).rejects.toThrow('Fetch failed');
    });

    it('should handle empty results', async () => {
      const fetchFn = vi.fn().mockResolvedValue([]);
      
      const result = await getCachedIntegrations(1, fetchFn);
      
      expect(result).toEqual([]);
      expect(integrationCache.get(1)).toEqual([]);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle negative user IDs', () => {
      integrationCache.set(-1, mockIntegrations);
      
      expect(integrationCache.get(-1)).toEqual(mockIntegrations);
    });

    it('should handle very large user IDs', () => {
      const largeUserId = Number.MAX_SAFE_INTEGER;
      integrationCache.set(largeUserId, mockIntegrations);
      
      expect(integrationCache.get(largeUserId)).toEqual(mockIntegrations);
    });

    it('should handle rapid cache updates', () => {
      integrationCache.set(1, [mockIntegration1]);
      integrationCache.set(1, [mockIntegration2]);
      integrationCache.set(1, mockIntegrations);
      
      const result = integrationCache.get(1);
      
      expect(result).toEqual(mockIntegrations);
      expect(result).toHaveLength(2);
    });

    it('should handle large number of users', () => {
      const userCount = 1000;
      
      for (let i = 1; i <= userCount; i++) {
        integrationCache.set(i, [mockIntegration1]);
      }
      
      expect(integrationCache.size()).toBe(userCount);
      
      // Verify random samples
      expect(integrationCache.get(1)).toEqual([mockIntegration1]);
      expect(integrationCache.get(500)).toEqual([mockIntegration1]);
      expect(integrationCache.get(1000)).toEqual([mockIntegration1]);
    });

    it('should handle concurrent access patterns', async () => {
      const fetchFn = vi.fn().mockResolvedValue(mockIntegrations);
      
      // Simulate concurrent requests
      const promises = [
        getCachedIntegrations(1, fetchFn),
        getCachedIntegrations(1, fetchFn),
        getCachedIntegrations(1, fetchFn),
      ];
      
      const results = await Promise.all(promises);
      
      // All should return same data
      results.forEach(result => {
        expect(result).toEqual(mockIntegrations);
      });
      
      // Fetch should be called multiple times (no locking)
      // This is expected behavior for simple cache
      expect(fetchFn).toHaveBeenCalled();
    });
  });
});
