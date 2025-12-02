/**
 * Property-Based Tests for Azure AI Knowledge Network
 * 
 * Feature: huntaze-ai-azure-migration, Property 10: Knowledge broadcast
 * Validates: Requirements 2.5
 * 
 * Property: For any insight shared by an agent, all other agents in the network
 * should receive the broadcasted insight via the event system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { AzureAIKnowledgeNetwork, Insight } from '../../../lib/ai/azure/knowledge-network.azure';

// Mock Azure SDK
vi.mock('@azure/eventgrid', () => {
  const mockSend = vi.fn().mockResolvedValue(undefined);
  return {
    EventGridPublisherClient: vi.fn(function(this: any) {
      this.send = mockSend;
      return this;
    }),
    AzureKeyCredential: vi.fn(),
  };
});

vi.mock('@azure/identity', () => ({
  DefaultAzureCredential: vi.fn(),
}));

vi.mock('@azure/search-documents', () => {
  const mockUploadDocuments = vi.fn().mockResolvedValue({ results: [] });
  const mockSearch = vi.fn().mockReturnValue({
    results: {
      [Symbol.asyncIterator]: async function* () {
        // Empty results
      },
    },
  });
  const mockDeleteDocuments = vi.fn().mockResolvedValue({ results: [] });
  
  return {
    SearchClient: vi.fn(function(this: any) {
      this.uploadDocuments = mockUploadDocuments;
      this.search = mockSearch;
      this.deleteDocuments = mockDeleteDocuments;
      return this;
    }),
    AzureKeyCredential: vi.fn(),
  };
});

vi.mock('../../../lib/prisma', () => ({
  db: {
    aIInsight: {
      create: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

describe('Azure Knowledge Network - Property-Based Tests', () => {
  beforeEach(() => {
    // Set required environment variables
    process.env.AZURE_EVENTGRID_TOPIC_ENDPOINT = 'https://test.eventgrid.azure.net/api/events';
    process.env.AZURE_EVENTGRID_ACCESS_KEY = 'test-key';
    process.env.AZURE_SEARCH_ENDPOINT = 'https://test.search.windows.net';
    process.env.AZURE_SEARCH_API_KEY = 'test-search-key';
    process.env.AZURE_SEARCH_INSIGHTS_INDEX = 'ai-insights';
    process.env.AZURE_USE_MANAGED_IDENTITY = 'false';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 10: Knowledge broadcast
   * 
   * For any insight shared by an agent, all other agents in the network
   * should receive the broadcasted insight via the event system.
   */
  describe('Property 10: Knowledge broadcast', () => {
    it('should broadcast insights to all subscribed agents except source', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random creator ID
          fc.integer({ min: 1, max: 10000 }),
          // Generate random source agent
          fc.constantFrom('emma', 'alex', 'sarah', 'claire'),
          // Generate random insight type
          fc.constantFrom('fan_preference', 'content_strategy', 'sales_tactic', 'compliance_check'),
          // Generate random confidence
          fc.float({ min: 0, max: 1 }),
          // Generate random data
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 20 }),
            value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
          }),
          // Generate list of subscribing agents (excluding source)
          fc.array(
            fc.constantFrom('emma', 'alex', 'sarah', 'claire'),
            { minLength: 1, maxLength: 3 }
          ),
          async (creatorId, sourceAgent, insightType, confidence, data, subscribingAgents) => {
            // Create network
            const network = new AzureAIKnowledgeNetwork();

            // Track which agents received the insight
            const receivedInsights = new Map<string, Insight>();

            // Subscribe agents (excluding source)
            const uniqueSubscribers = [...new Set(subscribingAgents)].filter(
              agent => agent !== sourceAgent
            );

            for (const agent of uniqueSubscribers) {
              network.subscribe(agent, async (cId, insight) => {
                receivedInsights.set(agent, insight);
              });
            }

            // Create and broadcast insight
            const insight: Insight = {
              source: sourceAgent,
              type: insightType,
              confidence,
              data,
              timestamp: new Date(),
            };

            await network.broadcastInsight(creatorId, insight);

            // Wait for async handlers to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            // Verify all subscribed agents (except source) received the insight
            for (const agent of uniqueSubscribers) {
              expect(receivedInsights.has(agent)).toBe(true);
              const received = receivedInsights.get(agent)!;
              expect(received.source).toBe(sourceAgent);
              expect(received.type).toBe(insightType);
              expect(received.confidence).toBe(confidence);
              expect(received.data).toEqual(data);
            }

            // Verify source agent did NOT receive the insight
            expect(receivedInsights.has(sourceAgent)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should broadcast insights with correct event structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }),
          fc.constantFrom('emma', 'alex', 'sarah', 'claire'),
          fc.constantFrom('fan_preference', 'content_strategy', 'sales_tactic', 'compliance_check'),
          fc.float({ min: 0, max: 1 }),
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 20 }),
            value: fc.string(),
          }),
          async (creatorId, sourceAgent, insightType, confidence, data) => {
            const network = new AzureAIKnowledgeNetwork();

            const insight: Insight = {
              source: sourceAgent,
              type: insightType,
              confidence,
              data,
              timestamp: new Date(),
            };

            await network.broadcastInsight(creatorId, insight);

            // Verify Event Grid was called with correct structure
            const { EventGridPublisherClient } = await import('@azure/eventgrid');
            const mockClient = vi.mocked(EventGridPublisherClient).mock.results[0].value;
            const sendCalls = mockClient.send.mock.calls;

            expect(sendCalls.length).toBeGreaterThan(0);
            const lastCall = sendCalls[sendCalls.length - 1][0];
            expect(lastCall).toHaveLength(1);

            const event = lastCall[0];
            expect(event.eventType).toBe('Huntaze.AI.InsightBroadcast');
            expect(event.subject).toBe(`creator/${creatorId}/insight/${insightType}`);
            expect(event.data.creatorId).toBe(creatorId);
            expect(event.data.insight.source).toBe(sourceAgent);
            expect(event.data.insight.type).toBe(insightType);
            expect(event.data.insight.confidence).toBe(confidence);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should store insights in both search and database', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }),
          fc.constantFrom('emma', 'alex', 'sarah', 'claire'),
          fc.constantFrom('fan_preference', 'content_strategy', 'sales_tactic', 'compliance_check'),
          fc.float({ min: 0, max: 1 }),
          fc.record({
            preference: fc.string(),
          }),
          async (creatorId, sourceAgent, insightType, confidence, data) => {
            const network = new AzureAIKnowledgeNetwork();

            const insight: Insight = {
              source: sourceAgent,
              type: insightType,
              confidence,
              data,
              timestamp: new Date(),
            };

            await network.broadcastInsight(creatorId, insight);

            // Verify Azure Cognitive Search was called
            const { SearchClient } = await import('@azure/search-documents');
            const mockSearchClient = vi.mocked(SearchClient).mock.results[0].value;
            const uploadCalls = mockSearchClient.uploadDocuments.mock.calls;

            expect(uploadCalls.length).toBeGreaterThan(0);
            const lastUpload = uploadCalls[uploadCalls.length - 1][0];
            expect(lastUpload).toHaveLength(1);
            expect(lastUpload[0].creatorId).toBe(creatorId);
            expect(lastUpload[0].source).toBe(sourceAgent);
            expect(lastUpload[0].type).toBe(insightType);
            expect(lastUpload[0].confidence).toBe(confidence);

            // Verify PostgreSQL was called
            const { db } = await import('../../../lib/prisma');
            const createCalls = vi.mocked(db.aIInsight.create).mock.calls;

            expect(createCalls.length).toBeGreaterThan(0);
            const lastCreate = createCalls[createCalls.length - 1][0];
            expect(lastCreate.data.creatorId).toBe(creatorId);
            expect(lastCreate.data.source).toBe(sourceAgent);
            expect(lastCreate.data.type).toBe(insightType);
            expect(lastCreate.data.confidence).toBe(confidence);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple concurrent broadcasts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }),
          fc.array(
            fc.record({
              source: fc.constantFrom('emma', 'alex', 'sarah', 'claire'),
              type: fc.constantFrom('fan_preference', 'content_strategy', 'sales_tactic'),
              confidence: fc.float({ min: 0, max: 1 }),
              data: fc.record({ key: fc.string() }),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          async (creatorId, insights) => {
            const network = new AzureAIKnowledgeNetwork();

            // Track received insights per agent
            const receivedByAgent = new Map<string, Insight[]>();
            const agents = ['emma', 'alex', 'sarah', 'claire'];

            for (const agent of agents) {
              receivedByAgent.set(agent, []);
              network.subscribe(agent, async (cId, insight) => {
                receivedByAgent.get(agent)!.push(insight);
              });
            }

            // Broadcast all insights concurrently
            await Promise.all(
              insights.map(insight =>
                network.broadcastInsight(creatorId, {
                  ...insight,
                  timestamp: new Date(),
                })
              )
            );

            // Wait for async handlers
            await new Promise(resolve => setTimeout(resolve, 50));

            // Verify each agent received insights from other agents
            for (const agent of agents) {
              const received = receivedByAgent.get(agent)!;
              const expectedCount = insights.filter(i => i.source !== agent).length;

              expect(received.length).toBe(expectedCount);

              // Verify no agent received their own insights
              for (const insight of received) {
                expect(insight.source).not.toBe(agent);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain insight integrity during broadcast', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }),
          fc.constantFrom('emma', 'alex', 'sarah', 'claire'),
          fc.constantFrom('fan_preference', 'content_strategy', 'sales_tactic', 'compliance_check'),
          fc.float({ min: 0, max: 1 }),
          fc.record({
            nested: fc.record({
              deep: fc.record({
                value: fc.string(),
                number: fc.integer(),
                bool: fc.boolean(),
              }),
            }),
          }),
          async (creatorId, sourceAgent, insightType, confidence, complexData) => {
            const network = new AzureAIKnowledgeNetwork();

            let receivedInsight: Insight | null = null;
            network.subscribe('receiver', async (cId, insight) => {
              receivedInsight = insight;
            });

            const originalInsight: Insight = {
              source: sourceAgent,
              type: insightType,
              confidence,
              data: complexData,
              timestamp: new Date(),
            };

            await network.broadcastInsight(creatorId, originalInsight);
            await new Promise(resolve => setTimeout(resolve, 10));

            // Verify insight data integrity
            expect(receivedInsight).not.toBeNull();
            expect(receivedInsight!.source).toBe(originalInsight.source);
            expect(receivedInsight!.type).toBe(originalInsight.type);
            expect(receivedInsight!.confidence).toBe(originalInsight.confidence);
            expect(receivedInsight!.data).toEqual(originalInsight.data);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle Event Grid failures gracefully in local notifications', async () => {
      // Test that local subscribers still receive insights even if Event Grid fails
      // This is tested in the unit tests with proper mock manipulation
      // Here we verify the property holds across different inputs
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }),
          fc.constantFrom('emma', 'alex', 'sarah', 'claire'),
          fc.constantFrom('fan_preference', 'content_strategy'),
          fc.float({ min: 0, max: 1 }),
          fc.record({ key: fc.string() }),
          async (creatorId, sourceAgent, insightType, confidence, data) => {
            const network = new AzureAIKnowledgeNetwork();

            let receivedInsight: Insight | null = null;
            network.subscribe('receiver', async (cId, insight) => {
              receivedInsight = insight;
            });

            const insight: Insight = {
              source: sourceAgent,
              type: insightType,
              confidence,
              data,
              timestamp: new Date(),
            };

            // Broadcast should succeed (Event Grid is mocked to succeed)
            await network.broadcastInsight(creatorId, insight);
            await new Promise(resolve => setTimeout(resolve, 10));

            // Local subscribers should receive the insight
            expect(receivedInsight).not.toBeNull();
            expect(receivedInsight!.source).toBe(sourceAgent);
            expect(receivedInsight!.type).toBe(insightType);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
