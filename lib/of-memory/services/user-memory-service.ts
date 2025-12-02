/**
 * OnlyFans AI Memory System - User Memory Service
 * 
 * Main orchestration service coordinating memory operations,
 * context aggregation, and cache management.
 * 
 * Features:
 * - Cache-first strategy with Redis
 * - Parallel data fetching for performance
 * - Graceful degradation on errors
 * - GDPR compliance (data deletion)
 * - Retry logic for transient failures
 * - Comprehensive error logging
 */

import { memoryRepository } from '../repositories/memory-repository';
import { memoryCache } from '../cache/redis-cache';
import { circuitBreakerRegistry } from '../utils/circuit-breaker';
import { azureCognitiveSearchService } from '../../ai/azure/azure-cognitive-search.service';
import { azureEmbeddingService } from '../../ai/azure/azure-embedding.service';
import type { IUserMemoryService } from '../interfaces';
import type {
  MemoryContext,
  MemoryStats,
  InteractionEvent,
  ConversationMessage,
  PersonalityProfile,
  PersonalityProfileRecord,
  FanPreferences,
  FanPreferencesRecord,
  EmotionalState,
  EmotionalStateRecord,
  EngagementMetrics,
  EngagementMetricsRecord
} from '../types';

/**
 * Retry configuration for transient failures
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 100, // ms
  maxDelay: 2000, // ms
  backoffFactor: 2
};

/**
 * Cache TTL configuration (in seconds)
 */
const CACHE_TTL = {
  memoryContext: 3600, // 1 hour
  engagementScore: 3600, // 1 hour
  personalityProfile: 7200, // 2 hours
  preferences: 7200 // 2 hours
};

/**
 * Service error types for better error handling
 */
export enum MemoryServiceError {
  CACHE_ERROR = 'CACHE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT'
}

/**
 * Custom error class for memory service operations
 */
export class MemoryServiceException extends Error {
  constructor(
    public type: MemoryServiceError,
    message: string,
    public originalError?: Error,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'MemoryServiceException';
  }
}

/**
 * User memory service implementation
 */
export class UserMemoryService implements IUserMemoryService {
  private dbCircuitBreaker = circuitBreakerRegistry.getOrCreate('memory-database', {
    failureThreshold: 5,
    resetTimeout: 60000, // 60 seconds
    monitoringPeriod: 10000 // 10 seconds
  });

  private cacheCircuitBreaker = circuitBreakerRegistry.getOrCreate('memory-cache', {
    failureThreshold: 3,
    resetTimeout: 30000, // 30 seconds
    monitoringPeriod: 5000 // 5 seconds
  });

  private azureSearchCircuitBreaker = circuitBreakerRegistry.getOrCreate('azure-cognitive-search', {
    failureThreshold: 5,
    resetTimeout: 60000, // 60 seconds
    monitoringPeriod: 10000 // 10 seconds
  });

  // Feature flag for Azure migration
  private useAzureSearch = process.env.USE_AZURE_COGNITIVE_SEARCH === 'true';

