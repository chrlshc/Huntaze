/**
 * Enhanced OnlyFans AI Assistant with Memory Integration
 * 
 * Integrates UserMemoryService with existing AI suggestion service.
 * Provides personality-aware, context-rich message suggestions with:
 * - Memory-based personalization
 * - Emotional intelligence
 * - Preference learning
 * - Circuit breaker protection
 * - Retry strategies for resilience
 * - Comprehensive error handling
 * 
 * @module lib/services/onlyfans-ai-assistant-enhanced
 */

import { logger } from '../utils/logger';
import { UserMemoryService } from '../of-memory/services/user-memory-service';
import { PersonalityCalibrator } from '../of-memory/services/personality-calibrator';
import { PreferenceLearningEngine } from '../of-memory/services/preference-learning-engine';
import { EmotionAnalyzer } from '../of-memory/services/emotion-analyzer';
import { CircuitBreaker } from '../of-memory/utils/circuit-breaker';
import {
  MessageContext,
  MessageSuggestion,
  OnlyFansAISuggestionsService
} from './onlyfans-ai-suggestions.service';
import type {
  InteractionEvent,
  MemoryContext,
  ResponseStyle
} from '../of-memory/types';

/**
 * Configuration for retry behavior
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
} as const;

/**
 * Timeout configuration (ms)
 */
const TIMEOUT_CONFIG = {
  memoryRetrieval: 5000,
  suggestionGeneration: 10000,
  emotionAnalysis: 3000,
  personalityCalibration: 3000,
} as const;

/**
 * Cache TTL configuration (ms)
 */
const CACHE_TTL = {
  memoryContext: 60000, // 1 minute
  engagementScore: 300000, // 5 minutes
  responseStyle: 120000, // 2 minutes
} as const;

/**
 * Enhanced message context with creator and fan IDs
 */
export interface EnhancedMessageContext extends MessageContext {
  creatorId: string;
  fanId: string;
  correlationId?: string;
}

/**
 * Enhanced message suggestion with memory context metadata
 */
export interface EnhancedMessageSuggestion extends MessageSuggestion {
  memoryContext?: {
    referencedTopics?: string[];
    personalityAdjusted: boolean;
    emotionalContext?: string;
    confidence?: number;
  };
}

/**
 * Error types for better error handling
 */
export enum AIAssistantErrorType {
  MEMORY_RETRIEVAL_FAILED = 'MEMORY_RETRIEVAL_FAILED',
  EMOTION_ANALYSIS_FAILED = 'EMOTION_ANALYSIS_FAILED',
  SUGGESTION_GENERATION_FAILED = 'SUGGESTION_GENERATION_FAILED',
  PERSONALITY_CALIBRATION_FAILED = 'PERSONALITY_CALIBRATION_FAILED',
  INTERACTION_SAVE_FAILED = 'INTERACTION_SAVE_FAILED',
  TIMEOUT = 'TIMEOUT',
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
}

/**
 * Custom error class for AI Assistant errors
 */
export class AIAssistantError extends Error {
  constructor(
    public type: AIAssistantErrorType,
    message: string,
    public originalError?: Error,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AIAssistantError';
  }
}

/**
 * Enhanced OnlyFans AI Assistant with memory integration
 */
export class OnlyFansAIAssistantEnhanced {
  private memoryService: UserMemoryService;
  private personalityCalibrator: PersonalityCalibrator;
  private preferenceLearning: PreferenceLearningEngine;
  private emotionAnalyzer: EmotionAnalyzer;
  private baseSuggestionService: OnlyFansAISuggestionsService;
  
  // Circuit breakers for each service
  private memoryCircuitBreaker: CircuitBreaker;
  private emotionCircuitBreaker: CircuitBreaker;
  private personalityCircuitBreaker: CircuitBreaker;
  
  // Simple in-memory cache (consider Redis for production)
  private cache: Map<string, { data: any; expiresAt: number }>;

