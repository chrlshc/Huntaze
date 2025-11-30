/**
 * OnlyFans AI Memory System - Preference Learning Engine
 * 
 * Learns and predicts fan content preferences based on interaction history
 * and purchase patterns to optimize content recommendations.
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Circuit breaker for fault tolerance
 * - Comprehensive error handling
 * - Request caching for performance
 * - Structured logging for debugging
 * - Type-safe API responses
 */

import type { IPreferenceLearningEngine } from '../interfaces';
import type {
  FanPreferences,
  PreferenceScore,
  PurchasePattern,
  InteractionEvent,
  ContentItem,
  ContentRecommendation
} from '../types';
import { CircuitBreaker } from '../utils/circuit-breaker';

/**
 * Error types for preference learning operations
 */
export class PreferenceLearningError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'PreferenceLearningError';
  }
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

/**
 * Cache entry for preferences
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Structured log entry
 */
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  operation: string;
  fanId?: string;
  creatorId?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Preference learning engine implementation with production-ready features
 */
export class PreferenceLearningEngine implements IPreferenceLearningEngine {
  private readonly circuitBreaker: CircuitBreaker;
  private readonly cache: Map<string, CacheEntry<any>>;
  private readonly retryConfig: RetryConfig;
  private readonly defaultCacheTTL: number = 300000; // 5 minutes

