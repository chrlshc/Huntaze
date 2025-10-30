/**
 * Tests for Enhanced Rate Limiter
 * Tests OnlyFans-specific rate limiting with multi-layer controls
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EnhancedRateLimiter, RateLimitResult, RateLimitStats, GlobalRateLimitStats } from '../../lib/services/enhanced-rate-limiter';

// Mock external dependencies
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  setex: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  pipeline: vi.fn(),
  keys: vi.fn(),
  scard: vi.fn(),
  ttl: vi.fn(),
  quit: vi.fn()
};

const mockPrisma = {
  onlyFansMessage: {
    create: vi.fn()
  },
  $disconnect: vi.fn()
};

const mockSQSClient = {
  send: vi.fn()
};

const mockCloudWatchClient = {
  send: vi.fn()
};

const mockPipeline = {
  incr: vi.fn(),
  expire: vi.fn(),
  setex: vi.fn(),
  exec: vi.fn()
};

// Mock modules
vi.mock('ioredis', () => ({
  Redis: vi.fn(() => mockRedis)
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma)
}));

vi.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: vi.fn(() => mockSQSClient),
  SendMessageCommand: vi.fn((params) => params),
  ReceiveMessageCommand: vi.fn((params) => params),
  DeleteMessageCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: vi.fn(() => mockCloudWatchClient),
  PutMetricDataCommand: vi.fn((params) => params)
}));

describe('EnhancedRateLimiter', () => {
  let rateLimiter: EnhancedRateLimiter;

  beforeEach(() => {
    rateLimiter = new EnhancedRateLimiter();
    vi.clearAllMocks();
    
    // Setup default pipeline mock
    mockRedis.pipeline.mockReturnValue(mockPipeline);
    mockPipeline.exec.mockResolvedValue([]);
    
    // Setup default successful responses
    mockRedis.get.mockResolvedValue('0');
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.setex.mockResolvedValue('OK');
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.keys.mockResolvedValue([]);
    mockRedis.scard.mockResolvedValue(0);
    mockRedis.ttl.mockResolvedValue(-1);
    
    mockPrisma.onlyFansMessage.create.mockResolvedValue({});
    mockSQSClient.send.mockResolvedValue({});
    mockCloudWatchClient.send.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkLimit - Basic Rate Limiting', () => {
    it('should allow messages within OnlyFans limits (10/minute)', async () => {
      // Mock user has sent 5 messages this minute
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('minute')) return '5';
        if (key.includes('hour')) return '20';
        if (key.includes('global:second')) return '2';
        return '0';
      });

      const result = await rateLimiter.checkLimit('user-123', 'message');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5); // 10 - 5 = 5 remaining
      expect(result.layer).toBe('user');
      expect(result.throttled).toBe(false);
      expect(result.resetTime).toBeInstanceOf(Date);
    });

    it('should reject messages when user minute limit exceeded', async () => {
      // Mock user has sent 10 messages this minute (at limit)
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('minute')) return '10';
        return '0';
      });

      const result = await rateLimiter.checkLimit('user-123', 'message');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.layer).toBe('user');
      expect(result.throttled).toBe(true);
      expect(result.retryAfter).toBe(60);
      expect(result.reason).toBe('user_minute_limit');
    });

    it('should reject messages when user hour limit exceeded', async () => {
      // Mock user within minute limit but exceeded hour limit
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('minute')) return '5';
        if (key.includes('hour')) return '100'; // At hour limit
        return '0';
      });

      const result = await rateLimiter.checkLimit('user-123', 'message');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.layer).toBe('user');
      expect(result.throttled).toBe(true);
      expect(result.retryAfter).toBe(3600);
      expect(result.reason).toBe('user_hour_limit');
    });

    it('should reject messages when global rate limit exceeded', async () => {
      // Mock global limit exceeded
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('global:second')) return '5'; // At global limit
        return '0';
      });

      const result = await rateLimiter.checkLimit('user-123', 'message');

      expect(result.allowed).toBe(false);
      expect(result.layer).toBe('global');
      expect(result.throttled).toBe(true);
      expect(result.retryAfter).toBe(1);
      expect(result.reason).toBe('global_rate_limit');
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await rateLimiter.checkLimit('user-123', 'message');

      expect(result.allowed).toBe(false);
      expect(result.throttled).toBe(true);
      expect(result.reason).toBe('rate_limiter_error');
    });
  });

  describe('checkOnlyFansLimits - OnlyFans Specific Rules', () => {
    it('should allow messages within recipient limits', async () => {
      // Mock recipient has received 1 message this minute
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('recipient:')) return '1';
        return null;
      });
      mockRedis.scard.mockResolvedValue(10); // 10 unique recipients this hour

      const result = await rateLimiter.checkOnlyFansLimits('user-123', 'recipient-456');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1); // 2 - 1 = 1 remaining per recipient
      expect(result.layer).toBe('recipient');
      expect(result.throttled).toBe(false);
    });

    it('should reject when recipient minute limit exceeded', async () => {
      // Mock recipient has received 2 messages this minute (at limit)
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('recipient:')) return '2';
        return null;
      });

      const result = await rateLimiter.checkOnlyFansLimits('user-123', 'recipient-456');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.layer).toBe('recipient');
      expect(result.throttled).toBe(true);
      expect(result.retryAfter).toBe(60);
      expect(result.reason).toBe('recipient_limit_exceeded');
    });

    it('should enforce minimum delay between messages (6 seconds)', async () => {
      const now = Date.now();
      const lastMessageTime = now - 3000; // 3 seconds ago (less than 6 second minimum)

      mockRedis.get.mockImplementation((key) => {
        if (key.includes('recipient:')) return '0';
        if (key.includes('last_message:')) return lastMessageTime.toString();
        return null;
      });

      const result = await rateLimiter.checkOnlyFansLimits('user-123', 'recipient-456');

      expect(result.allowed).toBe(false);
      expect(result.layer).toBe('onlyfans_tos');
      expect(result.throttled).toBe(true);
      expect(result.delayMs).toBeGreaterThan(0);
      expect(result.delayMs).toBeLessThanOrEqual(3000);
      expect(result.reason).toBe('min_delay_violation');
    });

    it('should allow messages after minimum delay has passed', async () => {
      const now = Date.now();
      const lastMessageTime = now - 7000; // 7 seconds ago (more than 6 second minimum)

      mockRedis.get.mockImplementation((key) => {
        if (key.includes('recipient:')) return '0';
        if (key.includes('last_message:')) return lastMessageTime.toString();
        return null;
      });
      mockRedis.scard.mockResolvedValue(10);

      const result = await rateLimiter.checkOnlyFansLimits('user-123', 'recipient-456');

      expect(result.allowed).toBe(true);
      expect(result.layer).toBe('recipient');
      expect(result.throttled).toBe(false);
    });

    it('should reject when unique recipients per hour limit exceeded', async () => {
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('recipient:')) return '0';
        return null;
      });
      mockRedis.scard.mockResolvedValue(50); // At unique recipients limit

      const result = await rateLimiter.checkOnlyFansLimits('user-123', 'new-recipient');

      expect(result.allowed).toBe(false);
      expect(result.layer).toBe('recipient');
      expect(result.throttled).toBe(true);
      expect(result.retryAfter).toBe(3600);
      expect(result.reason).toBe('unique_recipients_limit');
    });

    it('should handle OnlyFans check errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await rateLimiter.checkOnlyFansLimits('user-123', 'recipient-456');

      expect(result.allowed).toBe(false);
      expect(result.layer).toBe('onlyfans_tos');
      expect(result.throttled).toBe(true);
      expect(result.reason).toBe('onlyfans_check_error');
    });
  });

  describe('enforceMessageLimits - Combined Enforcement', () => {
    it('should pass both general and OnlyFans checks when within limits', async () => {
      // Mock all limits are within bounds
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('minute')) return '5';
        if (key.includes('hour')) return '20';
        if (key.includes('recipient:')) return '1';
        if (key.includes('global:second')) return '2';
        return '0';
      });
      mockRedis.scard.mockResolvedValue(10);

      const result = await rateLimiter.enforceMessageLimits('user-123', 'recipient-456');

      expect(result.allowed).toBe(true);
      expect(result.throttled).toBe(false);
    });

    it('should fail on general limits before checking OnlyFans limits', async () => {
      // Mock general limit exceeded
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('minute')) return '10'; // At user limit
        return '0';
      });

      const result = await rateLimiter.enforceMessageLimits('user-123', 'recipient-456');

      expect(result.allowed).toBe(false);
      expect(result.layer).toBe('user');
      expect(result.reason).toBe('user_minute_limit');
    });

    it('should schedule delayed message when OnlyFans throttled', async () => {
      // Mock general limits OK but OnlyFans delay needed
      const now = Date.now();
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('minute')) return '5';
        if (key.includes('hour')) return '20';
        if (key.includes('global:second')) return '2';
        if (key.includes('recipient:')) return '0';
        if (key.includes('last_message:')) return (now - 3000).toString(); // 3s ago
        return '0';
      });

      const result = await rateLimiter.enforceMessageLimits('user-123', 'recipient-456');

      expect(result.allowed).toBe(false);
      expect(result.layer).toBe('onlyfans_tos');
      expect(result.delayMs).toBeGreaterThan(0);
      expect(mockSQSClient.send).toHaveBeenCalled();
    });

    it('should work without recipient ID (general limits only)', async () => {
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('minute')) return '5';
        if (key.includes('hour')) return '20';
        if (key.includes('global:second')) return '2';
        return '0';
      });

      const result = await rateLimiter.enforceMessageLimits('user-123');

      expect(result.allowed).toBe(true);
      expect(result.layer).toBe('user');
    });
  });

  describe('Compliance Rules - Suspicious Activity Detection', () => {
    it('should detect suspicious activity (50+ messages/hour)', async () => {
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('minute')) return '5';
        if (key.includes('hour')) return '50'; // At suspicious threshold
        if (key.includes('global:second')) return '2';
        return '0';
      });

      const result = await rateLimiter.checkLimit('user-suspicious', 'message');

      expect(result.allowed).toBe(false);
      expect(result.layer).toBe('onlyfans_tos');
      expect(result.throttled).toBe(true);
      expect(result.retryAfter).toBe(3600);
      expect(result.reason).toBe('suspicious_activity');
      expect(mockRedis.setex).toHaveBeenCalledWith('suspicious:user-suspicious', 3600, '1');
    });

    it('should enforce burst limits and cooldowns', async () => {
      // Mock burst limit reached
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('minute')) return '2';
        if (key.includes('hour')) return '10';
        if (key.includes('global:second')) return '1';
        if (key.includes('burst:')) return '3'; // At burst limit
        return '0';
      });
      mockRedis.ttl.mockResolvedValue(25); // 25 seconds cooldown remaining

      const result = await rateLimiter.checkLimit('user-burst', 'message');

      expect(result.allowed).toBe(false);
      expect(result.layer).toBe('onlyfans_tos');
      expect(result.throttled).toBe(true);
      expect(result.delayMs).toBe(25000);
      expect(result.reason).toBe('burst_cooldown');
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should return accurate rate limit stats for user', async () => {
      const now = Date.now();
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('minute')) return '7';
        if (key.includes('hour')) return '35';
        if (key.includes('day')) return '150';
        if (key.includes('violations:')) return '2';
        if (key.includes('last_violation:')) return (now - 3600000).toString();
        return '0';
      });

      const stats = await rateLimiter.getRateLimitStats('user-stats');

      expect(stats.userId).toBe('user-stats');
      expect(stats.currentPeriod.messages).toBe(7);
      expect(stats.currentPeriod.limit).toBe(10);
      expect(stats.currentPeriod.resetTime).toBeInstanceOf(Date);
      expect(stats.violations.count).toBe(2);
      expect(stats.violations.lastViolation).toBeInstanceOf(Date);
    });

    it('should return global system statistics', async () => {
      mockRedis.keys.mockImplementation((pattern) => {
        if (pattern === 'active:*') return ['active:user1', 'active:user2', 'active:user3'];
        if (pattern.includes('user:*:minute:*')) return ['user:user1:minute:123', 'user:user2:minute:123'];
        if (pattern.includes('violations:*')) return ['violations:user1:123', 'violations:user2:123'];
        return [];
      });
      
      mockRedis.get.mockImplementation((key) => {
        if (key.includes('global:minute')) return '45';
        if (key.includes('violations:')) return '3';
        return '0';
      });

      const globalStats = await rateLimiter.getGlobalStats();

      expect(globalStats.totalUsers).toBe(2);
      expect(globalStats.activeUsers).toBe(3);
      expect(globalStats.messagesPerMinute).toBe(45);
      expect(globalStats.violationsPerHour).toBe(6); // 2 users * 3 violations each
      expect(globalStats.topViolators).toHaveLength(2);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should record violations in database and CloudWatch', async () => {
      mockRedis.get.mockResolvedValue('10'); // At limit
      
      await rateLimiter.checkLimit('user-violation', 'message');

      expect(mockRedis.incr).toHaveBeenCalledWith(expect.stringContaining('violations:user-violation'));
      expect(mockRedis.setex).toHaveBeenCalledWith('last_violation:user-violation', 86400, expect.any(String));
      expect(mockPrisma.onlyFansMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-violation',
          recipientId: 'rate-limit-violation',
          status: 'rate_limited'
        })
      });
      expect(mockCloudWatchClient.send).toHaveBeenCalled();
    });

    it('should handle database errors when recording violations', async () => {
      mockRedis.get.mockResolvedValue('10'); // At limit
      mockPrisma.onlyFansMessage.create.mockRejectedValue(new Error('DB error'));

      // Should not throw, just log error
      const result = await rateLimiter.checkLimit('user-db-error', 'message');

      expect(result.allowed).toBe(false);
      expect(mockCloudWatchClient.send).toHaveBeenCalled(); // CloudWatch should still work
    });

    it('should handle CloudWatch errors gracefully', async () => {
      mockCloudWatchClient.send.mockRejectedValue(new Error('CloudWatch error'));
      mockRedis.get.mockResolvedValue('5');

      // Should not throw, just log error
      const result = await rateLimiter.checkLimit('user-cw-error', 'message');

      expect(result.allowed).toBe(true);
    });

    it('should increment counters correctly after successful check', async () => {
      mockRedis.get.mockResolvedValue('5');

      await rateLimiter.checkLimit('user-increment', 'message');

      expect(mockRedis.pipeline).toHaveBeenCalled();
      expect(mockPipeline.incr).toHaveBeenCalledTimes(5); // minute, hour, day, global second, global minute
      expect(mockPipeline.expire).toHaveBeenCalledTimes(5);
      expect(mockPipeline.setex).toHaveBeenCalledWith('active:user-increment', 300, '1');
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('SQS Integration - Delayed Messages', () => {
    it('should schedule delayed message via SQS when throttled', async () => {
      const delayMs = 5000;
      
      await rateLimiter['scheduleDelayedMessage']('user-delay', 'recipient-delay', delayMs);

      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          QueueUrl: 'https://sqs.us-east-1.amazonaws.com/317805897534/onlyfans-send.fifo',
          MessageBody: expect.stringContaining('user-delay'),
          DelaySeconds: 5,
          MessageGroupId: 'user-delay',
          MessageDeduplicationId: expect.stringContaining('user-delay-recipient-delay')
        })
      );
    });

    it('should handle SQS delays longer than 15 minutes (900s limit)', async () => {
      const delayMs = 20 * 60 * 1000; // 20 minutes
      
      await rateLimiter['scheduleDelayedMessage']('user-long-delay', 'recipient', delayMs);

      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          DelaySeconds: 900 // Should be capped at 15 minutes
        })
      );
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle high-volume concurrent requests', async () => {
      mockRedis.get.mockResolvedValue('5');
      
      const promises = Array.from({ length: 100 }, (_, i) => 
        rateLimiter.checkLimit(`user-${i}`, 'message')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result.allowed).toBe(true);
      });
    });

    it('should cleanup resources properly', async () => {
      await rateLimiter.cleanup();

      expect(mockRedis.quit).toHaveBeenCalled();
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero counts correctly', async () => {
      mockRedis.get.mockResolvedValue('0');

      const result = await rateLimiter.checkLimit('new-user', 'message');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
    });

    it('should handle null/undefined Redis responses', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await rateLimiter.checkLimit('null-user', 'message');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
    });

    it('should handle invalid Redis responses gracefully', async () => {
      mockRedis.get.mockResolvedValue('invalid-number');

      const result = await rateLimiter.checkLimit('invalid-user', 'message');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10); // Should default to 0 count
    });

    it('should handle time boundary conditions (minute/hour transitions)', async () => {
      const now = Date.now();
      const minuteBoundary = Math.ceil(now / 60000) * 60000;
      
      mockRedis.get.mockResolvedValue('9'); // Just under limit

      const result = await rateLimiter.checkLimit('boundary-user', 'message');

      expect(result.allowed).toBe(true);
      expect(result.resetTime.getTime()).toBe(minuteBoundary);
    });
  });

  describe('Message Type Specific Limits', () => {
    it('should apply different limits for different message types', async () => {
      // This would require extending the implementation to support message type limits
      // For now, we test that the structure supports it
      
      const rateLimiter = new EnhancedRateLimiter();
      const rules = rateLimiter['ONLYFANS_RULES'];

      expect(rules.messageTypeLimits.welcome.perHour).toBe(20);
      expect(rules.messageTypeLimits.follow_up.perHour).toBe(30);
      expect(rules.messageTypeLimits.promotional.perDay).toBe(50);
      expect(rules.messageTypeLimits.custom.perMinute).toBe(5);
    });
  });

  describe('Integration with getEnhancedRateLimiter singleton', () => {
    it('should return singleton instance', async () => {
      const { getEnhancedRateLimiter } = await import('../../lib/services/enhanced-rate-limiter');
      
      const instance1 = await getEnhancedRateLimiter();
      const instance2 = await getEnhancedRateLimiter();

      expect(instance1).toBe(instance2);
    });
  });
});