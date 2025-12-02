/**
 * Unit Tests for Azure Embedding Service
 * 
 * Feature: huntaze-ai-azure-migration
 * Task 16: Implement embedding generation with Azure OpenAI
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AzureEmbeddingService } from '../../../lib/ai/azure/azure-embedding.service';

// Create mock function in hoisted scope
const mockGetEmbeddings = vi.hoisted(() => vi.fn());

// Mock Azure OpenAI SDK
vi.mock('@azure/openai', () => ({
  OpenAIClient: vi.fn(function() {
    return {
      getEmbeddings: mockGetEmbeddings,
    };
  }),
  AzureKeyCredential: vi.fn(),
}));

vi.mock('@azure/identity', () => ({
  DefaultAzureCredential: vi.fn(),
}));

// Mock Azure OpenAI config
vi.mock('../../../lib/ai/azure/azure-openai.config', () => ({
  AZURE_OPENAI_CONFIG: {
    endpoint: 'https://test.openai.azure.com/',
    apiKey: 'test-api-key',
    useManagedIdentity: false,
    deployments: {
      premium: 'gpt-4-turbo-prod',
      standard: 'gpt-4-standard-prod',
      economy: 'gpt-35-turbo-prod',
      vision: 'gpt-4-vision-prod',
      embedding: 'text-embedding-ada-002-prod',
    },
    timeout: 30000,
    retryConfig: {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
    },
    regions: {
      primary: 'eastus',
      secondary: 'eastus',
    },
  },
  AZURE_OPENAI_MODELS: {
    'text-embedding-ada-002-prod': {
      name: 'text-embedding-ada-002',
      version: '2',
      dimensions: 1536,
      costPer1kTokens: 0.0001,
    },
  },
}));

describe('AzureEmbeddingService', () => {
  let service: AzureEmbeddingService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockGetEmbeddings.mockReset();
    
    // Create service instance
    service = new AzureEmbeddingService();
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for valid text', async () => {
      // Arrange
      const text = 'Hello, how are you?';
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      
      mockGetEmbeddings.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
        model: 'text-embedding-ada-002',
        usage: {
          promptTokens: 5,
          totalTokens: 5,
        },
      });

      // Act
      const result = await service.generateEmbedding(text);

      // Assert
      expect(result.embedding).toEqual(mockEmbedding);
      expect(result.embedding.length).toBe(1536);
      expect(result.model).toBe('text-embedding-ada-002');
      expect(result.usage.promptTokens).toBeGreaterThan(0);
      expect(mockGetEmbeddings).toHaveBeenCalledWith(
        expect.any(String),
        [text],
        expect.any(Object)
      );
    });

    it('should throw error for empty text', async () => {
      // Act & Assert
      await expect(service.generateEmbedding('')).rejects.toThrow('Text cannot be empty');
    });

    it('should use cache for repeated requests', async () => {
      // Arrange
      const text = 'Test message';
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      
      mockGetEmbeddings.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
        model: 'text-embedding-ada-002',
        usage: { promptTokens: 3, totalTokens: 3 },
      });

      // Act
      const result1 = await service.generateEmbedding(text);
      const result2 = await service.generateEmbedding(text);

      // Assert
      expect(result1.embedding).toEqual(result2.embedding);
      expect(mockGetEmbeddings).toHaveBeenCalledTimes(1); // Only called once due to cache
    });

    it('should skip cache when skipCache option is true', async () => {
      // Arrange
      const text = 'Test message';
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      
      mockGetEmbeddings.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
        model: 'text-embedding-ada-002',
        usage: { promptTokens: 3, totalTokens: 3 },
      });

      // Act
      await service.generateEmbedding(text);
      await service.generateEmbedding(text, { skipCache: true });

      // Assert
      expect(mockGetEmbeddings).toHaveBeenCalledTimes(2); // Called twice
    });

    it('should retry on transient failures', async () => {
      // Arrange
      const text = 'Test message';
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      
      // Fail first two attempts, succeed on third
      mockGetEmbeddings
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          data: [{ embedding: mockEmbedding }],
          model: 'text-embedding-ada-002',
          usage: { promptTokens: 3, totalTokens: 3 },
        });

      // Act
      const result = await service.generateEmbedding(text);

      // Assert
      expect(result.embedding).toEqual(mockEmbedding);
      expect(mockGetEmbeddings).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retry attempts', async () => {
      // Arrange
      const text = 'Test message';
      
      mockGetEmbeddings.mockRejectedValue(new Error('Persistent error'));

      // Act & Assert
      await expect(service.generateEmbedding(text)).rejects.toThrow();
      expect(mockGetEmbeddings).toHaveBeenCalledTimes(3); // Max attempts
    });

    it('should validate embedding dimensions', async () => {
      // Arrange
      const text = 'Test message';
      const invalidEmbedding = new Array(512).fill(0); // Wrong dimensions
      
      mockGetEmbeddings.mockResolvedValue({
        data: [{ embedding: invalidEmbedding }],
        model: 'text-embedding-ada-002',
        usage: { promptTokens: 3, totalTokens: 3 },
      });

      // Act & Assert
      await expect(service.generateEmbedding(text)).rejects.toThrow('Invalid embedding dimensions');
    });
  });

  describe('generateEmbeddings (batch)', () => {
    it('should generate embeddings for multiple texts', async () => {
      // Arrange
      const texts = ['Hello', 'World', 'Test'];
      const mockEmbeddings = texts.map(() => 
        new Array(1536).fill(0).map(() => Math.random())
      );
      
      mockGetEmbeddings.mockResolvedValue({
        data: mockEmbeddings.map(embedding => ({ embedding })),
        model: 'text-embedding-ada-002',
        usage: { promptTokens: 10, totalTokens: 10 },
      });

      // Act
      const result = await service.generateEmbeddings(texts);

      // Assert
      expect(result.embeddings).toHaveLength(3);
      expect(result.embeddings[0].length).toBe(1536);
      expect(mockGetEmbeddings).toHaveBeenCalledTimes(1);
    });

    it('should split large batches into chunks of 16', async () => {
      // Arrange
      const texts = new Array(40).fill('Test message');
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      
      mockGetEmbeddings.mockResolvedValue({
        data: new Array(16).fill({ embedding: mockEmbedding }),
        model: 'text-embedding-ada-002',
        usage: { promptTokens: 50, totalTokens: 50 },
      });

      // Act
      const result = await service.generateEmbeddings(texts);

      // Assert
      expect(result.embeddings).toHaveLength(40);
      expect(mockGetEmbeddings).toHaveBeenCalledTimes(3); // 40 / 16 = 3 batches
    });

    it('should throw error for empty array', async () => {
      // Act & Assert
      await expect(service.generateEmbeddings([])).rejects.toThrow('Texts array cannot be empty');
    });

    it('should filter out empty texts', async () => {
      // Arrange
      const texts = ['Hello', '', 'World', '   ', 'Test'];
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      
      mockGetEmbeddings.mockResolvedValue({
        data: [
          { embedding: mockEmbedding },
          { embedding: mockEmbedding },
          { embedding: mockEmbedding },
        ],
        model: 'text-embedding-ada-002',
        usage: { promptTokens: 10, totalTokens: 10 },
      });

      // Act
      const result = await service.generateEmbeddings(texts);

      // Assert
      expect(result.embeddings).toHaveLength(3); // Only valid texts
      expect(mockGetEmbeddings).toHaveBeenCalledWith(
        expect.any(String),
        ['Hello', 'World', 'Test'],
        expect.any(Object)
      );
    });

    it('should use cache for batch requests', async () => {
      // Arrange
      const texts = ['Hello', 'World'];
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      
      mockGetEmbeddings.mockResolvedValue({
        data: [{ embedding: mockEmbedding }, { embedding: mockEmbedding }],
        model: 'text-embedding-ada-002',
        usage: { promptTokens: 5, totalTokens: 5 },
      });

      // Act
      await service.generateEmbeddings(texts);
      const result = await service.generateEmbeddings(texts);

      // Assert
      expect(result.embeddings).toHaveLength(2);
      expect(mockGetEmbeddings).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should handle partial cache hits', async () => {
      // Arrange
      const texts1 = ['Hello', 'World'];
      const texts2 = ['Hello', 'Test']; // 'Hello' is cached, 'Test' is not
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      
      mockGetEmbeddings.mockResolvedValue({
        data: [{ embedding: mockEmbedding }, { embedding: mockEmbedding }],
        model: 'text-embedding-ada-002',
        usage: { promptTokens: 5, totalTokens: 5 },
      });

      // Act
      await service.generateEmbeddings(texts1);
      mockGetEmbeddings.mockClear();
      
      mockGetEmbeddings.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
        model: 'text-embedding-ada-002',
        usage: { promptTokens: 2, totalTokens: 2 },
      });
      
      const result = await service.generateEmbeddings(texts2);

      // Assert
      expect(result.embeddings).toHaveLength(2);
      expect(mockGetEmbeddings).toHaveBeenCalledTimes(1); // Only for 'Test'
      expect(mockGetEmbeddings).toHaveBeenCalledWith(
        expect.any(String),
        ['Test'],
        expect.any(Object)
      );
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      // Arrange
      const embedding1 = [1, 0, 0];
      const embedding2 = [1, 0, 0];

      // Act
      const similarity = service.cosineSimilarity(embedding1, embedding2);

      // Assert
      expect(similarity).toBe(1); // Identical vectors
    });

    it('should return 0 for orthogonal vectors', () => {
      // Arrange
      const embedding1 = [1, 0, 0];
      const embedding2 = [0, 1, 0];

      // Act
      const similarity = service.cosineSimilarity(embedding1, embedding2);

      // Assert
      expect(similarity).toBe(0); // Orthogonal vectors
    });

    it('should throw error for different dimensions', () => {
      // Arrange
      const embedding1 = [1, 0, 0];
      const embedding2 = [1, 0];

      // Act & Assert
      expect(() => service.cosineSimilarity(embedding1, embedding2))
        .toThrow('Embeddings must have the same dimensions');
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      // Arrange
      const text = 'Test message';
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      
      mockGetEmbeddings.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
        model: 'text-embedding-ada-002',
        usage: { promptTokens: 3, totalTokens: 3 },
      });

      // Act
      await service.generateEmbedding(text);
      service.clearCache();
      await service.generateEmbedding(text);

      // Assert
      expect(mockGetEmbeddings).toHaveBeenCalledTimes(2); // Called twice after cache clear
    });

    it('should return cache statistics', () => {
      // Act
      const stats = service.getCacheStats();

      // Assert
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hitRate');
      expect(typeof stats.size).toBe('number');
    });
  });
});

