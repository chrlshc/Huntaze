/**
 * Unit Tests - OnlyFans Rate Limiter Service
 * 
 * Tests for the OnlyFans rate limiting service using AWS SQS
 * 
 * Coverage:
 * - Message validation with Zod
 * - Single message sending
 * - Batch message sending
 * - Queue status retrieval
 * - Retry logic with exponential backoff
 * - Error handling
 * - Feature flag behavior
 * - CloudWatch metrics integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SQSClient, SendMessageCommand, SendMessageBatchCommand, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';

// Mock AWS SDK
vi.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: vi.fn(),
  SendMessageCommand: vi.fn(),
  SendMessageBatchCommand: vi.fn(),
  GetQueueAttributesCommand: vi.fn(),
}));

// Mock logger and metrics
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/utils/metrics', () => ({
  metrics: {
    increment: vi.fn(),
  },
}));

describe('OnlyFansRateLimiterService', () => {
  let service: any;
  let mockSQSClient: any;
  let originalEnv: NodeJS.ProcessEnv;
  let OnlyFansRateLimiterService: any;
  let OnlyFansMessage: any;
  let logger: any;
  let metrics: any;

  beforeEach(async () => {
    // Save original env
    originalEnv = { ...process.env };

    // Setup test environment
    process.env.AWS_REGION = 'us-east-1';
    process.env.SQS_RATE_LIMITER_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue';
    process.env.SQS_RATE_LIMITER_DLQ_URL = 'https://sqs.us-east-1.amazonaws.com/123456789/test-dlq';
    process.env.RATE_LIMITER_ENABLED = 'true';

    // Mock SQS client
    mockSQSClient = {
      send: vi.fn(),
    };

    (SQSClient as any).mockImplementation(() => mockSQSClient);

    // Clear all mocks
    vi.clearAllMocks();
    
    // Import service after mocks are set up
    const serviceModule = await import('../../../lib/services/onlyfans-rate-limiter.service');
    OnlyFansRateLimiterService = serviceModule.OnlyFansRateLimiterService;
    
    // Import logger and metrics
    const loggerModule = await import('../../../lib/utils/logger');
    logger = loggerModule.logger;
    
    const metricsModule = await import('../../../lib/utils/metrics');
    metrics = metricsModule.metrics;
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      service = new OnlyFansRateLimiterService();

      expect(SQSClient).toHaveBeenCalledWith({ region: 'us-east-1' });
      expect(logger.info).toHaveBeenCalledWith(
        'OnlyFansRateLimiterService initialized',
        expect.objectContaining({
          enabled: true,
          region: 'us-east-1',
        })
      );
    });

    it('should disable service when queue URL is not configured', () => {
      delete process.env.SQS_RATE_LIMITER_QUEUE_URL;

      service = new OnlyFansRateLimiterService();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('SQS_RATE_LIMITER_QUEUE_URL not configured'),
        expect.any(Object)
      );
    });

    it('should disable service when feature flag is false', () => {
      process.env.RATE_LIMITER_ENABLED = 'false';

      service = new OnlyFansRateLimiterService();

      expect(logger.info).toHaveBeenCalledWith(
        'OnlyFansRateLimiterService initialized',
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    it('should use default region when AWS_REGION is not set', () => {
      delete process.env.AWS_REGION;

      service = new OnlyFansRateLimiterService();

      expect(SQSClient).toHaveBeenCalledWith({ region: 'us-east-1' });
    });
  });

  describe('Message Validation', () => {
    beforeEach(() => {
      service = new OnlyFansRateLimiterService();
    });

    it('should accept valid message', async () => {
      const validMessage: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Hello, this is a test message',
      };

      mockSQSClient.send.mockResolvedValueOnce({
        MessageId: 'sqs-msg-123',
      });

      const result = await service.sendMessage(validMessage);

      expect(result.status).toBe('queued');
    });

    it('should reject message with invalid UUID', async () => {
      const invalidMessage: OnlyFansMessage = {
        messageId: 'not-a-uuid',
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      };

      const result = await service.sendMessage(invalidMessage);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('validation failed');
    });

    it('should reject message with empty content', async () => {
      const invalidMessage: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: '',
      };

      const result = await service.sendMessage(invalidMessage);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('validation failed');
    });

    it('should reject message with content exceeding 5000 characters', async () => {
      const invalidMessage: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'a'.repeat(5001),
      };

      const result = await service.sendMessage(invalidMessage);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('validation failed');
    });

    it('should reject message with invalid media URL', async () => {
      const invalidMessage: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
        mediaUrls: ['not-a-url'],
      };

      const result = await service.sendMessage(invalidMessage);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('validation failed');
    });

    it('should accept message with valid media URLs', async () => {
      const validMessage: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
        mediaUrls: ['https://example.com/image.jpg', 'https://example.com/video.mp4'],
      };

      mockSQSClient.send.mockResolvedValueOnce({
        MessageId: 'sqs-msg-123',
      });

      const result = await service.sendMessage(validMessage);

      expect(result.status).toBe('queued');
    });

    it('should accept message with metadata', async () => {
      const validMessage: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
        metadata: {
          campaign: 'promo-2025',
          source: 'automation',
        },
      };

      mockSQSClient.send.mockResolvedValueOnce({
        MessageId: 'sqs-msg-123',
      });

      const result = await service.sendMessage(validMessage);

      expect(result.status).toBe('queued');
    });

    it('should accept message with priority', async () => {
      const validMessage: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
        priority: 8,
      };

      mockSQSClient.send.mockResolvedValueOnce({
        MessageId: 'sqs-msg-123',
      });

      const result = await service.sendMessage(validMessage);

      expect(result.status).toBe('queued');
    });

    it('should reject message with priority out of range', async () => {
      const invalidMessage: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
        priority: 11,
      };

      const result = await service.sendMessage(invalidMessage);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('validation failed');
    });
  });

  describe('sendMessage()', () => {
    beforeEach(() => {
      service = new OnlyFansRateLimiterService();
    });

    it('should send message successfully', async () => {
      const message: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      };

      mockSQSClient.send.mockResolvedValueOnce({
        MessageId: 'sqs-msg-123',
      });

      const result = await service.sendMessage(message);

      expect(result).toEqual({
        messageId: message.messageId,
        status: 'queued',
        queuedAt: expect.any(Date),
      });

      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(SendMessageCommand)
      );

      expect(logger.info).toHaveBeenCalledWith(
        'OnlyFansRateLimiterService: Message queued successfully',
        expect.objectContaining({
          messageId: message.messageId,
          sqsMessageId: 'sqs-msg-123',
        })
      );

      expect(metrics.increment).toHaveBeenCalledWith(
        'OnlyFansMessagesQueued',
        1,
        { userId: 'user123' }
      );
    });

    it('should include message attributes in SQS command', async () => {
      const message: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
        priority: 7,
      };

      mockSQSClient.send.mockResolvedValueOnce({
        MessageId: 'sqs-msg-123',
      });

      await service.sendMessage(message);

      const sendCall = mockSQSClient.send.mock.calls[0][0];
      expect(sendCall.input.MessageAttributes).toEqual({
        userId: {
          DataType: 'String',
          StringValue: 'user123',
        },
        messageType: {
          DataType: 'String',
          StringValue: 'onlyfans',
        },
        priority: {
          DataType: 'Number',
          StringValue: '7',
        },
      });
    });

    it('should use default priority when not specified', async () => {
      const message: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      };

      mockSQSClient.send.mockResolvedValueOnce({
        MessageId: 'sqs-msg-123',
      });

      await service.sendMessage(message);

      const sendCall = mockSQSClient.send.mock.calls[0][0];
      expect(sendCall.input.MessageAttributes.priority.StringValue).toBe('5');
    });

    it('should return failed status when service is disabled', async () => {
      process.env.RATE_LIMITER_ENABLED = 'false';
      service = new OnlyFansRateLimiterService();

      const message: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      };

      const result = await service.sendMessage(message);

      expect(result).toEqual({
        messageId: message.messageId,
        status: 'failed',
        error: 'Rate limiter disabled',
      });

      expect(mockSQSClient.send).not.toHaveBeenCalled();
    });

    it('should retry on SQS failure', async () => {
      const message: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      };

      // First attempt fails
      mockSQSClient.send
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ MessageId: 'sqs-msg-123' });

      const result = await service.sendMessage(message);

      expect(result.status).toBe('queued');
      expect(mockSQSClient.send).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalledWith(
        'OnlyFansRateLimiterService: Retrying message send',
        expect.objectContaining({
          messageId: message.messageId,
          attempt: 2,
        })
      );
    });

    it('should fail after max retries', async () => {
      const message: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      };

      // All attempts fail
      mockSQSClient.send.mockRejectedValue(new Error('Network error'));

      const result = await service.sendMessage(message);

      expect(result).toEqual({
        messageId: message.messageId,
        status: 'failed',
        error: 'Network error',
      });

      expect(mockSQSClient.send).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(logger.error).toHaveBeenCalledWith(
        'OnlyFansRateLimiterService: All retries exhausted',
        expect.objectContaining({
          messageId: message.messageId,
          attempts: 3,
        })
      );
    });
  });

  describe('sendBatch()', () => {
    beforeEach(() => {
      service = new OnlyFansRateLimiterService();
    });

    it('should send batch successfully', async () => {
      const messages: OnlyFansMessage[] = [
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

      mockSQSClient.send.mockResolvedValueOnce({
        Successful: [
          { Id: '0', MessageId: 'sqs-msg-1' },
          { Id: '1', MessageId: 'sqs-msg-2' },
        ],
        Failed: [],
      });

      const results = await service.sendBatch(messages);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('queued');
      expect(results[1].status).toBe('queued');
      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(SendMessageBatchCommand)
      );
    });

    it('should handle partial batch failure', async () => {
      const messages: OnlyFansMessage[] = [
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

      mockSQSClient.send.mockResolvedValueOnce({
        Successful: [{ Id: '0', MessageId: 'sqs-msg-1' }],
        Failed: [{ Id: '1', Code: 'InvalidMessage', Message: 'Invalid message format' }],
      });

      const results = await service.sendBatch(messages);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('queued');
      expect(results[1].status).toBe('failed');
      expect(results[1].error).toBe('Invalid message format');
    });

    it('should reject empty batch', async () => {
      const results = await service.sendBatch([]);

      expect(results).toHaveLength(0);
      expect(mockSQSClient.send).not.toHaveBeenCalled();
    });

    it('should reject batch exceeding 10 messages', async () => {
      const messages: OnlyFansMessage[] = Array.from({ length: 11 }, (_, i) => ({
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: `recipient${i}`,
        content: `Message ${i}`,
      }));

      await expect(service.sendBatch(messages)).rejects.toThrow(
        'Batch size cannot exceed 10 messages'
      );
    });

    it('should validate all messages in batch', async () => {
      const messages: OnlyFansMessage[] = [
        {
          messageId: crypto.randomUUID(),
          userId: 'user123',
          recipientId: 'recipient1',
          content: 'Valid message',
        },
        {
          messageId: 'invalid-uuid',
          userId: 'user123',
          recipientId: 'recipient2',
          content: 'Invalid message',
        },
      ];

      await expect(service.sendBatch(messages)).rejects.toThrow(
        'Batch validation failed'
      );
    });

    it('should return failed status for all messages when service is disabled', async () => {
      process.env.RATE_LIMITER_ENABLED = 'false';
      service = new OnlyFansRateLimiterService();

      const messages: OnlyFansMessage[] = [
        {
          messageId: crypto.randomUUID(),
          userId: 'user123',
          recipientId: 'recipient1',
          content: 'Message 1',
        },
      ];

      const results = await service.sendBatch(messages);

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('failed');
      expect(results[0].error).toBe('Rate limiter disabled');
    });

    it('should handle complete batch failure', async () => {
      const messages: OnlyFansMessage[] = [
        {
          messageId: crypto.randomUUID(),
          userId: 'user123',
          recipientId: 'recipient1',
          content: 'Message 1',
        },
      ];

      mockSQSClient.send.mockRejectedValueOnce(new Error('SQS unavailable'));

      const results = await service.sendBatch(messages);

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('failed');
      expect(results[0].error).toBe('SQS unavailable');
    });
  });

  describe('getQueueStatus()', () => {
    beforeEach(() => {
      service = new OnlyFansRateLimiterService();
    });

    it('should retrieve queue status successfully', async () => {
      mockSQSClient.send
        .mockResolvedValueOnce({
          Attributes: {
            ApproximateNumberOfMessages: '42',
            ApproximateNumberOfMessagesNotVisible: '5',
          },
        })
        .mockResolvedValueOnce({
          Attributes: {
            ApproximateNumberOfMessages: '3',
          },
        });

      const status = await service.getQueueStatus();

      expect(status).toEqual({
        queueDepth: 42,
        messagesInFlight: 5,
        dlqCount: 3,
        lastProcessedAt: expect.any(Date),
      });

      expect(mockSQSClient.send).toHaveBeenCalledTimes(2);
    });

    it('should handle missing queue attributes', async () => {
      mockSQSClient.send.mockResolvedValueOnce({
        Attributes: {},
      });

      const status = await service.getQueueStatus();

      expect(status.queueDepth).toBe(0);
      expect(status.messagesInFlight).toBe(0);
    });

    it('should handle DLQ query failure gracefully', async () => {
      mockSQSClient.send
        .mockResolvedValueOnce({
          Attributes: {
            ApproximateNumberOfMessages: '10',
            ApproximateNumberOfMessagesNotVisible: '2',
          },
        })
        .mockRejectedValueOnce(new Error('DLQ not accessible'));

      const status = await service.getQueueStatus();

      expect(status.queueDepth).toBe(10);
      expect(status.messagesInFlight).toBe(2);
      expect(status.dlqCount).toBe(0);
      expect(logger.warn).toHaveBeenCalledWith(
        'OnlyFansRateLimiterService: Failed to get DLQ status',
        expect.any(Object)
      );
    });

    it('should return zero values when service is disabled', async () => {
      process.env.RATE_LIMITER_ENABLED = 'false';
      service = new OnlyFansRateLimiterService();

      const status = await service.getQueueStatus();

      expect(status).toEqual({
        queueDepth: 0,
        messagesInFlight: 0,
        dlqCount: 0,
      });

      expect(mockSQSClient.send).not.toHaveBeenCalled();
    });

    it('should throw error on queue query failure', async () => {
      mockSQSClient.send.mockRejectedValueOnce(new Error('Queue not found'));

      await expect(service.getQueueStatus()).rejects.toThrow(
        'Failed to get queue status: Queue not found'
      );
    });
  });

  describe('generateMessageId()', () => {
    beforeEach(() => {
      service = new OnlyFansRateLimiterService();
    });

    it('should generate valid UUID', () => {
      const messageId = service.generateMessageId();

      expect(messageId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate unique IDs', () => {
      const id1 = service.generateMessageId();
      const id2 = service.generateMessageId();

      expect(id1).not.toBe(id2);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      service = new OnlyFansRateLimiterService();
    });

    it('should handle message with maximum content length', async () => {
      const message: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'a'.repeat(5000),
      };

      mockSQSClient.send.mockResolvedValueOnce({
        MessageId: 'sqs-msg-123',
      });

      const result = await service.sendMessage(message);

      expect(result.status).toBe('queued');
    });

    it('should handle message with multiple media URLs', async () => {
      const message: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Check out these photos!',
        mediaUrls: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg',
          'https://example.com/photo3.jpg',
        ],
      };

      mockSQSClient.send.mockResolvedValueOnce({
        MessageId: 'sqs-msg-123',
      });

      const result = await service.sendMessage(message);

      expect(result.status).toBe('queued');
    });

    it('should handle message with complex metadata', async () => {
      const message: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
        metadata: {
          campaign: 'promo-2025',
          tags: ['vip', 'premium'],
          analytics: {
            source: 'automation',
            timestamp: new Date().toISOString(),
          },
        },
      };

      mockSQSClient.send.mockResolvedValueOnce({
        MessageId: 'sqs-msg-123',
      });

      const result = await service.sendMessage(message);

      expect(result.status).toBe('queued');
    });

    it('should handle batch with maximum size (10 messages)', async () => {
      const messages: OnlyFansMessage[] = Array.from({ length: 10 }, (_, i) => ({
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: `recipient${i}`,
        content: `Message ${i}`,
      }));

      mockSQSClient.send.mockResolvedValueOnce({
        Successful: messages.map((_, i) => ({ Id: i.toString(), MessageId: `sqs-msg-${i}` })),
        Failed: [],
      });

      const results = await service.sendBatch(messages);

      expect(results).toHaveLength(10);
      expect(results.every(r => r.status === 'queued')).toBe(true);
    });
  });

  describe('Integration with CloudWatch Metrics', () => {
    beforeEach(() => {
      service = new OnlyFansRateLimiterService();
    });

    it('should emit metric on successful message send', async () => {
      const message: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      };

      mockSQSClient.send.mockResolvedValueOnce({
        MessageId: 'sqs-msg-123',
      });

      await service.sendMessage(message);

      expect(metrics.increment).toHaveBeenCalledWith(
        'OnlyFansMessagesQueued',
        1,
        { userId: 'user123' }
      );
    });

    it('should emit metrics for each successful message in batch', async () => {
      const messages: OnlyFansMessage[] = [
        {
          messageId: crypto.randomUUID(),
          userId: 'user123',
          recipientId: 'recipient1',
          content: 'Message 1',
        },
        {
          messageId: crypto.randomUUID(),
          userId: 'user456',
          recipientId: 'recipient2',
          content: 'Message 2',
        },
      ];

      mockSQSClient.send.mockResolvedValueOnce({
        Successful: [
          { Id: '0', MessageId: 'sqs-msg-1' },
          { Id: '1', MessageId: 'sqs-msg-2' },
        ],
        Failed: [],
      });

      await service.sendBatch(messages);

      expect(metrics.increment).toHaveBeenCalledTimes(2);
      expect(metrics.increment).toHaveBeenCalledWith(
        'OnlyFansMessagesQueued',
        1,
        { userId: 'user123' }
      );
      expect(metrics.increment).toHaveBeenCalledWith(
        'OnlyFansMessagesQueued',
        1,
        { userId: 'user456' }
      );
    });

    it('should not emit metrics on failed message send', async () => {
      const message: OnlyFansMessage = {
        messageId: crypto.randomUUID(),
        userId: 'user123',
        recipientId: 'recipient456',
        content: 'Test message',
      };

      mockSQSClient.send.mockRejectedValue(new Error('SQS error'));

      await service.sendMessage(message);

      expect(metrics.increment).not.toHaveBeenCalled();
    });
  });
});
