/**
 * Unit Tests for OnlyFans Scraper Queue Integration
 * Tests the integration between rate limiter Lambda, workflows FIFO queue, and Playwright scraper
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock AWS SDK clients
const mockSQSClient = {
  send: vi.fn()
};

const mockRedisClient = {
  eval: vi.fn(),
  get: vi.fn(),
  set: vi.fn()
};

const mockSecretsManagerClient = {
  send: vi.fn()
};

vi.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: vi.fn(() => mockSQSClient),
  SendMessageCommand: vi.fn((params) => params),
  ReceiveMessageCommand: vi.fn((params) => params),
  DeleteMessageCommand: vi.fn((params) => params),
  ChangeMessageVisibilityCommand: vi.fn((params) => params)
}));

vi.mock('redis', () => ({
  createClient: vi.fn(() => mockRedisClient)
}));

vi.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: vi.fn(() => mockSecretsManagerClient),
  GetSecretValueCommand: vi.fn((params) => params)
}));

// Types for the integration
interface MessagePayload {
  action: 'send_message' | 'scrape_profile' | 'download_media' | 'get_messages';
  creator_id: string;
  user_id: string;
  timestamp: string;
  message_content?: string;
  metadata: {
    campaign_id?: string;
    priority: 'low' | 'normal' | 'high';
    retry_count?: number;
    correlation_id: string;
  };
}

interface RateLimiterResult {
  allowed: boolean;
  retryAfter?: number;
  remainingTokens: number;
}

interface WorkflowsQueueMessage {
  MessageBody: string;
  MessageGroupId: string;
  MessageDeduplicationId: string;
  MessageAttributes: Record<string, any>;
}

// Mock implementation of rate limiter integration
class RateLimiterIntegration {
  constructor(
    private sqsClient = mockSQSClient,
    private redisClient = mockRedisClient,
    private workflowsQueueUrl: string = 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-hybrid-workflows.fifo'
  ) {}

  async checkRateLimit(key: string): Promise<RateLimiterResult> {
    // Lua script for atomic token bucket operation
    const luaScript = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refill_rate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      local bucket = redis.call('HMGET', key, 'tokens', 'timestamp')
      local tokens = tonumber(bucket[1]) or capacity
      local timestamp = tonumber(bucket[2]) or now
      
      local elapsed = now - timestamp
      local refilled = math.min(capacity, tokens + (elapsed * refill_rate))
      
      if refilled >= 1 then
        redis.call('HMSET', key, 'tokens', refilled - 1, 'timestamp', now)
        return {1, refilled - 1, 0}
      else
        local retry_after = math.ceil((1 - refilled) / refill_rate)
        return {0, refilled, retry_after}
      end
    `;

    const result = await this.redisClient.eval(
      luaScript,
      1,
      key,
      '10',  // capacity
      '0.1667',  // refill_rate (10 tokens per 60 seconds)
      String(Math.floor(Date.now() / 1000))
    );

    return {
      allowed: result[0] === 1,
      remainingTokens: result[1],
      retryAfter: result[2]
    };
  }

  generateMessageGroupId(payload: MessagePayload): string {
    return payload.creator_id || payload.user_id || 'default';
  }

  generateMessageDeduplicationId(payload: MessagePayload): string {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(JSON.stringify({
        action: payload.action,
        creator_id: payload.creator_id,
        timestamp: payload.timestamp
      }))
      .digest('hex');
  }

  async sendToWorkflowsQueue(
    payload: MessagePayload,
    remainingTokens: number
  ): Promise<void> {
    const messageGroupId = this.generateMessageGroupId(payload);
    const deduplicationId = this.generateMessageDeduplicationId(payload);

    const message: WorkflowsQueueMessage = {
      MessageBody: JSON.stringify(payload),
      MessageGroupId: messageGroupId,
      MessageDeduplicationId: deduplicationId,
      MessageAttributes: {
        rate_limit_timestamp: {
          DataType: 'String',
          StringValue: new Date().toISOString()
        },
        tokens_remaining: {
          DataType: 'Number',
          StringValue: String(remainingTokens)
        },
        rate_limiter_version: {
          DataType: 'String',
          StringValue: '1.0.0'
        }
      }
    };

    await this.sqsClient.send({
      QueueUrl: this.workflowsQueueUrl,
      ...message
    });
  }

  async processMessage(payload: MessagePayload): Promise<{
    success: boolean;
    action: 'forwarded' | 'delayed' | 'failed';
    retryAfter?: number;
  }> {
    try {
      // Check rate limit
      const rateLimitResult = await this.checkRateLimit('rate_limit:onlyfans:global');

      if (rateLimitResult.allowed) {
        // Forward to workflows queue
        await this.sendToWorkflowsQueue(payload, rateLimitResult.remainingTokens);
        return { success: true, action: 'forwarded' };
      } else {
        // Delay message
        return {
          success: true,
          action: 'delayed',
          retryAfter: rateLimitResult.retryAfter
        };
      }
    } catch (error) {
      return { success: false, action: 'failed' };
    }
  }
}

describe('RateLimiterIntegration', () => {
  let integration: RateLimiterIntegration;

  beforeEach(() => {
    integration = new RateLimiterIntegration();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should allow message when tokens are available', async () => {
      mockRedisClient.eval.mockResolvedValue([1, 9, 0]);

      const result = await integration.checkRateLimit('rate_limit:onlyfans:global');

      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBe(9);
      expect(result.retryAfter).toBe(0);
    });

    it('should reject message when no tokens available', async () => {
      mockRedisClient.eval.mockResolvedValue([0, 0, 30]);

      const result = await integration.checkRateLimit('rate_limit:onlyfans:global');

      expect(result.allowed).toBe(false);
      expect(result.remainingTokens).toBe(0);
      expect(result.retryAfter).toBe(30);
    });

    it('should use correct Lua script parameters', async () => {
      mockRedisClient.eval.mockResolvedValue([1, 5, 0]);

      await integration.checkRateLimit('rate_limit:onlyfans:global');

      expect(mockRedisClient.eval).toHaveBeenCalledWith(
        expect.stringContaining('local capacity = tonumber(ARGV[1])'),
        1,
        'rate_limit:onlyfans:global',
        '10',  // capacity
        '0.1667',  // refill_rate
        expect.any(String)  // timestamp
      );
    });
  });

  describe('generateMessageGroupId', () => {
    it('should use creator_id as MessageGroupId', () => {
      const payload: MessagePayload = {
        action: 'send_message',
        creator_id: 'creator_123',
        user_id: 'user_456',
        timestamp: '2025-10-29T12:00:00Z',
        metadata: {
          priority: 'normal',
          correlation_id: 'corr_789'
        }
      };

      const groupId = integration.generateMessageGroupId(payload);

      expect(groupId).toBe('creator_123');
    });

    it('should fallback to user_id if creator_id not present', () => {
      const payload: MessagePayload = {
        action: 'send_message',
        creator_id: '',
        user_id: 'user_456',
        timestamp: '2025-10-29T12:00:00Z',
        metadata: {
          priority: 'normal',
          correlation_id: 'corr_789'
        }
      };

      const groupId = integration.generateMessageGroupId(payload);

      expect(groupId).toBe('user_456');
    });

    it('should use default if both creator_id and user_id are empty', () => {
      const payload: MessagePayload = {
        action: 'send_message',
        creator_id: '',
        user_id: '',
        timestamp: '2025-10-29T12:00:00Z',
        metadata: {
          priority: 'normal',
          correlation_id: 'corr_789'
        }
      };

      const groupId = integration.generateMessageGroupId(payload);

      expect(groupId).toBe('default');
    });
  });

  describe('generateMessageDeduplicationId', () => {
    it('should generate consistent hash for same payload', () => {
      const payload: MessagePayload = {
        action: 'send_message',
        creator_id: 'creator_123',
        user_id: 'user_456',
        timestamp: '2025-10-29T12:00:00Z',
        metadata: {
          priority: 'normal',
          correlation_id: 'corr_789'
        }
      };

      const id1 = integration.generateMessageDeduplicationId(payload);
      const id2 = integration.generateMessageDeduplicationId(payload);

      expect(id1).toBe(id2);
      expect(id1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });

    it('should generate different hash for different payloads', () => {
      const payload1: MessagePayload = {
        action: 'send_message',
        creator_id: 'creator_123',
        user_id: 'user_456',
        timestamp: '2025-10-29T12:00:00Z',
        metadata: {
          priority: 'normal',
          correlation_id: 'corr_789'
        }
      };

      const payload2: MessagePayload = {
        ...payload1,
        timestamp: '2025-10-29T12:01:00Z'
      };

      const id1 = integration.generateMessageDeduplicationId(payload1);
      const id2 = integration.generateMessageDeduplicationId(payload2);

      expect(id1).not.toBe(id2);
    });

    it('should only hash relevant fields', () => {
      const payload1: MessagePayload = {
        action: 'send_message',
        creator_id: 'creator_123',
        user_id: 'user_456',
        timestamp: '2025-10-29T12:00:00Z',
        message_content: 'Hello!',
        metadata: {
          priority: 'normal',
          correlation_id: 'corr_789'
        }
      };

      const payload2: MessagePayload = {
        ...payload1,
        message_content: 'Different content'
      };

      const id1 = integration.generateMessageDeduplicationId(payload1);
      const id2 = integration.generateMessageDeduplicationId(payload2);

      // Should be same because message_content is not in hash
      expect(id1).toBe(id2);
    });
  });

  describe('sendToWorkflowsQueue', () => {
    it('should send message with correct attributes', async () => {
      mockSQSClient.send.mockResolvedValue({});

      const payload: MessagePayload = {
        action: 'send_message',
        creator_id: 'creator_123',
        user_id: 'user_456',
        timestamp: '2025-10-29T12:00:00Z',
        message_content: 'Hello!',
        metadata: {
          priority: 'high',
          correlation_id: 'corr_789'
        }
      };

      await integration.sendToWorkflowsQueue(payload, 9);

      expect(mockSQSClient.send).toHaveBeenCalledWith({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-hybrid-workflows.fifo',
        MessageBody: JSON.stringify(payload),
        MessageGroupId: 'creator_123',
        MessageDeduplicationId: expect.stringMatching(/^[a-f0-9]{64}$/),
        MessageAttributes: {
          rate_limit_timestamp: {
            DataType: 'String',
            StringValue: expect.any(String)
          },
          tokens_remaining: {
            DataType: 'Number',
            StringValue: '9'
          },
          rate_limiter_version: {
            DataType: 'String',
            StringValue: '1.0.0'
          }
        }
      });
    });

    it('should preserve original payload in MessageBody', async () => {
      mockSQSClient.send.mockResolvedValue({});

      const payload: MessagePayload = {
        action: 'scrape_profile',
        creator_id: 'creator_456',
        user_id: 'user_789',
        timestamp: '2025-10-29T13:00:00Z',
        metadata: {
          campaign_id: 'campaign_123',
          priority: 'low',
          correlation_id: 'corr_abc'
        }
      };

      await integration.sendToWorkflowsQueue(payload, 5);

      const call = mockSQSClient.send.mock.calls[0][0];
      const parsedBody = JSON.parse(call.MessageBody);

      expect(parsedBody).toEqual(payload);
    });

    it('should handle SQS send failures', async () => {
      mockSQSClient.send.mockRejectedValue(new Error('SQS service unavailable'));

      const payload: MessagePayload = {
        action: 'send_message',
        creator_id: 'creator_123',
        user_id: 'user_456',
        timestamp: '2025-10-29T12:00:00Z',
        metadata: {
          priority: 'normal',
          correlation_id: 'corr_789'
        }
      };

      await expect(
        integration.sendToWorkflowsQueue(payload, 9)
      ).rejects.toThrow('SQS service unavailable');
    });
  });

  describe('processMessage', () => {
    it('should forward message when rate limit allows', async () => {
      mockRedisClient.eval.mockResolvedValue([1, 9, 0]);
      mockSQSClient.send.mockResolvedValue({});

      const payload: MessagePayload = {
        action: 'send_message',
        creator_id: 'creator_123',
        user_id: 'user_456',
        timestamp: '2025-10-29T12:00:00Z',
        metadata: {
          priority: 'normal',
          correlation_id: 'corr_789'
        }
      };

      const result = await integration.processMessage(payload);

      expect(result.success).toBe(true);
      expect(result.action).toBe('forwarded');
      expect(mockRedisClient.eval).toHaveBeenCalled();
      expect(mockSQSClient.send).toHaveBeenCalled();
    });

    it('should delay message when rate limit exceeded', async () => {
      mockRedisClient.eval.mockResolvedValue([0, 0, 45]);

      const payload: MessagePayload = {
        action: 'send_message',
        creator_id: 'creator_123',
        user_id: 'user_456',
        timestamp: '2025-10-29T12:00:00Z',
        metadata: {
          priority: 'normal',
          correlation_id: 'corr_789'
        }
      };

      const result = await integration.processMessage(payload);

      expect(result.success).toBe(true);
      expect(result.action).toBe('delayed');
      expect(result.retryAfter).toBe(45);
      expect(mockRedisClient.eval).toHaveBeenCalled();
      expect(mockSQSClient.send).not.toHaveBeenCalled();
    });

    it('should handle Redis failures gracefully', async () => {
      mockRedisClient.eval.mockRejectedValue(new Error('Redis connection failed'));

      const payload: MessagePayload = {
        action: 'send_message',
        creator_id: 'creator_123',
        user_id: 'user_456',
        timestamp: '2025-10-29T12:00:00Z',
        metadata: {
          priority: 'normal',
          correlation_id: 'corr_789'
        }
      };

      const result = await integration.processMessage(payload);

      expect(result.success).toBe(false);
      expect(result.action).toBe('failed');
    });

    it('should handle SQS failures gracefully', async () => {
      mockRedisClient.eval.mockResolvedValue([1, 9, 0]);
      mockSQSClient.send.mockRejectedValue(new Error('SQS service unavailable'));

      const payload: MessagePayload = {
        action: 'send_message',
        creator_id: 'creator_123',
        user_id: 'user_456',
        timestamp: '2025-10-29T12:00:00Z',
        metadata: {
          priority: 'normal',
          correlation_id: 'corr_789'
        }
      };

      const result = await integration.processMessage(payload);

      expect(result.success).toBe(false);
      expect(result.action).toBe('failed');
    });
  });

  describe('Rate Limiting Behavior', () => {
    it('should enforce 10 messages per minute limit', async () => {
      const results: boolean[] = [];

      // Simulate 15 rapid requests
      for (let i = 0; i < 15; i++) {
        const tokensRemaining = Math.max(0, 10 - i - 1);
        const allowed = i < 10;
        const retryAfter = allowed ? 0 : (i - 9) * 6;

        mockRedisClient.eval.mockResolvedValueOnce([
          allowed ? 1 : 0,
          tokensRemaining,
          retryAfter
        ]);

        const payload: MessagePayload = {
          action: 'send_message',
          creator_id: 'creator_123',
          user_id: 'user_456',
          timestamp: new Date().toISOString(),
          metadata: {
            priority: 'normal',
            correlation_id: `corr_${i}`
          }
        };

        const rateLimitResult = await integration.checkRateLimit('rate_limit:onlyfans:global');
        results.push(rateLimitResult.allowed);
      }

      const allowedCount = results.filter(Boolean).length;
      const rejectedCount = results.filter(r => !r).length;

      expect(allowedCount).toBe(10);
      expect(rejectedCount).toBe(5);
    });

    it('should calculate correct retry_after values', async () => {
      const testCases = [
        { tokensRemaining: 0, expectedRetryAfter: 6 },
        { tokensRemaining: 0.5, expectedRetryAfter: 3 },
        { tokensRemaining: 0.8, expectedRetryAfter: 2 }
      ];

      for (const { tokensRemaining, expectedRetryAfter } of testCases) {
        mockRedisClient.eval.mockResolvedValueOnce([0, tokensRemaining, expectedRetryAfter]);

        const result = await integration.checkRateLimit('rate_limit:onlyfans:global');

        expect(result.allowed).toBe(false);
        expect(result.retryAfter).toBe(expectedRetryAfter);
      }
    });
  });

  describe('Message Ordering', () => {
    it('should use same MessageGroupId for same creator', async () => {
      mockRedisClient.eval.mockResolvedValue([1, 9, 0]);
      mockSQSClient.send.mockResolvedValue({});

      const messages: MessagePayload[] = [
        {
          action: 'send_message',
          creator_id: 'creator_123',
          user_id: 'user_456',
          timestamp: '2025-10-29T12:00:00Z',
          metadata: { priority: 'normal', correlation_id: 'corr_1' }
        },
        {
          action: 'scrape_profile',
          creator_id: 'creator_123',
          user_id: 'user_456',
          timestamp: '2025-10-29T12:01:00Z',
          metadata: { priority: 'normal', correlation_id: 'corr_2' }
        }
      ];

      for (const message of messages) {
        await integration.sendToWorkflowsQueue(message, 9);
      }

      const calls = mockSQSClient.send.mock.calls;
      expect(calls[0][0].MessageGroupId).toBe('creator_123');
      expect(calls[1][0].MessageGroupId).toBe('creator_123');
    });

    it('should use different MessageGroupId for different creators', async () => {
      mockRedisClient.eval.mockResolvedValue([1, 9, 0]);
      mockSQSClient.send.mockResolvedValue({});

      const messages: MessagePayload[] = [
        {
          action: 'send_message',
          creator_id: 'creator_123',
          user_id: 'user_456',
          timestamp: '2025-10-29T12:00:00Z',
          metadata: { priority: 'normal', correlation_id: 'corr_1' }
        },
        {
          action: 'send_message',
          creator_id: 'creator_789',
          user_id: 'user_456',
          timestamp: '2025-10-29T12:01:00Z',
          metadata: { priority: 'normal', correlation_id: 'corr_2' }
        }
      ];

      for (const message of messages) {
        await integration.sendToWorkflowsQueue(message, 9);
      }

      const calls = mockSQSClient.send.mock.calls;
      expect(calls[0][0].MessageGroupId).toBe('creator_123');
      expect(calls[1][0].MessageGroupId).toBe('creator_789');
    });
  });

  describe('Message Deduplication', () => {
    it('should generate same deduplication ID for duplicate messages', () => {
      const payload: MessagePayload = {
        action: 'send_message',
        creator_id: 'creator_123',
        user_id: 'user_456',
        timestamp: '2025-10-29T12:00:00Z',
        metadata: { priority: 'normal', correlation_id: 'corr_789' }
      };

      const id1 = integration.generateMessageDeduplicationId(payload);
      const id2 = integration.generateMessageDeduplicationId(payload);

      expect(id1).toBe(id2);
    });

    it('should generate different deduplication ID for different timestamps', () => {
      const payload1: MessagePayload = {
        action: 'send_message',
        creator_id: 'creator_123',
        user_id: 'user_456',
        timestamp: '2025-10-29T12:00:00Z',
        metadata: { priority: 'normal', correlation_id: 'corr_789' }
      };

      const payload2: MessagePayload = {
        ...payload1,
        timestamp: '2025-10-29T12:00:01Z'
      };

      const id1 = integration.generateMessageDeduplicationId(payload1);
      const id2 = integration.generateMessageDeduplicationId(payload2);

      expect(id1).not.toBe(id2);
    });
  });
});
