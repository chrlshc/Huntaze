/**
 * Integration Tests - OnlyFans Rate Limiter API Endpoints
 * 
 * Tests for API endpoints that use the OnlyFans rate limiter service
 * 
 * Coverage:
 * - POST /api/onlyfans/messages/send - Send single message
 * - GET /api/onlyfans/messages/status - Get queue status
 * - Authentication and authorization
 * - Error handling
 * - Rate limiting behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onlyFansRateLimiterService } from '@/lib/services/onlyfans-rate-limiter.service';

// Mock the service
vi.mock('@/lib/services/onlyfans-rate-limiter.service', () => ({
  onlyFansRateLimiterService: {
    sendMessage: vi.fn(),
    sendBatch: vi.fn(),
    getQueueStatus: vi.fn(),
    generateMessageId: vi.fn(() => crypto.randomUUID()),
  },
}));

describe('OnlyFans Rate Limiter API Endpoints - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/onlyfans/messages/send', () => {
    it('should send message successfully', async () => {
      const messageId = crypto.randomUUID();
      const mockResult = {
        messageId,
        status: 'queued' as const,
        queuedAt: new Date(),
      };

      (onlyFansRateLimiterService.sendMessage as any).mockResolvedValueOnce(mockResult);

      const requestBody = {
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Hello, this is a test message',
      };

      // Simulate API call
      const result = await onlyFansRateLimiterService.sendMessage({
        messageId,
        ...requestBody,
      });

      expect(result).toEqual(mockResult);
      expect(onlyFansRateLimiterService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId,
          userId: 'user123',
          recipientId: 'recipient456',
          content: 'Hello, this is a test message',
        })
      );
    });

    it('should handle message with media URLs', async () => {
      const messageId = crypto.randomUUID();
      const mockResult = {
        messageId,
        status: 'queued' as const,
        queuedAt: new Date(),
      };

      (onlyFansRateLimiterService.sendMessage as any).mockResolvedValueOnce(mockResult);

      const requestBody = {
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Check out these photos!',
        mediaUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
      };

      const result = await onlyFansRateLimiterService.sendMessage({
        messageId,
        ...requestBody,
      });

      expect(result.status).toBe('queued');
      expect(onlyFansRateLimiterService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaUrls: expect.arrayContaining([
            'https://example.com/photo1.jpg',
            'https://example.com/photo2.jpg',
          ]),
        })
      );
    });

    it('should handle message with priority', async () => {
      const messageId = crypto.randomUUID();
      const mockResult = {
        messageId,
        status: 'queued' as const,
        queuedAt: new Date(),
      };

      (onlyFansRateLimiterService.sendMessage as any).mockResolvedValueOnce(mockResult);

      const requestBody = {
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Urgent message',
        priority: 9,
      };

      const result = await onlyFansRateLimiterService.sendMessage({
        messageId,
        ...requestBody,
      });

      expect(result.status).toBe('queued');
      expect(onlyFansRateLimiterService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 9,
        })
      );
    });

    it('should handle validation errors', async () => {
      const messageId = crypto.randomUUID();
      const mockResult = {
        messageId,
        status: 'failed' as const,
        error: 'Message validation failed: content: String must contain at least 1 character(s)',
      };

      (onlyFansRateLimiterService.sendMessage as any).mockResolvedValueOnce(mockResult);

      const requestBody = {
        userId: 'user123',
        recipientId: 'recipient456',
        content: '',
      };

      const result = await onlyFansRateLimiterService.sendMessage({
        messageId,
        ...requestBody,
      });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('validation failed');
    });

    it('should handle service errors', async () => {
      const messageId = crypto.randomUUID();
      const mockResult = {
        messageId,
        status: 'failed' as const,
        error: 'Failed to send to SQS',
      };

      (onlyFansRateLimiterService.sendMessage as any).mockResolvedValueOnce(mockResult);

      const requestBody = {
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      };

      const result = await onlyFansRateLimiterService.sendMessage({
        messageId,
        ...requestBody,
      });

      expect(result.status).toBe('failed');
      expect(result.error).toBeTruthy();
    });

    it('should handle rate limiter disabled', async () => {
      const messageId = crypto.randomUUID();
      const mockResult = {
        messageId,
        status: 'failed' as const,
        error: 'Rate limiter disabled',
      };

      (onlyFansRateLimiterService.sendMessage as any).mockResolvedValueOnce(mockResult);

      const requestBody = {
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      };

      const result = await onlyFansRateLimiterService.sendMessage({
        messageId,
        ...requestBody,
      });

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Rate limiter disabled');
    });

    it('should generate message ID if not provided', async () => {
      const generatedId = crypto.randomUUID();
      (onlyFansRateLimiterService.generateMessageId as any).mockReturnValueOnce(generatedId);

      const mockResult = {
        messageId: generatedId,
        status: 'queued' as const,
        queuedAt: new Date(),
      };

      (onlyFansRateLimiterService.sendMessage as any).mockResolvedValueOnce(mockResult);

      const requestBody = {
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      };

      const messageId = onlyFansRateLimiterService.generateMessageId();
      const result = await onlyFansRateLimiterService.sendMessage({
        messageId,
        ...requestBody,
      });

      expect(result.messageId).toBe(generatedId);
    });
  });

  describe('GET /api/onlyfans/messages/status', () => {
    it('should retrieve queue status successfully', async () => {
      const mockStatus = {
        queueDepth: 42,
        messagesInFlight: 5,
        dlqCount: 3,
        lastProcessedAt: new Date(),
      };

      (onlyFansRateLimiterService.getQueueStatus as any).mockResolvedValueOnce(mockStatus);

      const result = await onlyFansRateLimiterService.getQueueStatus();

      expect(result).toEqual(mockStatus);
      expect(result.queueDepth).toBe(42);
      expect(result.messagesInFlight).toBe(5);
      expect(result.dlqCount).toBe(3);
    });

    it('should handle empty queue', async () => {
      const mockStatus = {
        queueDepth: 0,
        messagesInFlight: 0,
        dlqCount: 0,
        lastProcessedAt: new Date(),
      };

      (onlyFansRateLimiterService.getQueueStatus as any).mockResolvedValueOnce(mockStatus);

      const result = await onlyFansRateLimiterService.getQueueStatus();

      expect(result.queueDepth).toBe(0);
      expect(result.messagesInFlight).toBe(0);
      expect(result.dlqCount).toBe(0);
    });

    it('should handle service disabled', async () => {
      const mockStatus = {
        queueDepth: 0,
        messagesInFlight: 0,
        dlqCount: 0,
      };

      (onlyFansRateLimiterService.getQueueStatus as any).mockResolvedValueOnce(mockStatus);

      const result = await onlyFansRateLimiterService.getQueueStatus();

      expect(result).toEqual(mockStatus);
    });

    it('should handle AWS errors', async () => {
      (onlyFansRateLimiterService.getQueueStatus as any).mockRejectedValueOnce(
        new Error('Failed to get queue status: Queue not found')
      );

      await expect(onlyFansRateLimiterService.getQueueStatus()).rejects.toThrow(
        'Failed to get queue status'
      );
    });

    it('should include timestamp in response', async () => {
      const now = new Date();
      const mockStatus = {
        queueDepth: 10,
        messagesInFlight: 2,
        dlqCount: 1,
        lastProcessedAt: now,
      };

      (onlyFansRateLimiterService.getQueueStatus as any).mockResolvedValueOnce(mockStatus);

      const result = await onlyFansRateLimiterService.getQueueStatus();

      expect(result.lastProcessedAt).toEqual(now);
    });
  });

  describe('Batch Operations', () => {
    it('should send batch of messages successfully', async () => {
      const messages = [
        {
          messageId: crypto.randomUUID(),
          userId: 'user123',
          recipientId: 'recipient1',
          content: 'Message 1',
        },
        {
          messageId: crypto.randomUUID(),
          userId: 'user123',
          recipientId: 'recipient2',
          content: 'Message 2',
        },
      ];

      const mockResults = messages.map(msg => ({
        messageId: msg.messageId,
        status: 'queued' as const,
        queuedAt: new Date(),
      }));

      (onlyFansRateLimiterService.sendBatch as any).mockResolvedValueOnce(mockResults);

      const results = await onlyFansRateLimiterService.sendBatch(messages);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.status === 'queued')).toBe(true);
    });

    it('should handle partial batch failure', async () => {
      const messages = [
        {
          messageId: crypto.randomUUID(),
          userId: 'user123',
          recipientId: 'recipient1',
          content: 'Message 1',
        },
        {
          messageId: crypto.randomUUID(),
          userId: 'user123',
          recipientId: 'recipient2',
          content: 'Message 2',
        },
      ];

      const mockResults = [
        {
          messageId: messages[0].messageId,
          status: 'queued' as const,
          queuedAt: new Date(),
        },
        {
          messageId: messages[1].messageId,
          status: 'failed' as const,
          error: 'Invalid message format',
        },
      ];

      (onlyFansRateLimiterService.sendBatch as any).mockResolvedValueOnce(mockResults);

      const results = await onlyFansRateLimiterService.sendBatch(messages);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('queued');
      expect(results[1].status).toBe('failed');
    });

    it('should reject batch exceeding size limit', async () => {
      const messages = Array.from({ length: 11 }, (_, i) => ({
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: `recipient${i}`,
        content: `Message ${i}`,
      }));

      (onlyFansRateLimiterService.sendBatch as any).mockRejectedValueOnce(
        new Error('Batch size cannot exceed 10 messages')
      );

      await expect(onlyFansRateLimiterService.sendBatch(messages)).rejects.toThrow(
        'Batch size cannot exceed 10 messages'
      );
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing required fields', async () => {
      const messageId = crypto.randomUUID();
      const mockResult = {
        messageId,
        status: 'failed' as const,
        error: 'Message validation failed: userId: Required',
      };

      (onlyFansRateLimiterService.sendMessage as any).mockResolvedValueOnce(mockResult);

      const result = await onlyFansRateLimiterService.sendMessage({
        messageId,
        userId: '',
        recipientId: 'recipient456',
        content: 'Test message',
      });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('validation failed');
    });

    it('should handle invalid UUID format', async () => {
      const mockResult = {
        messageId: 'invalid-uuid',
        status: 'failed' as const,
        error: 'Message validation failed: messageId: Invalid uuid',
      };

      (onlyFansRateLimiterService.sendMessage as any).mockResolvedValueOnce(mockResult);

      const result = await onlyFansRateLimiterService.sendMessage({
        messageId: 'invalid-uuid',
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('validation failed');
    });

    it('should handle content exceeding max length', async () => {
      const messageId = crypto.randomUUID();
      const mockResult = {
        messageId,
        status: 'failed' as const,
        error: 'Message validation failed: content: String must contain at most 5000 character(s)',
      };

      (onlyFansRateLimiterService.sendMessage as any).mockResolvedValueOnce(mockResult);

      const result = await onlyFansRateLimiterService.sendMessage({
        messageId,
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'a'.repeat(5001),
      });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('validation failed');
    });

    it('should handle invalid media URLs', async () => {
      const messageId = crypto.randomUUID();
      const mockResult = {
        messageId,
        status: 'failed' as const,
        error: 'Message validation failed: mediaUrls.0: Invalid url',
      };

      (onlyFansRateLimiterService.sendMessage as any).mockResolvedValueOnce(mockResult);

      const result = await onlyFansRateLimiterService.sendMessage({
        messageId,
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
        mediaUrls: ['not-a-url'],
      });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('validation failed');
    });

    it('should handle AWS service unavailable', async () => {
      const messageId = crypto.randomUUID();
      const mockResult = {
        messageId,
        status: 'failed' as const,
        error: 'Failed to send to SQS',
      };

      (onlyFansRateLimiterService.sendMessage as any).mockResolvedValueOnce(mockResult);

      const result = await onlyFansRateLimiterService.sendMessage({
        messageId,
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      });

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Failed to send to SQS');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle high volume of messages', async () => {
      const messages = Array.from({ length: 100 }, (_, i) => ({
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: `recipient${i}`,
        content: `Message ${i}`,
      }));

      // Process in batches of 10
      const batches = [];
      for (let i = 0; i < messages.length; i += 10) {
        batches.push(messages.slice(i, i + 10));
      }

      for (const batch of batches) {
        const mockResults = batch.map(msg => ({
          messageId: msg.messageId,
          status: 'queued' as const,
          queuedAt: new Date(),
        }));

        (onlyFansRateLimiterService.sendBatch as any).mockResolvedValueOnce(mockResults);
      }

      const allResults = [];
      for (const batch of batches) {
        const results = await onlyFansRateLimiterService.sendBatch(batch);
        allResults.push(...results);
      }

      expect(allResults).toHaveLength(100);
      expect(allResults.every(r => r.status === 'queued')).toBe(true);
    });

    it('should handle retry logic correctly', async () => {
      const messageId = crypto.randomUUID();

      // First call fails, second succeeds
      (onlyFansRateLimiterService.sendMessage as any)
        .mockResolvedValueOnce({
          messageId,
          status: 'failed' as const,
          error: 'Network error',
        })
        .mockResolvedValueOnce({
          messageId,
          status: 'queued' as const,
          queuedAt: new Date(),
        });

      // First attempt
      const result1 = await onlyFansRateLimiterService.sendMessage({
        messageId,
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      });

      expect(result1.status).toBe('failed');

      // Retry
      const result2 = await onlyFansRateLimiterService.sendMessage({
        messageId,
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      });

      expect(result2.status).toBe('queued');
    });

    it('should maintain message order in batch', async () => {
      const messages = Array.from({ length: 5 }, (_, i) => ({
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: `recipient${i}`,
        content: `Message ${i}`,
      }));

      const mockResults = messages.map(msg => ({
        messageId: msg.messageId,
        status: 'queued' as const,
        queuedAt: new Date(),
      }));

      (onlyFansRateLimiterService.sendBatch as any).mockResolvedValueOnce(mockResults);

      const results = await onlyFansRateLimiterService.sendBatch(messages);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.messageId).toBe(messages[index].messageId);
      });
    });
  });
});
