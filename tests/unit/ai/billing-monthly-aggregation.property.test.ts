/**
 * Property-Based Tests for Monthly Aggregation Correctness
 * 
 * Feature: ai-system-gemini-integration, Property 3: Monthly aggregation correctness
 * Validates: Requirements 3.4, 5.3
 * 
 * Tests that monthly cost aggregations are accurate
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { aggregateMonthlyCharges, upsertMonthlyCharge } from '../../../lib/ai/gemini-billing.service';
import { Decimal } from '@prisma/client/runtime/library';

// Mock usage logs for testing
const mockUsageLogs: any[] = [];
const mockMonthlyCharges: any[] = [];

// Mock the database
vi.mock('../../../lib/prisma', () => ({
  db: {
    usageLog: {
      aggregate: vi.fn(async ({ where, _sum }: any) => {
        // Filter logs by date range and creatorId
        const filteredLogs = mockUsageLogs.filter(log => {
          if (where.creatorId && log.creatorId !== where.creatorId) {
            return false;
          }
          if (where.createdAt) {
            const logDate = new Date(log.createdAt);
            if (where.createdAt.gte && logDate < where.createdAt.gte) {
              return false;
            }
            if (where.createdAt.lte && logDate > where.createdAt.lte) {
              return false;
            }
          }
          return true;
        });

        // Calculate sums
        const sums = filteredLogs.reduce(
          (acc, log) => ({
            tokensInput: acc.tokensInput + log.tokensInput,
            tokensOutput: acc.tokensOutput + log.tokensOutput,
            costUsd: acc.costUsd + Number(log.costUsd),
          }),
          { tokensInput: 0, tokensOutput: 0, costUsd: 0 }
        );

        return {
          _sum: {
            tokensInput: sums.tokensInput || null,
            tokensOutput: sums.tokensOutput || null,
            costUsd: sums.costUsd || null,
          },
        };
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return mockUsageLogs.filter(log => {
          if (where?.creatorId && log.creatorId !== where.creatorId) {
            return false;
          }
          return true;
        });
      }),
    },
    monthlyCharge: {
      upsert: vi.fn(async ({ where, create, update }: any) => {
        const existingIndex = mockMonthlyCharges.findIndex(
          charge =>
            charge.creatorId === where.creatorId_month.creatorId &&
            charge.month.getTime() === where.creatorId_month.month.getTime()
        );

        if (existingIndex >= 0) {
          // Update existing
          mockMonthlyCharges[existingIndex] = {
            ...mockMonthlyCharges[existingIndex],
            ...update,
          };
          return mockMonthlyCharges[existingIndex];
        } else {
          // Create new
          const newCharge = {
            id: `charge-${Date.now()}-${Math.random()}`,
            ...create,
          };
          mockMonthlyCharges.push(newCharge);
          return newCharge;
        }
      }),
    },
  },
}));

describe('Property 3: Monthly aggregation correctness', () => {
  beforeEach(() => {
    // Clear mock data before each test
    mockUsageLogs.length = 0;
    mockMonthlyCharges.length = 0;
    vi.clearAllMocks();
  });

  test('monthly total equals sum of all usage logs for that month', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }), // creatorId
        fc.array(
          fc.record({
            tokensInput: fc.integer({ min: 0, max: 10000 }),
            tokensOutput: fc.integer({ min: 0, max: 5000 }),
            costUsd: fc.float({ min: 0, max: 5, noNaN: true }), // Reduced to fit Decimal(10,6)
            dayOfMonth: fc.integer({ min: 1, max: 28 }), // Safe day range
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (creatorId, usageLogs) => {
          const testMonth = new Date(2024, 0, 1); // January 2024

          // Create usage logs for the month
          mockUsageLogs.length = 0;
          for (const log of usageLogs) {
            mockUsageLogs.push({
              id: `log-${Math.random()}`,
              creatorId,
              feature: 'test',
              model: 'gemini-2.5-pro',
              tokensInput: log.tokensInput,
              tokensOutput: log.tokensOutput,
              costUsd: log.costUsd,
              createdAt: new Date(2024, 0, log.dayOfMonth),
            });
          }

          // Calculate expected totals
          const expectedTotalInput = usageLogs.reduce((sum, log) => sum + log.tokensInput, 0);
          const expectedTotalOutput = usageLogs.reduce((sum, log) => sum + log.tokensOutput, 0);
          const expectedTotalCost = usageLogs.reduce((sum, log) => sum + log.costUsd, 0);

          // Aggregate
          const result = await aggregateMonthlyCharges(creatorId, testMonth);

          // Verify totals match
          expect(result.totalTokensInput).toBe(expectedTotalInput);
          expect(result.totalTokensOutput).toBe(expectedTotalOutput);
          expect(Math.abs(result.totalCostUsd - expectedTotalCost)).toBeLessThan(0.001);

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('aggregation excludes logs from other months', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 0, max: 11 }), // target month
        fc.integer({ min: 0, max: 11 }), // other month
        async (creatorId, targetMonth, otherMonth) => {
          // Skip if months are the same
          if (targetMonth === otherMonth) return true;

          mockUsageLogs.length = 0;

          // Add log in target month
          mockUsageLogs.push({
            id: 'log-target',
            creatorId,
            feature: 'test',
            model: 'gemini-2.5-pro',
            tokensInput: 100,
            tokensOutput: 50,
            costUsd: 1.0,
            createdAt: new Date(2024, targetMonth, 15),
          });

          // Add log in other month
          mockUsageLogs.push({
            id: 'log-other',
            creatorId,
            feature: 'test',
            model: 'gemini-2.5-pro',
            tokensInput: 200,
            tokensOutput: 100,
            costUsd: 2.0,
            createdAt: new Date(2024, otherMonth, 15),
          });

          // Aggregate for target month
          const result = await aggregateMonthlyCharges(
            creatorId,
            new Date(2024, targetMonth, 1)
          );

          // Should only include target month log
          expect(result.totalTokensInput).toBe(100);
          expect(result.totalTokensOutput).toBe(50);
          expect(result.totalCostUsd).toBe(1.0);

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('aggregation excludes logs from other creators', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        async (creatorId1, creatorId2) => {
          // Skip if IDs are the same
          if (creatorId1 === creatorId2) return true;

          const testMonth = new Date(2024, 0, 1);

          mockUsageLogs.length = 0;

          // Add log for creator 1
          mockUsageLogs.push({
            id: 'log-1',
            creatorId: creatorId1,
            feature: 'test',
            model: 'gemini-2.5-pro',
            tokensInput: 100,
            tokensOutput: 50,
            costUsd: 1.0,
            createdAt: new Date(2024, 0, 15),
          });

          // Add log for creator 2
          mockUsageLogs.push({
            id: 'log-2',
            creatorId: creatorId2,
            feature: 'test',
            model: 'gemini-2.5-pro',
            tokensInput: 200,
            tokensOutput: 100,
            costUsd: 2.0,
            createdAt: new Date(2024, 0, 15),
          });

          // Aggregate for creator 1
          const result = await aggregateMonthlyCharges(creatorId1, testMonth);

          // Should only include creator 1's log
          expect(result.totalTokensInput).toBe(100);
          expect(result.totalTokensOutput).toBe(50);
          expect(result.totalCostUsd).toBe(1.0);

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('empty month returns zero totals', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 0, max: 11 }),
        async (creatorId, month) => {
          mockUsageLogs.length = 0;

          // No logs for this creator/month

          const result = await aggregateMonthlyCharges(
            creatorId,
            new Date(2024, month, 1)
          );

          expect(result.totalTokensInput).toBe(0);
          expect(result.totalTokensOutput).toBe(0);
          expect(result.totalCostUsd).toBe(0);

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('upsert creates or updates monthly charge correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        async (creatorId, planPrice1, planPrice2) => {
          const testMonth = new Date(2024, 0, 1);

          mockUsageLogs.length = 0;
          mockMonthlyCharges.length = 0;

          // Add a usage log
          mockUsageLogs.push({
            id: 'log-1',
            creatorId,
            feature: 'test',
            model: 'gemini-2.5-pro',
            tokensInput: 100,
            tokensOutput: 50,
            costUsd: 1.0,
            createdAt: new Date(2024, 0, 15),
          });

          // First upsert (create)
          await upsertMonthlyCharge(creatorId, testMonth, planPrice1);

          expect(mockMonthlyCharges.length).toBe(1);
          expect(Number(mockMonthlyCharges[0].planPrice)).toBeCloseTo(planPrice1, 2);

          // Second upsert (update)
          await upsertMonthlyCharge(creatorId, testMonth, planPrice2);

          expect(mockMonthlyCharges.length).toBe(1); // Still only one record
          expect(Number(mockMonthlyCharges[0].planPrice)).toBeCloseTo(planPrice2, 2);

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('aggregation handles large token counts correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 10, max: 20 }), // number of logs - reduced
        async (creatorId, numLogs) => {
          const testMonth = new Date(2024, 0, 1);

          mockUsageLogs.length = 0;

          let expectedTotal = 0;

          // Create many logs with large token counts
          for (let i = 0; i < numLogs; i++) {
            const cost = Math.random() * 5; // Reduced to fit Decimal(10,6)
            expectedTotal += cost;

            mockUsageLogs.push({
              id: `log-${i}`,
              creatorId,
              feature: 'test',
              model: 'gemini-2.5-pro',
              tokensInput: 100000,
              tokensOutput: 50000,
              costUsd: cost,
              createdAt: new Date(2024, 0, 15),
            });
          }

          const result = await aggregateMonthlyCharges(creatorId, testMonth);

          expect(result.totalTokensInput).toBe(100000 * numLogs);
          expect(result.totalTokensOutput).toBe(50000 * numLogs);
          expect(Math.abs(result.totalCostUsd - expectedTotal)).toBeLessThan(0.01);

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
});