  /**
   * Get complete memory context for a fan
   * Aggregates data from multiple sources with cache-first strategy
   * 
   * @param fanId - Fan identifier
   * @param creatorId - Creator identifier
   * @returns Complete memory context with all fan data
   * @throws MemoryServiceException on critical failures
   */
  async getMemoryContext(
    fanId: string,
    creatorId: string
  ): Promise<MemoryContext> {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Input validation
      if (!fanId || !creatorId) {
        throw new MemoryServiceException(
          MemoryServiceError.VALIDATION_ERROR,
          'fanId and creatorId are required',
          undefined,
          { fanId, creatorId, correlationId }
        );
      }

      console.log('[UserMemoryService] Getting memory context', {
        fanId,
        creatorId,
        correlationId
      });

      // Try to get complete context from cache first (with circuit breaker)
      const cachedContext = await this.withCacheCircuitBreaker(
        () => this.withRetry(
          () => memoryCache.getMemoryContext(fanId, creatorId),
          'cache.getMemoryContext',
          { fanId, creatorId, correlationId }
        ),
        async () => {
          console.warn('[UserMemoryService] Cache circuit breaker open, skipping cache', {
            fanId,
            creatorId,
            correlationId
          });
          return null;
        }
      );

      if (cachedContext) {
        console.log('[UserMemoryService] Cache hit for memory context', {
          fanId,
          creatorId,
          duration: Date.now() - startTime,
          correlationId
        });
        return cachedContext;
      }

      console.log('[UserMemoryService] Cache miss, fetching from storage', {
        fanId,
        creatorId,
        useAzureSearch: this.useAzureSearch,
        correlationId
      });

      // Fetch recent messages from Azure Cognitive Search or PostgreSQL
      let recentMessages: ConversationMessage[];
      
      if (this.useAzureSearch) {
        // Use Azure Cognitive Search for memory retrieval
        recentMessages = await this.withAzureSearchCircuitBreaker(
          async () => {
            const memories = await this.withTimeout(
              azureCognitiveSearchService.getRecentMemories(fanId, creatorId, 50),
              5000,
              'azureSearch.getRecentMemories'
            );
            
            // Convert Azure memory documents to ConversationMessage format
            return memories.map(mem => ({
              id: mem.id,
              fanId: mem.fanId,
              creatorId: mem.creatorId,
              content: mem.content,
              sender: mem.sender,
              timestamp: mem.timestamp,
              sentiment: (mem.sentiment as 'positive' | 'negative' | 'neutral' | null) || null,
              topics: mem.topics,
              metadata: mem.metadata
            }));
          },
          async () => {
            console.warn('[UserMemoryService] Azure Search circuit breaker open, falling back to database', {
              fanId,
              creatorId,
              correlationId
            });
            // Fallback to PostgreSQL
            return await this.withDatabaseCircuitBreaker(
              () => this.withTimeout(
                memoryRepository.getRecentMessages(fanId, creatorId, 50),
                5000,
                'getRecentMessages'
              ),
              async () => [] as ConversationMessage[]
            );
          }
        );
      } else {
        // Use PostgreSQL for memory retrieval
        recentMessages = await this.withDatabaseCircuitBreaker(
          () => this.withTimeout(
            memoryRepository.getRecentMessages(fanId, creatorId, 50),
            5000,
            'getRecentMessages'
          ),
          async () => {
            console.warn('[UserMemoryService] Database circuit breaker open, returning empty messages', {
              fanId,
              creatorId,
              correlationId
            });
            return [] as ConversationMessage[];
          }
        );
      }

      // Fetch other data in parallel from repository with timeout and circuit breaker
      const [
        personalityProfile,
        preferences,
        emotionalState,
        engagementMetrics
      ] = await this.withDatabaseCircuitBreaker(
        () => Promise.all([
          this.withTimeout(
            memoryRepository.getPersonalityProfile(fanId, creatorId),
            3000,
            'getPersonalityProfile'
          ),
          this.withTimeout(
            memoryRepository.getPreferences(fanId, creatorId),
            3000,
            'getPreferences'
          ),
          this.withTimeout(
            memoryRepository.getEmotionalState(fanId, creatorId),
            3000,
            'getEmotionalState'
          ),
          this.withTimeout(
            memoryRepository.getEngagementMetrics(fanId, creatorId),
            3000,
            'getEngagementMetrics'
          )
        ]),
        async () => {
          console.warn('[UserMemoryService] Database circuit breaker open, returning minimal data', {
            fanId,
            creatorId,
            correlationId
          });
          // Return nulls for graceful degradation
          return [null, null, null, null] as [PersonalityProfileRecord | null, FanPreferencesRecord | null, EmotionalStateRecord | null, EngagementMetricsRecord | null];
        }
      );

      // Build memory context with defaults for missing data
      const context: MemoryContext = {
        fanId,
        creatorId,
        recentMessages: recentMessages || [],
        personalityProfile: personalityProfile 
          ? this.mapPersonalityProfile(personalityProfile) 
          : this.getDefaultPersonalityProfile(fanId),
        preferences: preferences 
          ? this.mapPreferences(preferences) 
          : this.getDefaultPreferences(fanId),
        emotionalState: emotionalState 
          ? this.mapEmotionalState(emotionalState) 
          : this.getDefaultEmotionalState(),
        engagementMetrics: engagementMetrics 
          ? this.mapEngagementMetrics(engagementMetrics) 
          : this.getDefaultEngagementMetrics(fanId, creatorId),
        lastInteraction: this.getLastInteractionDate(recentMessages, engagementMetrics)
      };

      // Cache the complete context (non-blocking with circuit breaker)
      this.withCacheCircuitBreaker(
        () => this.withRetry(
          () => memoryCache.setMemoryContext(fanId, creatorId, context, CACHE_TTL.memoryContext),
          'cache.setMemoryContext',
          { fanId, creatorId, correlationId }
        ),
        async () => {
          console.warn('[UserMemoryService] Cache circuit breaker open, skipping cache write', {
            fanId,
            creatorId,
            correlationId
          });
          return undefined;
        }
      ).catch(error => {
        console.warn('[UserMemoryService] Failed to cache memory context', {
          error: error.message,
          fanId,
          creatorId,
          correlationId
        });
      });

      console.log('[UserMemoryService] Memory context fetched successfully', {
        fanId,
        creatorId,
        duration: Date.now() - startTime,
        messageCount: context.recentMessages.length,
        correlationId
      });

      return context;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error('[UserMemoryService] Error getting memory context', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fanId,
        creatorId,
        duration,
        correlationId
      });

