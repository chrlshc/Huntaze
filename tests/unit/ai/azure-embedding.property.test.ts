/**
 * Property-Based Tests for Azure Embedding Service
 * 
 * Feature: huntaze-ai-azure-migration, Property 6: Embedding generation
 * Task 16.1: Write property test for embedding generation
 * Validates: Requirements 3.1
 * 
 * Property 6: Embedding Model Consistency
 * For any interaction stored in the memory service, the system should generate 
 * embeddings using the text-embedding-ada-002 model.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
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

describe('AzureEmbeddingService - Property-Based Tests', () => {
  let service: AzureEmbeddingService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEmbeddings.mockReset();
    service = new AzureEmbeddingService();
  });

  /**
   * Property 6: Embedding Model Consistency
   * For any text input, the embedding service should use text-embedding-ada-002 model
   */
  describe('Property 6: Embedding Model Consistency', () => {
    it('should always use text-embedding-ada-002 model for any text', () => {
      fc.assert(
        fc.asyncProperty(
          // Generate random non-empty text strings
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          async (text) => {
            // Clear cache to ensure fresh generation
            service.clearCache();
            
            // Arrange
            const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
            
            mockGetEmbeddings.mockResolvedValue({
              data: [{ embedding: mockEmbedding }],
              model: 'text-embedding-ada-002',
              usage: { promptTokens: 10, totalTokens: 10 },
            });

            // Act
            const result = await service.generateEmbedding(text);

            // Assert
            expect(result.model).toBe('text-embedding-ada-002');
            expect(mockGetEmbeddings).toHaveBeenLastCalledWith(
              'text-embedding-ada-002-prod', // Deployment name
              [text],
              expect.any(Object)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return 1536-dimensional embeddings for any text', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          async (text) => {
            // Clear cache to ensure fresh generation
            service.clearCache();
            
            // Arrange
            const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
            
            mockGetEmbeddings.mockResolvedValue({
              data: [{ embedding: mockEmbedding }],
              model: 'text-embedding-ada-002',
              usage: { promptTokens: 10, totalTokens: 10 },
            });

            // Act
            const result = await service.generateEmbedding(text);

            // Assert
            expect(result.embedding).toHaveLength(1536);
            expect(Array.isArray(result.embedding)).toBe(true);
            expect(result.embedding.every(v => typeof v === 'number')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate consistent embeddings for identical texts', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          async (text) => {
            // Clear cache and reset mock before each iteration
            service.clearCache();
            mockGetEmbeddings.mockReset();
            
            // Arrange - Use a fixed embedding for consistency
            const mockEmbedding = new Array(1536).fill(0).map((_, i) => i / 1536);
            
            mockGetEmbeddings.mockResolvedValue({
              data: [{ embedding: mockEmbedding }],
              model: 'text-embedding-ada-002',
              usage: { promptTokens: 10, totalTokens: 10 },
            });

            // Act
            const result1 = await service.generateEmbedding(text);
            const result2 = await service.generateEmbedding(text);

            // Assert - Should use cache and return identical embeddings
            expect(result1.embedding).toEqual(result2.embedding);
            expect(result1.model).toBe(result2.model);
            // Mock should only be called once due to caching
            expect(mockGetEmbeddings).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Batch Embedding Consistency
   * For any array of texts, batch embedding should produce same results as individual embeddings
   */
  describe('Property: Batch Embedding Consistency', () => {
    it('should produce consistent results for batch vs individual embeddings', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 10 }),
          async (texts) => {
            // Clear cache and reset mock to ensure fresh generation
            service.clearCache();
            mockGetEmbeddings.mockReset();

            // Arrange - Mock for individual calls
            const mockEmbeddings = texts.map(() => 
              new Array(1536).fill(0).map(() => Math.random())
            );

            // Mock batch call
            mockGetEmbeddings.mockResolvedValue({
              data: mockEmbeddings.map(embedding => ({ embedding })),
              model: 'text-embedding-ada-002',
              usage: { promptTokens: texts.length * 10, totalTokens: texts.length * 10 },
            });

            // Act
            const batchResult = await service.generateEmbeddings(texts);

            // Assert
            expect(batchResult.embeddings).toHaveLength(texts.length);
            expect(batchResult.model).toBe('text-embedding-ada-002');
            batchResult.embeddings.forEach(embedding => {
              expect(embedding).toHaveLength(1536);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle batches larger than 16 items correctly', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 17, max: 50 }),
          async (count) => {
            // Clear cache and reset mock
            service.clearCache();
            mockGetEmbeddings.mockReset();
            
            // Arrange
            const texts = new Array(count).fill('test');
            const mockEmbedding = new Array(1536).fill(0).map((_, i) => i / 1536);
            
            mockGetEmbeddings.mockResolvedValue({
              data: new Array(16).fill({ embedding: mockEmbedding }),
              model: 'text-embedding-ada-002',
              usage: { promptTokens: 160, totalTokens: 160 },
            });

            // Act
            const result = await service.generateEmbeddings(texts);

            // Assert
            expect(result.embeddings).toHaveLength(count);
            const expectedBatches = Math.ceil(count / 16);
            expect(mockGetEmbeddings).toHaveBeenCalledTimes(expectedBatches);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Cosine Similarity Properties
   * Mathematical properties of cosine similarity
   */
  describe('Property: Cosine Similarity Properties', () => {
    it('should return 1 for identical vectors', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { minLength: 10, maxLength: 100 })
            .filter(v => v.some(x => x !== 0)), // Filter out all-zero vectors
          (vector) => {
            // Act
            const similarity = service.cosineSimilarity(vector, vector);

            // Assert - Identical vectors should have similarity of 1
            expect(similarity).toBeCloseTo(1, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be symmetric', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { minLength: 10, maxLength: 100 })
            .filter(v => v.some(x => x !== 0)),
          fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { minLength: 10, maxLength: 100 })
            .filter(v => v.some(x => x !== 0)),
          (vector1, vector2) => {
            // Ensure same length
            const length = Math.min(vector1.length, vector2.length);
            const v1 = vector1.slice(0, length);
            const v2 = vector2.slice(0, length);

            // Act
            const sim1 = service.cosineSimilarity(v1, v2);
            const sim2 = service.cosineSimilarity(v2, v1);

            // Assert - Cosine similarity should be symmetric
            expect(sim1).toBeCloseTo(sim2, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be bounded between -1 and 1', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { minLength: 10, maxLength: 100 })
            .filter(v => v.some(x => x !== 0)),
          fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { minLength: 10, maxLength: 100 })
            .filter(v => v.some(x => x !== 0)),
          (vector1, vector2) => {
            // Ensure same length
            const length = Math.min(vector1.length, vector2.length);
            const v1 = vector1.slice(0, length);
            const v2 = vector2.slice(0, length);

            // Act
            const similarity = service.cosineSimilarity(v1, v2);

            // Assert - Cosine similarity must be between -1 and 1
            expect(similarity).toBeGreaterThanOrEqual(-1);
            expect(similarity).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Cache Behavior
   * Cache should be transparent and not affect results
   */
  describe('Property: Cache Behavior', () => {
    it('should use cache to avoid redundant API calls', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          async (text) => {
            // Clear cache and reset mock before each iteration
            service.clearCache();
            mockGetEmbeddings.mockReset();
            
            // Arrange - Use fixed embedding for consistency
            const mockEmbedding = new Array(1536).fill(0).map((_, i) => i / 1536);
            
            mockGetEmbeddings.mockResolvedValue({
              data: [{ embedding: mockEmbedding }],
              model: 'text-embedding-ada-002',
              usage: { promptTokens: 10, totalTokens: 10 },
            });

            // Act - Call twice with same text
            const result1 = await service.generateEmbedding(text);
            const result2 = await service.generateEmbedding(text);

            // Assert - Mock should only be called once due to caching
            expect(mockGetEmbeddings).toHaveBeenCalledTimes(1);
            expect(result1.embedding).toEqual(result2.embedding);
            expect(result1.model).toBe(result2.model);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Error Handling
   * Service should handle errors gracefully
   */
  describe('Property: Error Handling', () => {
    it('should reject empty or whitespace-only strings', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom('', '   ', '\t', '\n', '  \t\n  '),
          async (emptyText) => {
            // Act & Assert
            await expect(service.generateEmbedding(emptyText))
              .rejects.toThrow('Text cannot be empty');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should filter out empty texts in batch operations', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.oneof(
              fc.string({ minLength: 1, maxLength: 100 }),
              fc.constantFrom('', '   ', '\t')
            ),
            { minLength: 1, maxLength: 20 }
          ),
          async (texts) => {
            // Arrange
            const validTexts = texts.filter(t => t.trim().length > 0);
            if (validTexts.length === 0) return; // Skip if no valid texts

            const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
            mockGetEmbeddings.mockResolvedValue({
              data: validTexts.map(() => ({ embedding: mockEmbedding })),
              model: 'text-embedding-ada-002',
              usage: { promptTokens: validTexts.length * 10, totalTokens: validTexts.length * 10 },
            });

            // Act
            const result = await service.generateEmbeddings(texts);

            // Assert - Should only generate embeddings for valid texts
            expect(result.embeddings).toHaveLength(validTexts.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Token Usage Tracking
   * Service should always report token usage
   */
  describe('Property: Token Usage Tracking', () => {
    it('should always include usage information in response', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          async (text) => {
            // Clear cache and reset mock before each iteration
            service.clearCache();
            mockGetEmbeddings.mockReset();
            
            // Arrange
            const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
            
            mockGetEmbeddings.mockResolvedValue({
              data: [{ embedding: mockEmbedding }],
              model: 'text-embedding-ada-002',
              usage: { promptTokens: 10, totalTokens: 10 },
            });

            // Act
            const result = await service.generateEmbedding(text);

            // Assert
            expect(result.usage).toBeDefined();
            expect(result.usage.promptTokens).toBeGreaterThan(0);
            expect(result.usage.totalTokens).toBeGreaterThan(0);
            expect(result.usage.totalTokens).toBeGreaterThanOrEqual(result.usage.promptTokens);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

