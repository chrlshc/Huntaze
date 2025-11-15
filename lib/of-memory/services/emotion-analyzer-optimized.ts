/**
 * OnlyFans AI Memory System - Emotion Analyzer (Optimized)
 * 
 * Analyzes emotional state and sentiment from fan messages to enable
 * emotionally intelligent AI responses and detect disengagement signals.
 * 
 * Features:
 * - Sentiment analysis (positive/negative/neutral)
 * - Emotion detection (joy, love, excitement, sadness, anger, etc.)
 * - Disengagement signal detection
 * - Engagement level tracking
 * - Error handling with graceful degradation
 * - Retry strategies for transient failures
 * - Caching for performance optimization
 * - Comprehensive logging and monitoring
 * 
 * @example
 * ```typescript
 * const analyzer = new EmotionAnalyzer();
 * const analysis = await analyzer.analyzeMessage("I love this! 😍");
 * // { sentiment: 'positive', emotions: { love: 0.8, joy: 0.6 }, ... }
 * ```
 */

import type { IEmotionAnalyzer } from '../interfaces';
import type {
  EmotionalAnalysis,
  EmotionalState,
  DisengagementSignal,
  ConversationMessage,
  MemoryContext
} from '../types';

/**
 * Custom error for emotion analysis failures
 */
export class EmotionAnalysisError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'EmotionAnalysisError';
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
 * Cache entry
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

/**
 * Emotion analyzer implementation with error handling, retry logic, and caching
 */
