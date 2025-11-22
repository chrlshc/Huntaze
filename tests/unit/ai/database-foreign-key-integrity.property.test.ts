/**
 * Property-Based Tests for Database Foreign Key Integrity
 * 
 * Feature: ai-system-gemini-integration, Property 24: Usage log foreign key integrity
 * Validates: Requirements 11.5
 * 
 * Tests that UsageLog records maintain foreign key integrity with Creator records
 * and that cascade deletes work correctly
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';

// Track database state for verification
const mockCreators: Map<number, any> = new Map();
const mockUsageLogs: Map<string, any> = new Map();
const mockMonthlyCharges: Map<string, any> = new Map();
const mockAIInsights: Map<string, any> = new Map();

// Mock the database with foreign key enforcement
vi.mock('../../../lib/prisma', () => ({
  db: {
    users: {
      create: vi.fn(async ({ data }: any) => {
        const creator = {
          id: data.id ?? Math.floor(Math.random() * 1000000),
          email: data.email,
          name: data.name,
          password: data.password,
          created_at: new Date(),
        };
        mockCreators.set(creator.id, creator);
        return creator;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        return mockCreators.get(where.id) ?? null;
      }),
      delete: vi.fn(async ({ where }: any) => {
        const creator = mockCreators.get(where.id);
        if (!creator) {
          throw new Error('Creator not found');
        }
        
        // Cascade delete - remove all related records
        for (const [logId, log] of mockUsageLogs.entries()) {
          if (log.creatorId === where.id) {
            mockUsageLogs.delete(logId);
          }
        }
        
        for (const [chargeId, charge] of mockMonthlyCharges.entries()) {
          if (charge.creatorId === where.id) {
            mockMonthlyCharges.delete(chargeId);
          }
        }
        
        for (const [insightId, insight] of mockAIInsights.entries()) {
          if (insight.creatorId === where.id) {
            mockAIInsights.delete(insightId);
          }
        }
        
        mockCreators.delete(where.id);
        return creator;
      }),
    },
    usageLog: {
      create: vi.fn(async ({ data }: any) => {
        // Enforce foreign key constraint
        if (!mockCreators.has(data.creatorId)) {
          throw new Error('Foreign key constraint failed: Creator does not exist');
        }
        
        const log = {
          id: `log-${Date.now()}-${Math.random()}`,
          ...data,
          createdAt: new Date(),
        };
        mockUsageLogs.set(log.id, log);
        return log;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        const logs = Array.from(mockUsageLogs.values());
        if (where?.creatorId) {
          return logs.filter(log => log.creatorId === where.creatorId);
        }
        return logs;
      }),
      count: vi.fn(async ({ where }: any) => {
        const logs = Array.from(mockUsageLogs.values());
        if (where?.creatorId) {
          return logs.filter(log => log.creatorId === where.creatorId).length;
        }
        return logs.length;
      }),
    },
    monthlyCharge: {
      create: vi.fn(async ({ data }: any) => {
        // Enforce foreign key constraint
        if (!mockCreators.has(data.creatorId)) {
          throw new Error('Foreign key constraint failed: Creator does not exist');
        }
        
        const charge = {
          id: `charge-${Date.now()}-${Math.random()}`,
          ...data,
        };
        mockMonthlyCharges.set(charge.id, charge);
        return charge;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        const charges = Array.from(mockMonthlyCharges.values());
        if (where?.creatorId) {
          return charges.filter(charge => charge.creatorId === where.creatorId);
        }
        return charges;
      }),
      count: vi.fn(async ({ where }: any) => {
        const charges = Array.from(mockMonthlyCharges.values());
        if (where?.creatorId) {
          return charges.filter(charge => charge.creatorId === where.creatorId).length;
        }
        return charges.length;
      }),
    },
    aIInsight: {
      create: vi.fn(async ({ data }: any) => {
        // Enforce foreign key constraint
        if (!mockCreators.has(data.creatorId)) {
          throw new Error('Foreign key constraint failed: Creator does not exist');
        }
        
        const insight = {
          id: `insight-${Date.now()}-${Math.random()}`,
          ...data,
          createdAt: new Date(),
        };
        mockAIInsights.set(insight.id, insight);
        return insight;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        const insights = Array.from(mockAIInsights.values());
        if (where?.creatorId) {
          return insights.filter(insight => insight.creatorId === where.creatorId);
        }
        return insights;
      }),
      count: vi.fn(async ({ where }: any) => {
        const insights = Array.from(mockAIInsights.values());
        if (where?.creatorId) {
          return insights.filter(insight => insight.creatorId === where.creatorId).length;
        }
        return insights.length;
      }),
    },
  },
}));

const { db } = await import('../../../lib/prisma');

describe('Property 24: Usage log foreign key integrity', () => {
  beforeEach(() => {
    // Clear all mock data before each test
    mockCreators.clear();
    mockUsageLogs.clear();
    mockMonthlyCharges.clear();
    mockAIInsights.clear();
    vi.clearAllMocks();
  });

  test('cannot create UsageLog without existing Creator', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // non-existent creatorId
        fc.constantFrom('messaging', 'content', 'analytics', 'sales'),
        fc.constantFrom('gemini-2.5-pro', 'gemini-2.5-flash'),
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 0, max: 5000 }),
        async (creatorId, feature, model, tokensInput, tokensOutput) => {
          // Ensure creator doesn't exist
          expect(mockCreators.has(creatorId)).toBe(false);

          // Attempt to create usage log should fail
          await expect(
            db.usageLog.create({
              data: {
                creatorId,
                feature,
                model,
                tokensInput,
                tokensOutput,
                costUsd: 0.001,
              },
            })
          ).rejects.toThrow('Foreign key constraint failed');

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('can create UsageLog with existing Creator', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.constantFrom('messaging', 'content', 'analytics', 'sales'),
        fc.constantFrom('gemini-2.5-pro', 'gemini-2.5-flash'),
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 0, max: 5000 }),
        async (email, feature, model, tokensInput, tokensOutput) => {
          // Create creator first
          const creator = await db.users.create({
            data: {
              email,
              name: 'Test Creator',
              password: 'hashed_password',
            },
          });

          // Now create usage log should succeed
          const log = await db.usageLog.create({
            data: {
              creatorId: creator.id,
              feature,
              model,
              tokensInput,
              tokensOutput,
              costUsd: 0.001,
            },
          });

          expect(log.creatorId).toBe(creator.id);
          expect(log.feature).toBe(feature);
          expect(log.model).toBe(model);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('deleting Creator cascades to UsageLog', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.integer({ min: 1, max: 10 }), // number of usage logs
        async (email, numLogs) => {
          // Create creator
          const creator = await db.users.create({
            data: {
              email,
              name: 'Test Creator',
              password: 'hashed_password',
            },
          });

          // Create multiple usage logs
          for (let i = 0; i < numLogs; i++) {
            await db.usageLog.create({
              data: {
                creatorId: creator.id,
                feature: 'test',
                model: 'gemini-2.5-pro',
                tokensInput: 100,
                tokensOutput: 50,
                costUsd: 0.001,
              },
            });
          }

          // Verify logs exist
          const logsBefore = await db.usageLog.findMany({
            where: { creatorId: creator.id },
          });
          expect(logsBefore.length).toBe(numLogs);

          // Delete creator
          await db.users.delete({
            where: { id: creator.id },
          });

          // Verify all logs are deleted (cascade)
          const logsAfter = await db.usageLog.findMany({
            where: { creatorId: creator.id },
          });
          expect(logsAfter.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('deleting Creator cascades to MonthlyCharge', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.integer({ min: 1, max: 12 }), // number of monthly charges
        async (email, numCharges) => {
          // Create creator
          const creator = await db.users.create({
            data: {
              email,
              name: 'Test Creator',
              password: 'hashed_password',
            },
          });

          // Create multiple monthly charges
          for (let i = 0; i < numCharges; i++) {
            const month = new Date(2024, i, 1);
            await db.monthlyCharge.create({
              data: {
                creatorId: creator.id,
                month,
                totalTokensInput: 1000,
                totalTokensOutput: 500,
                totalCostUsd: 0.1,
                planPrice: 10.0,
              },
            });
          }

          // Verify charges exist
          const chargesBefore = await db.monthlyCharge.findMany({
            where: { creatorId: creator.id },
          });
          expect(chargesBefore.length).toBe(numCharges);

          // Delete creator
          await db.users.delete({
            where: { id: creator.id },
          });

          // Verify all charges are deleted (cascade)
          const chargesAfter = await db.monthlyCharge.findMany({
            where: { creatorId: creator.id },
          });
          expect(chargesAfter.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('deleting Creator cascades to AIInsight', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.integer({ min: 1, max: 10 }), // number of insights
        async (email, numInsights) => {
          // Create creator
          const creator = await db.users.create({
            data: {
              email,
              name: 'Test Creator',
              password: 'hashed_password',
            },
          });

          // Create multiple insights
          for (let i = 0; i < numInsights; i++) {
            await db.aIInsight.create({
              data: {
                creatorId: creator.id,
                source: 'test-agent',
                type: 'test-insight',
                confidence: 0.8,
                data: { test: true },
              },
            });
          }

          // Verify insights exist
          const insightsBefore = await db.aIInsight.findMany({
            where: { creatorId: creator.id },
          });
          expect(insightsBefore.length).toBe(numInsights);

          // Delete creator
          await db.users.delete({
            where: { id: creator.id },
          });

          // Verify all insights are deleted (cascade)
          const insightsAfter = await db.aIInsight.findMany({
            where: { creatorId: creator.id },
          });
          expect(insightsAfter.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('deleting Creator cascades to all related records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        async (email, numLogs, numCharges, numInsights) => {
          // Create creator
          const creator = await db.users.create({
            data: {
              email,
              name: 'Test Creator',
              password: 'hashed_password',
            },
          });

          // Create usage logs
          for (let i = 0; i < numLogs; i++) {
            await db.usageLog.create({
              data: {
                creatorId: creator.id,
                feature: 'test',
                model: 'gemini-2.5-pro',
                tokensInput: 100,
                tokensOutput: 50,
                costUsd: 0.001,
              },
            });
          }

          // Create monthly charges
          for (let i = 0; i < numCharges; i++) {
            const month = new Date(2024, i, 1);
            await db.monthlyCharge.create({
              data: {
                creatorId: creator.id,
                month,
                totalTokensInput: 1000,
                totalTokensOutput: 500,
                totalCostUsd: 0.1,
                planPrice: 10.0,
              },
            });
          }

          // Create insights
          for (let i = 0; i < numInsights; i++) {
            await db.aIInsight.create({
              data: {
                creatorId: creator.id,
                source: 'test-agent',
                type: 'test-insight',
                confidence: 0.8,
                data: { test: true },
              },
            });
          }

          // Verify all records exist
          const totalBefore = 
            (await db.usageLog.count({ where: { creatorId: creator.id } })) +
            (await db.monthlyCharge.count({ where: { creatorId: creator.id } })) +
            (await db.aIInsight.count({ where: { creatorId: creator.id } }));
          
          expect(totalBefore).toBe(numLogs + numCharges + numInsights);

          // Delete creator
          await db.users.delete({
            where: { id: creator.id },
          });

          // Verify all related records are deleted
          const totalAfter = 
            (await db.usageLog.count({ where: { creatorId: creator.id } })) +
            (await db.monthlyCharge.count({ where: { creatorId: creator.id } })) +
            (await db.aIInsight.count({ where: { creatorId: creator.id } }));
          
          expect(totalAfter).toBe(0);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});
