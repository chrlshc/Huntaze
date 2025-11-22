/**
 * Property-Based Tests for Cross-Agent Insight Retrieval
 * 
 * Feature: ai-system-gemini-integration, Property 21: Cross-agent insight retrieval
 * Validates: Requirements 7.2, 10.2
 * 
 * Tests that insights can be retrieved across agents regardless of source
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

describe('Property 21: Cross-agent insight retrieval', () => {
  beforeEach(() => {
    // Clear mock insights before each test
    mockInsights.length = 0;
    vi.clearAllMocks();
  });

  test('retrieves insights of specified type regardless of source agent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }), // creatorId
        fc.constantFrom('fan_preference', 'content_strategy', 'sales_tactic'), // type
        fc.array(
          fc.constantFrom('messaging-agent', 'content-agent', 'analytics-agent', 'sales-agent'),
          { minLength: 2, maxLength: 4 }
        ), // different source agents
        async (creatorId, type, sourceAgents) => {
          // Remove duplicates from sourceAgents
          const uniqueSourceAgents = [...new Set(sourceAgents)];
          
          // Clear all mock insights before this test
          mockInsights.length = 0;
          vi.clearAllMocks();
          
          const network = new AIKnowledgeNetwork();
          
          // Store insights from different agents with the same type
          for (const source of uniqueSourceAgents) {
            await network.storeInsight(creatorId, {
              source,
              type,
              confidence: 0.8,
              data: { source },
              timestamp: new Date(),
            });
          }
          
          // Retrieve insights by type
          const retrieved = await network.getRelevantInsights(creatorId, type);
          
          // Should retrieve all insights of this type, regardless of source
          expect(retrieved.length).toBe(uniqueSourceAgents.length);
          
          // Verify all source agents are represented
          const retrievedSources = retrieved.map(i => i.source);
          for (const source of uniqueSourceAgents) {
            expect(retrievedSources).toContain(source);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('filters insights by creator ID correctly', async () => {
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
          
          // Store insights for two different creators with same type
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
          
          // Retrieve insights for creator 1
          const retrieved = await network.getRelevantInsights(creatorId1, type);
          
          // Should only get creator 1's insights
          expect(retrieved.length).toBe(1);
          expect(retrieved[0].data).toEqual({ creator: 1 });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('filters insights by type correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.constantFrom('fan_preference', 'content_strategy', 'sales_tactic'),
        fc.constantFrom('engagement_pattern', 'conversion_insight', 'timing_strategy'),
        async (creatorId, type1, type2) => {
          // Ensure different types
          fc.pre(type1 !== type2);
          
          // Clear all mock insights before this test
          mockInsights.length = 0;
          vi.clearAllMocks();
          
          const network = new AIKnowledgeNetwork();
          
          // Store insights of different types
          await network.storeInsight(creatorId, {
            source: 'agent1',
            type: type1,
            confidence: 0.8,
            data: { type: 1 },
            timestamp: new Date(),
          });
          
          await network.storeInsight(creatorId, {
            source: 'agent2',
            type: type2,
            confidence: 0.9,
            data: { type: 2 },
            timestamp: new Date(),
          });
          
          // Retrieve insights of type1
          const retrieved = await network.getRelevantInsights(creatorId, type1);
          
          // Should only get type1 insights
          expect(retrieved.length).toBe(1);
          expect(retrieved[0].type).toBe(type1);
          expect(retrieved[0].data).toEqual({ type: 1 });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('retrieves insights from multiple agents for same creator and type', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.integer({ min: 2, max: 5 }),
        async (creatorId, type, numAgents) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          // Store insights from multiple agents
          const agents = Array.from({ length: numAgents }, (_, i) => `agent-${i}`);
          
          for (const agent of agents) {
            await network.storeInsight(creatorId, {
              source: agent,
              type,
              confidence: 0.8,
              data: { agent },
              timestamp: new Date(),
            });
          }
          
          // Retrieve all insights
          const retrieved = await network.getRelevantInsights(creatorId, type, numAgents);
          
          // Should retrieve all insights from all agents
          expect(retrieved.length).toBe(numAgents);
          
          // Verify all agents are represented
          const retrievedAgents = retrieved.map(i => i.source);
          for (const agent of agents) {
            expect(retrievedAgents).toContain(agent);
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('respects limit parameter when retrieving insights', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.integer({ min: 5, max: 10 }), // total insights
        fc.integer({ min: 1, max: 4 }), // limit
        async (creatorId, type, totalInsights, limit) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          // Store multiple insights
          for (let i = 0; i < totalInsights; i++) {
            await network.storeInsight(creatorId, {
              source: `agent-${i}`,
              type,
              confidence: 0.8,
              data: { index: i },
              timestamp: new Date(Date.now() + i * 1000), // Different timestamps
            });
          }
          
          // Retrieve with limit
          const retrieved = await network.getRelevantInsights(creatorId, type, limit);
          
          // Should respect the limit
          expect(retrieved.length).toBeLessThanOrEqual(limit);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('returns empty array when no insights match criteria', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        async (creatorId, storedType, requestedType) => {
          // Ensure different types
          fc.pre(storedType !== requestedType);
          
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          // Store insight of one type
          await network.storeInsight(creatorId, {
            source: 'agent1',
            type: storedType,
            confidence: 0.8,
            data: {},
            timestamp: new Date(),
          });
          
          // Request different type
          const retrieved = await network.getRelevantInsights(creatorId, requestedType);
          
          // Should return empty array
          expect(retrieved.length).toBe(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('insights contain all original fields after retrieval', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.float({ min: 0, max: 1 }),
        fc.record({
          key: fc.string(),
          value: fc.oneof(fc.string(), fc.integer()),
        }),
        async (creatorId, source, type, confidence, data) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          const timestamp = new Date();
          
          // Store insight
          await network.storeInsight(creatorId, {
            source,
            type,
            confidence,
            data,
            timestamp,
          });
          
          // Retrieve insight
          const retrieved = await network.getRelevantInsights(creatorId, type);
          
          expect(retrieved.length).toBe(1);
          
          const insight = retrieved[0];
          
          // Verify all fields are present
          expect(insight.source).toBe(source);
          expect(insight.type).toBe(type);
          expect(insight.confidence).toBe(confidence);
          expect(insight.data).toEqual(data);
          expect(insight.timestamp).toEqual(timestamp);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('retrieves insights sorted by most recent first', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.integer({ min: 3, max: 5 }),
        async (creatorId, type, numInsights) => {
          mockInsights.length = 0;
          
          const network = new AIKnowledgeNetwork();
          
          // Store insights with different timestamps
          const timestamps: Date[] = [];
          for (let i = 0; i < numInsights; i++) {
            const timestamp = new Date(Date.now() - (numInsights - i) * 60000); // Older to newer
            timestamps.push(timestamp);
            
            await network.storeInsight(creatorId, {
              source: `agent-${i}`,
              type,
              confidence: 0.8,
              data: { index: i },
              timestamp,
            });
          }
          
          // Retrieve insights
          const retrieved = await network.getRelevantInsights(creatorId, type, numInsights);
          
          // Should be sorted by most recent first
          for (let i = 0; i < retrieved.length - 1; i++) {
            expect(retrieved[i].timestamp.getTime()).toBeGreaterThanOrEqual(
              retrieved[i + 1].timestamp.getTime()
            );
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
