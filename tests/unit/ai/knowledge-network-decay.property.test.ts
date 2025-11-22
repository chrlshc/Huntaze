/**
 * Property-Based Tests for Confidence Decay Over Time
 * 
 * Feature: ai-system-gemini-integration, Property 22: Confidence decay over time
 * Validates: Requirements 7.4, 10.4
 * 
 * Tests that confidence scores decay by 20% per 30 days
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { AIKnowledgeNetwork, Insight } from '../../../lib/ai/knowledge-network';

// Track database calls for verification
const mockInsights: any[] = [];

// Mock the database to track calls
vi.mock('../../../lib/prisma', () => ({
  db: {
    aIInsight: {
      create: vi.fn(async ({ data }: any) => {
        const insight = {
          id: `insight-${Date.now()}-${Math.random()}`,
          ...data,
        };
        mockInsights.push(insight);
        return insight;
      }),
      findMany: vi.fn(async ({ where, orderBy, take }: any) => {
        let filtered = mockInsights;
        
        if (where?.creatorId) {
          filtered = filtered.filter(i => i.creatorId === where.creatorId);
        }
        
        if (where?.type) {
          filtered = filtered.filter(i => i.type === where.type);
        }
        
        // Sort by createdAt desc
        if (orderBy?.createdAt === 'desc') {
          filtered = [...filtered].sort((a, b) => 
            b.createdAt.getTime() - a.createdAt.getTime()
          );
        }
        
        // Apply limit
        if (take) {
          filtered = filtered.slice(0, take);
        }
        
        return filtered;
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        const beforeCount = mockInsights.length;
        
        if (where?.creatorId && where?.createdAt?.lt) {
          const cutoffDate = where.createdAt.lt;
          const toKeep = mockInsights.filter(i => 
            i.creatorId !== where.creatorId || i.createdAt >= cutoffDate
          );
          mockInsights.length = 0;
          mockInsights.push(...toKeep);
        }
        
        return { count: beforeCount - mockInsights.length };
      }),
    },
  },
}));

describe('Property 22: Confidence decay over time', () => {
  beforeEach(() => {
    // Clear mock insights before each test
    mockInsights.length = 0;
    vi.clearAllMocks();
  });

  test('confidence decays by at least 20% after 30 days', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.float({ min: Math.fround(0.3), max: Math.fround(1), noNaN: true }), // Start with at least 0.3 to see meaningful decay
        async (creatorId, originalConfidence) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          // Store insight 30 days ago
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          
          await network.storeInsight(creatorId, {
            source: 'test-agent',
            type: 'test-type',
            confidence: originalConfidence,
            data: {},
            timestamp: thirtyDaysAgo,
          });
          
          // Retrieve insight (decay will be applied)
          const retrieved = await network.getRelevantInsights(creatorId, 'test-type');
          
          expect(retrieved.length).toBe(1);
          
          const decayedConfidence = retrieved[0].decayedConfidence;
          
          // After 30 days, confidence should be reduced by 20% (multiplied by 0.8)
          const expectedConfidence = originalConfidence * 0.8;
          
          // Allow small floating point error
          expect(Math.abs(decayedConfidence - expectedConfidence)).toBeLessThan(0.001);
          
          // Verify it's at least 20% less
          const reductionPercent = (originalConfidence - decayedConfidence) / originalConfidence;
          expect(reductionPercent).toBeGreaterThanOrEqual(0.19); // Allow small margin
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('confidence decays exponentially over multiple 30-day periods', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.float({ min: 0.5, max: 1, noNaN: true }),
        fc.integer({ min: 1, max: 4 }), // Number of 30-day periods
        async (creatorId, originalConfidence, periods) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          // Store insight N*30 days ago
          const daysAgo = periods * 30;
          const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
          
          await network.storeInsight(creatorId, {
            source: 'test-agent',
            type: 'test-type',
            confidence: originalConfidence,
            data: {},
            timestamp,
          });
          
          // Retrieve insight
          const retrieved = await network.getRelevantInsights(creatorId, 'test-type');
          
          expect(retrieved.length).toBe(1);
          
          const decayedConfidence = retrieved[0].decayedConfidence;
          
          // After N periods, confidence should be multiplied by 0.8^N
          const expectedConfidence = originalConfidence * Math.pow(0.8, periods);
          
          // Allow small floating point error
          expect(Math.abs(decayedConfidence - expectedConfidence)).toBeLessThan(0.001);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('recent insights have minimal decay', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.float({ min: 0.5, max: 1, noNaN: true }),
        fc.integer({ min: 0, max: 5 }), // Days old (less than 30)
        async (creatorId, originalConfidence, daysOld) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          // Store recent insight
          const timestamp = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
          
          await network.storeInsight(creatorId, {
            source: 'test-agent',
            type: 'test-type',
            confidence: originalConfidence,
            data: {},
            timestamp,
          });
          
          // Retrieve insight
          const retrieved = await network.getRelevantInsights(creatorId, 'test-type');
          
          expect(retrieved.length).toBe(1);
          
          const decayedConfidence = retrieved[0].decayedConfidence;
          
          // Recent insights should have confidence close to original
          // For 0-5 days, decay factor is 0.8^(days/30) which is close to 1
          const expectedDecayFactor = Math.pow(0.8, daysOld / 30);
          expect(expectedDecayFactor).toBeGreaterThan(0.95); // Should be > 95% of original
          
          // Verify decayed confidence is close to original
          expect(decayedConfidence).toBeGreaterThan(originalConfidence * 0.95);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('older insights have lower decayed confidence than newer ones', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.float({ min: 0.5, max: 1, noNaN: true }),
        fc.integer({ min: 10, max: 50 }), // Days for older insight
        fc.integer({ min: 1, max: 9 }), // Days for newer insight
        async (creatorId, confidence, olderDays, newerDays) => {
          // Ensure older is actually older
          fc.pre(olderDays > newerDays);
          
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          // Store two insights with same confidence but different ages
          const olderTimestamp = new Date(Date.now() - olderDays * 24 * 60 * 60 * 1000);
          const newerTimestamp = new Date(Date.now() - newerDays * 24 * 60 * 60 * 1000);
          
          await network.storeInsight(creatorId, {
            source: 'older-agent',
            type: 'test-type',
            confidence,
            data: { age: 'older' },
            timestamp: olderTimestamp,
          });
          
          await network.storeInsight(creatorId, {
            source: 'newer-agent',
            type: 'test-type',
            confidence,
            data: { age: 'newer' },
            timestamp: newerTimestamp,
          });
          
          // Retrieve insights
          const retrieved = await network.getRelevantInsights(creatorId, 'test-type', 10);
          
          expect(retrieved.length).toBe(2);
          
          // Find older and newer insights
          const olderInsight = retrieved.find(i => i.data.age === 'older');
          const newerInsight = retrieved.find(i => i.data.age === 'newer');
          
          expect(olderInsight).toBeDefined();
          expect(newerInsight).toBeDefined();
          
          // Older insight should have lower decayed confidence
          expect(olderInsight!.decayedConfidence).toBeLessThan(newerInsight!.decayedConfidence);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('decay formula is consistent for any age', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.float({ min: Math.fround(0.2), max: Math.fround(1), noNaN: true }),
        fc.integer({ min: 0, max: 180 }), // Days old (0 to 6 months)
        async (creatorId, originalConfidence, daysOld) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          // Store insight
          const timestamp = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
          
          await network.storeInsight(creatorId, {
            source: 'test-agent',
            type: 'test-type',
            confidence: originalConfidence,
            data: {},
            timestamp,
          });
          
          // Retrieve insight
          const retrieved = await network.getRelevantInsights(creatorId, 'test-type');
          
          expect(retrieved.length).toBe(1);
          
          const decayedConfidence = retrieved[0].decayedConfidence;
          
          // Calculate expected confidence using decay formula
          const thirtyDayPeriods = daysOld / 30;
          const expectedConfidence = originalConfidence * Math.pow(0.8, thirtyDayPeriods);
          
          // Verify formula is applied correctly
          expect(Math.abs(decayedConfidence - expectedConfidence)).toBeLessThan(0.001);
          
          // Verify decayed confidence is never greater than original
          expect(decayedConfidence).toBeLessThanOrEqual(originalConfidence);
          
          // Verify decayed confidence is always positive
          expect(decayedConfidence).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('original confidence is preserved in insight object', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.float({ min: 0.5, max: 1, noNaN: true }),
        fc.integer({ min: 30, max: 90 }),
        async (creatorId, originalConfidence, daysOld) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          // Store old insight
          const timestamp = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
          
          await network.storeInsight(creatorId, {
            source: 'test-agent',
            type: 'test-type',
            confidence: originalConfidence,
            data: {},
            timestamp,
          });
          
          // Retrieve insight
          const retrieved = await network.getRelevantInsights(creatorId, 'test-type');
          
          expect(retrieved.length).toBe(1);
          
          const insight = retrieved[0];
          
          // Original confidence should be preserved
          expect(insight.confidence).toBe(originalConfidence);
          
          // Decayed confidence should be different (and lower)
          expect(insight.decayedConfidence).toBeLessThan(originalConfidence);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('insights are ranked by decayed confidence', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.array(
          fc.record({
            confidence: fc.float({ min: 0.5, max: 1, noNaN: true }),
            daysOld: fc.integer({ min: 0, max: 90 }),
          }),
          { minLength: 3, maxLength: 5 }
        ),
        async (creatorId, insightData) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          // Store insights with different ages and confidences
          for (let i = 0; i < insightData.length; i++) {
            const { confidence, daysOld } = insightData[i];
            const timestamp = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
            
            await network.storeInsight(creatorId, {
              source: `agent-${i}`,
              type: 'test-type',
              confidence,
              data: { index: i },
              timestamp,
            });
          }
          
          // Retrieve insights
          const retrieved = await network.getRelevantInsights(creatorId, 'test-type', 10);
          
          expect(retrieved.length).toBe(insightData.length);
          
          // Verify insights are sorted by decayed confidence (descending)
          for (let i = 0; i < retrieved.length - 1; i++) {
            expect(retrieved[i].decayedConfidence).toBeGreaterThanOrEqual(
              retrieved[i + 1].decayedConfidence
            );
          }
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('zero-day-old insights have no decay', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.float({ min: Math.fround(0.2), max: Math.fround(1), noNaN: true }),
        async (creatorId, originalConfidence) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          // Store insight with current timestamp
          const now = new Date();
          
          await network.storeInsight(creatorId, {
            source: 'test-agent',
            type: 'test-type',
            confidence: originalConfidence,
            data: {},
            timestamp: now,
          });
          
          // Retrieve insight immediately
          const retrieved = await network.getRelevantInsights(creatorId, 'test-type');
          
          expect(retrieved.length).toBe(1);
          
          const decayedConfidence = retrieved[0].decayedConfidence;
          
          // Should have no decay (or minimal due to milliseconds elapsed)
          expect(Math.abs(decayedConfidence - originalConfidence)).toBeLessThan(0.001);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
});
