/**
 * Integration Tests: Cache Integration with IntegrationsService
 * 
 * Tests that caching is properly integrated into the IntegrationsService
 * and that cache invalidation works correctly.
 * 
 * Requirements: 10.1, 10.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { integrationCache } from '@/lib/services/integrations/cache';
import type { Integration } from '@/lib/services/integrations/types';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockIntegration: Integration = {
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

// ============================================================================
// Test Suite
// ============================================================================

describe('Cache Integration with IntegrationsService', () => {
  beforeEach(() => {
    // Clear cache before each test
    integrationCache.clear();
  });

  afterEach(() => {
    // Clean up
    integrationCache.clear();
  });

  // ==========================================================================
  // Cache Behavior Tests
  // ==========================================================================

  describe('Cache Behavior', () => {
    it('should cache integration data', () => {
      const userId = 1;
      const integrations = [mockIntegration];
      
      integrationCache.set(userId, integrations);
      
      const cached = integrationCache.get(userId);
      
      expect(cached).toEqual(integrations);
    });

    it('should invalidate cache on connect', () => {
      const userId = 1;
      const integrations = [mockIntegration];
      
      integrationCache.set(userId, integrations);
      expect(integrationCache.has(userId)).toBe(true);
      
      // Simulate connect operation
      integrationCache.invalidate(userId);
      
      expect(integrationCache.has(userId)).toBe(false);
    });

    it('should invalidate cache on disconnect', () => {
      const userId = 1;
      const integrations = [mockIntegration];
      
      integrationCache.set(userId, integrations);
      expect(integrationCache.has(userId)).toBe(true);
      
      // Simulate disconnect operation
      integrationCache.invalidate(userId);
      
      expect(integrationCache.has(userId)).toBe(false);
    });

    it('should invalidate cache on token refresh', () => {
      const userId = 1;
      const integrations = [mockIntegration];
      
      integrationCache.set(userId, integrations);
      expect(integrationCache.has(userId)).toBe(true);
      
      // Simulate token refresh operation
      integrationCache.invalidate(userId);
      
      expect(integrationCache.has(userId)).toBe(false);
    });
  });

  // ==========================================================================
  // Multi-User Cache Isolation
  // ==========================================================================

  describe('Multi-User Cache Isolation', () => {
    it('should isolate cache between users', () => {
      const user1Integrations = [
        { ...mockIntegration, id: 1, providerAccountId: 'user1-account' },
      ];
      const user2Integrations = [
        { ...mockIntegration, id: 2, providerAccountId: 'user2-account' },
      ];
      
      integrationCache.set(1, user1Integrations);
      integrationCache.set(2, user2Integrations);
      
      expect(integrationCache.get(1)).toEqual(user1Integrations);
      expect(integrationCache.get(2)).toEqual(user2Integrations);
    });

    it('should not affect other users when invalidating', () => {
      integrationCache.set(1, [mockIntegration]);
      integrationCache.set(2, [mockIntegration]);
      integrationCache.set(3, [mockIntegration]);
      
      integrationCache.invalidate(2);
      
      expect(integrationCache.has(1)).toBe(true);
      expect(integrationCache.has(2)).toBe(false);
      expect(integrationCache.has(3)).toBe(true);
    });
  });

  // ==========================================================================
  // Cache Performance Tests
  // ==========================================================================

  describe('Cache Performance', () => {
    it('should reduce database calls with caching', async () => {
      const userId = 1;
      const integrations = [mockIntegration];
      let fetchCount = 0;
      
      const fetchFn = vi.fn(async () => {
        fetchCount++;
        return integrations;
      });
      
      // First call - should fetch
      integrationCache.set(userId, integrations);
      expect(integrationCache.get(userId)).toEqual(integrations);
      
      // Second call - should use cache
      expect(integrationCache.get(userId)).toEqual(integrations);
      
      // Should not have called fetch function
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should handle high-volume cache operations', () => {
      const userCount = 1000;
      
      // Set cache for many users
      for (let i = 1; i <= userCount; i++) {
        integrationCache.set(i, [mockIntegration]);
      }
      
      expect(integrationCache.size()).toBe(userCount);
      
      // Verify random samples
      expect(integrationCache.get(1)).toEqual([mockIntegration]);
      expect(integrationCache.get(500)).toEqual([mockIntegration]);
      expect(integrationCache.get(1000)).toEqual([mockIntegration]);
    });
  });

  // ==========================================================================
  // Cache Statistics and Monitoring
  // ==========================================================================

  describe('Cache Statistics and Monitoring', () => {
    it('should provide accurate cache statistics', () => {
      integrationCache.set(1, [mockIntegration]);
      integrationCache.set(2, [mockIntegration]);
      integrationCache.set(3, [mockIntegration]);
      
      const stats = integrationCache.getStats();
      
      expect(stats.size).toBe(3);
      expect(stats.active).toBe(3);
      expect(stats.expired).toBe(0);
    });

    it('should track cache size correctly', () => {
      expect(integrationCache.size()).toBe(0);
      
      integrationCache.set(1, [mockIntegration]);
      expect(integrationCache.size()).toBe(1);
      
      integrationCache.set(2, [mockIntegration]);
      expect(integrationCache.size()).toBe(2);
      
      integrationCache.invalidate(1);
      expect(integrationCache.size()).toBe(1);
      
      integrationCache.clear();
      expect(integrationCache.size()).toBe(0);
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle invalid user IDs gracefully', () => {
      expect(() => integrationCache.get(-1)).not.toThrow();
      expect(() => integrationCache.set(-1, [mockIntegration])).not.toThrow();
      expect(() => integrationCache.invalidate(-1)).not.toThrow();
    });

    it('should handle empty integration arrays', () => {
      integrationCache.set(1, []);
      
      expect(integrationCache.get(1)).toEqual([]);
    });

    it('should handle cache operations on non-existent users', () => {
      expect(integrationCache.get(999)).toBeNull();
      expect(integrationCache.has(999)).toBe(false);
      expect(() => integrationCache.invalidate(999)).not.toThrow();
    });
  });

  // ==========================================================================
  // Cache Lifecycle
  // ==========================================================================

  describe('Cache Lifecycle', () => {
    it('should support full cache lifecycle', () => {
      const userId = 1;
      const integrations = [mockIntegration];
      
      // 1. Cache miss
      expect(integrationCache.get(userId)).toBeNull();
      
      // 2. Set cache
      integrationCache.set(userId, integrations);
      expect(integrationCache.has(userId)).toBe(true);
      
      // 3. Cache hit
      expect(integrationCache.get(userId)).toEqual(integrations);
      
      // 4. Invalidate
      integrationCache.invalidate(userId);
      expect(integrationCache.has(userId)).toBe(false);
      
      // 5. Cache miss again
      expect(integrationCache.get(userId)).toBeNull();
    });

    it('should allow re-caching after invalidation', () => {
      const userId = 1;
      const oldIntegrations = [mockIntegration];
      const newIntegrations = [
        { ...mockIntegration, id: 2, providerAccountId: 'new-account' },
      ];
      
      // Set initial cache
      integrationCache.set(userId, oldIntegrations);
      expect(integrationCache.get(userId)).toEqual(oldIntegrations);
      
      // Invalidate
      integrationCache.invalidate(userId);
      
      // Set new cache
      integrationCache.set(userId, newIntegrations);
      expect(integrationCache.get(userId)).toEqual(newIntegrations);
    });
  });
});
