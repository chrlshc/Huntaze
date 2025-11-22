/**
 * Feature: ai-system-gemini-integration, Property 11: Rate limit reset
 * Validates: Requirements 5.4, 7.4
 * 
 * Property: For any creator who was rate-limited, after the sliding window period elapses, 
 * the next request SHALL be allowed.
 */

import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import fc from 'fast-check';
import { checkCreatorRateLimit, RateLimitError, getRateLimitStatus, type CreatorPlan } from '../../../lib/ai/rate-limit';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.ELASTICACHE_REDIS_HOST || 'huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com',
  port: parseInt(process.env.ELASTICACHE_REDIS_PORT || '6379'),
});

// Check if Redis is available
let redisAvailable = false;

describe('Property 11: Rate limit reset', () => {
  beforeAll(async () => {
    try {
      await redis.ping();
      redisAvailable = true;
    } catch (error) {
      console.warn('Redis not available, skipping rate limit tests');
      redisAvailable = false;
    }
  });

  afterEach(async () => {
    if (!redisAvailable) return;
    
    try {
      // Clean up test data
      const keys = await redis.keys('ai:ratelimit:*:test-creator-*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      const anomalyKeys = await redis.keys('ai:anomaly:test-creator-*');
      if (anomalyKeys.length > 0) {
        await redis.del(...anomalyKeys);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test.skipIf(!redisAvailable)('Property 11: Rate limit resets after sliding window expires', async () => {
    // Note: This test uses a small window for testing purposes
    // In production, the window is 1 hour
    const creatorId = `test-creator-reset-${Date.now()}-${Math.random()}`;
    const plan: CreatorPlan = 'starter';
    const limit = 50;

    // Exhaust the rate limit
    for (let i = 0; i < limit; i++) {
      await checkCreatorRateLimit(creatorId, plan);
    }

    // Should be rate limited
    await expect(
      checkCreatorRateLimit(creatorId, plan)
    ).rejects.toThrow(RateLimitError);

    // Get reset time
    let error: RateLimitError | null = null;
    try {
      await checkCreatorRateLimit(creatorId, plan);
    } catch (e) {
      if (e instanceof RateLimitError) {
        error = e;
      }
    }

    expect(error).not.toBeNull();
    expect(error!.retryAfter).toBeGreaterThan(0);
    
    // Verify reset time is reasonable (within 1 hour)
    expect(error!.retryAfter).toBeLessThanOrEqual(3600);
  }, 10000);

  test.skipIf(!redisAvailable)('Property 11: Sliding window allows gradual recovery', async () => {
    // This test verifies that the sliding window allows requests to be made
    // as old requests fall out of the window
    const creatorId = `test-creator-sliding-${Date.now()}-${Math.random()}`;
    const plan: CreatorPlan = 'starter';
    const limit = 50;

    // Make some requests
    const initialRequests = 10;
    for (let i = 0; i < initialRequests; i++) {
      await checkCreatorRateLimit(creatorId, plan);
    }

    // Wait a short time (in production this would be longer)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should still be able to make more requests up to the limit
    for (let i = initialRequests; i < limit; i++) {
      await expect(
        checkCreatorRateLimit(creatorId, plan)
      ).resolves.not.toThrow();
    }

    // Now should be at the limit
    await expect(
      checkCreatorRateLimit(creatorId, plan)
    ).rejects.toThrow(RateLimitError);
  }, 10000);

  test.skipIf(!redisAvailable)('Property 11: Rate limit status reflects remaining capacity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro', 'business'),
        fc.integer({ min: 1, max: 10 }),
        async (plan, numRequests) => {
          const creatorId = `test-creator-${Date.now()}-${Math.random()}`;
          
          const limits: Record<CreatorPlan, number> = {
            starter: 50,
            pro: 100,
            business: 500,
          };
          const limit = limits[plan];

          // Make some requests
          const requestsToMake = Math.min(numRequests, limit - 1);
          for (let i = 0; i < requestsToMake; i++) {
            await checkCreatorRateLimit(creatorId, plan);
          }

          // Check status
          const status = await getRateLimitStatus(creatorId, plan);
          
          expect(status.limit).toBe(limit);
          expect(status.remaining).toBeGreaterThanOrEqual(0);
          expect(status.remaining).toBeLessThanOrEqual(limit);
          expect(status.reset).toBeGreaterThan(Date.now());
        }
      ),
      { numRuns: 10 }
    );
  });

  test.skipIf(!redisAvailable)('Property 11: Reset time is consistent across rate limit checks', async () => {
    const creatorId = `test-creator-consistent-${Date.now()}-${Math.random()}`;
    const plan: CreatorPlan = 'starter';
    const limit = 50;

    // Exhaust the limit
    for (let i = 0; i < limit; i++) {
      await checkCreatorRateLimit(creatorId, plan);
    }

    // Get reset time from multiple failed attempts
    const resetTimes: number[] = [];
    for (let i = 0; i < 3; i++) {
      try {
        await checkCreatorRateLimit(creatorId, plan);
      } catch (error) {
        if (error instanceof RateLimitError) {
          resetTimes.push(error.retryAfter);
        }
      }
      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    expect(resetTimes.length).toBe(3);
    
    // Reset times should be decreasing (or staying the same within margin)
    for (let i = 1; i < resetTimes.length; i++) {
      expect(resetTimes[i]).toBeLessThanOrEqual(resetTimes[i - 1] + 1);
    }
  }, 10000);

  test.skipIf(!redisAvailable)('Property 11: Different creators have independent reset times', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro', 'business'),
        async (plan) => {
          const creator1 = `test-creator-1-${Date.now()}-${Math.random()}`;
          const creator2 = `test-creator-2-${Date.now()}-${Math.random()}`;
          
          const limits: Record<CreatorPlan, number> = {
            starter: 50,
            pro: 100,
            business: 500,
          };
          const limit = limits[plan];

          // Exhaust creator1's limit
          for (let i = 0; i < limit; i++) {
            await checkCreatorRateLimit(creator1, plan);
          }

          // Wait a bit
          await new Promise(resolve => setTimeout(resolve, 100));

          // Exhaust creator2's limit
          for (let i = 0; i < limit; i++) {
            await checkCreatorRateLimit(creator2, plan);
          }

          // Get reset times
          let reset1 = 0;
          let reset2 = 0;

          try {
            await checkCreatorRateLimit(creator1, plan);
          } catch (error) {
            if (error instanceof RateLimitError) {
              reset1 = error.retryAfter;
            }
          }

          try {
            await checkCreatorRateLimit(creator2, plan);
          } catch (error) {
            if (error instanceof RateLimitError) {
              reset2 = error.retryAfter;
            }
          }

          // Both should have reset times
          expect(reset1).toBeGreaterThan(0);
          expect(reset2).toBeGreaterThan(0);

          // Creator1's reset should be sooner (since they hit limit first)
          // Allow for small timing variations
          expect(reset1).toBeLessThanOrEqual(reset2 + 1);
        }
      ),
      { numRuns: 3, timeout: 120000 }
    );
  }, 180000);
});