  constructor() {
    this.memoryService = new UserMemoryService();
    this.personalityCalibrator = new PersonalityCalibrator();
    this.preferenceLearning = new PreferenceLearningEngine();
    this.emotionAnalyzer = new EmotionAnalyzer();
    this.baseSuggestionService = new OnlyFansAISuggestionsService();
    
    // Initialize circuit breakers
    this.memoryCircuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 120000,
    });
    
    this.emotionCircuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 30000,
      monitoringPeriod: 60000,
    });
    
    this.personalityCircuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 30000,
      monitoringPeriod: 60000,
    });
    
    this.cache = new Map();
  }

  /**
   * Generate AI response with memory context
   * Main integration point with comprehensive error handling and retry logic
   * 
   * @param context - Enhanced message context with fan and creator IDs
   * @returns Array of enhanced message suggestions
   * @throws AIAssistantError on critical failures
   */
  async generateResponse(
    context: EnhancedMessageContext
  ): Promise<EnhancedMessageSuggestion[]> {
    const correlationId = context.correlationId || this.generateCorrelationId();
    const startTime = Date.now();
    
    try {
      logger.info('[AIAssistant] Generating enhanced response', {
        fanId: context.fanId,
        creatorId: context.creatorId,
        correlationId,
      });

      // Step 1: Retrieve memory context with retry and circuit breaker
      const memoryContext = await this.withRetry(
        () => this.getMemoryContextWithCircuitBreaker(context.fanId, context.creatorId),
        'memory retrieval',
        correlationId
      );

      // Step 2: Get optimal response style
      const responseStyle = await this.withTimeout(
        () => this.getResponseStyleSafe(context.fanId, memoryContext),
        TIMEOUT_CONFIG.personalityCalibration,
        'response style calculation'
      );

      // Step 3: Analyze emotional state
      const emotionalState = await this.analyzeEmotionalStateSafe(
        context,
        memoryContext,
        correlationId
      );

      // Step 4: Generate base suggestions with timeout
      const baseSuggestions = await this.withTimeout(
        () => this.baseSuggestionService.generateSuggestions(context),
        TIMEOUT_CONFIG.suggestionGeneration,
        'base suggestion generation'
      );

      // Step 5: Enhance suggestions with memory context
      const enhancedSuggestions = await this.enhanceSuggestionsWithMemory(
        baseSuggestions,
        memoryContext,
        responseStyle,
        emotionalState
      );

      // Step 6: Save interaction to memory (non-blocking)
      if (context.lastMessage) {
        this.saveInteractionToMemoryAsync(context, memoryContext, correlationId);
      }

      const duration = Date.now() - startTime;
      logger.info('[AIAssistant] Response generated successfully', {
        fanId: context.fanId,
        suggestionCount: enhancedSuggestions.length,
        duration,
        correlationId,
      });

      return enhancedSuggestions;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('[AIAssistant] Failed to generate enhanced response', {
        error: error instanceof Error ? error.message : String(error),
        fanId: context.fanId,
        creatorId: context.creatorId,
        duration,
        correlationId,
      });

      // Fallback to base suggestions without memory
      try {
        logger.info('[AIAssistant] Falling back to base suggestions', { correlationId });
        return await this.baseSuggestionService.generateSuggestions(context);
      } catch (fallbackError) {
        logger.error('[AIAssistant] Fallback also failed', {
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          correlationId,
        });
        
        // Return empty array as last resort
        return [];
      }
    }
  }

  /**
   * Get memory context with circuit breaker protection
   */
  private async getMemoryContextWithCircuitBreaker(
    fanId: string,
    creatorId: string
  ): Promise<MemoryContext> {
    // Check cache first
    const cacheKey = `memory:${fanId}:${creatorId}`;
    const cached = this.getFromCache<MemoryContext>(cacheKey);
    if (cached) {
      logger.debug('[AIAssistant] Memory context cache hit', { fanId, creatorId });
      return cached;
    }

    // Use circuit breaker
    const memoryContext = await this.memoryCircuitBreaker.execute(
      () => this.memoryService.getMemoryContext(fanId, creatorId)
    );

    // Cache the result
    this.setCache(cacheKey, memoryContext, CACHE_TTL.memoryContext);

    return memoryContext;
  }

  /**
   * Get response style with error handling
   */
  private async getResponseStyleSafe(
    fanId: string,
    memoryContext: MemoryContext
  ): Promise<ResponseStyle> {
    try {
      return await this.personalityCircuitBreaker.execute(
        () => this.personalityCalibrator.getOptimalResponseStyle(fanId, memoryContext)
      );
    } catch (error) {
      logger.warn('[AIAssistant] Failed to get response style, using default', {
        fanId,
        error: error instanceof Error ? error.message : String(error),
      });
      
      // Return default response style
      return {
        tone: 'friendly',
        emojiCount: 1,
        maxLength: 200,
        formality: 'casual',
      };
    }
  }

  /**
   * Analyze emotional state with error handling
   */
  private async analyzeEmotionalStateSafe(
    context: EnhancedMessageContext,
    memoryContext: MemoryContext,
    correlationId: string
  ): Promise<any> {
    try {
      let emotionalState = memoryContext.emotionalState;
      
      if (context.lastMessage) {
        emotionalState = await this.withTimeout(
          async () => {
            await this.emotionCircuitBreaker.execute(
              () => this.emotionAnalyzer.analyzeMessage(context.lastMessage!)
            );
            
            return await this.emotionCircuitBreaker.execute(
              () => this.emotionAnalyzer.getEmotionalState(
                context.fanId,
                context.creatorId,
                memoryContext.recentMessages
              )
            );
          },
          TIMEOUT_CONFIG.emotionAnalysis,
          'emotion analysis'
        );
      }
      
      return emotionalState;
    } catch (error) {
      logger.warn('[AIAssistant] Emotion analysis failed, using default', {
        fanId: context.fanId,
        error: error instanceof Error ? error.message : String(error),
        correlationId,
      });
      
      // Return neutral emotional state
      return {
        currentSentiment: 'neutral',
        confidence: 0.5,
      };
    }
  }

  /**
   * Enhance suggestions with memory context
   */
  private async enhanceSuggestionsWithMemory(
    baseSuggestions: MessageSuggestion[],
    memoryContext: MemoryContext,
    responseStyle: ResponseStyle,
    emotionalState: any
  ): Promise<EnhancedMessageSuggestion[]> {
    const enhanced: EnhancedMessageSuggestion[] = [];

    for (const suggestion of baseSuggestions) {
      try {
        let enhancedText = suggestion.text;
        let personalityAdjusted = false;

        // Apply personality calibration
        enhancedText = this.applyPersonalityStyle(
          enhancedText,
          memoryContext.personalityProfile,
          responseStyle
        );
        personalityAdjusted = true;

        // Add contextual references from memory
        const referencedTopics = this.addContextualReferences(
          enhancedText,
          memoryContext
        );

        // Adjust based on emotional state
        if (emotionalState.currentSentiment === 'negative') {
          // Avoid promotional content if fan is in negative state
          if (suggestion.category === 'promotional') {
            logger.debug('[AIAssistant] Skipping promotional suggestion for negative sentiment');
            continue;
          }
          // Make tone more empathetic
          enhancedText = this.makeEmpathetic(enhancedText);
        }

        enhanced.push({
          ...suggestion,
          text: enhancedText,
          memoryContext: {
            referencedTopics,
            personalityAdjusted,
            emotionalContext: emotionalState.currentSentiment,
            confidence: emotionalState.confidence || 0.5,
          }
        });
      } catch (error) {
        logger.warn('[AIAssistant] Failed to enhance suggestion, using original', {
          error: error instanceof Error ? error.message : String(error),
        });
        // Include original suggestion if enhancement fails
        enhanced.push(suggestion);
      }
    }

    return enhanced;
  }

  /**
   * Apply personality style to message
   */
  private applyPersonalityStyle(
    text: string,
    personalityProfile: any,
    responseStyle: ResponseStyle
  ): string {
    let styled = text;

    try {
      // Adjust emoji frequency
      const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
      const currentEmojiCount = (text.match(emojiRegex) || []).length;
      const targetEmojiCount = responseStyle.emojiCount;

      if (currentEmojiCount < targetEmojiCount && 
          personalityProfile.preferredEmojis?.length > 0) {
        // Add preferred emojis
        const emojisToAdd = personalityProfile.preferredEmojis.slice(
          0,
          targetEmojiCount - currentEmojiCount
        );
        styled += ' ' + emojisToAdd.join(' ');
      }

      // Adjust message length
      if (personalityProfile.messageLengthPreference === 'short' && 
          styled.length > responseStyle.maxLength) {
        styled = styled.substring(0, responseStyle.maxLength - 3) + '...';
      }

      // Apply tone
      styled = this.applyTone(styled, personalityProfile.tone || responseStyle.tone);
    } catch (error) {
      logger.warn('[AIAssistant] Failed to apply personality style', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Return original text if styling fails
      return text;
    }

    return styled;
  }

  /**
   * Apply tone to message
   */
  private applyTone(text: string, tone: string): string {
    try {
      switch (tone) {
        case 'flirty':
          if (!text.includes('😏') && !text.includes('😘')) {
            text = text.replace(/!$/, ' 😏');
          }
          break;
        case 'friendly':
          // Keep friendly and warm
          break;
        case 'professional':
          // Remove excessive emojis
          text = text.replace(/[😏😘💕]/g, '');
          break;
        case 'playful':
          if (!text.includes('😄') && !text.includes('😊')) {
            text = text.replace(/!$/, ' 😄');
          }
          break;
      }
    } catch (error) {
      logger.warn('[AIAssistant] Failed to apply tone', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    
    return text;
  }

  /**
   * Add contextual references from memory
   */
  private addContextualReferences(
    text: string,
    memoryContext: MemoryContext
  ): string[] {
    const referencedTopics: string[] = [];

    try {
      // Check if we can reference past conversations
      if (memoryContext.recentMessages?.length > 0) {
        const lastConversation = memoryContext.recentMessages[0];
        if (lastConversation.topics && lastConversation.topics.length > 0) {
          referencedTopics.push(...lastConversation.topics);
        }
      }
    } catch (error) {
      logger.warn('[AIAssistant] Failed to add contextual references', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return referencedTopics;
  }

  /**
   * Make message more empathetic
   */
  private makeEmpathetic(text: string): string {
    try {
      // Replace aggressive CTAs with softer ones
      text = text.replace(/Want to know more\?/gi, 'Let me know if you\'d like to hear more');
      text = text.replace(/Interested\?/gi, 'No pressure, just thought you might like it');
      
      // Add empathetic phrases
      if (!text.includes('hope')) {
        text = 'I hope you\'re doing okay! ' + text;
      }
    } catch (error) {
      logger.warn('[AIAssistant] Failed to make empathetic', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return text;
  }

  /**
   * Save interaction to memory (async, non-blocking)
   */
  private saveInteractionToMemoryAsync(
    context: EnhancedMessageContext,
    memoryContext: MemoryContext,
    correlationId: string
  ): void {
    // Fire and forget - don't block response generation
    setImmediate(async () => {
      try {
        await this.saveInteractionToMemory(context, memoryContext);
      } catch (error) {
        logger.error('[AIAssistant] Async interaction save failed', {
          error: error instanceof Error ? error.message : String(error),
          fanId: context.fanId,
          correlationId,
        });
      }
    });
  }

  /**
   * Save interaction to memory
   */
  private async saveInteractionToMemory(
    context: EnhancedMessageContext,
    memoryContext: MemoryContext
  ): Promise<void> {
    try {
      const interaction: InteractionEvent = {
        fanId: context.fanId,
        creatorId: context.creatorId,
        type: 'message',
        content: context.lastMessage || '',
        timestamp: new Date(),
        metadata: {
          messageCount: context.messageCount,
          fanValue: context.fanValueCents
        }
      };

      await this.memoryService.saveInteraction(interaction);

      // Update personality calibration if enough interactions
      if (memoryContext.personalityProfile?.interactionCount >= 5) {
        await this.personalityCalibrator.calibratePersonality(
          context.fanId,
          [interaction]
        );
      }

      // Learn from interaction
      await this.preferenceLearning.learnFromInteraction(interaction);

    } catch (error) {
      logger.error('[AIAssistant] Failed to save interaction to memory', {
        error: error instanceof Error ? error.message : String(error),
        fanId: context.fanId,
      });
      // Don't throw - memory save failure shouldn't break response generation
    }
  }

  /**
   * Get engagement score for prioritization
   * 
   * @param fanId - Fan identifier
   * @param creatorId - Creator identifier
   * @returns Engagement score (0-1)
   */
  async getEngagementScore(fanId: string, creatorId: string): Promise<number> {
    try {
      // Check cache first
      const cacheKey = `engagement:${fanId}:${creatorId}`;
      const cached = this.getFromCache<number>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const score = await this.withRetry(
        () => this.memoryService.getEngagementScore(fanId, creatorId),
        'engagement score retrieval'
      );

      // Cache the result
      this.setCache(cacheKey, score, CACHE_TTL.engagementScore);

      return score;
    } catch (error) {
      logger.error('[AIAssistant] Failed to get engagement score', {
        error: error instanceof Error ? error.message : String(error),
        fanId,
        creatorId,
      });
      return 0.5; // Default neutral score
    }
  }

  /**
   * Clear memory for a fan (GDPR compliance)
   * 
   * @param fanId - Fan identifier
   * @param creatorId - Creator identifier
   */
  async clearFanMemory(fanId: string, creatorId: string): Promise<void> {
    try {
      await this.memoryService.clearMemory(fanId, creatorId);
      
      // Clear cache entries
      this.clearCacheForFan(fanId, creatorId);
      
      logger.info('[AIAssistant] Fan memory cleared', { fanId, creatorId });
    } catch (error) {
      logger.error('[AIAssistant] Failed to clear fan memory', {
        error: error instanceof Error ? error.message : String(error),
        fanId,
        creatorId,
      });
      throw new AIAssistantError(
        AIAssistantErrorType.MEMORY_RETRIEVAL_FAILED,
        'Failed to clear fan memory',
        error instanceof Error ? error : undefined,
        { fanId, creatorId }
      );
    }
  }

  /**
   * Get memory statistics for creator dashboard
   * 
   * @param creatorId - Creator identifier
   * @returns Memory statistics
   */
  async getMemoryStats(creatorId: string) {
    try {
      return await this.withRetry(
        () => this.memoryService.getMemoryStats(creatorId),
        'memory stats retrieval'
      );
    } catch (error) {
      logger.error('[AIAssistant] Failed to get memory stats', {
        error: error instanceof Error ? error.message : String(error),
        creatorId,
      });
      throw new AIAssistantError(
        AIAssistantErrorType.MEMORY_RETRIEVAL_FAILED,
        'Failed to get memory statistics',
        error instanceof Error ? error : undefined,
        { creatorId }
      );
    }
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    operation: string,
    correlationId?: string
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = RETRY_CONFIG.initialDelay;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === RETRY_CONFIG.maxAttempts) {
          logger.error(`[AIAssistant] ${operation} failed after ${attempt} attempts`, {
            error: lastError.message,
            correlationId,
          });
          throw lastError;
        }

        logger.warn(`[AIAssistant] ${operation} failed, retrying (${attempt}/${RETRY_CONFIG.maxAttempts})`, {
          error: lastError.message,
          delay,
          correlationId,
        });

        await this.sleep(delay);
        delay = Math.min(delay * RETRY_CONFIG.backoffFactor, RETRY_CONFIG.maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Timeout wrapper
   */
  private async withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    operation: string
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new AIAssistantError(
            AIAssistantErrorType.TIMEOUT,
            `${operation} timed out after ${timeoutMs}ms`
          )),
          timeoutMs
        )
      )
    ]);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate correlation ID for request tracing
   */
  private generateCorrelationId(): string {
    return `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get value from cache
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  /**
   * Set value in cache
   */
  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Clear cache entries for a specific fan
   */
  private clearCacheForFan(fanId: string, creatorId: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      if (key.includes(fanId) && key.includes(creatorId)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    logger.debug('[AIAssistant] Cache cleared for fan', {
      fanId,
      creatorId,
      keysCleared: keysToDelete.length,
    });
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus() {
    return {
      memory: this.memoryCircuitBreaker.getStatus(),
      emotion: this.emotionCircuitBreaker.getStatus(),
      personality: this.personalityCircuitBreaker.getStatus(),
    };
  }
}

// Export singleton instance
export const onlyFansAIAssistantEnhanced = new OnlyFansAIAssistantEnhanced();
