/**
 * Unit Tests for Azure Cognitive Search Service
 * 
 * Tests memory storage and retrieval functionality with Azure Cognitive Search.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AzureCognitiveSearchService } from '../../../lib/ai/azure/azure-cognitive-search.service';
import { AzureEmbeddingService } from '../../../lib/ai/azure/azure-embedding.service';
import type { MemoryDocument } from '../../../lib/ai/azure/azure-cognitive-search.service';

// Mock Azure SDK
vi.mock('@azure/search-documents', () => {
  const mockSearchClient = {
    uploadDocuments: vi.fn(),
    search: vi.fn(),
    deleteDocuments: vi.fn()
  };
  
  return {
    SearchClient: vi.fn(function() {
      return mockSearchClient;
    }),
    SearchIndexClient: vi.fn(function() {
      return {};
    }),
    AzureKeyCredential: vi.fn(function() {
      return {};
    })
  };
});

vi.mock('@azure/identity', () => ({
  DefaultAzureCredential: vi.fn(function() {
    return {};
  })
}));

// Mock embedding service
vi.mock('../../../lib/ai/azure/azure-embedding.service', () => ({
  AzureEmbeddingService: vi.fn(function() {
    return {
      generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
      generateEmbeddings: vi.fn().mockImplementation((texts: string[]) => 
        Promise.resolve(texts.map(() => new Array(1536).fill(0.1)))
      )
    };
  })
}));

describe('AzureCognitiveSearchService', () => {
  let service: AzureCognitiveSearchService;
  let mockSearchClient: any;
  let mockEmbeddingService: any;

  beforeEach(() => {
    // Reset environment variables
    process.env.AZURE_SEARCH_ENDPOINT = 'https://test.search.windows.net';
    process.env.AZURE_SEARCH_API_KEY = 'test-key';
    process.env.AZURE_SEARCH_INDEX_NAME = 'test-index';
    process.env.AZURE_USE_MANAGED_IDENTITY = 'false';

    // Create mock embedding service
    mockEmbeddingService = {
      generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
      generateEmbeddings: vi.fn().mockImplementation((texts: string[]) => 
        Promise.resolve(texts.map(() => new Array(1536).fill(0.1)))
      )
    };

    // Create service with mock embedding service
    service = new AzureCognitiveSearchService(mockEmbeddingService as any);
    
    // Get mock search client
    mockSearchClient = (service as any).searchClient;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('indexMemory', () => {
    it('should generate embedding and index memory document', async () => {
      const memory: Omit<MemoryDocument, 'contentVector'> = {
        id: 'mem-1',
        fanId: 'fan-1',
        creatorId: 'creator-1',
        content: 'Hello, how are you?',
        sender: 'fan',
        sentiment: 'positive',
        topics: ['greeting'],
        timestamp: new Date(),
        metadata: {}
      };

      mockSearchClient.uploadDocuments.mockResolvedValue({
        results: [{ succeeded: true }]
      });

      await service.indexMemory(memory);

      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith(memory.content);
      expect(mockSearchClient.uploadDocuments).toHaveBeenCalledWith([
        expect.objectContaining({
          ...memory,
          contentVector: expect.any(Array)
        })
      ]);
    });

    it('should throw error if indexing fails', async () => {
      const memory: Omit<MemoryDocument, 'contentVector'> = {
        id: 'mem-1',
        fanId: 'fan-1',
        creatorId: 'creator-1',
        content: 'Test message',
        sender: 'fan',
        sentiment: null,
        topics: [],
        timestamp: new Date(),
        metadata: {}
      };

      mockSearchClient.uploadDocuments.mockResolvedValue({
        results: [{ succeeded: false, errorMessage: 'Index error' }]
      });

      await expect(service.indexMemory(memory)).rejects.toThrow('Failed to index document');
    });

    it('should retry on transient failures', async () => {
      const memory: Omit<MemoryDocument, 'contentVector'> = {
        id: 'mem-1',
        fanId: 'fan-1',
        creatorId: 'creator-1',
        content: 'Test',
        sender: 'fan',
        sentiment: null,
        topics: [],
        timestamp: new Date(),
        metadata: {}
      };

      mockSearchClient.uploadDocuments
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockResolvedValueOnce({
          results: [{ succeeded: true }]
        });

      await service.indexMemory(memory);

      expect(mockSearchClient.uploadDocuments).toHaveBeenCalledTimes(2);
    });
  });

  describe('indexMemories', () => {
    it('should batch index multiple memories', async () => {
      const memories: Omit<MemoryDocument, 'contentVector'>[] = [
        {
          id: 'mem-1',
          fanId: 'fan-1',
          creatorId: 'creator-1',
          content: 'Message 1',
          sender: 'fan',
          sentiment: null,
          topics: [],
          timestamp: new Date(),
          metadata: {}
        },
        {
          id: 'mem-2',
          fanId: 'fan-1',
          creatorId: 'creator-1',
          content: 'Message 2',
          sender: 'creator',
          sentiment: null,
          topics: [],
          timestamp: new Date(),
          metadata: {}
        }
      ];

      mockSearchClient.uploadDocuments.mockResolvedValue({
        results: memories.map(() => ({ succeeded: true }))
      });

      await service.indexMemories(memories);

      expect(mockEmbeddingService.generateEmbeddings).toHaveBeenCalledWith(
        memories.map(m => m.content)
      );
      expect(mockSearchClient.uploadDocuments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'mem-1', contentVector: expect.any(Array) }),
          expect.objectContaining({ id: 'mem-2', contentVector: expect.any(Array) })
        ])
      );
    });

    it('should handle large batches by splitting into chunks', async () => {
      const memories: Omit<MemoryDocument, 'contentVector'>[] = Array.from({ length: 150 }, (_, i) => ({
        id: `mem-${i}`,
        fanId: 'fan-1',
        creatorId: 'creator-1',
        content: `Message ${i}`,
        sender: 'fan' as const,
        sentiment: null,
        topics: [],
        timestamp: new Date(),
        metadata: {}
      }));

      mockSearchClient.uploadDocuments.mockResolvedValue({
        results: Array(100).fill({ succeeded: true })
      });

      await service.indexMemories(memories);

      // Should be called twice (100 + 50)
      expect(mockSearchClient.uploadDocuments).toHaveBeenCalledTimes(2);
    });
  });

  describe('searchSimilar', () => {
    it('should perform hybrid search with vector and keyword', async () => {
      const query = 'How are you?';
      const fanId = 'fan-1';
      const creatorId = 'creator-1';

      const mockResults = {
        results: (async function* () {
          yield {
            document: {
              id: 'mem-1',
              fanId,
              creatorId,
              content: 'I am doing great!',
              sender: 'creator',
              sentiment: 'positive',
              topics: ['wellbeing'],
              timestamp: new Date(),
              metadata: {}
            },
            score: 0.85
          };
        })()
      };

      mockSearchClient.search.mockResolvedValue(mockResults);

      const results = await service.searchSimilar(query, fanId, creatorId);

      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith(query);
      expect(mockSearchClient.search).toHaveBeenCalledWith(
        query,
        expect.objectContaining({
          top: 10,
          filter: expect.stringContaining(`fanId eq '${fanId}'`),
          vectorSearchOptions: expect.objectContaining({
            queries: expect.arrayContaining([
              expect.objectContaining({
                kind: 'vector',
                vector: expect.any(Array)
              })
            ])
          })
        })
      );
      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(0.85);
    });

    it('should filter results by minimum score', async () => {
      const query = 'test';
      const fanId = 'fan-1';
      const creatorId = 'creator-1';

      const mockResults = {
        results: (async function* () {
          yield { document: { id: 'mem-1' }, score: 0.9 };
          yield { document: { id: 'mem-2' }, score: 0.6 };
          yield { document: { id: 'mem-3' }, score: 0.8 };
        })()
      };

      mockSearchClient.search.mockResolvedValue(mockResults);

      const results = await service.searchSimilar(query, fanId, creatorId, {
        minScore: 0.75
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.score >= 0.75)).toBe(true);
    });

    it('should support keyword-only search', async () => {
      const query = 'test';
      const fanId = 'fan-1';
      const creatorId = 'creator-1';

      mockSearchClient.search.mockResolvedValue({
        results: (async function* () {})()
      });

      await service.searchSimilar(query, fanId, creatorId, {
        includeVectorSearch: false,
        includeKeywordSearch: true
      });

      expect(mockEmbeddingService.generateEmbedding).not.toHaveBeenCalled();
      expect(mockSearchClient.search).toHaveBeenCalledWith(
        query,
        expect.objectContaining({
          vectorSearchOptions: undefined
        })
      );
    });
  });

  describe('getRecentMemories', () => {
    it('should retrieve recent memories ordered by timestamp', async () => {
      const fanId = 'fan-1';
      const creatorId = 'creator-1';

      const mockResults = {
        results: (async function* () {
          yield {
            document: {
              id: 'mem-1',
              fanId,
              creatorId,
              content: 'Recent message',
              timestamp: new Date()
            }
          };
        })()
      };

      mockSearchClient.search.mockResolvedValue(mockResults);

      const results = await service.getRecentMemories(fanId, creatorId, 50);

      expect(mockSearchClient.search).toHaveBeenCalledWith(
        '*',
        expect.objectContaining({
          top: 50,
          filter: expect.stringContaining(`fanId eq '${fanId}'`),
          orderBy: ['timestamp desc']
        })
      );
      expect(results).toHaveLength(1);
    });
  });

  describe('deleteMemories', () => {
    it('should delete all memories for a fan', async () => {
      const fanId = 'fan-1';
      const creatorId = 'creator-1';

      // Mock search to find documents
      const mockSearchResults = {
        results: (async function* () {
          yield { document: { id: 'mem-1' } };
          yield { document: { id: 'mem-2' } };
        })()
      };

      mockSearchClient.search.mockResolvedValue(mockSearchResults);
      mockSearchClient.deleteDocuments.mockResolvedValue({});

      await service.deleteMemories(fanId, creatorId);

      expect(mockSearchClient.search).toHaveBeenCalledWith(
        '*',
        expect.objectContaining({
          filter: expect.stringContaining(`fanId eq '${fanId}'`)
        })
      );
      expect(mockSearchClient.deleteDocuments).toHaveBeenCalledWith(
        'id',
        ['mem-1', 'mem-2']
      );
    });

    it('should handle empty result set gracefully', async () => {
      const fanId = 'fan-1';
      const creatorId = 'creator-1';

      mockSearchClient.search.mockResolvedValue({
        results: (async function* () {})()
      });

      await service.deleteMemories(fanId, creatorId);

      expect(mockSearchClient.deleteDocuments).not.toHaveBeenCalled();
    });

    it('should batch delete large result sets', async () => {
      const fanId = 'fan-1';
      const creatorId = 'creator-1';

      // Mock 150 documents
      const mockSearchResults = {
        results: (async function* () {
          for (let i = 0; i < 150; i++) {
            yield { document: { id: `mem-${i}` } };
          }
        })()
      };

      mockSearchClient.search.mockResolvedValue(mockSearchResults);
      mockSearchClient.deleteDocuments.mockResolvedValue({});

      await service.deleteMemories(fanId, creatorId);

      // Should be called twice (100 + 50)
      expect(mockSearchClient.deleteDocuments).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteMemory', () => {
    it('should delete a specific memory by ID', async () => {
      const id = 'mem-1';

      mockSearchClient.deleteDocuments.mockResolvedValue({});

      await service.deleteMemory(id);

      expect(mockSearchClient.deleteDocuments).toHaveBeenCalledWith('id', [id]);
    });
  });

  describe('getMemoryCount', () => {
    it('should return count of memories for a fan', async () => {
      const fanId = 'fan-1';
      const creatorId = 'creator-1';

      mockSearchClient.search.mockResolvedValue({
        count: 42,
        results: (async function* () {})()
      });

      const count = await service.getMemoryCount(fanId, creatorId);

      expect(count).toBe(42);
      expect(mockSearchClient.search).toHaveBeenCalledWith(
        '*',
        expect.objectContaining({
          filter: expect.stringContaining(`fanId eq '${fanId}'`),
          includeTotalCount: true,
          top: 0
        })
      );
    });

    it('should return 0 on error', async () => {
      const fanId = 'fan-1';
      const creatorId = 'creator-1';

      mockSearchClient.search.mockRejectedValue(new Error('Search error'));

      const count = await service.getMemoryCount(fanId, creatorId);

      expect(count).toBe(0);
    });
  });
});