  constructor(
    retryConfig?: Partial<RetryConfig>,
    circuitBreakerConfig?: {
      failureThreshold?: number;
      resetTimeout?: number;
      monitoringPeriod?: number;
    }
  ) {
    this.retryConfig = {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      ...retryConfig
    };

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: circuitBreakerConfig?.failureThreshold || 5,
      resetTimeout: circuitBreakerConfig?.resetTimeout || 60000,
      monitoringPeriod: circuitBreakerConfig?.monitoringPeriod || 60000,
      name: 'preference-learning-engine'
    });

    this.cache = new Map();
  }

  /**
   * Learn from a single interaction with retry and error handling
   */
  async learnFromInteraction(interaction: InteractionEvent): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.log({
        timestamp: new Date().toISOString(),
        level: 'info',
        operation: 'learnFromInteraction',
        fanId: interaction.fanId,
        creatorId: interaction.creatorId,
        metadata: { type: interaction.type }
      });

      await this.withRetry(async () => {
        await this.circuitBreaker.execute(async () => {
          if (interaction.type === 'purchase' && interaction.metadata?.contentType) {
            await this.learnFromPurchase(interaction);
          } else if (interaction.type === 'message' && interaction.content) {
            await this.learnFromMessage(interaction);
          }
        });
      });

      this.log({
        timestamp: new Date().toISOString(),
        level: 'info',
        operation: 'learnFromInteraction',
        fanId: interaction.fanId,
        duration: Date.now() - startTime,
        metadata: { success: true }
      });
    } catch (error) {
      this.log({
        timestamp: new Date().toISOString(),
        level: 'error',
        operation: 'learnFromInteraction',
        fanId: interaction.fanId,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        metadata: { type: interaction.type }
      });

      throw new PreferenceLearningError(
        'Failed to learn from interaction',
        'LEARN_INTERACTION_FAILED',
        true,
        { fanId: interaction.fanId, type: interaction.type }
      );
    }
  }

  /**
   * Get predicted preferences for a fan with caching
   */
  async getPredictedPreferences(
    fanId: string,
    creatorId: string
  ): Promise<FanPreferences> {
    const cacheKey = `preferences:${fanId}:${creatorId}`;
    const startTime = Date.now();

    try {
      // Check cache first
      const cached = this.getFromCache<FanPreferences>(cacheKey);
      if (cached) {
        this.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'getPredictedPreferences',
          fanId,
          creatorId,
          duration: Date.now() - startTime,
          metadata: { cacheHit: true }
        });
        return cached;
      }

      // Fetch with retry and circuit breaker
      const preferences = await this.withRetry(async () => {
        return await this.circuitBreaker.execute(async () => {
          // This would fetch from repository
          // For now, return default preferences
          return this.getDefaultPreferences(fanId);
        });
      });

      // Cache the result
      this.setInCache(cacheKey, preferences, this.defaultCacheTTL);

      this.log({
        timestamp: new Date().toISOString(),
        level: 'info',
        operation: 'getPredictedPreferences',
        fanId,
        creatorId,
        duration: Date.now() - startTime,
        metadata: { cacheHit: false }
      });

      return preferences;
    } catch (error) {
      this.log({
        timestamp: new Date().toISOString(),
        level: 'error',
        operation: 'getPredictedPreferences',
        fanId,
        creatorId,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      });

      throw new PreferenceLearningError(
        'Failed to get predicted preferences',
        'GET_PREFERENCES_FAILED',
        true,
        { fanId, creatorId }
      );
    }
  }

  /**
   * Update a specific preference score with validation
   */
  async updatePreferenceScore(
    fanId: string,
    creatorId: string,
    category: string,
    delta: number
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate inputs
      if (!fanId || !creatorId || !category) {
        throw new PreferenceLearningError(
          'Invalid parameters',
          'INVALID_PARAMS',
          false,
          { fanId, creatorId, category }
        );
      }

      if (delta < -1 || delta > 1) {
        throw new PreferenceLearningError(
          'Delta must be between -1 and 1',
          'INVALID_DELTA',
          false,
          { delta }
        );
      }

      await this.withRetry(async () => {
        await this.circuitBreaker.execute(async () => {
          // This would update the repository
          // Implementation would fetch current score, apply delta, and save
          console.log(`Updating preference for ${fanId}: ${category} by ${delta}`);
        });
      });

      // Invalidate cache
      const cacheKey = `preferences:${fanId}:${creatorId}`;
      this.cache.delete(cacheKey);

      this.log({
        timestamp: new Date().toISOString(),
        level: 'info',
        operation: 'updatePreferenceScore',
        fanId,
        creatorId,
        duration: Date.now() - startTime,
        metadata: { category, delta }
      });
    } catch (error) {
      this.log({
        timestamp: new Date().toISOString(),
        level: 'error',
        operation: 'updatePreferenceScore',
        fanId,
        creatorId,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        metadata: { category, delta }
      });

      if (error instanceof PreferenceLearningError) {
        throw error;
      }

      throw new PreferenceLearningError(
        'Failed to update preference score',
        'UPDATE_SCORE_FAILED',
        true,
        { fanId, creatorId, category, delta }
      );
    }
  }

  /**
   * Get content recommendations based on preferences
   */
  async getContentRecommendations(
    fanId: string,
    creatorId: string,
    availableContent: ContentItem[]
  ): Promise<ContentRecommendation[]> {
    const startTime = Date.now();

    try {
      if (!availableContent || availableContent.length === 0) {
        this.log({
          timestamp: new Date().toISOString(),
          level: 'warn',
          operation: 'getContentRecommendations',
          fanId,
          creatorId,
          metadata: { warning: 'No available content' }
        });
        return [];
      }

      // Get fan preferences (with caching)
      const preferences = await this.getPredictedPreferences(fanId, creatorId);

      // Score each content item
      const recommendations = availableContent.map(content => {
        const score = this.scoreContent(content, preferences);
        const optimalTiming = this.calculateOptimalTiming(content, preferences);

        return {
          contentId: content.id,
          score,
          reason: this.generateRecommendationReason(content, preferences, score),
          optimalTiming
        };
      });

      // Sort by score and return top recommendations
      const topRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      this.log({
        timestamp: new Date().toISOString(),
        level: 'info',
        operation: 'getContentRecommendations',
        fanId,
        creatorId,
        duration: Date.now() - startTime,
        metadata: {
          totalContent: availableContent.length,
          recommendations: topRecommendations.length
        }
      });

      return topRecommendations;
    } catch (error) {
      this.log({
        timestamp: new Date().toISOString(),
        level: 'error',
        operation: 'getContentRecommendations',
        fanId,
        creatorId,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      });

      throw new PreferenceLearningError(
        'Failed to get content recommendations',
        'GET_RECOMMENDATIONS_FAILED',
        true,
        { fanId, creatorId, contentCount: availableContent.length }
      );
    }
  }

  /**
   * Analyze purchase patterns for a fan
   */
  async analyzePurchasePatterns(
    fanId: string,
    creatorId: string
  ): Promise<{
    preferredDays: number[];
    preferredHours: number[];
    averageAmount: number;
  }> {
    const startTime = Date.now();

    try {
      // Get fan preferences
      const preferences = await this.getPredictedPreferences(fanId, creatorId);
      
      if (preferences.purchasePatterns.length === 0) {
        this.log({
          timestamp: new Date().toISOString(),
          level: 'info',
          operation: 'analyzePurchasePatterns',
          fanId,
          creatorId,
          duration: Date.now() - startTime,
          metadata: { noPurchaseHistory: true }
        });

        return {
          preferredDays: [],
          preferredHours: [],
          averageAmount: 0
        };
      }

      // Aggregate all preferred days and hours
      const allDays = preferences.purchasePatterns.flatMap(p => p.preferredDays);
      const allHours = preferences.purchasePatterns.flatMap(p => p.preferredHours);
      
      // Get unique days and hours
      const preferredDays = [...new Set(allDays)];
      const preferredHours = [...new Set(allHours)];
      
      // Calculate average amount
      const averageAmount = this.getAveragePurchaseAmount(preferences);

      this.log({
        timestamp: new Date().toISOString(),
        level: 'info',
        operation: 'analyzePurchasePatterns',
        fanId,
        creatorId,
        duration: Date.now() - startTime,
        metadata: {
          preferredDays: preferredDays.length,
          preferredHours: preferredHours.length,
          averageAmount
        }
      });

      return {
        preferredDays,
        preferredHours,
        averageAmount
      };
    } catch (error) {
      this.log({
        timestamp: new Date().toISOString(),
        level: 'error',
        operation: 'analyzePurchasePatterns',
        fanId,
        creatorId,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      });

      throw new PreferenceLearningError(
        'Failed to analyze purchase patterns',
        'ANALYZE_PATTERNS_FAILED',
        true,
        { fanId, creatorId }
      );
    }
  }

  // ============================================================================
  // RETRY & CIRCUIT BREAKER UTILITIES
  // ============================================================================

  /**
   * Execute operation with retry logic
   */
  private async withRetry<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.retryConfig.initialDelay;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry non-retryable errors
        if (error instanceof PreferenceLearningError && !error.retryable) {
          throw error;
        }

        // Last attempt, throw error
        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }

        // Wait before retry with exponential backoff
        await this.sleep(delay);
        delay = Math.min(
          delay * this.retryConfig.backoffFactor,
          this.retryConfig.maxDelay
        );

        this.log({
          timestamp: new Date().toISOString(),
          level: 'warn',
          operation: 'retry',
          metadata: {
            attempt,
            maxAttempts: this.retryConfig.maxAttempts,
            nextDelay: delay,
            error: lastError.message
          }
        });
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // CACHE UTILITIES
  // ============================================================================

  /**
   * Get value from cache
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache
   */
  private setInCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      operation: 'clearCache',
      metadata: { cleared: true }
    });
  }

  // ============================================================================
  // LOGGING UTILITIES
  // ============================================================================

  /**
   * Structured logging
   */
  private log(entry: LogEntry): void {
    const logMessage = JSON.stringify(entry);
    
    switch (entry.level) {
      case 'error':
        console.error(`[PreferenceLearningEngine] ${logMessage}`);
        break;
      case 'warn':
        console.warn(`[PreferenceLearningEngine] ${logMessage}`);
        break;
      default:
        console.log(`[PreferenceLearningEngine] ${logMessage}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Learn from a purchase interaction
   */
  private async learnFromPurchase(interaction: InteractionEvent): Promise<void> {
    const contentType = interaction.metadata?.contentType as string;
    const category = interaction.metadata?.category as string;
    const amount = interaction.amount || 0;

    // Positive signal - increase preference score
    const delta = this.calculatePurchaseDelta(amount);
    
    if (category) {
      await this.updatePreferenceScore(
        interaction.fanId,
        interaction.creatorId,
        category,
        delta
      );
    }
  }

  /**
   * Learn from a message interaction
   */
  private async learnFromMessage(interaction: InteractionEvent): Promise<void> {
    if (!interaction.content) return;

    // Extract topics/interests from message
    const topics = this.extractTopics(interaction.content);

    // Update topic interests
    for (const topic of topics) {
      await this.updatePreferenceScore(
        interaction.fanId,
        interaction.creatorId,
        topic,
        0.1
      );
    }
  }

  /**
   * Score content based on preferences
   */
  private scoreContent(content: ContentItem, preferences: FanPreferences): number {
    let score = 0.5; // Base score

    // Check content category preference
    const categoryPref = preferences.contentPreferences[content.category];
    if (categoryPref) {
      score += categoryPref.score * 0.4; // 40% weight
    }

    // Check topic interests
    for (const topic of content.topics) {
      const topicInterest = preferences.topicInterests[topic];
      if (topicInterest) {
        score += topicInterest * 0.3; // 30% weight
      }
    }

    // Check purchase patterns (price sensitivity)
    const priceScore = this.scorePricePreference(content.price, preferences);
    score += priceScore * 0.2; // 20% weight

    // Recency bonus (newer content gets slight boost)
    const daysSinceCreation = this.getDaysSince(content.createdAt);
    if (daysSinceCreation < 7) {
      score += 0.1; // 10% boost for content less than a week old
    }

    return Math.min(Math.max(score, 0), 1); // Clamp to 0-1
  }

  /**
   * Calculate optimal timing for content recommendation
   */
  private calculateOptimalTiming(
    content: ContentItem,
    preferences: FanPreferences
  ): { day: number; hour: number } | undefined {
    // Find most common purchase day and hour
    const patterns = preferences.purchasePatterns;
    
    if (patterns.length === 0) {
      return undefined;
    }

    // Aggregate preferred days and hours
    const dayFrequency: Record<number, number> = {};
    const hourFrequency: Record<number, number> = {};

    for (const pattern of patterns) {
      for (const day of pattern.preferredDays) {
        dayFrequency[day] = (dayFrequency[day] || 0) + 1;
      }
      for (const hour of pattern.preferredHours) {
        hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;
      }
    }

    // Get most common day and hour
    const optimalDay = this.getMostFrequent(dayFrequency);
    const optimalHour = this.getMostFrequent(hourFrequency);

    if (optimalDay !== undefined && optimalHour !== undefined) {
      return { day: optimalDay, hour: optimalHour };
    }

    return undefined;
  }

  /**
   * Generate recommendation reason
   */
  private generateRecommendationReason(
    content: ContentItem,
    preferences: FanPreferences,
    score: number
  ): string {
    const reasons: string[] = [];

    // Check category match
    const categoryPref = preferences.contentPreferences[content.category];
    if (categoryPref && categoryPref.score > 0.7) {
      reasons.push(`High interest in ${content.category}`);
    }

    // Check topic matches
    const matchedTopics = content.topics.filter(
      topic => preferences.topicInterests[topic] > 0.6
    );
    if (matchedTopics.length > 0) {
      reasons.push(`Interested in ${matchedTopics.join(', ')}`);
    }

    // Check price range
    const avgPurchase = this.getAveragePurchaseAmount(preferences);
    if (content.price <= avgPurchase * 1.2) {
      reasons.push('Within preferred price range');
    }

    // Check recency
    const daysSince = this.getDaysSince(content.createdAt);
    if (daysSince < 3) {
      reasons.push('New content');
    }

    return reasons.length > 0 ? reasons.join('; ') : 'General recommendation';
  }

  /**
   * Calculate purchase delta based on amount
   */
  private calculatePurchaseDelta(amount: number): number {
    // Higher purchases = stronger signal
    if (amount >= 50) return 0.3;
    if (amount >= 25) return 0.2;
    if (amount >= 10) return 0.15;
    return 0.1;
  }

  /**
   * Extract topics from message content
   */
  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    const lowerContent = content.toLowerCase();

    // Simple keyword matching (in production, use NLP)
    const topicKeywords: Record<string, string[]> = {
      fitness: ['gym', 'workout', 'fitness', 'exercise', 'training'],
      travel: ['travel', 'trip', 'vacation', 'beach', 'destination'],
      fashion: ['outfit', 'dress', 'fashion', 'style', 'clothes'],
      food: ['food', 'restaurant', 'cooking', 'recipe', 'meal'],
      gaming: ['game', 'gaming', 'play', 'stream', 'console'],
      music: ['music', 'song', 'concert', 'band', 'album'],
      art: ['art', 'painting', 'drawing', 'creative', 'design']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  /**
   * Score price preference
   */
  private scorePricePreference(price: number, preferences: FanPreferences): number {
    const avgPurchase = this.getAveragePurchaseAmount(preferences);
    
    if (avgPurchase === 0) {
      return 0.5; // No purchase history, neutral score
    }

    // Score based on how close price is to average
    const ratio = price / avgPurchase;
    
    if (ratio <= 1.0) {
      return 1.0; // At or below average, perfect score
    } else if (ratio <= 1.5) {
      return 0.7; // Slightly above average
    } else if (ratio <= 2.0) {
      return 0.4; // Significantly above average
    } else {
      return 0.2; // Much higher than usual
    }
  }

  /**
   * Get average purchase amount
   */
  private getAveragePurchaseAmount(preferences: FanPreferences): number {
    const patterns = preferences.purchasePatterns;
    
    if (patterns.length === 0) {
      return 0;
    }

    const total = patterns.reduce((sum, p) => sum + p.averageAmount, 0);
    return total / patterns.length;
  }

  /**
   * Get most frequent value from frequency map
   */
  private getMostFrequent(frequency: Record<number, number>): number | undefined {
    const entries = Object.entries(frequency);
    
    if (entries.length === 0) {
      return undefined;
    }

    return Number(entries.reduce((max, curr) => 
      curr[1] > max[1] ? curr : max
    )[0]);
  }

  /**
   * Get days since a date
   */
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get default preferences
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
}

// Export singleton instance with default configuration
export const preferenceLearningEngine = new PreferenceLearningEngine();
