/**
 * Integration tests for Admin AI Cost Monitoring Dashboard
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

describe('Admin AI Costs API', () => {
  const testCreatorIds: number[] = [];
  const testUsageLogIds: string[] = [];

  beforeEach(async () => {
    // Clean up any existing test data
    await db.usageLog.deleteMany({
      where: {
        creator: {
          email: {
            startsWith: 'test-admin-api-',
          },
        },
      },
    });
    
    await db.users.deleteMany({
      where: {
        email: {
          startsWith: 'test-admin-api-',
        },
      },
    });
  });

  afterEach(async () => {
    // Cleanup
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

  it('should return total spending across all creators', async () => {
    // Create test creators
    const creator1 = await db.users.create({
      data: {
        email: `test-admin-api-1-${Date.now()}@example.com`,
        name: 'Test Creator 1',
      },
    });
    testCreatorIds.push(creator1.id);

    const creator2 = await db.users.create({
      data: {
        email: `test-admin-api-2-${Date.now()}@example.com`,
        name: 'Test Creator 2',
      },
    });
    testCreatorIds.push(creator2.id);

    // Create usage logs
    const log1 = await db.usageLog.create({
      data: {
        creatorId: creator1.id,
        feature: 'messaging',
        model: 'gemini-2.5-pro',
        tokensInput: 100,
        tokensOutput: 50,
        costUsd: new Decimal(1.5),
      },
    });
    testUsageLogIds.push(log1.id);

    const log2 = await db.usageLog.create({
      data: {
        creatorId: creator2.id,
        feature: 'content',
        model: 'gemini-2.5-pro',
        tokensInput: 200,
        tokensOutput: 100,
        costUsd: new Decimal(2.5),
      },
    });
    testUsageLogIds.push(log2.id);

    // Make API request
    const response = await fetch('http://localhost:3000/api/admin/ai-costs');
    expect(response.ok).toBe(true);

    const data = await response.json();
    
    // Verify total spending includes our test data
    expect(data.totalSpending).toBeDefined();
    expect(data.totalSpending.costUsd).toBeGreaterThanOrEqual(4.0);
    expect(data.totalSpending.tokensInput).toBeGreaterThanOrEqual(300);
    expect(data.totalSpending.tokensOutput).toBeGreaterThanOrEqual(150);
  });

  it('should return per-creator breakdown by feature', async () => {
    // Create test creator
    const creator = await db.users.create({
      data: {
        email: `test-admin-api-breakdown-${Date.now()}@example.com`,
        name: 'Test Creator',
      },
    });
    testCreatorIds.push(creator.id);

    // Create usage logs for different features
    const log1 = await db.usageLog.create({
      data: {
        creatorId: creator.id,
        feature: 'messaging',
        agentId: 'messaging-agent',
        model: 'gemini-2.5-pro',
        tokensInput: 100,
        tokensOutput: 50,
        costUsd: new Decimal(1.0),
      },
    });
    testUsageLogIds.push(log1.id);

    const log2 = await db.usageLog.create({
      data: {
        creatorId: creator.id,
        feature: 'content',
        agentId: 'content-agent',
        model: 'gemini-2.5-pro',
        tokensInput: 200,
        tokensOutput: 100,
        costUsd: new Decimal(2.0),
      },
    });
    testUsageLogIds.push(log2.id);

    // Make API request filtered by creator
    const response = await fetch(
      `http://localhost:3000/api/admin/ai-costs?creatorId=${creator.id}`
    );
    expect(response.ok).toBe(true);

    const data = await response.json();
    
    // Find our creator in the breakdown
    const creatorData = data.perCreatorBreakdown.find(
      (c: any) => c.creatorId === creator.id
    );
    
    expect(creatorData).toBeDefined();
    expect(creatorData.totalCost).toBeCloseTo(3.0, 2);
    expect(creatorData.byFeature.messaging).toBeDefined();
    expect(creatorData.byFeature.messaging.cost).toBeCloseTo(1.0, 2);
    expect(creatorData.byFeature.content).toBeDefined();
    expect(creatorData.byFeature.content.cost).toBeCloseTo(2.0, 2);
  });

  it('should filter by date range', async () => {
    // Create test creator
    const creator = await db.users.create({
      data: {
        email: `test-admin-api-date-${Date.now()}@example.com`,
        name: 'Test Creator',
      },
    });
    testCreatorIds.push(creator.id);

    // Create log in January 2024
    const log1 = await db.usageLog.create({
      data: {
        creatorId: creator.id,
        feature: 'messaging',
        model: 'gemini-2.5-pro',
        tokensInput: 100,
        tokensOutput: 50,
        costUsd: new Decimal(1.0),
        createdAt: new Date('2024-01-15'),
      },
    });
    testUsageLogIds.push(log1.id);

    // Create log in February 2024
    const log2 = await db.usageLog.create({
      data: {
        creatorId: creator.id,
        feature: 'messaging',
        model: 'gemini-2.5-pro',
        tokensInput: 100,
        tokensOutput: 50,
        costUsd: new Decimal(2.0),
        createdAt: new Date('2024-02-15'),
      },
    });
    testUsageLogIds.push(log2.id);

    // Query only January
    const response = await fetch(
      `http://localhost:3000/api/admin/ai-costs?creatorId=${creator.id}&startDate=2024-01-01&endDate=2024-01-31`
    );
    expect(response.ok).toBe(true);

    const data = await response.json();
    const creatorData = data.perCreatorBreakdown.find(
      (c: any) => c.creatorId === creator.id
    );
    
    expect(creatorData).toBeDefined();
    expect(creatorData.totalCost).toBeCloseTo(1.0, 2);
  });

  it('should filter by feature', async () => {
    // Create test creator
    const creator = await db.users.create({
      data: {
        email: `test-admin-api-feature-${Date.now()}@example.com`,
        name: 'Test Creator',
      },
    });
    testCreatorIds.push(creator.id);

    // Create logs for different features
    const log1 = await db.usageLog.create({
      data: {
        creatorId: creator.id,
        feature: 'messaging',
        model: 'gemini-2.5-pro',
        tokensInput: 100,
        tokensOutput: 50,
        costUsd: new Decimal(1.0),
      },
    });
    testUsageLogIds.push(log1.id);

    const log2 = await db.usageLog.create({
      data: {
        creatorId: creator.id,
        feature: 'content',
        model: 'gemini-2.5-pro',
        tokensInput: 100,
        tokensOutput: 50,
        costUsd: new Decimal(2.0),
      },
    });
    testUsageLogIds.push(log2.id);

    // Query only messaging feature
    const response = await fetch(
      `http://localhost:3000/api/admin/ai-costs?creatorId=${creator.id}&feature=messaging`
    );
    expect(response.ok).toBe(true);

    const data = await response.json();
    const creatorData = data.perCreatorBreakdown.find(
      (c: any) => c.creatorId === creator.id
    );
    
    expect(creatorData).toBeDefined();
    expect(creatorData.totalCost).toBeCloseTo(1.0, 2);
    expect(creatorData.byFeature.messaging).toBeDefined();
    expect(creatorData.byFeature.content).toBeUndefined();
  });

  it('should return high-cost creators ranked by spending', async () => {
    // Create multiple creators with different spending
    const creators = await Promise.all([
      db.users.create({
        data: {
          email: `test-admin-api-rank-1-${Date.now()}@example.com`,
          name: 'Low Spender',
        },
      }),
      db.users.create({
        data: {
          email: `test-admin-api-rank-2-${Date.now()}@example.com`,
          name: 'High Spender',
        },
      }),
      db.users.create({
        data: {
          email: `test-admin-api-rank-3-${Date.now()}@example.com`,
          name: 'Medium Spender',
        },
      }),
    ]);
    testCreatorIds.push(...creators.map(c => c.id));

    // Create logs with different costs
    const logs = await Promise.all([
      db.usageLog.create({
        data: {
          creatorId: creators[0].id,
          feature: 'messaging',
          model: 'gemini-2.5-pro',
          tokensInput: 100,
          tokensOutput: 50,
          costUsd: new Decimal(1.0),
        },
      }),
      db.usageLog.create({
        data: {
          creatorId: creators[1].id,
          feature: 'messaging',
          model: 'gemini-2.5-pro',
          tokensInput: 1000,
          tokensOutput: 500,
          costUsd: new Decimal(10.0),
        },
      }),
      db.usageLog.create({
        data: {
          creatorId: creators[2].id,
          feature: 'messaging',
          model: 'gemini-2.5-pro',
          tokensInput: 500,
          tokensOutput: 250,
          costUsd: new Decimal(5.0),
        },
      }),
    ]);
    testUsageLogIds.push(...logs.map(l => l.id));

    // Query with limit
    const response = await fetch(
      'http://localhost:3000/api/admin/ai-costs?limit=3'
    );
    expect(response.ok).toBe(true);

    const data = await response.json();
    
    // Find our test creators in the ranking
    const testCreatorRanking = data.highCostCreators.filter((c: any) =>
      creators.some(tc => tc.id === c.creatorId)
    );
    
    // Should be sorted by cost descending
    expect(testCreatorRanking.length).toBeGreaterThanOrEqual(3);
    expect(testCreatorRanking[0].totalCost).toBeGreaterThanOrEqual(testCreatorRanking[1].totalCost);
    expect(testCreatorRanking[1].totalCost).toBeGreaterThanOrEqual(testCreatorRanking[2].totalCost);
  });

  it('should detect anomalies', async () => {
    // Create creators with normal and anomalous spending
    const normalCreator = await db.users.create({
      data: {
        email: `test-admin-api-normal-${Date.now()}@example.com`,
        name: 'Normal Spender',
      },
    });
    testCreatorIds.push(normalCreator.id);

    const anomalousCreator = await db.users.create({
      data: {
        email: `test-admin-api-anomaly-${Date.now()}@example.com`,
        name: 'Anomalous Spender',
      },
    });
    testCreatorIds.push(anomalousCreator.id);

    // Create normal spending
    const normalLog = await db.usageLog.create({
      data: {
        creatorId: normalCreator.id,
        feature: 'messaging',
        model: 'gemini-2.5-pro',
        tokensInput: 100,
        tokensOutput: 50,
        costUsd: new Decimal(1.0),
      },
    });
    testUsageLogIds.push(normalLog.id);

    // Create anomalous spending (much higher)
    const anomalousLog = await db.usageLog.create({
      data: {
        creatorId: anomalousCreator.id,
        feature: 'messaging',
        model: 'gemini-2.5-pro',
        tokensInput: 10000,
        tokensOutput: 5000,
        costUsd: new Decimal(100.0),
      },
    });
    testUsageLogIds.push(anomalousLog.id);

    // Query
    const response = await fetch('http://localhost:3000/api/admin/ai-costs');
    expect(response.ok).toBe(true);

    const data = await response.json();
    
    // Should detect anomaly for high spender
    const anomaly = data.anomalies.find(
      (a: any) => a.creatorId === anomalousCreator.id && a.type === 'high_spending'
    );
    
    expect(anomaly).toBeDefined();
    expect(anomaly.severity).toMatch(/medium|high/);
  });
});
