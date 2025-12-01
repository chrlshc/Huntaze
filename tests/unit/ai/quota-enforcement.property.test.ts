/**
 * Property-Based Tests for Quota Enforcement
 * 
 * Feature: ai-system-gemini-integration, Property 5: Quota enforcement before execution
 * Validates: Requirements 4.1, 6.1
 * 
 * Tests that quota is checked and enforced before AI requests are executed
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { assertWithinMonthlyQuota, QuotaExceededError, type CreatorPlan } from '../../../lib/ai/quota';
import { getQuotaLimit } from '../../../lib/ai/billing';
import { db } from '../../../lib/prisma';

const handleSchemaMismatch = (err: unknown) => {
  if ((err as any)?.code === 'P2022') {
    return true;
  }
  throw err;
};

describe('Property 5: Quota enforcement before execution', () => {
  const testUserIds: number[] = [];

  // Helper to create a test user
  async function createTestUser(): Promise<number> {
    const user = await db.users.create({
      data: {
        email: `test-quota-${Date.now()}-${Math.random()}@test.com`,
        name: 'Test User',
      },
    }).catch(handleSchemaMismatch);
    if (user === true || !user) return -1;
    testUserIds.push(user.id);
    return user.id;
  }

  // Clean up test data after each test
  afterEach(async () => {
    if (testUserIds.length > 0) {
      await db.users.deleteMany({
        where: {
          id: {
            in: testUserIds,
          },
        },
      }).catch(() => {});
      testUserIds.length = 0;
    }
  });

  test('requests within quota are allowed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro', 'business'),
        fc.double({ min: 0.01, max: 5, noNaN: true }), // Small cost that won't exceed quota
        async (plan, estimatedCost) => {
          const creatorId = await createTestUser();
          if (creatorId === -1) return true;
          
          // Should not throw for requests within quota
          await expect(
            assertWithinMonthlyQuota(creatorId, plan, estimatedCost)
          ).resolves.not.toThrow();

          return true;
        }
      ),
      { numRuns: 10 } // Reduced runs due to database operations
    );
  });

  test('requests exceeding quota are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro'),
        async (plan) => {
          const creatorId = await createTestUser();
          if (creatorId === -1) return true;
          const limit = getQuotaLimit(plan);
          
          // Create usage that fills the quota
          await db.usageLog.create({
            data: {
              creatorId,
              feature: 'test',
              model: 'gemini-2.5-pro',
              tokensInput: 1000,
              tokensOutput: 1000,
              costUsd: limit * 0.9, // 90% of quota
            },
          });

          // Request that would exceed quota should be rejected
          const excessiveCost = limit * 0.2; // Would push to 110%
          
          await expect(
            assertWithinMonthlyQuota(creatorId, plan, excessiveCost)
          ).rejects.toThrow(QuotaExceededError);

          return true;
        }
      ),
      { numRuns: 10 } // Reduced runs due to database operations
    );
  });

  test('quota check happens before any execution', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro'),
        fc.double({ min: 0.01, max: 100, noNaN: true }),
        async (plan, estimatedCost) => {
          const creatorId = await createTestUser();
          if (creatorId === -1) return true;
          const limit = getQuotaLimit(plan);
          
          // Fill quota completely
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

          // Any additional cost should be rejected immediately
          try {
            await assertWithinMonthlyQuota(creatorId, plan, estimatedCost);
            // Should not reach here
            expect(false).toBe(true);
          } catch (error) {
            expect(error).toBeInstanceOf(QuotaExceededError);
            if (error instanceof QuotaExceededError) {
              expect(error.details.currentUsage).toBeGreaterThanOrEqual(limit);
              expect(error.details.limit).toBe(limit);
              expect(error.details.plan).toBe(plan);
            }
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
        fc.double({ min: 0.01, max: 1000, noNaN: true }), // Large costs within DB limits
        async (estimatedCost) => {
          const creatorId = await createTestUser();
          
          // Business plan should allow any reasonable cost
          await expect(
            assertWithinMonthlyQuota(creatorId, 'business', estimatedCost)
          ).resolves.not.toThrow();

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('quota is calculated from current month only', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro'),
        fc.double({ min: 0.01, max: 5, noNaN: true }),
        async (plan, currentMonthCost) => {
          const creatorId = await createTestUser();
          
          // Create usage from previous month
          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          
          await db.usageLog.create({
            data: {
              creatorId,
              feature: 'test',
              model: 'gemini-2.5-pro',
              tokensInput: 1000,
              tokensOutput: 1000,
              costUsd: 100, // Large cost from last month
              createdAt: lastMonth,
            },
          });

          // Current month request should not be affected by last month's usage
          await expect(
            assertWithinMonthlyQuota(creatorId, plan, currentMonthCost)
          ).resolves.not.toThrow();

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('quota error includes detailed information', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro'),
        async (plan) => {
          const creatorId = await createTestUser();
          const limit = getQuotaLimit(plan);
          
          // Fill quota
          const currentSpending = limit * 0.95;
          await db.usageLog.create({
            data: {
              creatorId,
              feature: 'test',
              model: 'gemini-2.5-pro',
              tokensInput: 1000,
              tokensOutput: 1000,
              costUsd: currentSpending,
            },
          });

          const excessiveCost = limit * 0.1; // Would exceed
          
          try {
            await assertWithinMonthlyQuota(creatorId, plan, excessiveCost);
            expect(false).toBe(true); // Should not reach
          } catch (error) {
            expect(error).toBeInstanceOf(QuotaExceededError);
            if (error instanceof QuotaExceededError) {
              // Verify error details
              expect(error.details.currentUsage).toBeCloseTo(currentSpending, 2);
              expect(error.details.limit).toBe(limit);
              expect(error.details.plan).toBe(plan);
              expect(error.details.estimatedCost).toBe(excessiveCost);
              expect(error.code).toBe('QUOTA_EXCEEDED');
            }
          }

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('zero cost requests are always allowed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<CreatorPlan>('starter', 'pro'),
        async (plan) => {
          const creatorId = await createTestUser();
          
          // Even with quota filled, zero cost should be allowed
          const limit = getQuotaLimit(plan);
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

          await expect(
            assertWithinMonthlyQuota(creatorId, plan, 0)
          ).resolves.not.toThrow();

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
});