export class EmotionAnalyzer implements IEmotionAnalyzer {
  private readonly logger = console; // Replace with proper logger in production
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  };

  // Cache TTLs (in milliseconds)
  private readonly CACHE_TTL = {
    MESSAGE_ANALYSIS: 5 * 60 * 1000, // 5 minutes
    EMOTIONAL_STATE: 2 * 60 * 1000,  // 2 minutes
    DISENGAGEMENT: 10 * 60 * 1000    // 10 minutes
  };

  /**
   * Log error with context and correlation ID
   */
  private logError(
    context: string,
    error: unknown,
    metadata?: Record<string, unknown>,
    correlationId?: string
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    this.logger.error(`[EmotionAnalyzer] ${context}`, {
      error: errorMessage,
      stack: errorStack,
      correlationId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Log info with context and correlation ID
   */
  private logInfo(
    context: string,
    metadata?: Record<string, unknown>,
    correlationId?: string
  ): void {
    this.logger.log(`[EmotionAnalyzer] ${context}`, {
      correlationId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Get from cache
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  /**
   * Set in cache
   */
  private setInCache<T>(key: string, value: T, ttl: number): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Retry with exponential backoff
   */
  private async retry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    correlationId?: string
  ): Promise<T> {
    const {
      maxAttempts,
      initialDelay,
      maxDelay,
      backoffFactor
    } = { ...this.defaultRetryConfig, ...config };

    let lastError: Error | undefined;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry non-retryable errors
        if (error instanceof EmotionAnalysisError && !error.retryable) {
          throw error;
        }

        if (attempt === maxAttempts) {
          this.logError(
            'Max retry attempts reached',
            error,
            { attempt, maxAttempts },
            correlationId
          );
          throw lastError;
        }

        this.logInfo(
          `Retry attempt ${attempt}/${maxAttempts}`,
          { delay, error: (error as Error).message },
          correlationId
        );

        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Analyze a single message for emotional content
   * 
   * @param message - The message text to analyze
   * @param correlationId - Optional correlation ID for request tracing
   * @returns Emotional analysis with sentiment, emotions, intensity, and confidence
   * @throws EmotionAnalysisError if analysis fails
   * 
   * @example
   * ```typescript
   * const analysis = await analyzer.analyzeMessage("I'm so happy! 😊");
   * console.log(analysis.sentiment); // 'positive'
   * console.log(analysis.emotions); // { joy: 0.8 }
   * ```
   */
  async analyzeMessage(
    message: string,
    correlationId?: string
  ): Promise<EmotionalAnalysis> {
    const cid = correlationId || crypto.randomUUID();

    try {
      // Validate input
      if (!message || typeof message !== 'string') {
        throw new EmotionAnalysisError(
          'Invalid message input',
          'INVALID_INPUT',
          { message },
          false // Not retryable
        );
      }

      if (message.trim().length === 0) {
        // Return neutral analysis for empty messages
        return {
          sentiment: 'neutral',
          confidence: 0,
          emotions: {},
          intensity: 0
        };
      }

      // Check cache
      const cacheKey = `message:${this.hashString(message)}`;
      const cached = this.getFromCache<EmotionalAnalysis>(cacheKey);
      if (cached) {
        this.logInfo('Cache hit for message analysis', { cacheKey }, cid);
        return cached;
      }

      this.logInfo('Analyzing message', { 
        messageLength: message.length,
        preview: message.substring(0, 50) 
      }, cid);

      // Perform analysis with retry
      const analysis = await this.retry(async () => {
        const sentiment = this.detectSentiment(message);
        const emotions = this.detectEmotions(message);
        const intensity = this.calculateIntensity(message, emotions);
        const confidence = this.calculateConfidence(message);

        return {
          sentiment,
          confidence,
          emotions,
          intensity
        };
      }, {}, cid);

      // Cache result
      this.setInCache(cacheKey, analysis, this.CACHE_TTL.MESSAGE_ANALYSIS);

      this.logInfo('Message analysis complete', {
        sentiment: analysis.sentiment,
        emotionCount: Object.keys(analysis.emotions).length,
        intensity: analysis.intensity,
        confidence: analysis.confidence
      }, cid);

      return analysis;
    } catch (error) {
      this.logError('Failed to analyze message', error, { 
        messageLength: message?.length 
      }, cid);

      // Graceful degradation: return neutral analysis
      if (error instanceof EmotionAnalysisError && !error.retryable) {
        throw error;
      }

      return {
        sentiment: 'neutral',
        confidence: 0,
        emotions: {},
        intensity: 0
      };
    }
  }

  /**
   * Get current emotional state based on recent messages
   * 
   * @param fanId - The fan's unique identifier
   * @param creatorId - The creator's unique identifier
   * @param recentMessages - Array of recent conversation messages
   * @param correlationId - Optional correlation ID for request tracing
   * @returns Current emotional state with sentiment history and engagement metrics
   * 
   * @example
   * ```typescript
   * const state = await analyzer.getEmotionalState('fan123', 'creator456', messages);
   * console.log(state.engagementLevel); // 'high' | 'medium' | 'low'
   * ```
   */
  async getEmotionalState(
    fanId: string,
    creatorId: string,
    recentMessages: ConversationMessage[],
    correlationId?: string
  ): Promise<EmotionalState> {
    const cid = correlationId || crypto.randomUUID();

    try {
      // Validate input
      if (!fanId || typeof fanId !== 'string') {
        throw new EmotionAnalysisError(
          'Invalid fanId',
          'INVALID_FAN_ID',
          { fanId },
          false
        );
      }

      if (!creatorId || typeof creatorId !== 'string') {
        throw new EmotionAnalysisError(
          'Invalid creatorId',
          'INVALID_CREATOR_ID',
          { creatorId },
          false
        );
      }

      if (!Array.isArray(recentMessages)) {
        throw new EmotionAnalysisError(
          'Invalid recentMessages array',
          'INVALID_MESSAGES',
          { type: typeof recentMessages },
          false
        );
      }

      // Check cache
      const cacheKey = `state:${fanId}:${creatorId}`;
      const cached = this.getFromCache<EmotionalState>(cacheKey);
      if (cached) {
        this.logInfo('Cache hit for emotional state', { fanId, creatorId }, cid);
        return cached;
      }

      this.logInfo('Getting emotional state', {
        fanId,
        creatorId,
        messageCount: recentMessages.length
      }, cid);

      if (recentMessages.length === 0) {
        this.logInfo('No messages found, returning default state', { fanId, creatorId }, cid);
        return this.getDefaultEmotionalState();
      }

      // Perform analysis with retry
      const state = await this.retry(async () => {
        // Analyze recent sentiment trend
        const sentimentHistory = recentMessages
          .filter(m => m.sentiment)
          .map(m => ({
            timestamp: m.timestamp,
            sentiment: m.sentiment as 'positive' | 'negative' | 'neutral',
            intensity: 0.5 // Default intensity
          }));

        // Determine current sentiment (most recent)
        const currentSentiment = sentimentHistory.length > 0
          ? sentimentHistory[sentimentHistory.length - 1].sentiment
          : 'neutral';

        // Extract dominant emotions
        const dominantEmotions = this.extractDominantEmotions(recentMessages);

        // Calculate engagement level
        const engagementLevel = this.calculateEngagementLevel(recentMessages);

        // Find last positive/negative interactions
        const lastPositive = this.findLastInteraction(recentMessages, 'positive');
        const lastNegative = this.findLastInteraction(recentMessages, 'negative');

        return {
          currentSentiment,
          sentimentHistory,
          dominantEmotions,
          engagementLevel,
          lastPositiveInteraction: lastPositive,
          lastNegativeInteraction: lastNegative
        };
      }, {}, cid);

      // Cache result
      this.setInCache(cacheKey, state, this.CACHE_TTL.EMOTIONAL_STATE);

      this.logInfo('Emotional state calculated', {
        fanId,
        creatorId,
        currentSentiment: state.currentSentiment,
        engagementLevel: state.engagementLevel,
        dominantEmotionCount: state.dominantEmotions.length
      }, cid);

      return state;
    } catch (error) {
      this.logError('Failed to get emotional state', error, { fanId, creatorId }, cid);

      // Graceful degradation
      if (error instanceof EmotionAnalysisError && !error.retryable) {
        throw error;
      }

      return this.getDefaultEmotionalState();
    }
  }

  /**
   * Detect disengagement signals
   * 
   * @param fanId - The fan's unique identifier
   * @param creatorId - The creator's unique identifier
   * @param context - Memory context with recent messages and interaction history
   * @param correlationId - Optional correlation ID for request tracing
   * @returns Disengagement signal if detected, null otherwise
   */
  async detectDisengagement(
    fanId: string,
    creatorId: string,
    context: MemoryContext,
    correlationId?: string
  ): Promise<DisengagementSignal | null> {
    const cid = correlationId || crypto.randomUUID();

    try {
      // Validate input
      if (!fanId || !creatorId) {
        throw new EmotionAnalysisError(
          'Invalid fanId or creatorId',
          'INVALID_INPUT',
          { fanId, creatorId },
          false
        );
      }

      // Check cache
      const cacheKey = `disengagement:${fanId}:${creatorId}`;
      const cached = this.getFromCache<DisengagementSignal | null>(cacheKey);
      if (cached !== null) {
        this.logInfo('Cache hit for disengagement detection', { fanId, creatorId }, cid);
        return cached;
      }

      const messages = context.recentMessages;
      
      if (messages.length < 3) {
        this.logInfo('Not enough messages for disengagement detection', {
          fanId,
          creatorId,
          messageCount: messages.length
        }, cid);
        return null;
      }

      this.logInfo('Detecting disengagement signals', {
        fanId,
        creatorId,
        messageCount: messages.length
      }, cid);

      // Check for various disengagement signals
      const shortResponseSignal = this.detectShortResponses(messages);
      if (shortResponseSignal) {
        this.logInfo('Short response signal detected', { fanId, creatorId }, cid);
        this.setInCache(cacheKey, shortResponseSignal, this.CACHE_TTL.DISENGAGEMENT);
        return shortResponseSignal;
      }

      const longDelaySignal = this.detectLongDelays(messages, context);
      if (longDelaySignal) {
        this.logInfo('Long delay signal detected', { fanId, creatorId }, cid);
        this.setInCache(cacheKey, longDelaySignal, this.CACHE_TTL.DISENGAGEMENT);
        return longDelaySignal;
      }

      const negativeSentimentSignal = this.detectNegativeSentiment(messages);
      if (negativeSentimentSignal) {
        this.logInfo('Negative sentiment signal detected', { fanId, creatorId }, cid);
        this.setInCache(cacheKey, negativeSentimentSignal, this.CACHE_TTL.DISENGAGEMENT);
        return negativeSentimentSignal;
      }

      const reducedFrequencySignal = this.detectReducedFrequency(messages, context);
      if (reducedFrequencySignal) {
        this.logInfo('Reduced frequency signal detected', { fanId, creatorId }, cid);
        this.setInCache(cacheKey, reducedFrequencySignal, this.CACHE_TTL.DISENGAGEMENT);
        return reducedFrequencySignal;
      }

      this.logInfo('No disengagement signals detected', { fanId, creatorId }, cid);
      this.setInCache(cacheKey, null, this.CACHE_TTL.DISENGAGEMENT);
      return null;
    } catch (error) {
      this.logError('Failed to detect disengagement', error, { fanId, creatorId }, cid);
      return null; // Graceful degradation
    }
  }

  /**
   * Update emotional state after interaction
   */
  async updateEmotionalState(
    fanId: string,
    creatorId: string,
    sentiment: 'positive' | 'negative' | 'neutral',
    intensity: number,
    correlationId?: string
  ): Promise<void> {
    const cid = correlationId || crypto.randomUUID();

    try {
      this.logInfo('Updating emotional state', {
        fanId,
        creatorId,
        sentiment,
        intensity
      }, cid);

      // Invalidate cache
      const cacheKey = `state:${fanId}:${creatorId}`;
      this.cache.delete(cacheKey);

      // This would update the repository with new emotional state
      // For now, just log the update
      this.logInfo('Emotional state updated successfully', {
        fanId,
        creatorId,
        sentiment,
        intensity
      }, cid);
    } catch (error) {
      this.logError('Failed to update emotional state', error, {
        fanId,
        creatorId,
        sentiment,
        intensity
      }, cid);
      throw error;
    }
  }

  /**
   * Clear cache (useful for testing or manual cache invalidation)
   */
  clearCache(): void {
    this.cache.clear();
    this.logInfo('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Hash string for cache key
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Detect sentiment from message text
   */
  private detectSentiment(message: string): 'positive' | 'negative' | 'neutral' {
    const lowerMessage = message.toLowerCase();

    // Positive keywords
    const positiveKeywords = [
      'love', 'amazing', 'great', 'awesome', 'perfect', 'beautiful',
      'wonderful', 'fantastic', 'excellent', 'best', 'happy', 'excited',
      '❤️', '😍', '🔥', '😊', '💕', '😘', '🥰'
    ];

    // Negative keywords
    const negativeKeywords = [
      'hate', 'bad', 'terrible', 'awful', 'worst', 'disappointed',
      'angry', 'sad', 'upset', 'annoyed', 'frustrated', 'boring',
      '😠', '😡', '😢', '😞', '😔'
    ];

    const positiveCount = positiveKeywords.filter(kw => lowerMessage.includes(kw)).length;
    const negativeCount = negativeKeywords.filter(kw => lowerMessage.includes(kw)).length;

    if (positiveCount > negativeCount) {
      return 'positive';
    } else if (negativeCount > positiveCount) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  /**
   * Detect specific emotions
   */
  private detectEmotions(message: string): Record<string, number> {
    const lowerMessage = message.toLowerCase();
    const emotions: Record<string, number> = {};

    // Emotion patterns
    const emotionPatterns: Record<string, string[]> = {
      joy: ['happy', 'joy', 'excited', 'thrilled', '😊', '😄', '🎉'],
      love: ['love', 'adore', 'cherish', '❤️', '😍', '💕', '🥰'],
      excitement: ['excited', 'amazing', 'wow', 'omg', '🔥', '😱'],
      sadness: ['sad', 'down', 'depressed', '😢', '😞', '😔'],
      anger: ['angry', 'mad', 'furious', '😠', '😡'],
      surprise: ['surprised', 'shocked', 'unexpected', '😮', '😲'],
      desire: ['want', 'need', 'crave', 'wish', '😏', '🤤']
    };

    for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
      const matches = patterns.filter(p => lowerMessage.includes(p)).length;
      if (matches > 0) {
        emotions[emotion] = Math.min(matches / patterns.length, 1);
      }
    }

    return emotions;
  }

  /**
   * Calculate emotional intensity
   */
  private calculateIntensity(message: string, emotions: Record<string, number>): number {
    let intensity = 0.5;

    const exclamationCount = (message.match(/!/g) || []).length;
    intensity += Math.min(exclamationCount * 0.1, 0.3);

    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.5) {
      intensity += 0.2;
    }

    const emojiCount = (message.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
    intensity += Math.min(emojiCount * 0.05, 0.2);

    const maxEmotion = Math.max(...Object.values(emotions), 0);
    intensity += maxEmotion * 0.2;

    return Math.min(intensity, 1);
  }

  /**
   * Calculate confidence in analysis
   */
  private calculateConfidence(message: string): number {
    const lengthScore = Math.min(message.length / 100, 1) * 0.5;

    const hasEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(message);
    const hasExclamation = message.includes('!');
    const indicatorScore = (hasEmoji ? 0.25 : 0) + (hasExclamation ? 0.25 : 0);

    return Math.min(lengthScore + indicatorScore, 1);
  }

  /**
   * Extract dominant emotions from messages
   */
  private extractDominantEmotions(messages: ConversationMessage[]): string[] {
    const emotionCounts: Record<string, number> = {};
    const recentMessages = messages.slice(-10);
    
    for (const msg of recentMessages) {
      if (msg.sentiment === 'positive') {
        emotionCounts['joy'] = (emotionCounts['joy'] || 0) + 1;
      } else if (msg.sentiment === 'negative') {
        emotionCounts['sadness'] = (emotionCounts['sadness'] || 0) + 1;
      }
    }

    return Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);
  }

  /**
   * Calculate engagement level
   */
  private calculateEngagementLevel(messages: ConversationMessage[]): 'high' | 'medium' | 'low' {
    if (messages.length === 0) return 'low';

    const avgLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
    const daysSince = this.getDaysSinceFirst(messages);
    const frequency = messages.length / Math.max(daysSince, 1);
    const positiveRatio = messages.filter(m => m.sentiment === 'positive').length / messages.length;

    let score = 0;
    if (avgLength > 50) score += 1;
    if (frequency > 2) score += 1;
    if (positiveRatio > 0.6) score += 1;

    if (score >= 2) return 'high';
    if (score >= 1) return 'medium';
    return 'low';
  }

  /**
   * Find last interaction with specific sentiment
   */
  private findLastInteraction(
    messages: ConversationMessage[],
    sentiment: 'positive' | 'negative'
  ): Date | null {
    const filtered = messages.filter(m => m.sentiment === sentiment);
    return filtered.length > 0 ? filtered[filtered.length - 1].timestamp : null;
  }

  /**
   * Detect short response pattern (disengagement signal)
   */
  private detectShortResponses(messages: ConversationMessage[]): DisengagementSignal | null {
    const recentFanMessages = messages
      .filter(m => m.sender === 'fan')
      .slice(-5);

    if (recentFanMessages.length < 3) return null;

    const avgLength = recentFanMessages.reduce((sum, m) => sum + m.content.length, 0) / recentFanMessages.length;

    if (avgLength < 20) {
      return {
        type: 'short_responses',
        severity: 'medium',
        detectedAt: new Date(),
        suggestedAction: 'Ask open-ended questions to re-engage'
      };
    }

    return null;
  }

  /**
   * Detect long delays (disengagement signal)
   */
  private detectLongDelays(messages: ConversationMessage[], context: MemoryContext): DisengagementSignal | null {
    const lastInteraction = context.lastInteraction;
    const daysSince = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince > 14) {
      return {
        type: 'long_delays',
        severity: 'high',
        detectedAt: new Date(),
        suggestedAction: 'Send re-engagement message with personalized content'
      };
    }

    return null;
  }

  /**
   * Detect negative sentiment spike (disengagement signal)
   */
  private detectNegativeSentiment(messages: ConversationMessage[]): DisengagementSignal | null {
    const recent = messages.slice(-5);
    const negativeCount = recent.filter(m => m.sentiment === 'negative').length;

    if (negativeCount >= 3) {
      return {
        type: 'negative_sentiment',
        severity: 'high',
        detectedAt: new Date(),
        suggestedAction: 'Address concerns and avoid sales pitches temporarily'
      };
    }

    return null;
  }

  /**
   * Detect reduced frequency (disengagement signal)
   */
  private detectReducedFrequency(messages: ConversationMessage[], context: MemoryContext): DisengagementSignal | null {
    if (messages.length < 5) return null;

    const recentWeek = messages.filter(m => {
      const daysSince = (Date.now() - m.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });

    if (recentWeek.length < 2) {
      return {
        type: 'reduced_frequency',
        severity: 'low',
        detectedAt: new Date(),
        suggestedAction: 'Send casual check-in message'
      };
    }

    return null;
  }

  /**
   * Get days since first message
   */
  private getDaysSinceFirst(messages: ConversationMessage[]): number {
    if (messages.length === 0) return 1;

    const first = messages[0].timestamp.getTime();
    const last = messages[messages.length - 1].timestamp.getTime();
    const days = (last - first) / (1000 * 60 * 60 * 24);

    return Math.max(days, 1);
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
}

// Export singleton instance
export const emotionAnalyzer = new EmotionAnalyzer();
