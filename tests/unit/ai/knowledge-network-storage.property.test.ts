/**
 * Property-Based Tests for Insight Storage Completeness
 * 
 * Feature: ai-system-gemini-integration, Property 20: Insight storage completeness
 * Validates: Requirements 7.1, 10.1, 10.3
 * 
 * Tests that all insights are stored with complete information
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

describe('Property 20: Insight storage completeness', () => {
  beforeEach(() => {
    // Clear mock insights before each test
    mockInsights.length = 0;
    vi.clearAllMocks();
  });

  test('stores insight with all required fields for any valid input', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }), // creatorId
        fc.constantFrom('messaging-agent', 'content-agent', 'analytics-agent', 'sales-agent'), // source
        fc.constantFrom('fan_preference', 'content_strategy', 'sales_tactic', 'engagement_pattern'), // type
        fc.float({ min: 0, max: 1 }), // confidence
        fc.record({
          key: fc.string({ minLength: 1, maxLength: 20 }),
          value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
        }), // data
        async (creatorId, source, type, confidence, data) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          const timestamp = new Date();
          
          const insight: Insight = {
            source,
            type,
            confidence,
            data,
            timestamp,
          };
          
          await network.storeInsight(creatorId, insight);
          
          // Verify insight was stored
          const stored = mockInsights.filter(i => i.creatorId === creatorId);
          expect(stored.length).toBe(1);
          
          const storedInsight = stored[0];
          
          // Requirement 7.1: Verify all required fields are present
          expect(storedInsight.creatorId).toBe(creatorId);
          expect(storedInsight.source).toBe(source);
          expect(storedInsight.type).toBe(type);
          expect(storedInsight.confidence).toBe(confidence);
          expect(storedInsight.data).toEqual(data);
          expect(storedInsight.createdAt).toEqual(timestamp);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('broadcastInsight stores insight identically to storeInsight', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.float({ min: 0, max: 1 }),
        fc.object(),
        async (creatorId, source, type, confidence, data) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          const timestamp = new Date();
          
          const insight: Insight = {
            source,
            type,
            confidence,
            data,
            timestamp,
          };
          
          // Use broadcastInsight instead of storeInsight
          await network.broadcastInsight(creatorId, insight);
          
          // Verify insight was stored with all fields
          const stored = mockInsights.filter(i => i.creatorId === creatorId);
          expect(stored.length).toBe(1);
          
          const storedInsight = stored[0];
          expect(storedInsight.source).toBe(source);
          expect(storedInsight.type).toBe(type);
          expect(storedInsight.confidence).toBe(confidence);
          expect(storedInsight.data).toEqual(data);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('multiple insights are stored independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.array(
          fc.record({
            source: fc.string({ minLength: 5, maxLength: 20 }),
            type: fc.string({ minLength: 5, maxLength: 20 }),
            confidence: fc.float({ min: 0, max: 1 }),
            data: fc.object(),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (creatorId, insightData) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          // Store multiple insights
          for (const data of insightData) {
            await network.storeInsight(creatorId, {
              ...data,
              timestamp: new Date(),
            });
          }
          
          // Verify all insights were stored
          const stored = mockInsights.filter(i => i.creatorId === creatorId);
          expect(stored.length).toBe(insightData.length);
          
          // Verify each insight has its own data
          for (let i = 0; i < insightData.length; i++) {
            const expectedData = insightData[i];
            const storedInsight = stored.find(s => 
              s.source === expectedData.source && 
              s.type === expectedData.type
            );
            
            expect(storedInsight).toBeDefined();
            expect(storedInsight.confidence).toBe(expectedData.confidence);
            expect(storedInsight.data).toEqual(expectedData.data);
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('insights from different creators are isolated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        async (creatorId1, creatorId2, type) => {
          // Ensure different creator IDs
          fc.pre(creatorId1 !== creatorId2);
          
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          // Store insights for two different creators
          await network.storeInsight(creatorId1, {
            source: 'agent1',
            type,
            confidence: 0.8,
            data: { creator: 1 },
            timestamp: new Date(),
          });
          
          await network.storeInsight(creatorId2, {
            source: 'agent2',
            type,
            confidence: 0.9,
            data: { creator: 2 },
            timestamp: new Date(),
          });
          
          // Verify insights are isolated by creator
          const creator1Insights = mockInsights.filter(i => i.creatorId === creatorId1);
          const creator2Insights = mockInsights.filter(i => i.creatorId === creatorId2);
          
          expect(creator1Insights.length).toBe(1);
          expect(creator2Insights.length).toBe(1);
          
          expect(creator1Insights[0].data).toEqual({ creator: 1 });
          expect(creator2Insights[0].data).toEqual({ creator: 2 });
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('confidence values are preserved exactly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.float({ min: 0, max: 1, noNaN: true }), // Ensure no NaN values
        async (creatorId, confidence) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          await network.storeInsight(creatorId, {
            source: 'test-agent',
            type: 'test-type',
            confidence,
            data: {},
            timestamp: new Date(),
          });
          
          const stored = mockInsights.filter(i => i.creatorId === creatorId);
          expect(stored.length).toBe(1);
          
          // Confidence should be preserved exactly
          expect(stored[0].confidence).toBe(confidence);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('timestamps are preserved correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
        async (creatorId, timestamp) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          await network.storeInsight(creatorId, {
            source: 'test-agent',
            type: 'test-type',
            confidence: 0.5,
            data: {},
            timestamp,
          });
          
          const stored = mockInsights.filter(i => i.creatorId === creatorId);
          expect(stored.length).toBe(1);
          
          // Timestamp should be preserved
          expect(stored[0].createdAt).toEqual(timestamp);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('complex data structures are stored correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.record({
          nested: fc.record({
            value: fc.string(),
            count: fc.integer(),
          }),
          array: fc.array(fc.string(), { maxLength: 5 }),
          boolean: fc.boolean(),
        }),
        async (creatorId, complexData) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          await network.storeInsight(creatorId, {
            source: 'test-agent',
            type: 'test-type',
            confidence: 0.5,
            data: complexData,
            timestamp: new Date(),
          });
          
          const stored = mockInsights.filter(i => i.creatorId === creatorId);
          expect(stored.length).toBe(1);
          
          // Complex data should be preserved
          expect(stored[0].data).toEqual(complexData);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
