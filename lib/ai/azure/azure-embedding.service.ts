/**
 * Azure OpenAI Embedding Service
 * Generates embeddings using Azure OpenAI text-embedding-ada-002 model
 * 
 * Feature: huntaze-ai-azure-migration, Property 6: Embedding generation
 * Task 16: Implement embedding generation with Azure OpenAI
 * Validates: Requirements 3.1
 */

import { AzureOpenAI } from 'openai';
import { DefaultAzureCredential } from '@azure/identity';
import { AZURE_OPENAI_CONFIG } from './azure-openai.config';
import { AzureOpenAIError, type AzureOpenAIErrorCode } from './azure-openai.types';

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

/**
 * Embedding configuration
 */
const EMBEDDING_CONFIG = {
  model: 'text-embedding-ada-002',
  deployment: AZURE_OPENAI_CONFIG.deployments.embedding || 'text-embedding-ada-002',
  dimensions: 1536,
  maxBatchSize: 16, // Azure OpenAI limit for batch embedding
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  timeout: 10000, // 10 seconds
  retryConfig: {
    maxAttempts: 3,
    initialDelay: 100,
    maxDelay: 2000,
    backoffFactor: 2,
  },
};

/**
 * Embedding response
 */
export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Batch embedding response
 */
export interface BatchEmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Embedding cache entry
 */
interface CacheEntry {
  embedding: number[];
  timestamp: number;
}

/**
 * Azure OpenAI Embedding Service
 * Generates vector embeddings for semantic search and memory retrieval
 */
export class AzureEmbeddingService {
  private client: AzureOpenAI | null = null;
  private deployment: string;
  private cache: Map<string, CacheEntry> = new Map();
  private endpoint: string;

