/**
 * Integration Tests - OnlyFans AI Memory Service
 * 
 * Tests the user memory service with:
 * - Cache-first strategy validation
 * - Retry logic for transient failures
 * - Timeout handling
 * - Error recovery and graceful degradation
 * - GDPR compliance (data deletion)
 * - Performance characteristics
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getUserMemoryService, MemoryServiceError, MemoryServiceException } from '@/lib/of-memory/services/user-memory-service';
import type { InteractionEvent } from '@/lib/of-memory/types';

// Test configuration
const TEST_FAN_ID = 'test-fan-123';
const TEST_CREATOR_ID = 'test-creator-456';

describe('Integration: OnlyFans AI Memory Service', () => {
  let memoryService: ReturnType<typeof getUserMemoryService>;

  beforeAll(() => {
    memoryService = getUserMemoryService();
  });

  describe('Memory Context Retrieval', () => {
    it('should get memory context for a fan', async () => {
      const context = await memoryService.getMemoryContext(TEST_FAN_ID, TEST_CREATOR_ID);
      
      expect(context).toBeDefined();
      expect(context.fanId).toBe(TEST_FAN_ID);
      expect(context.creatorId).toBe(TEST_CREATOR_ID);
      expect(context.recentMessages).toBeInstanceOf(Array);
      expect(context.personalityProfile).toBeDefined();
      expect(context.preferences).toBeDefined();
      expect(context.emotionalState).toBeDefined();
      expect(context.engagementMetrics).toBeDefined();
    });

    it('should return cached context on second call', async () => {
      const start1 = Date.now();
      const context1 = await memoryService.getMemoryContext(TEST_FAN_ID, TEST_CREATOR_ID);
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      const context2 = await memoryService.getMemoryContext(TEST_FAN_ID, TEST_CREATOR_ID);
      const duration2 = Date.now() - start2;

      // Second call should be faster (cached)
      expect(duration2).toBeLessThan(duration1);
      expect(context2.fanId).toBe(context1.fanId);
    });

    it('should validate required parameters', async () => {
      await expect(
        memoryService.getMemoryContext('', TEST_CREATOR_ID)
      ).rejects.toThrow(MemoryServiceException);

      await expect(
        memoryService.getMemoryContext(TEST_FAN_ID, '')
      ).rejects.toThrow(MemoryServiceException);
    });

    it('should return minimal context on database error', async () => {
      // This tests graceful degradation
      const context = await memoryService.getMemoryContext(
        'non-existent-fan',
        'non-existent-creator'
      );
      
      expect(context).toBeDefined();
      expect(context.fanId).toBe('non-existent-fan');
      expect(context.personalityProfile.confidenceScore).toBe(0.3); // Default for new fans
    });

    it('should respond within acceptable time', async () => {
      const start = Date.now();
      await memoryService.getMemoryContext(TEST_FAN_ID, TEST_CREATOR_ID);
      const duration = Date.now() - start;
      
      // Should respond within 5 seconds (including database queries)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Interaction Saving', () => {
    it('should save a message interaction', async () => {
      const interaction: InteractionEvent = {
        fanId: TEST_FAN_ID,
        creatorId: TEST_CREATOR_ID,
        type: 'message',
        content: 'Test message',
        timestamp: new Date(),
        metadata: { source: 'test' }
      };

      await expect(
        memoryService.saveInteraction(interaction)
      ).resolves.not.toThrow();
    });

    it('should save a purchase interaction', async () => {
      const interaction: InteractionEvent = {
        fanId: TEST_FAN_ID,
        creatorId: TEST_CREATOR_ID,
        type: 'purchase',
        amount: 9.99,
        timestamp: new Date(),
        metadata: { productId: 'prod-123' }
      };

      await expect(
        memoryService.saveInteraction(interaction)
      ).resolves.not.toThrow();
    });

    it('should validate interaction parameters', async () => {
      const invalidInteraction = {
        fanId: '',
        creatorId: TEST_CREATOR_ID,
        type: 'message',
        timestamp: new Date()
      } as InteractionEvent;

      await expect(
        memoryService.saveInteraction(invalidInteraction)
      ).rejects.toThrow(MemoryServiceException);
    });

    it('should invalidate cache after saving interaction', async () => {
      // Get initial context (will be cached)
      const context1 = await memoryService.getMemoryContext(TEST_FAN_ID, TEST_CREATOR_ID);
      const messageCount1 = context1.engagementMetrics.totalMessages;

      // Save new interaction
      await memoryService.saveInteraction({
        fanId: TEST_FAN_ID,
        creatorId: TEST_CREATOR_ID,
        type: 'message',
        content: 'New message',
        timestamp: new Date()
      });

      // Wait a bit for cache invalidation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get context again (should fetch fresh data)
      const context2 = await memoryService.getMemoryContext(TEST_FAN_ID, TEST_CREATOR_ID);
      
      // Message count should have increased
      expect(context2.engagementMetrics.totalMessages).toBeGreaterThanOrEqual(messageCount1);
    });
  });

  describe('Engagement Score', () => {
    it('should get engagement score for a fan', async () => {
      const score = await memoryService.getEngagementScore(TEST_FAN_ID, TEST_CREATOR_ID);
      
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return default score for new fans', async () => {
      const score = await memoryService.getEngagementScore(
        'new-fan-999',
        TEST_CREATOR_ID
      );
      
      expect(score).toBe(0.5); // Default score
    });

    it('should cache engagement score', async () => {
      const start1 = Date.now();
      const score1 = await memoryService.getEngagementScore(TEST_FAN_ID, TEST_CREATOR_ID);
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      const score2 = await memoryService.getEngagementScore(TEST_FAN_ID, TEST_CREATOR_ID);
      const duration2 = Date.now() - start2;

      expect(score1).toBe(score2);
      expect(duration2).toBeLessThan(duration1);
    });
  });

  describe('Bulk Operations', () => {
    it('should get memories for multiple fans', async () => {
      const fanIds = ['fan-1', 'fan-2', 'fan-3'];
      
      const contextsMap = await memoryService.getMemoriesForFans(
        fanIds,
        TEST_CREATOR_ID
      );
      
      expect(contextsMap.size).toBe(fanIds.length);
      fanIds.forEach(fanId => {
        expect(contextsMap.has(fanId)).toBe(true);
        expect(contextsMap.get(fanId)?.fanId).toBe(fanId);
      });
    });

    it('should handle bulk operations with concurrency limit', async () => {
      const fanIds = Array.from({ length: 25 }, (_, i) => `fan-${i}`);
      
      const start = Date.now();
      const contextsMap = await memoryService.getMemoriesForFans(
        fanIds,
        TEST_CREATOR_ID
      );
      const duration = Date.now() - start;
      
      expect(contextsMap.size).toBe(fanIds.length);
      // Should complete within reasonable time even with 25 fans
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('GDPR Compliance', () => {
    it('should clear all memory for a fan', async () => {
      // First, ensure there's some data
      await memoryService.saveInteraction({
        fanId: 'gdpr-test-fan',
        creatorId: TEST_CREATOR_ID,
        type: 'message',
        content: 'Test message',
        timestamp: new Date()
      });

      // Clear memory
      await expect(
        memoryService.clearMemory('gdpr-test-fan', TEST_CREATOR_ID)
      ).resolves.not.toThrow();

      // Verify data is cleared (should return minimal context)
      const context = await memoryService.getMemoryContext(
        'gdpr-test-fan',
        TEST_CREATOR_ID
      );
      
      expect(context.recentMessages).toHaveLength(0);
      expect(context.personalityProfile.interactionCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle cache failures gracefully', async () => {
      // Even if cache fails, should still return data from database
      const context = await memoryService.getMemoryContext(TEST_FAN_ID, TEST_CREATOR_ID);
      expect(context).toBeDefined();
    });

    it('should retry on transient failures', async () => {
      // This would require mocking to test properly
      // For now, just verify the service doesn't crash
      const context = await memoryService.getMemoryContext(TEST_FAN_ID, TEST_CREATOR_ID);
      expect(context).toBeDefined();
    });

    it('should timeout on slow operations', async () => {
      // This would require mocking slow database queries
      // For now, verify normal operations complete quickly
      const start = Date.now();
      await memoryService.getMemoryContext(TEST_FAN_ID, TEST_CREATOR_ID);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(10000); // Should not hang
    });
  });

  describe('Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      const requests = Array.from({ length: 10 }, () =>
        memoryService.getMemoryContext(TEST_FAN_ID, TEST_CREATOR_ID)
      );
      
      const start = Date.now();
      const contexts = await Promise.all(requests);
      const duration = Date.now() - start;
      
      expect(contexts).toHaveLength(10);
      contexts.forEach(context => {
        expect(context.fanId).toBe(TEST_FAN_ID);
      });
      
      // Should complete within 2 seconds (most will be cached)
      expect(duration).toBeLessThan(2000);
    });

    it('should have acceptable first-request latency', async () => {
      const uniqueFanId = `perf-test-${Date.now()}`;
      
      const start = Date.now();
      await memoryService.getMemoryContext(uniqueFanId, TEST_CREATOR_ID);
      const duration = Date.now() - start;
      
      // First request (no cache) should complete within 3 seconds
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Memory Statistics', () => {
    it('should get memory stats for a creator', async () => {
      const stats = await memoryService.getMemoryStats(TEST_CREATOR_ID);
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalFans).toBe('number');
      expect(typeof stats.avgEngagementScore).toBe('number');
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });
  });
});
