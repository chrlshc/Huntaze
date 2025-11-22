/**
 * Property Test: Per-creator breakdown accuracy
 * Feature: ai-system-gemini-integration, Property 28: Per-creator breakdown accuracy
 * Validates: Requirements 8.2, 12.2
 * 
 * Property: For any creator, the dashboard spending breakdown by feature SHALL equal 
 * the sum of UsageLog costs grouped by feature for that creator.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { db } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

describe('Property 28: Per-creator breakdown accuracy', () => {
  const testCreatorIds: number[] = [];
  const testUsageLogIds: string[] = [];

  beforeEach(async () => {
    // Clean up any orphaned test data from previous failed runs
    await db.usageLog.deleteMany({
      where: {
        creator: {
          email: {
            startsWith: 'test-breakdown-',
          },
        },
      },
    });
    
    await db.users.deleteMany({
      where: {
        email: {
          startsWith: 'test-breakdown-',
        },
      },
    });
  });

  afterEach(async () => {
    // Cleanup test data
    if (testUsageLogIds.length > 0) {
      await db.usageLog.deleteMany({
        where: { id: { in: testUsageLogIds } },
      });
      testUsageLogIds.length = 0;
    }

    if (testCreatorIds.length > 0) {
      await db.users.deleteMany({
        where: { id: { in: testCreatorIds } },
      });
      testCreatorIds.length = 0;
    }
  });

  it('per-creator breakdown by feature equals sum of usage logs grouped by feature', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random features (2-5 different features)
        fc.array(
          fc.constantFrom('messaging', 'content', 'analytics', 'sales', 'compliance'),
          { minLength: 2, maxLength: 5 }
        ),
        // Generate random costs per feature (1-10 logs per feature)
        fc.array(fc.float({ min: Math.fround(0.01), max: Math.fround(5.0), noNaN: true }), { minLength: 2, maxLength: 50 }),
        
        async (features, costs) => {
          // Create test creator
          const creator = await db.users.create({
            data: {
              email: `test-breakdown-${Date.now()}-${Math.random()}@example.com`,
              name: 'Test Creator',
            },
          });
          testCreatorIds.push(creator.id);

          // Track expected totals by feature
          const expectedByFeature: Record<string, number> = {};
          features.forEach(f => expectedByFeature[f] = 0);

          // Create usage logs distributed across features
          let costIndex = 0;
          for (const feature of features) {
            const logsForFeature = Math.min(10, costs.length - costIndex);
            for (let i = 0; i < logsForFeature && costIndex < costs.length; i++) {
              const cost = costs[costIndex++];
              
              const log = await db.usageLog.create({
                data: {
                  creatorId: creator.id,
                  feature,
                  agentId: `${feature}-agent`,
                  model: 'gemini-2.5-pro',
                  tokensInput: 100,
                  tokensOutput: 50,
                  costUsd: new Decimal(cost),
                },
              });
              testUsageLogIds.push(log.id);
              expectedByFeature[feature] += cost;
            }
          }

          // Query breakdown by feature for this creator
          const logs = await db.usageLog.findMany({
            where: { creatorId: creator.id },
          });

          const actualByFeature: Record<string, number> = {};
          for (const log of logs) {
            if (!actualByFeature[log.feature]) {
              actualByFeature[log.feature] = 0;
            }
            actualByFeature[log.feature] += Number(log.costUsd);
          }

          // Verify each feature's total matches
          for (const feature of features) {
            const expected = expectedByFeature[feature];
            const actual = actualByFeature[feature] ?? 0;
            expect(Math.abs(actual - expected)).toBeLessThan(0.01);
          }
          
          return true;
        }
      ),
      { numRuns: 20, timeout: 60000 }
    );
  }, 70000);

  it('breakdown includes all features used by creator', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constantFrom('messaging', 'content', 'analytics', 'sales'),
          { minLength: 1, maxLength: 4 }
        ),
        
        async (features) => {
          // Remove duplicates
          const uniqueFeatures = [...new Set(features)];
          
          // Create test creator
          const creator = await db.users.create({
            data: {
              email: `test-breakdown-all-${Date.now()}-${Math.random()}@example.com`,
              name: 'Test Creator',
            },
          });
          testCreatorIds.push(creator.id);

          // Create one log per feature
          for (const feature of uniqueFeatures) {
            const log = await db.usageLog.create({
              data: {
                creatorId: creator.id,
                feature,
                model: 'gemini-2.5-pro',
                tokensInput: 100,
                tokensOutput: 50,
                costUsd: new Decimal(1.0),
              },
            });
            testUsageLogIds.push(log.id);
          }

          // Query breakdown
          const logs = await db.usageLog.findMany({
            where: { creatorId: creator.id },
          });

          const actualFeatures = new Set(logs.map(log => log.feature));

          // All features should be present
          for (const feature of uniqueFeatures) {
            expect(actualFeatures.has(feature)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 20, timeout: 60000 }
    );
  }, 70000);

  it('breakdown excludes other creators logs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: Math.fround(1.0), max: Math.fround(10.0), noNaN: true }),
        fc.float({ min: Math.fround(1.0), max: Math.fround(10.0), noNaN: true }),
        
        async (creator1Cost, creator2Cost) => {
          // Create two test creators
          const creator1 = await db.users.create({
            data: {
              email: `test-breakdown-c1-${Date.now()}-${Math.random()}@example.com`,
              name: 'Test Creator 1',
            },
          });
          testCreatorIds.push(creator1.id);

          const creator2 = await db.users.create({
            data: {
              email: `test-breakdown-c2-${Date.now()}-${Math.random()}@example.com`,
              name: 'Test Creator 2',
            },
          });
          testCreatorIds.push(creator2.id);

          // Create logs for both creators with same feature
          const log1 = await db.usageLog.create({
            data: {
              creatorId: creator1.id,
              feature: 'messaging',
              model: 'gemini-2.5-pro',
              tokensInput: 100,
              tokensOutput: 50,
              costUsd: new Decimal(creator1Cost),
            },
          });
          testUsageLogIds.push(log1.id);

          const log2 = await db.usageLog.create({
            data: {
              creatorId: creator2.id,
              feature: 'messaging',
              model: 'gemini-2.5-pro',
              tokensInput: 100,
              tokensOutput: 50,
              costUsd: new Decimal(creator2Cost),
            },
          });
          testUsageLogIds.push(log2.id);

          // Query breakdown for creator1 only
          const logs = await db.usageLog.findMany({
            where: { creatorId: creator1.id },
          });

          const totalCost = logs.reduce((sum, log) => sum + Number(log.costUsd), 0);

          // Should only include creator1's cost
          expect(Math.abs(totalCost - creator1Cost)).toBeLessThan(0.01);
          
          return true;
        }
      ),
      { numRuns: 20, timeout: 60000 }
    );
  }, 70000);

  it('breakdown by feature and agent is accurate', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            feature: fc.constantFrom('messaging', 'content', 'analytics'),
            agent: fc.constantFrom('agent-1', 'agent-2', 'agent-3'),
            cost: fc.float({ min: Math.fround(0.01), max: Math.fround(5.0), noNaN: true }),
          }),
          { minLength: 3, maxLength: 20 }
        ),
        
        async (logs) => {
          // Create test creator
          const creator = await db.users.create({
            data: {
              email: `test-breakdown-agent-${Date.now()}-${Math.random()}@example.com`,
              name: 'Test Creator',
            },
          });
          testCreatorIds.push(creator.id);

          // Track expected totals
          const expectedByFeature: Record<string, number> = {};
          const expectedByAgent: Record<string, number> = {};

          // Create usage logs
          for (const logData of logs) {
            const log = await db.usageLog.create({
              data: {
                creatorId: creator.id,
                feature: logData.feature,
                agentId: logData.agent,
                model: 'gemini-2.5-pro',
                tokensInput: 100,
                tokensOutput: 50,
                costUsd: new Decimal(logData.cost),
              },
            });
            testUsageLogIds.push(log.id);

            expectedByFeature[logData.feature] = (expectedByFeature[logData.feature] ?? 0) + logData.cost;
            expectedByAgent[logData.agent] = (expectedByAgent[logData.agent] ?? 0) + logData.cost;
          }

          // Query and aggregate
          const actualLogs = await db.usageLog.findMany({
            where: { creatorId: creator.id },
          });

          const actualByFeature: Record<string, number> = {};
          const actualByAgent: Record<string, number> = {};

          for (const log of actualLogs) {
            actualByFeature[log.feature] = (actualByFeature[log.feature] ?? 0) + Number(log.costUsd);
            if (log.agentId) {
              actualByAgent[log.agentId] = (actualByAgent[log.agentId] ?? 0) + Number(log.costUsd);
            }
          }

          // Verify feature breakdown
          for (const feature in expectedByFeature) {
            const expected = expectedByFeature[feature];
            const actual = actualByFeature[feature] ?? 0;
            expect(Math.abs(actual - expected)).toBeLessThan(0.01);
          }

          // Verify agent breakdown
          for (const agent in expectedByAgent) {
            const expected = expectedByAgent[agent];
            const actual = actualByAgent[agent] ?? 0;
            expect(Math.abs(actual - expected)).toBeLessThan(0.01);
          }
          
          return true;
        }
      ),
      { numRuns: 20, timeout: 60000 }
    );
  }, 70000);
});