  constructor() {
    this.endpoint = AZURE_OPENAI_CONFIG.endpoint;
    this.deployment = EMBEDDING_CONFIG.deployment;

    // During Next.js build we disable the real client to avoid hard failures
    if (isBuildTime) {
      console.log('[AzureEmbeddingService] Initialized in build mode - Azure OpenAI client disabled');
      return;
    }

    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || process.env.OPENAI_API_VERSION;
    if (!apiVersion) {
      console.warn('[AzureEmbeddingService] AZURE_OPENAI_API_VERSION or OPENAI_API_VERSION not set - embeddings disabled');
      return;
    }

    try {
      // Initialize client with Managed Identity or API Key
      if (AZURE_OPENAI_CONFIG.useManagedIdentity) {
        const credential = new DefaultAzureCredential();

        this.client = new AzureOpenAI({
          endpoint: this.endpoint,
          apiVersion,
          azureADTokenProvider: async () => {
            const token = await credential.getToken('https://cognitiveservices.azure.com/.default');
            if (!token?.token) {
              throw new Error('Failed to acquire Azure AD token for Azure OpenAI');
            }
            return token.token;
          },
        });
      } else {
        if (!AZURE_OPENAI_CONFIG.apiKey) {
          console.warn('[AzureEmbeddingService] AZURE_OPENAI_API_KEY is not configured - embeddings disabled');
          return;
        }

        this.client = new AzureOpenAI({
          endpoint: this.endpoint,
          apiKey: AZURE_OPENAI_CONFIG.apiKey,
          apiVersion,
        });
      }

      // Start cache cleanup interval
      this.startCacheCleanup();
    } catch (error) {
      console.error('[AzureEmbeddingService] Failed to initialize Azure OpenAI client', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.client = null;
    }
  }

  /**
   * Generate embedding for a single text
   * Implements caching with 24-hour TTL
   * 
   * @param text - Text to generate embedding for
   * @param options - Optional configuration
   * @returns Embedding response with vector and usage
   */
  async generateEmbedding(
    text: string,
    options: { skipCache?: boolean } = {}
  ): Promise<EmbeddingResponse> {
    // Input validation
    if (!text || text.trim().length === 0) {
      throw new AzureOpenAIError(
        'Text cannot be empty',
        'invalid_request' as AzureOpenAIErrorCode,
        400,
        false
      );
    }

    const client = this.client;
    if (!client) {
      throw new AzureOpenAIError(
        'Azure OpenAI embeddings client is not configured',
        'authentication_error' as AzureOpenAIErrorCode,
        500,
        false
      );
    }

    // Check cache first (unless skipCache is true)
    if (!options.skipCache) {
      const cached = this.getFromCache(text);
      if (cached) {
        return {
          embedding: cached,
          model: EMBEDDING_CONFIG.model,
          usage: {
            promptTokens: this.estimateTokens(text),
            totalTokens: this.estimateTokens(text),
          },
        };
      }
    }

    // Generate embedding with retry logic
    const result = await this.withRetry(async () => {
      const response = await client.embeddings.create(
        {
          model: this.deployment,
          input: text,
          dimensions: EMBEDDING_CONFIG.dimensions,
        },
        {
          timeout: EMBEDDING_CONFIG.timeout,
        }
      );

      return response;
    });

    // Extract embedding
    const embedding = result.data[0]?.embedding;
    if (!embedding) {
      throw new AzureOpenAIError(
        'No embedding returned from Azure OpenAI',
        'unknown' as AzureOpenAIErrorCode,
        500,
        true
      );
    }

    // Validate embedding dimensions
    if (embedding.length !== EMBEDDING_CONFIG.dimensions) {
      throw new AzureOpenAIError(
        `Invalid embedding dimensions: expected ${EMBEDDING_CONFIG.dimensions}, got ${embedding.length}`,
        'unknown' as AzureOpenAIErrorCode,
        500,
        false
      );
    }

    // Cache the embedding
    this.setInCache(text, embedding);

    return {
      embedding,
      model: result.model || EMBEDDING_CONFIG.model,
      usage: {
        promptTokens: result.usage?.prompt_tokens || this.estimateTokens(text),
        totalTokens: result.usage?.total_tokens || this.estimateTokens(text),
      },
    };
  }

  /**
   * Generate embeddings for multiple texts in batch
   * Automatically splits into batches of 16 items (Azure OpenAI limit)
   * 
   * @param texts - Array of texts to generate embeddings for
   * @param options - Optional configuration
   * @returns Batch embedding response with vectors and usage
   */
  async generateEmbeddings(
    texts: string[],
    options: { skipCache?: boolean } = {}
  ): Promise<BatchEmbeddingResponse> {
    // Input validation
    if (!texts || texts.length === 0) {
      throw new AzureOpenAIError(
        'Texts array cannot be empty',
        'invalid_request' as AzureOpenAIErrorCode,
        400,
        false
      );
    }

    // Filter out empty texts
    const validTexts = texts.filter(t => t && t.trim().length > 0);
    if (validTexts.length === 0) {
      throw new AzureOpenAIError(
        'All texts are empty',
        'invalid_request' as AzureOpenAIErrorCode,
        400,
        false
      );
    }

    const client = this.client;
    if (!client) {
      throw new AzureOpenAIError(
        'Azure OpenAI embeddings client is not configured',
        'authentication_error' as AzureOpenAIErrorCode,
        500,
        false
      );
    }

    // Check cache for all texts (unless skipCache is true)
    const embeddings: number[][] = [];
    const textsToGenerate: string[] = [];
    const indexMap: Map<number, number> = new Map(); // Maps original index to textsToGenerate index

    if (!options.skipCache) {
      for (let i = 0; i < validTexts.length; i++) {
        const cached = this.getFromCache(validTexts[i]);
        if (cached) {
          embeddings[i] = cached;
        } else {
          indexMap.set(i, textsToGenerate.length);
          textsToGenerate.push(validTexts[i]);
        }
      }
    } else {
      textsToGenerate.push(...validTexts);
      validTexts.forEach((_, i) => indexMap.set(i, i));
    }

    // If all embeddings were cached, return immediately
    if (textsToGenerate.length === 0) {
      return {
        embeddings,
        model: EMBEDDING_CONFIG.model,
        usage: {
          promptTokens: validTexts.reduce((sum, t) => sum + this.estimateTokens(t), 0),
          totalTokens: validTexts.reduce((sum, t) => sum + this.estimateTokens(t), 0),
        },
      };
    }

    // Split into batches of max 16 items
    const batches: string[][] = [];
    for (let i = 0; i < textsToGenerate.length; i += EMBEDDING_CONFIG.maxBatchSize) {
      batches.push(textsToGenerate.slice(i, i + EMBEDDING_CONFIG.maxBatchSize));
    }

    // Generate embeddings for each batch
    let totalPromptTokens = 0;
    let totalTokens = 0;
    const generatedEmbeddings: number[][] = [];

    for (const batch of batches) {
      const result = await this.withRetry(async () => {
        const response = await client.embeddings.create(
          {
            model: this.deployment,
            input: batch,
            dimensions: EMBEDDING_CONFIG.dimensions,
          },
          {
            timeout: EMBEDDING_CONFIG.timeout,
          }
        );

        return response;
      });

      // Extract embeddings from batch
      for (let i = 0; i < batch.length; i++) {
        const embedding = result.data[i]?.embedding;
        if (!embedding) {
          throw new AzureOpenAIError(
            `No embedding returned for text at index ${i}`,
            'unknown' as AzureOpenAIErrorCode,
            500,
            true
          );
        }

        // Validate embedding dimensions
        if (embedding.length !== EMBEDDING_CONFIG.dimensions) {
          throw new AzureOpenAIError(
            `Invalid embedding dimensions at index ${i}: expected ${EMBEDDING_CONFIG.dimensions}, got ${embedding.length}`,
            'unknown' as AzureOpenAIErrorCode,
            500,
            false
          );
        }

        generatedEmbeddings.push(embedding);

        // Cache the embedding
        this.setInCache(batch[i], embedding);
      }

      // Accumulate usage
      totalPromptTokens += result.usage?.prompt_tokens || batch.reduce((sum, t) => sum + this.estimateTokens(t), 0);
      totalTokens += result.usage?.total_tokens || batch.reduce((sum, t) => sum + this.estimateTokens(t), 0);
    }

    // Merge cached and generated embeddings in original order
    for (let i = 0; i < validTexts.length; i++) {
      if (!embeddings[i]) {
        const genIndex = indexMap.get(i);
        if (genIndex !== undefined) {
          embeddings[i] = generatedEmbeddings[genIndex];
        }
      }
    }

    return {
      embeddings,
      model: EMBEDDING_CONFIG.model,
      usage: {
        promptTokens: totalPromptTokens,
        totalTokens,
      },
    };
  }

  /**
   * Calculate cosine similarity between two embeddings
   * 
   * @param embedding1 - First embedding vector
   * @param embedding2 - Second embedding vector
   * @returns Cosine similarity score (0-1)
   */
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Clear the embedding cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    // This is a simplified version - in production, track hits/misses
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get embedding from cache
   */
  private getFromCache(text: string): number[] | null {
    const key = this.getCacheKey(text);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache entry is expired
    const now = Date.now();
    if (now - entry.timestamp > EMBEDDING_CONFIG.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.embedding;
  }

  /**
   * Set embedding in cache
   */
  private setInCache(text: string, embedding: number[]): void {
    const key = this.getCacheKey(text);
    this.cache.set(key, {
      embedding,
      timestamp: Date.now(),
    });
  }

  /**
   * Generate cache key from text
   */
  private getCacheKey(text: string): string {
    // Simple hash function for cache key
    // In production, consider using a proper hash function
    return text.trim().toLowerCase();
  }

  /**
   * Estimate token count for text
   * Rough estimate: 1 token ≈ 4 characters
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    let delay = EMBEDDING_CONFIG.retryConfig.initialDelay;

    for (let attempt = 1; attempt <= EMBEDDING_CONFIG.retryConfig.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on non-retryable errors
        if (error instanceof AzureOpenAIError && !error.retryable) {
          throw error;
        }

        if (attempt === EMBEDDING_CONFIG.retryConfig.maxAttempts) {
          console.error('[AzureEmbeddingService] Operation failed after max attempts', {
            attempt,
            error: lastError.message,
          });
          throw this.handleError(lastError);
        }

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.3 * delay;
        const waitTime = Math.min(delay + jitter, EMBEDDING_CONFIG.retryConfig.maxDelay);

        console.warn('[AzureEmbeddingService] Retry attempt', {
          attempt,
          maxAttempts: EMBEDDING_CONFIG.retryConfig.maxAttempts,
          error: lastError.message,
          waitTime,
        });

        await new Promise(resolve => setTimeout(resolve, waitTime));
        delay *= EMBEDDING_CONFIG.retryConfig.backoffFactor;
      }
    }

    throw lastError;
  }

  /**
   * Handle and classify errors
   */
  private handleError(error: any): AzureOpenAIError {
    if (error instanceof AzureOpenAIError) {
      return error;
    }

    const message = error.message || 'Unknown error';
    const statusCode = error.statusCode || error.status;

    // Classify error type
    if (statusCode === 429) {
      return new AzureOpenAIError(
        'Rate limit exceeded',
        'rate_limit_exceeded' as AzureOpenAIErrorCode,
        429,
        true
      );
    }

    if (statusCode === 403 && message.includes('quota')) {
      return new AzureOpenAIError(
        'Quota exceeded',
        'quota_exceeded' as AzureOpenAIErrorCode,
        403,
        false
      );
    }

    if (statusCode === 401 || statusCode === 403) {
      return new AzureOpenAIError(
        'Authentication error',
        'authentication_error' as AzureOpenAIErrorCode,
        statusCode,
        false
      );
    }

    if (statusCode === 404) {
      return new AzureOpenAIError(
        'Deployment not found',
        'deployment_not_found' as AzureOpenAIErrorCode,
        404,
        false
      );
    }

    if (error.name === 'AbortError' || message.includes('timeout')) {
      return new AzureOpenAIError(
        'Request timeout',
        'timeout' as AzureOpenAIErrorCode,
        408,
        true
      );
    }

    // Unknown error
    return new AzureOpenAIError(
      message,
      'unknown' as AzureOpenAIErrorCode,
      statusCode,
      true
    );
  }

  /**
   * Start cache cleanup interval
   * Removes expired entries every hour
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let removed = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > EMBEDDING_CONFIG.cacheTTL) {
          this.cache.delete(key);
          removed++;
        }
      }

      if (removed > 0) {
        console.log('[AzureEmbeddingService] Cache cleanup', {
          removed,
          remaining: this.cache.size,
        });
      }
    }, 60 * 60 * 1000); // Run every hour
  }
}

// Export singleton instance
export const azureEmbeddingService = new AzureEmbeddingService();
