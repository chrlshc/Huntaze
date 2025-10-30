/**
 * OnlyFans Rate Limiter Service - Unit Tests
 * 
 * Tests for the OnlyFansRateLimiterService class
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OnlyFansRateLimiterService, OnlyFansMessageSchema } from '@/lib/services/onlyfans-rate-limiter.service';
import { IntelligentQueueManager } from '@/lib/services/intelligent-queue-manager';
import { CloudWatchMetricsService } from '@/lib/services/cloudwatch-metrics.service';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
vi.mock('@/lib/services/intelligent-queue-manager');
vi.mock('@/lib/services/cloudwatch-metrics.service');
vi.mock('@prisma/client');

describe('OnlyFansRateLimiterService', () => {
  let service: OnlyFansRateLimiterService;
  let mockQueueManager: any;
  let mockPrisma: any;
  let mockMetrics: any;
  let mockLogger: any;

  beforeEach(() => {
    // Setup mocks
    mockQueueManager = {
      sendToRateLimiterQueue: vi.fn(),
    };

    mockPrisma = {
      onlyFansMessage: {
        create: vi.fn(),
        groupBy: vi.fn(),
        findMany: vi.fn(),
      },
    };

    mockMetrics = {
      putMetric: vi.fn(),
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Create service instance
    service = new OnlyFansRateLimiterService(
      mockQueueManager,
      mockPrisma,
      mockMetrics,
      mockLogger
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Payload Validation', () => {
    it('should accept valid message payload', async () => {
      const validMessage = {
        recipientId: 'user_123',
        content: 'Hello!',
        mediaUrls: ['https://example.com/image.jpg'],
        priority: 'high' as const,
      };

      mockQueueManager.sendToRateLimiterQueue.mockResolvedValue({
        messageId: 'sqs_msg_123',
        success: true,
      });

      mockPrisma.onlyFansMessage.create.mockResolvedValue({});

      const result = await service.sendMessage('user_456', validMessage);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should reject message with missing recipientId', async () => {
      const invalidMessage = {
        recipientId: '',
        content: 'Hello!',
      } as any;

      await expect(
        service.sendMessage('user_456', invalidMessage)
      ).rejects.toThrow(/validation failed/i);
    });

    it('should reject message with missing content', async () => {
      const invalidMessage = {
        recipientId: 'user_123',
        content: '',
      } as any;

      await expect(
        service.sendMessage('user_456', invalidMessage)
      ).rejects.toThrow(/validation failed/i);
    });

    it('should reject message with content too long', async () => {
      const invalidMessage = {
        recipientId: 'user_123',
        content: 'a'.repeat(10001), // Max is 10000
      };

      await expect(
        service.sendMessage('user_456', invalidMessage)
      ).rejects.toThrow(/validation failed/i);
    });

    it('should reject message with invalid mediaUrls', async () => {
      const invalidMessage = {
        recipientId: 'user_123',
        content: 'Hello!',
        mediaUrls: ['not-a-url'],
      } as any;

      await expect(
        service.sendMessage('user_456', invalidMessage)
      ).rejects.toThrow(/validation failed/i);
    });

    it('should accept message without optional fields', async () => {
      const minimalMessage = {
        recipientId: 'user_123',
        content: 'Hello!',
      };

      mockQueueManager.sendToRateLimiterQueue.mockResolvedValue({
        messageId: 'sqs_msg_123',
        success: true,
      });

      mockPrisma.onlyFansMessage.create.mockResolvedValue({});

      const result = await service.sendMessage('user_456', minimalMessage);

      expect(result.success).toBe(true);
    });
  });

  describe('Message ID Generation', () => {
    it('should generate unique message IDs', async () => {
      const message = {
        recipientId: 'user_123',
        content: 'Hello!',
      };

      mockQueueManager.sendToRateLimiterQueue.mockResolvedValue({
        messageId: 'sqs_msg_123',
        success: true,
      });

      mockPrisma.onlyFansMessage.create.mockResolvedValue({});

      const result1 = await service.sendMessage('user_456', message);
      const result2 = await service.sendMessage('user_456', message);

      expect(result1.messageId).not.toBe(result2.messageId);
      expect(result1.messageId).toMatch(/^msg_/);
      expect(result2.messageId).toMatch(/^msg_/);
    });
  });

  describe('Feature Flag', () => {
    it('should bypass queue when rate limiter is disabled', async () => {
      // Mock environment variable
      const originalEnv = process.env.RATE_LIMITER_ENABLED;
      process.env.RATE_LIMITER_ENABLED = 'false';

      // Create new service instance with disabled flag
      const disabledService = new OnlyFansRateLimiterService(
        mockQueueManager,
        mockPrisma,
        mockMetrics,
        mockLogger
      );

      const message = {
        recipientId: 'user_123',
        content: 'Hello!',
      };

      const result = await disabledService.sendMessage('user_456', message);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/disabled/i);
      expect(mockQueueManager.sendToRateLimiterQueue).not.toHaveBeenCalled();

      // Restore environment
      process.env.RATE_LIMITER_ENABLED = originalEnv;
    });
  });

  describe('Error Handling', () => {
    it('should handle SQS send failure with fallback', async () => {
      const message = {
        recipientId: 'user_123',
        content: 'Hello!',
      };

      mockQueueManager.sendToRateLimiterQueue.mockRejectedValue(
        new Error('SQS unavailable')
      );

      mockPrisma.onlyFansMessage.create.mockResolvedValue({});

      const result = await service.sendMessage('user_456', message);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/SQS unavailable/i);
      expect(result.fallbackUsed).toBe(true);
      expect(mockPrisma.onlyFansMessage.create).toHaveBeenCalled();
    });

    it('should track failed message metric', async () => {
      const message = {
        recipientId: 'user_123',
        content: 'Hello!',
      };

      mockQueueManager.sendToRateLimiterQueue.mockRejectedValue(
        new Error('SQS error')
      );

      mockPrisma.onlyFansMessage.create.mockResolvedValue({});

      await service.sendMessage('user_456', message);

      expect(mockMetrics.putMetric).toHaveBeenCalledWith(
        'MessagesFailed',
        1,
        expect.any(Object)
      );
    });
  });

  describe('Batch Sending', () => {
    it('should send multiple messages in batch', async () => {
      const messages = [
        { recipientId: 'user_1', content: 'Hello 1!' },
        { recipientId: 'user_2', content: 'Hello 2!' },
        { recipientId: 'user_3', content: 'Hello 3!' },
      ];

      mockQueueManager.sendToRateLimiterQueue.mockResolvedValue({
        messageId: 'sqs_msg_123',
        success: true,
      });

      mockPrisma.onlyFansMessage.create.mockResolvedValue({});

      const results = await service.sendBatch('user_456', messages);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(mockQueueManager.sendToRateLimiterQueue).toHaveBeenCalledTimes(3);
    });

    it('should handle partial batch failures', async () => {
      const messages = [
        { recipientId: 'user_1', content: 'Hello 1!' },
        { recipientId: 'user_2', content: 'Hello 2!' },
      ];

      mockQueueManager.sendToRateLimiterQueue
        .mockResolvedValueOnce({ messageId: 'sqs_msg_1', success: true })
        .mockRejectedValueOnce(new Error('SQS error'));

      mockPrisma.onlyFansMessage.create.mockResolvedValue({});

      const results = await service.sendBatch('user_456', messages);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('Queue Status', () => {
    it('should return queue status with metrics', async () => {
      mockPrisma.onlyFansMessage.groupBy.mockResolvedValue([
        { status: 'queued', _count: 10 },
        { status: 'processing', _count: 5 },
        { status: 'failed', _count: 2 },
      ]);

      mockPrisma.onlyFansMessage.findMany.mockResolvedValue([
        { queuedAt: new Date('2025-01-01T00:00:00Z'), sentAt: new Date('2025-01-01T00:00:05Z') },
        { queuedAt: new Date('2025-01-01T00:00:00Z'), sentAt: new Date('2025-01-01T00:00:03Z') },
      ]);

      const status = await service.getQueueStatus();

      expect(status.healthy).toBe(true);
      expect(status.messagesQueued).toBe(10);
      expect(status.messagesProcessing).toBe(5);
      expect(status.messagesFailed).toBe(2);
      expect(status.averageLatency).toBeGreaterThan(0);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.onlyFansMessage.groupBy.mockRejectedValue(
        new Error('Database error')
      );

      const status = await service.getQueueStatus();

      expect(status.healthy).toBe(false);
      expect(status.lastError).toMatch(/Database error/i);
    });
  });
});