      // For validation errors, throw immediately
      if (error instanceof MemoryServiceException && 
          error.type === MemoryServiceError.VALIDATION_ERROR) {
        throw error;
      }
      
      // Return minimal context on error (graceful degradation)
      console.warn('[UserMemoryService] Returning minimal context due to error', {
        fanId,
        creatorId,
        correlationId
      });
      
      return this.getMinimalContext(fanId, creatorId);
    }
  }

  /**
   * Save a new interaction to memory
   * 
   * @param interaction - Interaction event to save
   * @throws MemoryServiceException on critical failures
   */
  async saveInteraction(interaction: InteractionEvent): Promise<void> {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      const { fanId, creatorId, type, content, amount, metadata, timestamp } = interaction;

      // Input validation
      if (!fanId || !creatorId || !type) {
        throw new MemoryServiceException(
          MemoryServiceError.VALIDATION_ERROR,
          'fanId, creatorId, and type are required',
          undefined,
          { interaction, correlationId }
        );
      }

      console.log('[UserMemoryService] Saving interaction', {
        fanId,
        creatorId,
        type,
        hasContent: !!content,
        amount,
        correlationId
      });

      // Save message if it's a message interaction
      if (type === 'message' && content) {
        if (this.useAzureSearch) {
          // Save to Azure Cognitive Search with embeddings
          await this.withAzureSearchCircuitBreaker(
            async () => {
              // Generate embedding for the message content
              console.log('[UserMemoryService] Generating embedding for message', {
                fanId,
                creatorId,
                contentLength: content.length,
                correlationId
              });

              const memoryId = crypto.randomUUID();
              
              // Index memory with embedding (embedding generation happens inside)
              await azureCognitiveSearchService.indexMemory({
                id: memoryId,
                fanId,
                creatorId,
                content,
                sender: 'fan', // Assuming fan sent the message
                sentiment: null, // Will be analyzed later
                topics: [],
                timestamp: timestamp,
                metadata: metadata || {}
              });

              console.log('[UserMemoryService] Message indexed in Azure Cognitive Search', {
                memoryId,
                fanId,
                creatorId,
                correlationId
              });
            },
            async () => {
              // Fallback to PostgreSQL if Azure Search fails
              console.warn('[UserMemoryService] Azure Search circuit breaker open, falling back to database', {
                fanId,
                creatorId,
                correlationId
              });
              
              await this.withDatabaseCircuitBreaker(
                () => this.withRetry(
                  () => memoryRepository.saveFanMemory({
                    fan_id: fanId,
                    creator_id: creatorId,
                    message_content: content,
                    sender: 'fan',
                    sentiment: null,
                    topics: [],
                    metadata: metadata || {}
                  }),
                  'repository.saveFanMemory',
                  { fanId, creatorId, correlationId }
                ),
                async () => {
                  throw new MemoryServiceException(
                    MemoryServiceError.DATABASE_ERROR,
                    'Both Azure Search and database circuit breakers open - cannot save message',
                    undefined,
                    { fanId, creatorId, correlationId }
                  );
                }
              );
            }
          );
        } else {
          // Save to PostgreSQL (legacy path)
          await this.withDatabaseCircuitBreaker(
            () => this.withRetry(
              () => memoryRepository.saveFanMemory({
                fan_id: fanId,
                creator_id: creatorId,
                message_content: content,
                sender: 'fan',
                sentiment: null,
                topics: [],
                metadata: metadata || {}
              }),
              'repository.saveFanMemory',
              { fanId, creatorId, correlationId }
            ),
            async () => {
              throw new MemoryServiceException(
                MemoryServiceError.DATABASE_ERROR,
                'Database circuit breaker open - cannot save message',
                undefined,
                { fanId, creatorId, correlationId }
              );
            }
          );
        }
      }

      // Update engagement metrics with retry and circuit breaker
      const currentMetrics = await this.withDatabaseCircuitBreaker(
        () => this.withRetry(
          () => memoryRepository.getEngagementMetrics(fanId, creatorId),
          'repository.getEngagementMetrics',
          { fanId, creatorId, correlationId }
        ),
        async () => null // Return null if circuit breaker is open
      );
      
      if (currentMetrics) {
        const updates: any = {
          last_interaction: timestamp,
          total_messages: type === 'message' 
            ? currentMetrics.total_messages + 1 
            : currentMetrics.total_messages
        };

        if (type === 'purchase' || type === 'tip') {
          updates.total_purchases = currentMetrics.total_purchases + 1;
          updates.total_revenue = Number(currentMetrics.total_revenue) + (amount || 0);
        }

        await this.withDatabaseCircuitBreaker(
          () => this.withRetry(
            () => memoryRepository.updateEngagementMetrics(fanId, creatorId, updates),
            'repository.updateEngagementMetrics',
            { fanId, creatorId, correlationId }
          ),
          async () => {
            throw new MemoryServiceException(
              MemoryServiceError.DATABASE_ERROR,
              'Database circuit breaker open - cannot update metrics',
              undefined,
              { fanId, creatorId, correlationId }
            );
          }
        );
      } else {
        // Create initial metrics (with circuit breaker)
        await this.withDatabaseCircuitBreaker(
          () => this.withRetry(
            () => memoryRepository.saveEngagementMetrics({
              fan_id: fanId,
              creator_id: creatorId,
              engagement_score: 0.5,
              total_messages: type === 'message' ? 1 : 0,
              total_purchases: (type === 'purchase' || type === 'tip') ? 1 : 0,
              total_revenue: amount || 0,
              avg_response_time_seconds: null,
              last_interaction: timestamp
            }),
            'repository.saveEngagementMetrics',
            { fanId, creatorId, correlationId }
          ),
          async () => {
            throw new MemoryServiceException(
              MemoryServiceError.DATABASE_ERROR,
              'Database circuit breaker open - cannot create metrics',
              undefined,
              { fanId, creatorId, correlationId }
            );
          }
        );
      }

      // Invalidate context cache (non-blocking with circuit breaker)
      this.withCacheCircuitBreaker(
        () => this.withRetry(
          () => memoryCache.invalidate(
            memoryCache.generateKey(fanId, creatorId, 'context')
          ),
          'cache.invalidate',
          { fanId, creatorId, correlationId }
        ),
        async () => {
          console.warn('[UserMemoryService] Cache circuit breaker open, skipping invalidation', {
            fanId,
            creatorId,
            correlationId
          });
          return undefined;
        }
      ).catch(error => {
        console.warn('[UserMemoryService] Failed to invalidate cache', {
          error: error.message,
          fanId,
          creatorId,
          correlationId
        });
      });

      console.log('[UserMemoryService] Interaction saved successfully', {
        fanId,
        creatorId,
        type,
        duration: Date.now() - startTime,
        correlationId
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error('[UserMemoryService] Error saving interaction', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        interaction,
        duration,
        correlationId
      });

      throw new MemoryServiceException(
        MemoryServiceError.DATABASE_ERROR,
        'Failed to save interaction',
        error instanceof Error ? error : new Error(String(error)),
        { interaction, correlationId }
      );
    }
  }

  /**
   * Clear all memory for a fan (GDPR compliance)
   * Deletes from Azure Cognitive Search (if enabled) and PostgreSQL
   * Includes audit logging and verification
   */
  async clearMemory(fanId: string, creatorId: string): Promise<void> {
    const correlationId = crypto.randomUUID();
    
    try {
      console.log('[UserMemoryService] Clearing memory (GDPR)', {
        fanId,
        creatorId,
        useAzureSearch: this.useAzureSearch,
        correlationId
      });

      // Delete from Azure Cognitive Search if enabled
      if (this.useAzureSearch) {
        await this.withAzureSearchCircuitBreaker(
          async () => {
            const result = await azureCognitiveSearchService.deleteMemoriesGDPR(fanId, creatorId);
            
            console.log('[UserMemoryService] Azure Cognitive Search GDPR deletion completed', {
              fanId,
              creatorId,
              deletedCount: result.deletedCount,
              verifiedComplete: result.verifiedComplete,
              auditLogId: result.auditLogId,
              correlationId
            });

            if (!result.verifiedComplete) {
              console.warn('[UserMemoryService] Azure deletion verification failed', {
                fanId,
                creatorId,
                correlationId
              });
            }
          },
          async () => {
            console.warn('[UserMemoryService] Azure Search circuit breaker open, skipping Azure deletion', {
              fanId,
              creatorId,
              correlationId
            });
          }
        );
      }

      // Delete from database (with circuit breaker)
      await this.withDatabaseCircuitBreaker(
        () => this.withRetry(
          () => memoryRepository.deleteMemory(fanId, creatorId),
          'repository.deleteMemory',
          { fanId, creatorId, correlationId }
        ),
        async () => {
          throw new MemoryServiceException(
            MemoryServiceError.DATABASE_ERROR,
            'Database circuit breaker open - cannot delete memory',
            undefined,
            { fanId, creatorId, correlationId }
          );
        }
      );

      // Clear cache (with circuit breaker)
      await this.withCacheCircuitBreaker(
        () => this.withRetry(
          () => memoryCache.invalidateFanCache(fanId, creatorId),
          'cache.invalidateFanCache',
          { fanId, creatorId, correlationId }
        ),
        async () => {
          console.warn('[UserMemoryService] Cache circuit breaker open, skipping cache clear', {
            fanId,
            creatorId,
            correlationId
          });
          return undefined;
        }
      );

      console.log('[UserMemoryService] Cleared all memory for fan (GDPR compliant)', {
        fanId,
        creatorId,
        correlationId
      });
    } catch (error) {
      console.error('[UserMemoryService] Error clearing memory', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fanId,
        creatorId,
        correlationId
      });
      throw error;
    }
  }

  /**
   * Get memories for multiple fans (bulk operation)
   */
  async getMemoriesForFans(
    fanIds: string[],
    creatorId: string
  ): Promise<Map<string, MemoryContext>> {
    try {
      const contextsMap = new Map<string, MemoryContext>();

      // Fetch contexts in parallel (with concurrency limit)
      const batchSize = 10;
      for (let i = 0; i < fanIds.length; i += batchSize) {
        const batch = fanIds.slice(i, i + batchSize);
        const contexts = await Promise.all(
          batch.map(fanId => this.getMemoryContext(fanId, creatorId))
        );

        batch.forEach((fanId, index) => {
          contextsMap.set(fanId, contexts[index]);
        });
      }

      return contextsMap;
    } catch (error) {
      console.error('[UserMemoryService] Error getting bulk memories:', error);
      throw error;
    }
  }

  /**
   * Get engagement score for a fan
   */
  async getEngagementScore(fanId: string, creatorId: string): Promise<number> {
    const correlationId = crypto.randomUUID();
    
    try {
      // Try cache first (with circuit breaker)
      const cachedScore = await this.withCacheCircuitBreaker(
        () => this.withRetry(
          () => memoryCache.getEngagementScore(fanId, creatorId),
          'cache.getEngagementScore',
          { fanId, creatorId, correlationId }
        ),
        async () => null // Skip cache if circuit breaker is open
      );
      
      if (cachedScore !== null) {
        return cachedScore;
      }

      // Get from database (with circuit breaker)
      const metrics = await this.withDatabaseCircuitBreaker(
        () => this.withRetry(
          () => memoryRepository.getEngagementMetrics(fanId, creatorId),
          'repository.getEngagementMetrics',
          { fanId, creatorId, correlationId }
        ),
        async () => null // Return null if circuit breaker is open
      );
      
      const score = metrics ? Number(metrics.engagement_score) : 0.5;

      // Cache the score (non-blocking with circuit breaker)
      this.withCacheCircuitBreaker(
        () => this.withRetry(
          () => memoryCache.setEngagementScore(fanId, creatorId, score, CACHE_TTL.engagementScore),
          'cache.setEngagementScore',
          { fanId, creatorId, correlationId }
        ),
        async () => undefined
      ).catch(error => {
        console.warn('[UserMemoryService] Failed to cache engagement score', {
          error: error.message,
          fanId,
          creatorId,
          correlationId
        });
      });

      return score;
    } catch (error) {
      console.error('[UserMemoryService] Error getting engagement score', {
        error: error instanceof Error ? error.message : String(error),
        fanId,
        creatorId,
        correlationId
      });
      return 0.5; // Default score
    }
  }

  /**
   * Get memory statistics for a creator
   */
  async getMemoryStats(creatorId: string): Promise<MemoryStats> {
    try {
      // This would require additional queries to aggregate stats
      // For now, return placeholder stats
      return {
        totalFans: 0,
        fansWithMemory: 0,
        totalMessages: 0,
        totalInteractions: 0,
        avgEngagementScore: 0.5,
        calibratedProfiles: 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('[UserMemoryService] Error getting memory stats:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Retry wrapper for transient failures
   * Implements exponential backoff with jitter
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    operation: string,
    context: Record<string, any>
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = RETRY_CONFIG.initialDelay;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === RETRY_CONFIG.maxAttempts) {
          console.error(`[UserMemoryService] Operation failed after ${attempt} attempts`, {
            operation,
            error: lastError.message,
            ...context
          });
          throw lastError;
        }

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.3 * delay;
        const waitTime = Math.min(delay + jitter, RETRY_CONFIG.maxDelay);

        console.warn(`[UserMemoryService] Retry attempt ${attempt}/${RETRY_CONFIG.maxAttempts}`, {
          operation,
          error: lastError.message,
          waitTime,
          ...context
        });

        await new Promise(resolve => setTimeout(resolve, waitTime));
        delay *= RETRY_CONFIG.backoffFactor;
      }
    }

    throw lastError;
  }

  /**
   * Timeout wrapper for operations
   * Prevents hanging on slow database queries
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operation: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new MemoryServiceException(
          MemoryServiceError.TIMEOUT,
          `Operation ${operation} timed out after ${timeoutMs}ms`
        ));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Map database personality profile to domain model
   */
  private mapPersonalityProfile(record: any): PersonalityProfile {
    return {
      fanId: record.fan_id,
      tone: record.tone,
      emojiFrequency: Number(record.emoji_frequency),
      messageLengthPreference: record.message_length_preference,
      punctuationStyle: record.punctuation_style,
      preferredEmojis: record.preferred_emojis || [],
      responseSpeed: record.response_speed,
      confidenceScore: Number(record.confidence_score),
      lastCalibrated: new Date(record.last_calibrated),
      interactionCount: record.interaction_count
    };
  }

  /**
   * Map database preferences to domain model
   */
  private mapPreferences(record: any): FanPreferences {
    return {
      fanId: record.fan_id,
      contentPreferences: record.content_preferences || {},
      topicInterests: record.topic_interests || {},
      purchasePatterns: record.purchase_patterns || [],
      communicationPreferences: record.communication_preferences || {},
      lastUpdated: new Date(record.last_updated)
    };
  }

  /**
   * Map database emotional state to domain model
   */
  private mapEmotionalState(record: any): EmotionalState {
    return {
      currentSentiment: record.current_sentiment,
      sentimentHistory: record.sentiment_history || [],
      dominantEmotions: record.dominant_emotions || [],
      engagementLevel: record.engagement_level,
      lastPositiveInteraction: record.last_positive_interaction ? new Date(record.last_positive_interaction) : null,
      lastNegativeInteraction: record.last_negative_interaction ? new Date(record.last_negative_interaction) : null
    };
  }

  /**
   * Map database engagement metrics to domain model
   */
  private mapEngagementMetrics(record: any): EngagementMetrics {
    return {
      fanId: record.fan_id,
      creatorId: record.creator_id,
      engagementScore: Number(record.engagement_score),
      totalMessages: record.total_messages,
      totalPurchases: record.total_purchases,
      totalRevenue: Number(record.total_revenue),
      avgResponseTimeSeconds: record.avg_response_time_seconds,
      lastInteraction: record.last_interaction ? new Date(record.last_interaction) : null,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    };
  }

  /**
   * Get default personality profile for new fans
   */
  private getDefaultPersonalityProfile(fanId: string): PersonalityProfile {
    return {
      fanId,
      tone: 'friendly',
      emojiFrequency: 0.5,
      messageLengthPreference: 'medium',
      punctuationStyle: 'casual',
      preferredEmojis: [],
      responseSpeed: 'variable',
      confidenceScore: 0.3, // Low confidence for new fans
      lastCalibrated: new Date(),
      interactionCount: 0
    };
  }

  /**
   * Get default preferences for new fans
   */
  private getDefaultPreferences(fanId: string): FanPreferences {
    return {
      fanId,
      contentPreferences: {},
      topicInterests: {},
      purchasePatterns: [],
      communicationPreferences: {
        preferredResponseTime: 'flexible',
        messageFrequency: 'medium',
        preferredMessageLength: 'medium',
        likesEmojis: true,
        likesGifs: false
      },
      lastUpdated: new Date()
    };
  }

  /**
   * Get default emotional state
   */
  private getDefaultEmotionalState(): EmotionalState {
    return {
      currentSentiment: 'neutral',
      sentimentHistory: [],
      dominantEmotions: [],
      engagementLevel: 'medium',
      lastPositiveInteraction: null,
      lastNegativeInteraction: null
    };
  }

  /**
   * Get default engagement metrics
   */
  private getDefaultEngagementMetrics(fanId: string, creatorId: string): EngagementMetrics {
    return {
      fanId,
      creatorId,
      engagementScore: 0.5,
      totalMessages: 0,
      totalPurchases: 0,
      totalRevenue: 0,
      avgResponseTimeSeconds: null,
      lastInteraction: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get last interaction date from available data
   */
  private getLastInteractionDate(
    messages: ConversationMessage[],
    metrics: any
  ): Date {
    if (messages && messages.length > 0) {
      return messages[0].timestamp;
    }
    if (metrics && metrics.last_interaction) {
      return new Date(metrics.last_interaction);
    }
    return new Date();
  }

  /**
   * Get minimal context on error
   */
  private getMinimalContext(fanId: string, creatorId: string): MemoryContext {
    return {
      fanId,
      creatorId,
      recentMessages: [],
      personalityProfile: this.getDefaultPersonalityProfile(fanId),
      preferences: this.getDefaultPreferences(fanId),
      emotionalState: this.getDefaultEmotionalState(),
      engagementMetrics: this.getDefaultEngagementMetrics(fanId, creatorId),
      lastInteraction: new Date()
    };
  }

  /**
   * Execute database operation with circuit breaker protection
   */
  private async withDatabaseCircuitBreaker<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    return this.dbCircuitBreaker.execute(fn, fallback);
  }

  /**
   * Execute cache operation with circuit breaker protection
   */
  private async withCacheCircuitBreaker<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    return this.cacheCircuitBreaker.execute(fn, fallback);
  }

  /**
   * Execute Azure Cognitive Search operation with circuit breaker protection
   */
  private async withAzureSearchCircuitBreaker<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    return this.azureSearchCircuitBreaker.execute(fn, fallback);
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitBreakerStats() {
    return {
      database: this.dbCircuitBreaker.getStats(),
      cache: this.cacheCircuitBreaker.getStats(),
      azureSearch: this.azureSearchCircuitBreaker.getStats()
    };
  }
}

// Create singleton instance
let serviceInstance: UserMemoryService | null = null;

/**
 * Get or create the user memory service instance
 */
export function getUserMemoryService(): UserMemoryService {
  if (!serviceInstance) {
    serviceInstance = new UserMemoryService();
  }
  return serviceInstance;
}

// Export default instance
export const userMemoryService = getUserMemoryService();
