/**
 * Property-Based Tests for Plan-Based Quota Limits
 * 
 * Feature: ai-system-gemini-integration, Property 6: Plan-based quota limits
 * Validates: Requirements 4.3, 6.2
 * 
 * Tests that quota limits are correctly enforced based on plan type
 */

import { describe, test, expect, afterEach } from 'vitest';
import fc from 'fast-check';
import { assertWithinMonthlyQuota, QuotaExceededError, getRemainingQuota, type CreatorPlan } from '../../../lib/ai/quota';
import { getQuotaLimit } from '../../../lib/ai/billing';
import { db } from '../../../lib/prisma';

describe('Property 6: Plan-based quota limits', () => {
  const testUserIds: number[] = [];

  async function createTestUser(): Promise<number> {
    const user = await db.users.create({
      data: {
        email: `test-quota-plan-${Date.now()}-${Math.random()}@test.com`,
        name: 'Test User',
      },
    });
    testUserIds.push(user.id);
    return user.id;
  }

  afterEach(async () => {
    if (testUserIds.length > 0) {
      await db.users.deleteMany({
        where: {
          id: {
            in: testUserIds,
          },
        },
      });
      testUserIds.length = 0;
    }
  });

  test('starter plan has $10 monthly limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0.01, max: 20, noNaN: true }),
        async (cost) => {
          const creatorId = await createTestUser();
          const limit = getQuotaLimit('starter');
          
          // Verify limit is $10
          expect(limit).toBe(10);

          if (cost <= 10) {
            // Should allow costs up to $10
            await expect(
              assertWithinMonthlyQuota(creatorId, 'starter', cost)
            ).resolves.not.toThrow();
          } else {
            // Should reject costs over $10
            await expect(
              assertWithinMonthlyQuota(creatorId, 'starter', cost)
            ).rejects.toThrow(QuotaExceededError);
          }

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('pro plan has $50 monthly limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0.01, max: 100, noNaN: true }),
        async (cost) => {
          const creatorId = await createTestUser();
          const limit = getQuotaLimit('pro');
          
          // Verify limit is $50
          expect(limit).toBe(50);

          if (cost <= 50) {
            // Should allow costs up to $50
            await expect(
              assertWithinMonthlyQuota(creatorId, 'pro', cost)
            ).resolves.not.toThrow();
          } else {
            // Should reject costs over $50
            await expect(
              assertWithinMonthlyQuota(creatorId, 'pro', cost)
            ).rejects.toThrow(QuotaExceededError);
          }

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('business plan has effectively unlimited quota', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        async (cost) => {
          const creatorId = await createTestUser();
          const limit = getQuotaLimit('business');
          
          // Verify limit is very high (effectively unlimited)
          expect(limit).toBeGreaterThan(100000);

          // Should allow any reasonable cost
          await expect(
            assertWithinMonthlyQuota(creatorId, 'business', cost)
          ).resolves.not.toThrow();

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('quota limits are consistent across multiple checks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro', 'business'),
        async (plan) => {
          const limit1 = getQuotaLimit(plan);
          const limit2 = getQuotaLimit(plan);
          const limit3 = getQuotaLimit(plan);
          
          // Limits should be consistent
          expect(limit1).toBe(limit2);
          expect(limit2).toBe(limit3);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('different plans have different limits', () => {
    const starterLimit = getQuotaLimit('starter');
    const proLimit = getQuotaLimit('pro');
    const businessLimit = getQuotaLimit('business');

    // Verify hierarchy: starter < pro < business
    expect(starterLimit).toBeLessThan(proLimit);
    expect(proLimit).toBeLessThan(businessLimit);
    
    // Verify specific values
    expect(starterLimit).toBe(10);
    expect(proLimit).toBe(50);
    expect(businessLimit).toBeGreaterThan(100000);
  });

  test('remaining quota reflects plan limits', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro', 'business'),
        fc.double({ min: 0, max: 5, noNaN: true }),
        async (plan, spending) => {
          const creatorId = await createTestUser();
          const limit = getQuotaLimit(plan);
          
          // Create some usage
          if (spending > 0) {
            await db.usageLog.create({
              data: {
                creatorId,
                feature: 'test',
                model: 'gemini-2.5-pro',
                tokensInput: 1000,
                tokensOutput: 1000,
                costUsd: spending,
              },
            });
          }

          const quota = await getRemainingQuota(creatorId, plan);
          
          // Verify quota information
          expect(quota.limit).toBe(limit);
          expect(quota.spent).toBeCloseTo(spending, 2);
          expect(quota.remaining).toBeCloseTo(limit - spending, 2);
          expect(quota.percentUsed).toBeCloseTo((spending / limit) * 100, 1);

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('cumulative spending respects plan limits', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro'),
        fc.array(fc.double({ min: 0.1, max: 2, noNaN: true }), { minLength: 1, maxLength: 5 }),
        async (plan, costs) => {
          const creatorId = await createTestUser();
          const limit = getQuotaLimit(plan);
          let totalSpent = 0;

          for (const cost of costs) {
            if (totalSpent + cost <= limit) {
              // Should allow if within limit
              await expect(
                assertWithinMonthlyQuota(creatorId, plan, cost)
              ).resolves.not.toThrow();
              
              // Record the spending
              await db.usageLog.create({
                data: {
                  creatorId,
                  feature: 'test',
                  model: 'gemini-2.5-pro',
                  tokensInput: 1000,
                  tokensOutput: 1000,
                  costUsd: cost,
                },
              });
              
              totalSpent += cost;
            } else {
              // Should reject if would exceed limit
              await expect(
                assertWithinMonthlyQuota(creatorId, plan, cost)
              ).rejects.toThrow(QuotaExceededError);
              
              // Don't record this spending
              break;
            }
          }

          // Verify total spending doesn't exceed limit
          const quota = await getRemainingQuota(creatorId, plan);
          expect(quota.spent).toBeLessThanOrEqual(limit);

          return true;
        }
      ),
      { numRuns: 3, timeout: 10000 } // Fewer runs, longer timeout
    );
  });

  test('plan limits are enforced at exact boundary', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro'),
        async (plan) => {
          const creatorId = await createTestUser();
          const limit = getQuotaLimit(plan);
          
          // Spend exactly up to the limit
          await db.usageLog.create({
            data: {
              creatorId,
              feature: 'test',
              model: 'gemini-2.5-pro',
              tokensInput: 1000,
              tokensOutput: 1000,
              costUsd: limit,
            },
          });

          // Any additional cost should be rejected
          await expect(
            assertWithinMonthlyQuota(creatorId, plan, 0.01)
          ).rejects.toThrow(QuotaExceededError);

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('quota error message includes plan information', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro'),
        async (plan) => {
          const creatorId = await createTestUser();
          const limit = getQuotaLimit(plan);
          
          // Exceed quota
          try {
            await assertWithinMonthlyQuota(creatorId, plan, limit + 1);
            expect(false).toBe(true); // Should not reach
          } catch (error) {
            expect(error).toBeInstanceOf(QuotaExceededError);
            if (error instanceof QuotaExceededError) {
              expect(error.details.plan).toBe(plan);
              expect(error.details.limit).toBe(limit);
              expect(error.message).toContain(plan);
            }
          }

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
});
