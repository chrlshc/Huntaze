/**
 * OnlyFans AI Memory System - Emotion Analyzer
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
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'EmotionAnalysisError';
  }
}

/**
 * Emotion analyzer implementation with error handling and logging
 */
export class EmotionAnalyzer implements IEmotionAnalyzer {
  private readonly logger = console; // Replace with proper logger in production

  /**
   * Log error with context
   */
  private logError(context: string, error: unknown, metadata?: Record<string, unknown>): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    this.logger.error(`[EmotionAnalyzer] ${context}`, {
      error: errorMessage,
      stack: errorStack,
      ...metadata
    });
  }

  /**
   * Log info with context
   */
  private logInfo(context: string, metadata?: Record<string, unknown>): void {
    this.logger.log(`[EmotionAnalyzer] ${context}`, metadata);
  }
  /**
   * Analyze a single message for emotional content
   * 
   * @param message - The message text to analyze
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
  async analyzeMessage(message: string): Promise<EmotionalAnalysis> {
    try {
      // Validate input
      if (!message || typeof message !== 'string') {
        throw new EmotionAnalysisError(
          'Invalid message input',
          'INVALID_INPUT',
          { message }
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

      this.logInfo('Analyzing message', { 
        messageLength: message.length,
        preview: message.substring(0, 50) 
      });

      // Simple sentiment analysis (in production, use NLP API)
      const sentiment = this.detectSentiment(message);
      const emotions = this.detectEmotions(message);
      const intensity = this.calculateIntensity(message, emotions);
      const confidence = this.calculateConfidence(message);

      const analysis: EmotionalAnalysis = {
        sentiment,
        confidence,
        emotions,
        intensity
      };

      this.logInfo('Message analysis complete', {
        sentiment,
        emotionCount: Object.keys(emotions).length,
        intensity,
        confidence
      });

      return analysis;
    } catch (error) {
      this.logError('Failed to analyze message', error, { 
        messageLength: message?.length 
      });

      // Graceful degradation: return neutral analysis
      if (error instanceof EmotionAnalysisError) {
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
   */
  async getEmotionalState(
    fanId: string,
    creatorId: string,
    recentMessages: ConversationMessage[]
  ): Promise<EmotionalState> {
    if (recentMessages.length === 0) {
      return this.getDefaultEmotionalState();
    }

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
  }

  /**
   * Detect disengagement signals
   */
  async detectDisengagement(
    fanId: string,
    creatorId: string,
    context: MemoryContext
  ): Promise<DisengagementSignal | null> {
    const messages = context.recentMessages;
    
    if (messages.length < 3) {
      return null; // Not enough data
    }

    // Check for short responses
    const shortResponseSignal = this.detectShortResponses(messages);
    if (shortResponseSignal) return shortResponseSignal;

    // Check for long delays
    const longDelaySignal = this.detectLongDelays(messages, context);
    if (longDelaySignal) return longDelaySignal;

    // Check for negative sentiment spike
    const negativeSentimentSignal = this.detectNegativeSentiment(messages);
    if (negativeSentimentSignal) return negativeSentimentSignal;

    // Check for reduced frequency
    const reducedFrequencySignal = this.detectReducedFrequency(messages, context);
    if (reducedFrequencySignal) return reducedFrequencySignal;

    return null; // No disengagement detected
  }

  /**
   * Update emotional state after interaction
   */
  async updateEmotionalState(
    fanId: string,
    creatorId: string,
    sentiment: 'positive' | 'negative' | 'neutral',
    intensity: number
  ): Promise<void> {
    // This would update the repository with new emotional state
    // For now, just log the update
    console.log(`Updating emotional state for ${fanId}: ${sentiment} (intensity: ${intensity})`);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

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
    // Base intensity on message characteristics
    let intensity = 0.5;

    // Exclamation marks increase intensity
    const exclamationCount = (message.match(/!/g) || []).length;
    intensity += Math.min(exclamationCount * 0.1, 0.3);

    // ALL CAPS increases intensity
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.5) {
      intensity += 0.2;
    }

    // Multiple emojis increase intensity
    const emojiCount = (message.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
    intensity += Math.min(emojiCount * 0.05, 0.2);

    // Strong emotions increase intensity
    const maxEmotion = Math.max(...Object.values(emotions), 0);
    intensity += maxEmotion * 0.2;

    return Math.min(intensity, 1);
  }

  /**
   * Calculate confidence in analysis
   */
  private calculateConfidence(message: string): number {
    // Longer messages = higher confidence
    const lengthScore = Math.min(message.length / 100, 1) * 0.5;

    // Clear emotional indicators = higher confidence
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

    // This is simplified - in production, analyze each message
    const recentMessages = messages.slice(-10);
    
    for (const msg of recentMessages) {
      if (msg.sentiment === 'positive') {
        emotionCounts['joy'] = (emotionCounts['joy'] || 0) + 1;
      } else if (msg.sentiment === 'negative') {
        emotionCounts['sadness'] = (emotionCounts['sadness'] || 0) + 1;
      }
    }

    // Return top 3 emotions
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

    // Calculate average message length
    const avgLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;

    // Calculate message frequency (messages per day)
    const daysSince = this.getDaysSinceFirst(messages);
    const frequency = messages.length / Math.max(daysSince, 1);

    // Calculate positive sentiment ratio
    const positiveRatio = messages.filter(m => m.sentiment === 'positive').length / messages.length;

    // Scoring
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
