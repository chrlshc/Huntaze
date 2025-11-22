/**
 * Feature: ai-system-gemini-integration, Property 10: Plan-based rate limits
 * Validates: Requirements 5.2, 7.2
 * 
 * Property: For any creator, the enforced rate limit SHALL be 50 req/hour for STARTER, 
 * 100 req/hour for PRO, and 500 req/hour for BUSINESS.
 */

import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import fc from 'fast-check';
import { checkCreatorRateLimit, RateLimitError, type CreatorPlan } from '../../../lib/ai/rate-limit';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.ELASTICACHE_REDIS_HOST || 'huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com',
  port: parseInt(process.env.ELASTICACHE_REDIS_PORT || '6379'),
});

// Check if Redis is available
let redisAvailable = false;

describe('Property 10: Plan-based rate limits', () => {
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

  test.skipIf(!redisAvailable)('Property 10: Each plan enforces its specific rate limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro', 'business'),
        async (plan) => {
          const creatorId = `test-creator-${Date.now()}-${Math.random()}`;
          
          // Expected limits per plan
          const expectedLimits: Record<CreatorPlan, number> = {
            starter: 50,
            pro: 100,
            business: 500,
          };
          const expectedLimit = expectedLimits[plan];

          // Make exactly expectedLimit requests (should all succeed)
          for (let i = 0; i < expectedLimit; i++) {
            await expect(
              checkCreatorRateLimit(creatorId, plan)
            ).resolves.not.toThrow();
          }

          // The next request should be rejected
          try {
            await checkCreatorRateLimit(creatorId, plan);
            expect(false).toBe(true); // Should not reach here
          } catch (error) {
            expect(error).toBeInstanceOf(RateLimitError);
            if (error instanceof RateLimitError) {
              expect(error.limit).toBe(expectedLimit);
            }
          }
        }
      ),
      { numRuns: 3, timeout: 120000 }
    );
  }, 180000);

  test.skipIf(!redisAvailable)('Property 10: Starter plan has 50 req/hour limit', async () => {
    const creatorId = `test-creator-starter-${Date.now()}-${Math.random()}`;
    const plan: CreatorPlan = 'starter';
    const expectedLimit = 50;

    // Make 50 requests (should succeed)
    for (let i = 0; i < expectedLimit; i++) {
      await expect(
        checkCreatorRateLimit(creatorId, plan)
      ).resolves.not.toThrow();
    }

    // 51st request should fail
    await expect(
      checkCreatorRateLimit(creatorId, plan)
    ).rejects.toThrow(RateLimitError);
  }, 60000);

  test.skipIf(!redisAvailable)('Property 10: Pro plan has 100 req/hour limit', async () => {
    const creatorId = `test-creator-pro-${Date.now()}-${Math.random()}`;
    const plan: CreatorPlan = 'pro';
    const expectedLimit = 100;

    // Make 100 requests (should succeed)
    for (let i = 0; i < expectedLimit; i++) {
      await expect(
        checkCreatorRateLimit(creatorId, plan)
      ).resolves.not.toThrow();
    }

    // 101st request should fail
    await expect(
      checkCreatorRateLimit(creatorId, plan)
    ).rejects.toThrow(RateLimitError);
  }, 120000);

  test.skipIf(!redisAvailable)('Property 10: Business plan has 500 req/hour limit', async () => {
    const creatorId = `test-creator-business-${Date.now()}-${Math.random()}`;
    const plan: CreatorPlan = 'business';
    const expectedLimit = 500;

    // Make 500 requests (should succeed)
    for (let i = 0; i < expectedLimit; i++) {
      await expect(
        checkCreatorRateLimit(creatorId, plan)
      ).resolves.not.toThrow();
    }

    // 501st request should fail
    await expect(
      checkCreatorRateLimit(creatorId, plan)
    ).rejects.toThrow(RateLimitError);
  }, 300000); // 5 minutes for 500 requests

  test.skipIf(!redisAvailable)('Property 10: Different plans have different limits for same creator', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<[CreatorPlan, CreatorPlan]>(
          ['starter', 'pro'],
          ['starter', 'business'],
          ['pro', 'business']
        ),
        async ([plan1, plan2]) => {
          const creatorId = `test-creator-${Date.now()}-${Math.random()}`;
          
          const limits: Record<CreatorPlan, number> = {
            starter: 50,
            pro: 100,
            business: 500,
          };

          const limit1 = limits[plan1];
          const limit2 = limits[plan2];

          // Verify limits are different
          expect(limit1).not.toBe(limit2);

          // Make requests up to the smaller limit with plan1
          const smallerLimit = Math.min(limit1, limit2);
          for (let i = 0; i < smallerLimit; i++) {
            await checkCreatorRateLimit(creatorId, plan1);
          }

          // If plan1 has the smaller limit, it should be exhausted
          if (limit1 === smallerLimit) {
            await expect(
              checkCreatorRateLimit(creatorId, plan1)
            ).rejects.toThrow(RateLimitError);
          }

          // Plan2 should have independent tracking
          // (Note: In practice, same creator would have one plan, but this tests isolation)
          const creator2 = `${creatorId}-plan2`;
          await expect(
            checkCreatorRateLimit(creator2, plan2)
          ).resolves.not.toThrow();
        }
      ),
      { numRuns: 3, timeout: 120000 }
    );
  }, 180000);

  test.skipIf(!redisAvailable)('Property 10: Rate limit error includes correct plan limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro', 'business'),
        async (plan) => {
          const creatorId = `test-creator-${Date.now()}-${Math.random()}`;
          
          const expectedLimits: Record<CreatorPlan, number> = {
            starter: 50,
            pro: 100,
            business: 500,
          };
          const expectedLimit = expectedLimits[plan];

          // Exhaust the limit
          for (let i = 0; i < expectedLimit; i++) {
            await checkCreatorRateLimit(creatorId, plan);
          }

          // Verify error contains correct limit
          try {
            await checkCreatorRateLimit(creatorId, plan);
            expect(false).toBe(true);
          } catch (error) {
            expect(error).toBeInstanceOf(RateLimitError);
            if (error instanceof RateLimitError) {
              expect(error.limit).toBe(expectedLimit);
              expect(error.remaining).toBe(0);
            }
          }
        }
      ),
      { numRuns: 3, timeout: 120000 }
    );
  }, 180000);
});
