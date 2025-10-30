/**
 * Integration Tests for Enhanced Rate Limiter
 * Tests integration with Redis, SQS, CloudWatch, and OnlyFans service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EnhancedRateLimiter } from '../../lib/services/enhanced-rate-limiter';

// Mock real Redis client for integration testing
const mockRedisIntegration = {
  connected: true,
  get: vi.fn(),
  set: vi.fn(),
  setex: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  pipeline: vi.fn(),
  keys: vi.fn(),
  scard: vi.fn(),
  ttl: vi.fn(),
  quit: vi.fn(),
  sadd: vi.fn(),
  del: vi.fn()
};

const mockPipelineIntegration = {
  incr: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  setex: vi.fn().mockReturnThis(),
  sadd: vi.fn().mockReturnThis(),
  exec: vi.fn()
};

// Mock AWS services for integration
const mockSQSIntegration = {
  send: vi.fn(),
  config: { region: 'us-east-1' }
};

const mockCloudWatchIntegration = {
  send: vi.fn(),
  config: { region: 'us-east-1' }
};

// Mock Prisma for integration
const mockPrismaIntegration = {
  onlyFansMessage: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn()
  },
  $disconnect: vi.fn()
};

describe('Enhanced Rate Limiter Integration Tests', () => {
  let rateLimiter: EnhancedRateLimiter;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup pipeline mock
    mockRedisIntegration.pipeline.mockReturnValue(mockPipelineIntegration);
    mockPipelineIntegration.exec.mockResolvedValue([
      ['OK'], ['OK'], ['OK'], ['OK'], ['OK'], ['OK']
    ]);
    
    // Setup default Redis responses
    mockRedisIntegration.get.mockResolvedValue('0');
    mockRedisIntegration.incr.mockResolvedValue(1);
    mockRedisIntegration.setex.mockResolvedValue('OK');
    mockRedisIntegration.expire.mockResolvedValue(1);
    mockRedisIntegration.keys.mockResolvedValue([]);
    mockRedisIntegration.scard.mockResolvedValue(0);
    mockRedisIntegration.ttl.mockResolvedValue(-1);
    
    // Setup AWS mocks
    mockSQSIntegration.send.mockResolvedValue({ MessageId: 'test-message-id' });
    mockCloudWatchIntegration.send.mockResolvedValue({});
    
    // Setup Prisma mocks
    mockPrismaIntegration.onlyFansMessage.create.mockResolvedValue({
      id: 'test-message-id',
      workflowId: 'test-workflow',
      userId: 'test-user',
      status: 'rate_limited'
    });

    rateLimiter = new EnhancedRateLimiter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Redis Integration', () => {
    it('should properly interact with Redis for rate limiting', async () => {
      // Simulate user with some existing usage
      mockRedisIntegration.get.mockImplementation((key) => {
        if (key.includes('user:test-user:minute:')) return '3';
        if (key.includes('user:test-user:hour:')) return '15';
        if (key.includes('global:second:')) return '1';
        return '0';
      });

      const result = await rateLimiter.checkLimit('test-user', 'message');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(7); // 10 - 3 = 7

      // Verify Redis interactions
      expect(mockRedisIntegration.get).toHaveBeenCalledWith(
        expect.stringContaining('user:test-user:minute:')
      );
      expect(mockRedisIntegration.get).toHaveBeenCalledWith(
        expect.stringContaining('user:test-user:hour:')
      );
      expect(mockRedisIntegration.get).toHaveBeenCalledWith(
        expect.stringContaining('global:second:')
      );
    });

    it('should handle Redis pipeline operations for counter increments', async () => {
      mockRedisIntegration.get.mockResolvedValue('5');

      await rateLimiter.checkLimit('pipeline-user', 'message');

      expect(mockRedisIntegration.pipeline).toHaveBeenCalled();
      expect(mockPipelineIntegration.incr).toHaveBeenCalledTimes(5);
      expect(mockPipelineIntegration.expire).toHaveBeenCalledTimes(5);
      expect(mockPipelineIntegration.setex).toHaveBeenCalledWith('active:pipeline-user', 300, '1');
      expect(mockPipelineIntegration.exec).toHaveBeenCalled();
    });

    it('should handle Redis connection failures gracefully', async () => {
      mockRedisIntegration.get.mockRejectedValue(new Error('Redis connection lost'));

      const result = await rateLimiter.checkLimit('connection-fail-user', 'message');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('rate_limiter_error');
      expect(result.throttled).toBe(true);
    });

    it('should properly manage Redis key expiration', async () => {
      mockRedisIntegration.get.mockResolvedValue('2');

      await rateLimiter.checkLimit('expiry-user', 'message');

      // Verify TTL is set for different time periods
      expect(mockPipelineIntegration.expire).toHaveBeenCalledWith(
        expect.stringContaining('minute:'), 120
      );
      expect(mockPipelineIntegration.expire).toHaveBeenCalledWith(
        expect.stringContaining('hour:'), 7200
      );
      expect(mockPipelineIntegration.expire).toHaveBeenCalledWith(
        expect.stringContaining('day:'), 172800
      );
    });
  });

  describe('SQS Integration', () => {
    it('should send delayed messages to SQS FIFO queue', async () => {
      const userId = 'sqs-test-user';
      const recipientId = 'sqs-recipient';
      const delayMs = 10000; // 10 seconds

      await rateLimiter['scheduleDelayedMessage'](userId, recipientId, delayMs);

      expect(mockSQSIntegration.send).toHaveBeenCalledWith(
        expect.objectContaining({
          QueueUrl: 'https://sqs.us-east-1.amazonaws.com/317805897534/onlyfans-send.fifo',
          MessageBody: expect.stringContaining(userId),
          DelaySeconds: 10,
          MessageGroupId: userId,
          MessageDeduplicationId: expect.stringContaining(`${userId}-${recipientId}`)
        })
      );
    });

    it('should handle SQS send failures gracefully', async () => {
      mockSQSIntegration.send.mockRejectedValue(new Error('SQS service unavailable'));

      // Should not throw error, just log it
      await expect(
        rateLimiter['scheduleDelayedMessage']('sqs-fail-user', 'recipient', 5000)
      ).resolves.not.toThrow();
    });

    it('should respect SQS delay limits (max 900 seconds)', async () => {
      const longDelayMs = 20 * 60 * 1000; // 20 minutes

      await rateLimiter['scheduleDelayedMessage']('long-delay-user', 'recipient', longDelayMs);

      expect(mockSQSIntegration.send).toHaveBeenCalledWith(
        expect.objectContaining({
          DelaySeconds: 900 // Should be capped at 15 minutes
        })
      );
    });
  });

  describe('CloudWatch Integration', () => {
    it('should send metrics to CloudWatch on successful operations', async () => {
      mockRedisIntegration.get.mockResolvedValue('3');

      await rateLimiter.checkLimit('metrics-user', 'message');

      expect(mockCloudWatchIntegration.send).toHaveBeenCalledWith(
        expect.objectContaining({
          Namespace: 'Huntaze/RateLimiter',
          MetricData: expect.arrayContaining([
            expect.objectContaining({
              MetricName: 'MessagesProcessed',
              Value: 1,
              Unit: 'Count',
              Dimensions: expect.arrayContaining([
                { Name: 'UserId', Value: 'metrics-user' },
                { Name: 'Action', Value: 'message' }
              ])
            })
          ])
        })
      );
    });

    it('should send violation metrics to CloudWatch', async () => {
      mockRedisIntegration.get.mockResolvedValue('10'); // At limit

      await rateLimiter.checkLimit('violation-user', 'message');

      expect(mockCloudWatchIntegration.send).toHaveBeenCalledWith(
        expect.objectContaining({
          Namespace: 'Huntaze/RateLimiter',
          MetricData: expect.arrayContaining([
            expect.objectContaining({
              MetricName: 'RateLimitViolations',
              Value: 1,
              Unit: 'Count',
              Dimensions: expect.arrayContaining([
                { Name: 'UserId', Value: 'violation-user' },
                { Name: 'ViolationType', Value: 'user_limit' },
                { Name: 'Layer', Value: 'user' }
              ])
            })
          ])
        })
      );
    });

    it('should handle CloudWatch failures without affecting rate limiting', async () => {
      mockCloudWatchIntegration.send.mockRejectedValue(new Error('CloudWatch unavailable'));
      mockRedisIntegration.get.mockResolvedValue('5');

      const result = await rateLimiter.checkLimit('cw-fail-user', 'message');

      expect(result.allowed).toBe(true);
      // Rate limiting should still work even if CloudWatch fails
    });
  });

  describe('Database Integration', () => {
    it('should record violations in database', async () => {
      mockRedisIntegration.get.mockResolvedValue('10'); // At limit

      await rateLimiter.checkLimit('db-violation-user', 'message');

      expect(mockPrismaIntegration.onlyFansMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workflowId: expect.stringContaining('violation-'),
          userId: 'db-violation-user',
          recipientId: 'rate-limit-violation',
          content: expect.stringContaining('Rate limit violation'),
          status: 'rate_limited',
          lastError: expect.stringContaining('user_limit'),
          scheduledFor: expect.any(Date)
        })
      });
    });

    it('should handle database connection failures gracefully', async () => {
      mockPrismaIntegration.onlyFansMessage.create.mockRejectedValue(
        new Error('Database connection failed')
      );
      mockRedisIntegration.get.mockResolvedValue('10'); // At limit

      const result = await rateLimiter.checkLimit('db-fail-user', 'message');

      expect(result.allowed).toBe(false);
      // Should still record violation in Redis and CloudWatch
      expect(mockRedisIntegration.incr).toHaveBeenCalled();
      expect(mockCloudWatchIntegration.send).toHaveBeenCalled();
    });
  });

  describe('End-to-End OnlyFans Compliance Scenarios', () => {
    it('should handle complete OnlyFans message flow with all checks', async () => {
      const userId = 'e2e-user';
      const recipientId = 'e2e-recipient';

      // Setup realistic usage patterns
      mockRedisIntegration.get.mockImplementation((key) => {
        if (key.includes(`user:${userId}:minute:`)) return '8'; // Close to limit
        if (key.includes(`user:${userId}:hour:`)) return '45';
        if (key.includes(`recipient:${userId}:${recipientId}:minute`)) return '1';
        if (key.includes(`last_message:${userId}:${recipientId}`)) return (Date.now() - 7000).toString(); // 7s ago
        if (key.includes('global:second:')) return '3';
        return '0';
      });
      mockRedisIntegration.scard.mockResolvedValue(25); // Unique recipients

      const result = await rateLimiter.enforceMessageLimits(userId, recipientId);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // 10 - 8 = 2
      expect(result.layer).toBe('user');
    });

    it('should enforce OnlyFans minimum delay and schedule delayed message', async () => {
      const userId = 'delay-user';
      const recipientId = 'delay-recipient';
      const now = Date.now();

      // Setup scenario where minimum delay is violated
      mockRedisIntegration.get.mockImplementation((key) => {
        if (key.includes(`user:${userId}:minute:`)) return '5';
        if (key.includes(`user:${userId}:hour:`)) return '20';
        if (key.includes(`recipient:${userId}:${recipientId}:minute`)) return '0';
        if (key.includes(`last_message:${userId}:${recipientId}`)) return (now - 2000).toString(); // 2s ago
        if (key.includes('global:second:')) return '2';
        return '0';
      });

      const result = await rateLimiter.enforceMessageLimits(userId, recipientId);

      expect(result.allowed).toBe(false);
      expect(result.layer).toBe('onlyfans_tos');
      expect(result.reason).toBe('min_delay_violation');
      expect(result.delayMs).toBeGreaterThan(0);
      expect(result.delayMs).toBeLessThanOrEqual(4000);

      // Should schedule delayed message
      expect(mockSQSIntegration.send).toHaveBeenCalled();
    });

    it('should detect and handle suspicious activity patterns', async () => {
      const suspiciousUserId = 'suspicious-user';

      // Setup suspicious activity (50+ messages/hour)
      mockRedisIntegration.get.mockImplementation((key) => {
        if (key.includes(`user:${suspiciousUserId}:minute:`)) return '5';
        if (key.includes(`user:${suspiciousUserId}:hour:`)) return '50'; // Suspicious threshold
        if (key.includes('global:second:')) return '2';
        return '0';
      });

      const result = await rateLimiter.checkLimit(suspiciousUserId, 'message');

      expect(result.allowed).toBe(false);
      expect(result.layer).toBe('onlyfans_tos');
      expect(result.reason).toBe('suspicious_activity');
      expect(result.retryAfter).toBe(3600); // 1 hour cooldown

      // Should mark user as suspicious
      expect(mockRedisIntegration.setex).toHaveBeenCalledWith(
        `suspicious:${suspiciousUserId}`, 3600, '1'
      );
    });

    it('should handle burst detection and cooldown enforcement', async () => {
      const burstUserId = 'burst-user';

      // Setup burst scenario
      mockRedisIntegration.get.mockImplementation((key) => {
        if (key.includes(`user:${burstUserId}:minute:`)) return '3';
        if (key.includes(`user:${burstUserId}:hour:`)) return '15';
        if (key.includes(`burst:${burstUserId}`)) return '3'; // At burst limit
        if (key.includes('global:second:')) return '1';
        return '0';
      });
      mockRedisIntegration.ttl.mockResolvedValue(20); // 20 seconds cooldown remaining

      const result = await rateLimiter.checkLimit(burstUserId, 'message');

      expect(result.allowed).toBe(false);
      expect(result.layer).toBe('onlyfans_tos');
      expect(result.reason).toBe('burst_cooldown');
      expect(result.delayMs).toBe(20000);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle concurrent rate limit checks efficiently', async () => {
      const userCount = 50;
      const checksPerUser = 5;

      mockRedisIntegration.get.mockResolvedValue('3'); // Within limits

      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < userCount; i++) {
        for (let j = 0; j < checksPerUser; j++) {
          promises.push(rateLimiter.checkLimit(`load-user-${i}`, 'message'));
        }
      }

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(userCount * checksPerUser);
      results.forEach(result => {
        expect(result.allowed).toBe(true);
      });

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds for 250 checks
    });

    it('should maintain accuracy under concurrent load', async () => {
      const userId = 'concurrent-user';
      let callCount = 0;

      // Mock incremental counter
      mockRedisIntegration.get.mockImplementation((key) => {
        if (key.includes(`user:${userId}:minute:`)) {
          callCount++;
          return callCount.toString();
        }
        return '0';
      });

      const concurrentChecks = 10;
      const promises = Array.from({ length: concurrentChecks }, () =>
        rateLimiter.checkLimit(userId, 'message')
      );

      const results = await Promise.all(promises);

      // All should be allowed since we're mocking incremental counts
      results.forEach(result => {
        expect(result.allowed).toBe(true);
      });

      expect(callCount).toBe(concurrentChecks);
    });
  });

  describe('Statistics Integration', () => {
    it('should provide accurate cross-system statistics', async () => {
      // Setup complex Redis state
      mockRedisIntegration.keys.mockImplementation((pattern) => {
        if (pattern === 'active:*') return ['active:user1', 'active:user2', 'active:user3'];
        if (pattern.includes('user:*:minute:*')) return [
          'user:user1:minute:123',
          'user:user2:minute:123',
          'user:user3:minute:123'
        ];
        if (pattern.includes('violations:*')) return [
          'violations:user1:123',
          'violations:user2:123'
        ];
        return [];
      });

      mockRedisIntegration.get.mockImplementation((key) => {
        if (key.includes('global:minute:')) return '150';
        if (key.includes('violations:user1:')) return '5';
        if (key.includes('violations:user2:')) return '3';
        return '0';
      });

      const globalStats = await rateLimiter.getGlobalStats();

      expect(globalStats.totalUsers).toBe(3);
      expect(globalStats.activeUsers).toBe(3);
      expect(globalStats.messagesPerMinute).toBe(150);
      expect(globalStats.violationsPerHour).toBe(8); // 5 + 3
      expect(globalStats.topViolators).toEqual([
        { userId: 'user1', violations: 5 },
        { userId: 'user2', violations: 3 }
      ]);
    });

    it('should provide detailed user statistics', async () => {
      const userId = 'stats-user';
      const now = Date.now();

      mockRedisIntegration.get.mockImplementation((key) => {
        if (key.includes(`user:${userId}:minute:`)) return '7';
        if (key.includes(`user:${userId}:hour:`)) return '42';
        if (key.includes(`user:${userId}:day:`)) return '180';
        if (key.includes(`violations:${userId}:`)) return '2';
        if (key.includes(`last_violation:${userId}`)) return (now - 1800000).toString(); // 30 min ago
        return '0';
      });

      const userStats = await rateLimiter.getRateLimitStats(userId);

      expect(userStats.userId).toBe(userId);
      expect(userStats.currentPeriod.messages).toBe(7);
      expect(userStats.currentPeriod.limit).toBe(10);
      expect(userStats.violations.count).toBe(2);
      expect(userStats.violations.lastViolation).toBeInstanceOf(Date);
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should properly cleanup all connections', async () => {
      await rateLimiter.cleanup();

      expect(mockRedisIntegration.quit).toHaveBeenCalled();
      expect(mockPrismaIntegration.$disconnect).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockRedisIntegration.quit.mockRejectedValue(new Error('Redis quit failed'));
      mockPrismaIntegration.$disconnect.mockRejectedValue(new Error('Prisma disconnect failed'));

      // Should not throw
      await expect(rateLimiter.cleanup()).resolves.not.toThrow();
    });
  });
});