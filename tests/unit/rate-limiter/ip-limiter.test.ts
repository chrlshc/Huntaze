/**
 * IP Rate Limiter - Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  IPRateLimiter,
  getIPRateLimiter,
  resetIPRateLimiter,
  type IPRateLimitResult,
  type IPViolationMetadata,
} from '@/lib/services/rate-limiter/ip-limiter';

// Mock Redis client
vi.mock('@/lib/cache/redis', () => ({
  default: {
    incr: vi.fn(),
    expire: vi.fn(),
    setex: vi.fn(),
    get: vi.fn(),
    ttl: vi.fn(),
    del: vi.fn(),
  },
}));

describe('IPRateLimiter', () => {
  let limiter: IPRateLimiter;
  let mockRedis: any;

  beforeEach(async () => {
    // Reset singleton
    resetIPRateLimiter();
    
    // Get mock Redis
    const redisModule = await import('@/lib/cache/redis');
    mockRedis = redisModule.default;
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Create limiter with whitelist
    limiter = new IPRateLimiter(['127.0.0.1', '::1']);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Constructor & Initialization
  // ==========================================================================

  describe('Constructor', () => {
    it('should initialize with empty whitelist', () => {
      const limiter = new IPRateLimiter();
      expect(limiter.isWhitelisted('127.0.0.1')).toBe(false);
    });

    it('should initialize with whitelist', () => {
      const limiter = new IPRateLimiter(['127.0.0.1', '192.168.1.1']);
      expect(limiter.isWhitelisted('127.0.0.1')).toBe(true);
      expect(limiter.isWhitelisted('192.168.1.1')).toBe(true);
      expect(limiter.isWhitelisted('10.0.0.1')).toBe(false);
    });
  });

  // ==========================================================================
  // IP Validation
  // ==========================================================================

  describe('isWhitelisted', () => {
    it('should return true for whitelisted IPv4', () => {
      expect(limiter.isWhitelisted('127.0.0.1')).toBe(true);
    });

    it('should return true for whitelisted IPv6', () => {
      // Create limiter with IPv6 localhost in whitelist
      const limiterWithIPv6 = new IPRateLimiter(['127.0.0.1', '::1']);
      expect(limiterWithIPv6.isWhitelisted('::1')).toBe(true);
    });

    it('should return false for non-whitelisted IP', () => {
      expect(limiter.isWhitelisted('192.168.1.1')).toBe(false);
    });

    it('should return false for invalid IP format', () => {
      expect(limiter.isWhitelisted('invalid-ip')).toBe(false);
      expect(limiter.isWhitelisted('999.999.999.999')).toBe(false);
      expect(limiter.isWhitelisted('')).toBe(false);
    });
  });

  // ==========================================================================
  // Track Violation
  // ==========================================================================

  describe('trackViolation', () => {
    it('should track first violation with 60s block', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await limiter.trackViolation('192.168.1.1', 'test-123');

      expect(result).not.toBeNull();
      expect(result?.count).toBe(1);
      expect(result?.blockLevel).toBe(0);
      expect(result?.blockDuration).toBe(60);
      expect(result?.correlationId).toBe('test-123');
      
      expect(mockRedis.incr).toHaveBeenCalledWith('ip:violations:192.168.1.1');
      expect(mockRedis.expire).toHaveBeenCalledWith('ip:violations:192.168.1.1', 3600);
      expect(mockRedis.setex).toHaveBeenCalledWith('ip:blocked:192.168.1.1', 60, 1);
    });

    it('should track second violation with 600s block', async () => {
      mockRedis.incr.mockResolvedValue(2);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await limiter.trackViolation('192.168.1.1');

      expect(result?.count).toBe(2);
      expect(result?.blockLevel).toBe(1);
      expect(result?.blockDuration).toBe(600);
      
      expect(mockRedis.setex).toHaveBeenCalledWith('ip:blocked:192.168.1.1', 600, 2);
    });

    it('should track third violation with 3600s block', async () => {
      mockRedis.incr.mockResolvedValue(3);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await limiter.trackViolation('192.168.1.1');

      expect(result?.count).toBe(3);
      expect(result?.blockLevel).toBe(2);
      expect(result?.blockDuration).toBe(3600);
      
      expect(mockRedis.setex).toHaveBeenCalledWith('ip:blocked:192.168.1.1', 3600, 3);
    });

    it('should cap block level at maximum', async () => {
      mockRedis.incr.mockResolvedValue(10);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await limiter.trackViolation('192.168.1.1');

      expect(result?.blockLevel).toBe(2); // Max level
      expect(result?.blockDuration).toBe(3600); // Max duration
    });

    it('should skip whitelisted IPs', async () => {
      const result = await limiter.trackViolation('127.0.0.1');

      expect(result).toBeNull();
      expect(mockRedis.incr).not.toHaveBeenCalled();
    });

    it('should return null for invalid IP', async () => {
      const result = await limiter.trackViolation('invalid-ip');

      expect(result).toBeNull();
      expect(mockRedis.incr).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Redis connection failed'));

      const result = await limiter.trackViolation('192.168.1.1');

      expect(result).toBeNull();
    });

    it('should generate correlation ID if not provided', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await limiter.trackViolation('192.168.1.1');

      expect(result?.correlationId).toMatch(/^ip-\d+-[a-z0-9]+$/);
    });
  });

  // ==========================================================================
  // Check IP Block
  // ==========================================================================

  describe('checkIPBlock', () => {
    it('should allow non-blocked IP', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await limiter.checkIPBlock('192.168.1.1', 'test-123');

      expect(result.allowed).toBe(true);
      expect(result.violationCount).toBe(0);
      expect(result.blockLevel).toBe(0);
      expect(result.correlationId).toBe('test-123');
    });

    it('should block IP with active block', async () => {
      mockRedis.get.mockResolvedValueOnce(1); // isBlocked
      mockRedis.get.mockResolvedValueOnce(2); // violationCount
      mockRedis.ttl.mockResolvedValue(300); // 5 minutes remaining

      const result = await limiter.checkIPBlock('192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(300);
      expect(result.reason).toContain('5 minutes');
      expect(result.violationCount).toBe(2);
      expect(result.blockLevel).toBe(1);
    });

    it('should always allow whitelisted IPs', async () => {
      const result = await limiter.checkIPBlock('127.0.0.1');

      expect(result.allowed).toBe(true);
      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('should reject invalid IP format', async () => {
      const result = await limiter.checkIPBlock('invalid-ip');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Invalid IP');
      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully (fail open)', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await limiter.checkIPBlock('192.168.1.1');

      expect(result.allowed).toBe(true); // Fail open
      expect(result.violationCount).toBe(0);
    });

    it('should include violation count for non-blocked IP', async () => {
      mockRedis.get.mockResolvedValueOnce(null); // not blocked
      mockRedis.get.mockResolvedValueOnce(2); // violation count

      const result = await limiter.checkIPBlock('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.violationCount).toBe(2);
    });
  });

  // ==========================================================================
  // Clear Violations
  // ==========================================================================

  describe('clearIPViolations', () => {
    it('should clear violations for IP', async () => {
      mockRedis.del.mockResolvedValue(2);

      await limiter.clearIPViolations('192.168.1.1', 'admin-123');

      expect(mockRedis.del).toHaveBeenCalledWith(
        'ip:violations:192.168.1.1',
        'ip:blocked:192.168.1.1'
      );
    });

    it('should handle invalid IP gracefully', async () => {
      await limiter.clearIPViolations('invalid-ip');

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis connection failed'));

      await expect(
        limiter.clearIPViolations('192.168.1.1')
      ).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // Singleton
  // ==========================================================================

  describe('getIPRateLimiter', () => {
    it('should return singleton instance', () => {
      const limiter1 = getIPRateLimiter();
      const limiter2 = getIPRateLimiter();

      expect(limiter1).toBe(limiter2);
    });

    it('should use environment variable for whitelist', () => {
      process.env.RATE_LIMIT_WHITELIST_IPS = '10.0.0.1,10.0.0.2';
      
      resetIPRateLimiter();
      const limiter = getIPRateLimiter();

      expect(limiter.isWhitelisted('10.0.0.1')).toBe(true);
      expect(limiter.isWhitelisted('10.0.0.2')).toBe(true);
      
      delete process.env.RATE_LIMIT_WHITELIST_IPS;
    });

    it('should use provided whitelist over environment', () => {
      process.env.RATE_LIMIT_WHITELIST_IPS = '10.0.0.1';
      
      resetIPRateLimiter();
      const limiter = getIPRateLimiter(['192.168.1.1']);

      expect(limiter.isWhitelisted('192.168.1.1')).toBe(true);
      expect(limiter.isWhitelisted('10.0.0.1')).toBe(false);
      
      delete process.env.RATE_LIMIT_WHITELIST_IPS;
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle IPv6 addresses', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await limiter.trackViolation('2001:0db8:85a3:0000:0000:8a2e:0370:7334');

      expect(result).not.toBeNull();
      expect(result?.ip).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    it('should handle concurrent violations', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.setex.mockResolvedValue('OK');

      const promises = [
        limiter.trackViolation('192.168.1.1'),
        limiter.trackViolation('192.168.1.1'),
        limiter.trackViolation('192.168.1.1'),
      ];

      const results = await Promise.all(promises);

      expect(results.every(r => r !== null)).toBe(true);
    });

    it('should handle very long correlation IDs', async () => {
      const longId = 'x'.repeat(1000);
      mockRedis.get.mockResolvedValue(null);

      const result = await limiter.checkIPBlock('192.168.1.1', longId);

      expect(result.correlationId).toBe(longId);
    });

    it('should handle zero TTL gracefully', async () => {
      mockRedis.get.mockResolvedValueOnce(1);
      mockRedis.get.mockResolvedValueOnce(1);
      mockRedis.ttl.mockResolvedValue(0);

      const result = await limiter.checkIPBlock('192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(0);
    });

    it('should handle negative TTL gracefully', async () => {
      mockRedis.get.mockResolvedValueOnce(1);
      mockRedis.get.mockResolvedValueOnce(1);
      mockRedis.ttl.mockResolvedValue(-1);

      const result = await limiter.checkIPBlock('192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(0);
    });
  });

  // ==========================================================================
  // Retry Logic
  // ==========================================================================

  describe('Retry Logic', () => {
    it('should retry Redis operations on failure', async () => {
      mockRedis.incr
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await limiter.trackViolation('192.168.1.1');

      expect(result).not.toBeNull();
      expect(mockRedis.incr).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retry attempts', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Connection failed'));

      const result = await limiter.trackViolation('192.168.1.1');

      expect(result).toBeNull();
      expect(mockRedis.incr).toHaveBeenCalledTimes(3);
    });
  });
});
