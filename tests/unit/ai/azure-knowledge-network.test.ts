/**
 * Unit Tests for Azure AI Knowledge Network
 * 
 * Tests the event-driven insight broadcasting and retrieval system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
        // Empty results by default
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

describe('AzureAIKnowledgeNetwork', () => {
  let network: AzureAIKnowledgeNetwork;
  const mockCreatorId = 123;

  beforeEach(() => {
    // Set required environment variables
    process.env.AZURE_EVENTGRID_TOPIC_ENDPOINT = 'https://test.eventgrid.azure.net/api/events';
    process.env.AZURE_EVENTGRID_ACCESS_KEY = 'test-key';
    process.env.AZURE_SEARCH_ENDPOINT = 'https://test.search.windows.net';
    process.env.AZURE_SEARCH_API_KEY = 'test-search-key';
    process.env.AZURE_SEARCH_INSIGHTS_INDEX = 'ai-insights';
    process.env.AZURE_USE_MANAGED_IDENTITY = 'false';

    network = new AzureAIKnowledgeNetwork();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('broadcastInsight', () => {
    it('should broadcast insight via Event Grid', async () => {
      const insight: Insight = {
        source: 'emma',
        type: 'fan_preference',
        confidence: 0.85,
        data: { preference: 'morning_messages' },
        timestamp: new Date(),
      };

      await network.broadcastInsight(mockCreatorId, insight);

      // Verify Event Grid client was called
      const { EventGridPublisherClient } = await import('@azure/eventgrid');
      const mockClient = vi.mocked(EventGridPublisherClient).mock.results[0].value;
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: 'Huntaze.AI.InsightBroadcast',
            subject: `creator/${mockCreatorId}/insight/${insight.type}`,
            data: expect.objectContaining({
              creatorId: mockCreatorId,
              insight: expect.objectContaining({
                source: insight.source,
                type: insight.type,
                confidence: insight.confidence,
              }),
            }),
          }),
        ])
      );
    });

    it('should store insight in Azure Cognitive Search', async () => {
      const insight: Insight = {
        source: 'alex',
        type: 'content_strategy',
        confidence: 0.92,
        data: { strategy: 'video_content' },
        timestamp: new Date(),
      };

      await network.broadcastInsight(mockCreatorId, insight);

      // Verify Search client was called
      const { SearchClient } = await import('@azure/search-documents');
      const mockSearchClient = vi.mocked(SearchClient).mock.results[0].value;
      expect(mockSearchClient.uploadDocuments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            creatorId: mockCreatorId,
            source: insight.source,
            type: insight.type,
            confidence: insight.confidence,
          }),
        ])
      );
    });

    it('should store insight in PostgreSQL database', async () => {
      const insight: Insight = {
        source: 'sarah',
        type: 'sales_tactic',
        confidence: 0.78,
        data: { tactic: 'urgency' },
        timestamp: new Date(),
      };

      await network.broadcastInsight(mockCreatorId, insight);

      // Verify database was called
      const { db } = await import('../../../lib/prisma');
      expect(db.aIInsight.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creatorId: mockCreatorId,
            source: insight.source,
            type: insight.type,
            confidence: insight.confidence,
            data: insight.data,
          }),
        })
      );
    });

    it('should generate unique ID for insight', async () => {
      const insight: Insight = {
        source: 'claire',
        type: 'compliance_check',
        confidence: 0.95,
        data: { status: 'approved' },
        timestamp: new Date(),
      };

      await network.broadcastInsight(mockCreatorId, insight);

      const { db } = await import('../../../lib/prisma');
      const createCall = vi.mocked(db.aIInsight.create).mock.calls[0][0];
      expect(createCall.data.id).toBeDefined();
      expect(typeof createCall.data.id).toBe('string');
    });

    it('should notify local subscribers', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      network.subscribe('alex', handler);

      const insight: Insight = {
        source: 'emma',
        type: 'fan_preference',
        confidence: 0.85,
        data: { preference: 'evening_messages' },
        timestamp: new Date(),
      };

      await network.broadcastInsight(mockCreatorId, insight);

      expect(handler).toHaveBeenCalledWith(
        mockCreatorId,
        expect.objectContaining({
          source: insight.source,
          type: insight.type,
          confidence: insight.confidence,
        })
      );
    });

    it('should not notify source agent', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      network.subscribe('emma', handler);

      const insight: Insight = {
        source: 'emma',
        type: 'fan_preference',
        confidence: 0.85,
        data: { preference: 'morning_messages' },
        timestamp: new Date(),
      };

      await network.broadcastInsight(mockCreatorId, insight);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle Event Grid failures gracefully', async () => {
      const { EventGridPublisherClient } = await import('@azure/eventgrid');
      const mockClient = vi.mocked(EventGridPublisherClient).mock.results[0].value;
      mockClient.send = vi.fn().mockRejectedValue(new Error('Event Grid error'));

      const handler = vi.fn().mockResolvedValue(undefined);
      network.subscribe('alex', handler);

      const insight: Insight = {
        source: 'emma',
        type: 'fan_preference',
        confidence: 0.85,
        data: { preference: 'morning_messages' },
        timestamp: new Date(),
      };

      await expect(network.broadcastInsight(mockCreatorId, insight)).rejects.toThrow('Event Grid error');

      // Should still notify local subscribers
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('subscribe/unsubscribe', () => {
    it('should add subscription handler', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      network.subscribe('emma', handler);

      // Verify by triggering a broadcast
      const insight: Insight = {
        source: 'alex',
        type: 'content_strategy',
        confidence: 0.9,
        data: {},
        timestamp: new Date(),
      };

      await network.broadcastInsight(mockCreatorId, insight);
      // Handler should be called (tested in broadcastInsight tests)
      expect(handler).toHaveBeenCalled();
    });

    it('should support multiple handlers for same agent', async () => {
      const handler1 = vi.fn().mockResolvedValue(undefined);
      const handler2 = vi.fn().mockResolvedValue(undefined);

      network.subscribe('emma', handler1);
      network.subscribe('emma', handler2);

      const insight: Insight = {
        source: 'alex',
        type: 'content_strategy',
        confidence: 0.9,
        data: {},
        timestamp: new Date(),
      };

      await network.broadcastInsight(mockCreatorId, insight);

      // Both handlers should be called
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should remove subscription handler', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      network.subscribe('emma', handler);
      network.unsubscribe('emma');

      const insight: Insight = {
        source: 'alex',
        type: 'content_strategy',
        confidence: 0.9,
        data: {},
        timestamp: new Date(),
      };

      await network.broadcastInsight(mockCreatorId, insight);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('getRelevantInsights', () => {
    it('should retrieve insights from Azure Cognitive Search', async () => {
      const mockInsights = [
        {
          id: 'insight1',
          source: 'emma',
          type: 'fan_preference',
          confidence: 0.85,
          data: JSON.stringify({ preference: 'morning' }),
          timestamp: new Date().toISOString(),
        },
      ];

      const { SearchClient } = await import('@azure/search-documents');
      const mockSearchClient = vi.mocked(SearchClient).mock.results[0].value;
      mockSearchClient.search = vi.fn().mockReturnValue({
        results: {
          [Symbol.asyncIterator]: async function* () {
            for (const insight of mockInsights) {
              yield { document: insight };
            }
          },
        },
      });

      const results = await network.getRelevantInsights(mockCreatorId, 'fan_preference', 10);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        source: 'emma',
        type: 'fan_preference',
        confidence: 0.85,
      });
    });

    it('should apply confidence decay to old insights', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60); // 60 days old

      const mockInsights = [
        {
          id: 'insight1',
          source: 'emma',
          type: 'fan_preference',
          confidence: 1.0,
          data: JSON.stringify({ preference: 'morning' }),
          timestamp: oldDate.toISOString(),
        },
      ];

      const { SearchClient } = await import('@azure/search-documents');
      const mockSearchClient = vi.mocked(SearchClient).mock.results[0].value;
      mockSearchClient.search = vi.fn().mockReturnValue({
        results: {
          [Symbol.asyncIterator]: async function* () {
            for (const insight of mockInsights) {
              yield { document: insight };
            }
          },
        },
      });

      const results = await network.getRelevantInsights(mockCreatorId, 'fan_preference', 10);

      expect(results[0].decayedConfidence).toBeLessThan(results[0].confidence);
      // 60 days = 2 periods of 30 days, so decay = 0.8^2 = 0.64
      expect(results[0].decayedConfidence).toBeCloseTo(0.64, 2);
    });

    it('should sort insights by relevance score', async () => {
      const mockInsights = [
        {
          id: 'insight1',
          source: 'emma',
          type: 'fan_preference',
          confidence: 0.5,
          data: JSON.stringify({}),
          timestamp: new Date().toISOString(),
        },
        {
          id: 'insight2',
          source: 'alex',
          type: 'fan_preference',
          confidence: 0.9,
          data: JSON.stringify({}),
          timestamp: new Date().toISOString(),
        },
      ];

      const { SearchClient } = await import('@azure/search-documents');
      const mockSearchClient = vi.mocked(SearchClient).mock.results[0].value;
      mockSearchClient.search = vi.fn().mockReturnValue({
        results: {
          [Symbol.asyncIterator]: async function* () {
            for (const insight of mockInsights) {
              yield { document: insight };
            }
          },
        },
      });

      const results = await network.getRelevantInsights(mockCreatorId, 'fan_preference', 10);

      expect(results[0].confidence).toBe(0.9);
      expect(results[1].confidence).toBe(0.5);
    });

    it('should limit results to specified count', async () => {
      const mockInsights = Array.from({ length: 20 }, (_, i) => ({
        id: `insight${i}`,
        source: 'emma',
        type: 'fan_preference',
        confidence: 0.8,
        data: JSON.stringify({}),
        timestamp: new Date().toISOString(),
      }));

      const { SearchClient } = await import('@azure/search-documents');
      const mockSearchClient = vi.mocked(SearchClient).mock.results[0].value;
      mockSearchClient.search = vi.fn().mockReturnValue({
        results: {
          [Symbol.asyncIterator]: async function* () {
            for (const insight of mockInsights) {
              yield { document: insight };
            }
          },
        },
      });

      const results = await network.getRelevantInsights(mockCreatorId, 'fan_preference', 5);

      expect(results).toHaveLength(5);
    });
  });

  describe('getInsightStats', () => {
    it('should return insight statistics', async () => {
      const mockInsights = [
        { type: 'fan_preference', source: 'emma', confidence: 0.8 },
        { type: 'fan_preference', source: 'emma', confidence: 0.9 },
        { type: 'sales_tactic', source: 'sarah', confidence: 0.7 },
      ];

      const { db } = await import('../../../lib/prisma');
      vi.mocked(db.aIInsight.findMany).mockResolvedValue(mockInsights as any);

      const stats = await network.getInsightStats(mockCreatorId);

      expect(stats.totalInsights).toBe(3);
      expect(stats.insightsByType).toEqual({
        fan_preference: 2,
        sales_tactic: 1,
      });
      expect(stats.insightsBySource).toEqual({
        emma: 2,
        sarah: 1,
      });
      expect(stats.averageConfidence).toBeCloseTo(0.8, 2);
    });

    it('should handle empty insights', async () => {
      const { db } = await import('../../../lib/prisma');
      vi.mocked(db.aIInsight.findMany).mockResolvedValue([]);

      const stats = await network.getInsightStats(mockCreatorId);

      expect(stats.totalInsights).toBe(0);
      expect(stats.averageConfidence).toBe(0);
    });
  });

  describe('cleanupOldInsights', () => {
    it('should delete old insights from database and search', async () => {
      const { db } = await import('../../../lib/prisma');
      vi.mocked(db.aIInsight.deleteMany).mockResolvedValue({ count: 5 });

      const { SearchClient } = await import('@azure/search-documents');
      const mockSearchClient = vi.mocked(SearchClient).mock.results[0].value;
      mockSearchClient.search = vi.fn().mockReturnValue({
        results: {
          [Symbol.asyncIterator]: async function* () {
            yield { document: { id: 'insight1' } };
            yield { document: { id: 'insight2' } };
          },
        },
      });

      const count = await network.cleanupOldInsights(mockCreatorId, 90);

      expect(count).toBe(5);
      expect(db.aIInsight.deleteMany).toHaveBeenCalled();
      expect(mockSearchClient.deleteDocuments).toHaveBeenCalledWith('id', ['insight1', 'insight2']);
    });

    it('should use custom retention period', async () => {
      const { db } = await import('../../../lib/prisma');
      vi.mocked(db.aIInsight.deleteMany).mockResolvedValue({ count: 3 });

      await network.cleanupOldInsights(mockCreatorId, 30);

      const deleteCall = vi.mocked(db.aIInsight.deleteMany).mock.calls[0][0];
      const cutoffDate = deleteCall.where.createdAt.lt as Date;
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 30);

      expect(cutoffDate.getDate()).toBe(expectedDate.getDate());
    });
  });
});
