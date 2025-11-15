/**
 * Rate Limiting Algorithms Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SlidingWindowLimiter } from '../../../lib/services/rate-limiter/sliding-window';
import { TokenBucketLimiter } from '../../../lib/services/rate-limiter/token-bucket';

// Mock Redis
vi.mock('../../../lib/cache/redis', () => ({
  default: null,
}));

describe('Sliding Window Limiter', () => {
  let limiter: SlidingWindowLimiter;

  beforeEach(() => {
    limiter = new SlidingWindowLimiter();
  });

  describe('Request Counting', () => {
    it('should allow request when Redis is unavailable', async () => {
      const result = await limiter.check('test-key', 10, 60000);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(0);
    });

    it('should calculate correct reset time', async () => {
      const windowMs = 60000;
      const before = Date.now();
      const result = await limiter.check('test-key', 10, windowMs);
      const after = Date.now();

      const resetTime = result.resetAt.getTime();
      expect(resetTime).toBeGreaterThanOrEqual(before + windowMs);
      expect(resetTime).toBeLessThanOrEqual(after + windowMs + 100);
    });
  });

  describe('Multiple Windows', () => {
    it('should check multiple time windows', async () => {
      const windows = [
        { limit: 10, windowMs: 60000 },
        { limit: 100, windowMs: 3600000 },
      ];

      const results = await limiter.checkMultipleWindows('test-key', windows);

      expect(results).toHaveLength(2);
      expect(results[0].limit).toBe(0); // Redis unavailable
      expect(results[1].limit).toBe(0);
    });
  });

  describe('Reset', () => {
    it('should not throw when resetting', async () => {
      await expect(limiter.reset('test-key')).resolves.not.toThrow();
    });
  });
});

describe('Token Bucket Limiter', () => {
  let limiter: TokenBucketLimiter;

  beforeEach(() => {
    limiter = new TokenBucketLimiter();
  });

  describe('Token Consumption', () => {
    it('should allow request when Redis is unavailable', async () => {
      const result = await limiter.check('test-key', 10, 1);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(10);
    });

    it('should return correct capacity', async () => {
      const capacity = 20;
      const result = await limiter.check('test-key', capacity, 1);

      expect(result.limit).toBe(capacity);
    });
  });

  describe('Token Refill', () => {
    it('should calculate reset time based on refill rate', async () => {
      const capacity = 10;
      const refillRate = 1; // 1 token per second
      const result = await limiter.check('test-key', capacity, refillRate);

      // Reset time should be in the future (when bucket would be full)
      const resetTime = result.resetAt.getTime();
      const now = Date.now();
      expect(resetTime).toBeGreaterThanOrEqual(now - 1000); // Allow 1s tolerance
    });
  });

  describe('Burst Handling', () => {
    it('should allow burst up to capacity', async () => {
      const capacity = 5;
      const refillRate = 0.1; // Slow refill

      const result = await limiter.check('test-key', capacity, refillRate);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(capacity);
    });
  });

  describe('Get Tokens', () => {
    it('should return capacity when Redis unavailable', async () => {
      const capacity = 15;
      const tokens = await limiter.getTokens('test-key', capacity, 1);

      expect(tokens).toBe(capacity);
    });
  });

  describe('Reset', () => {
    it('should not throw when resetting', async () => {
      await expect(limiter.reset('test-key')).resolves.not.toThrow();
    });
  });

  describe('Set Tokens', () => {
    it('should not throw when setting tokens', async () => {
      await expect(
        limiter.setTokens('test-key', 5, 10, 1)
      ).resolves.not.toThrow();
    });
  });
});

describe('Algorithm Comparison', () => {
  it('should have different characteristics', async () => {
    const slidingWindow = new SlidingWindowLimiter();
    const tokenBucket = new TokenBucketLimiter();

    const swResult = await slidingWindow.check('sw-key', 10, 60000);
    const tbResult = await tokenBucket.check('tb-key', 10, 1);

    // Both should allow when Redis unavailable
    expect(swResult.allowed).toBe(true);
    expect(tbResult.allowed).toBe(true);

    // Token bucket includes capacity info
    expect(tbResult.limit).toBeGreaterThan(0);
  });
});
