/**
 * Feature: ai-system-gemini-integration, Property 9: Rate limit enforcement
 * Validates: Requirements 5.1, 7.1
 * 
 * Property: For any creator making N+1 requests within the rate limit window 
 * where N equals their plan's limit, the (N+1)th request SHALL be rejected with HTTP 429.
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

describe('Property 9: Rate limit enforcement', () => {
  beforeAll(async () => {
    try {
      await redis.ping();
      redisAvailable = true;
    } catch (error) {
      console.warn('Redis not available, skipping rate limit tests');
      redisAvailable = false;
    }
  });

  // Clean up test data after each test
  afterEach(async () => {
    if (!redisAvailable) return;
    
    try {
      // Clean up any test keys
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

  test.skipIf(!redisAvailable)('Property 9: N+1 requests should be rejected when N equals plan limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro', 'business'),
        async (plan) => {
          const creatorId = `test-creator-${Date.now()}-${Math.random()}`;
          
          // Get the limit for this plan
          const limits: Record<CreatorPlan, number> = {
            starter: 50,
            pro: 100,
            business: 500,
          };
          const limit = limits[plan];

          // Make N requests (should all succeed)
          for (let i = 0; i < limit; i++) {
            await expect(
              checkCreatorRateLimit(creatorId, plan)
            ).resolves.not.toThrow();
          }

          // The (N+1)th request should be rejected
          await expect(
            checkCreatorRateLimit(creatorId, plan)
          ).rejects.toThrow(RateLimitError);
        }
      ),
      { numRuns: 3, timeout: 60000 } // Increased timeout for high request volume
    );
  }, 120000); // 2 minute test timeout

  test.skipIf(!redisAvailable)('Property 9: Rate limit error contains retry-after information', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro', 'business'),
        async (plan) => {
          const creatorId = `test-creator-${Date.now()}-${Math.random()}`;
          
          const limits: Record<CreatorPlan, number> = {
            starter: 50,
            pro: 100,
            business: 500,
          };
          const limit = limits[plan];

          // Exhaust the rate limit
          for (let i = 0; i < limit; i++) {
            await checkCreatorRateLimit(creatorId, plan);
          }

          // Next request should throw with retry-after
          try {
            await checkCreatorRateLimit(creatorId, plan);
            expect(false).toBe(true); // Should not reach here
          } catch (error) {
            expect(error).toBeInstanceOf(RateLimitError);
            if (error instanceof RateLimitError) {
              expect(error.retryAfter).toBeGreaterThan(0);
              expect(error.limit).toBe(limit);
              expect(error.remaining).toBe(0);
            }
          }
        }
      ),
      { numRuns: 3, timeout: 60000 }
    );
  }, 120000);

  test.skipIf(!redisAvailable)('Property 9: Requests within limit should not throw', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro', 'business'),
        fc.integer({ min: 1, max: 10 }), // Test with small number of requests
        async (plan, numRequests) => {
          const creatorId = `test-creator-${Date.now()}-${Math.random()}`;
          
          const limits: Record<CreatorPlan, number> = {
            starter: 50,
            pro: 100,
            business: 500,
          };
          const limit = limits[plan];

          // Ensure we're within the limit
          const requestsToMake = Math.min(numRequests, limit - 1);

          // All requests should succeed
          for (let i = 0; i < requestsToMake; i++) {
            await expect(
              checkCreatorRateLimit(creatorId, plan)
            ).resolves.not.toThrow();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  test.skipIf(!redisAvailable)('Property 9: Different creators have independent rate limits', async () => {
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

          // Creator1 should be rate limited
          await expect(
            checkCreatorRateLimit(creator1, plan)
          ).rejects.toThrow(RateLimitError);

          // Creator2 should still be able to make requests
          await expect(
            checkCreatorRateLimit(creator2, plan)
          ).resolves.not.toThrow();
        }
      ),
      { numRuns: 3, timeout: 60000 }
    );
  }, 120000);
});
