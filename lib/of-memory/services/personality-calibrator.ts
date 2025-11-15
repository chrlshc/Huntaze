/**
 * OnlyFans AI Memory System - Personality Calibrator
 * 
 * Automatically adjusts AI personality parameters based on fan interaction history
 * to maximize engagement and authenticity.
 * 
 * Features:
 * - Automatic personality calibration based on interaction patterns
 * - Retry logic with exponential backoff
 * - Comprehensive error handling and logging
 * - Circuit breaker integration for resilience
 * - Type-safe API responses
 */

import type { IPersonalityCalibrator } from '../interfaces';
import type {
  PersonalityProfile,
  InteractionEvent,
  InteractionFeedback,
  ResponseStyle,
  MemoryContext
} from '../types';
import { CircuitBreaker } from '../utils/circuit-breaker';

/**
 * Calibration error types
 */
export class CalibrationError extends Error {
  constructor(
    message: string,
    public readonly code: CalibrationErrorCode,
    public readonly fanId?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'CalibrationError';
  }
}

export enum CalibrationErrorCode {
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  INVALID_INPUT = 'INVALID_INPUT',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  PROFILE_GENERATION_FAILED = 'PROFILE_GENERATION_FAILED',
  CIRCUIT_OPEN = 'CIRCUIT_OPEN'
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

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

/**
 * Personality calibrator implementation with resilience patterns
 */
export class PersonalityCalibrator implements IPersonalityCalibrator {
  private circuitBreaker: CircuitBreaker;
  private retryConfig: RetryConfig;

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    
    // Initialize circuit breaker for calibration operations
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 120000 // 2 minutes
    });
  }
  /**
   * Calibrate personality based on interaction history
   * Analyzes patterns and adjusts personality parameters
   * 
   * @param fanId - Unique fan identifier
   * @param interactionHistory - Array of interaction events
   * @returns Calibrated personality profile
   * @throws CalibrationError if calibration fails
   */
  async calibratePersonality(
    fanId: string,
    interactionHistory: InteractionEvent[]
  ): Promise<PersonalityProfile> {
    const correlationId = crypto.randomUUID();
    
    try {
      // Input validation
      if (!fanId || typeof fanId !== 'string') {
        throw new CalibrationError(
          'Invalid fanId provided',
          CalibrationErrorCode.INVALID_INPUT,
          fanId
        );
      }

      if (!Array.isArray(interactionHistory)) {
        throw new CalibrationError(
          'interactionHistory must be an array',
          CalibrationErrorCode.INVALID_INPUT,
          fanId
        );
      }

      console.log('[PersonalityCalibrator] Starting calibration', {
        fanId,
        interactionCount: interactionHistory.length,
        correlationId
      });

      // Require minimum interactions for calibration
      if (interactionHistory.length < 5) {
        console.log('[PersonalityCalibrator] Insufficient data, using default profile', {
          fanId,
          interactionCount: interactionHistory.length,
          correlationId
        });
        return this.getDefaultProfile(fanId);
      }

      // Execute calibration with circuit breaker and retry
      const profile = await this.executeWithRetry(
        async () => {
          return await this.circuitBreaker.execute(async () => {
            return await this.performCalibration(fanId, interactionHistory);
          });
        },
        `calibratePersonality-${fanId}`
      );

      console.log('[PersonalityCalibrator] Calibration completed', {
        fanId,
        tone: profile.tone,
        confidenceScore: profile.confidenceScore,
        correlationId
      });

      return profile;

    } catch (error) {
      console.error('[PersonalityCalibrator] Calibration failed', {
        fanId,
        error: error instanceof Error ? error.message : String(error),
        correlationId
      });

      // If circuit is open, return default profile
      if (error instanceof Error && error.message.includes('Circuit breaker is OPEN')) {
        console.warn('[PersonalityCalibrator] Circuit breaker open, using default profile', {
          fanId,
          correlationId
        });
        return this.getDefaultProfile(fanId);
      }

      // Rethrow CalibrationError
      if (error instanceof CalibrationError) {
        throw error;
      }

      // Wrap unknown errors
      throw new CalibrationError(
        'Calibration failed',
        CalibrationErrorCode.PROFILE_GENERATION_FAILED,
        fanId,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Perform the actual calibration logic
   * Separated for retry and circuit breaker wrapping
   */
  private async performCalibration(
    fanId: string,
    interactionHistory: InteractionEvent[]
  ): Promise<PersonalityProfile> {
    try {
      // Analyze interaction patterns
      const analysis = this.analyzeInteractions(interactionHistory);

      // Calculate optimal personality parameters
      const tone = this.calculateOptimalTone(analysis);
      const emojiFrequency = this.calculateEmojiFrequency(analysis);
      const messageLengthPreference = this.calculateMessageLength(analysis);
      const punctuationStyle = this.calculatePunctuationStyle(analysis);
      const preferredEmojis = this.extractPreferredEmojis(analysis);
      const responseSpeed = this.calculateResponseSpeed(analysis);

      // Calculate confidence based on data quality
      const confidenceScore = this.calculateConfidence(interactionHistory.length, analysis);

      return {
        fanId,
        tone,
        emojiFrequency,
        messageLengthPreference,
        punctuationStyle,
        preferredEmojis,
        responseSpeed,
        confidenceScore,
        lastCalibrated: new Date(),
        interactionCount: interactionHistory.length
      };
    } catch (error) {
      throw new CalibrationError(
        'Analysis failed during calibration',
        CalibrationErrorCode.ANALYSIS_FAILED,
        fanId,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Adjust tone based on feedback
   * 
   * @param currentProfile - Current personality profile
   * @param feedback - Interaction feedback
   * @returns Updated personality profile
   */
  adjustTone(
    currentProfile: PersonalityProfile,
    feedback: InteractionFeedback
  ): PersonalityProfile {
    const correlationId = crypto.randomUUID();
    
    try {
      console.log('[PersonalityCalibrator] Adjusting tone', {
        fanId: currentProfile.fanId,
        currentTone: currentProfile.tone,
        fanEngaged: feedback.fanEngaged,
        sentiment: feedback.sentiment,
        correlationId
      });
    const toneAdjustments: Record<string, string[]> = {
      flirty: ['playful', 'friendly'],
      friendly: ['flirty', 'playful', 'professional'],
      professional: ['friendly'],
      playful: ['flirty', 'friendly'],
      dominant: ['playful', 'flirty']
    };

    let newTone = currentProfile.tone;

    // Adjust based on engagement
    if (!feedback.fanEngaged && feedback.sentiment === 'negative') {
      // Try a different tone
      const alternatives = toneAdjustments[currentProfile.tone] || ['friendly'];
      newTone = alternatives[0] as PersonalityProfile['tone'];
    }

      // Increase confidence if positive feedback
      const confidenceDelta = feedback.fanEngaged ? 0.05 : -0.02;
      const newConfidence = Math.max(0, Math.min(1, currentProfile.confidenceScore + confidenceDelta));

      const updatedProfile = {
        ...currentProfile,
        tone: newTone,
        confidenceScore: newConfidence,
        lastCalibrated: new Date(),
        interactionCount: currentProfile.interactionCount + 1
      };

      console.log('[PersonalityCalibrator] Tone adjusted', {
        fanId: currentProfile.fanId,
        oldTone: currentProfile.tone,
        newTone,
        confidenceChange: confidenceDelta,
        correlationId
      });

      return updatedProfile;

    } catch (error) {
      console.error('[PersonalityCalibrator] Tone adjustment failed', {
        fanId: currentProfile.fanId,
        error: error instanceof Error ? error.message : String(error),
        correlationId
      });

      // Return unchanged profile on error
      return currentProfile;
    }
  }

  /**
   * Get optimal response style for a fan
   */
  getOptimalResponseStyle(
    fanId: string,
    context: MemoryContext
  ): ResponseStyle {
    const profile = context.personalityProfile;
    const preferences = context.preferences;

    // Calculate max length based on preference
    const maxLengthMap = {
      short: 100,
      medium: 200,
      long: 400
    };
    const maxLength = maxLengthMap[profile.messageLengthPreference];

    // Calculate emoji count
    const emojiCount = Math.round(profile.emojiFrequency * 5); // 0-5 emojis

    // Extract topics from preferences
    const topics = Object.entries(preferences.topicInterests)
      .filter(([_, score]) => score > 0.6)
      .map(([topic]) => topic);

    // Extract topics to avoid (low interest)
    const avoidTopics = Object.entries(preferences.topicInterests)
      .filter(([_, score]) => score < 0.3)
      .map(([topic]) => topic);

    return {
      maxLength,
      emojiCount,
      tone: profile.tone,
      topics,
      avoidTopics
    };
  }

  /**
   * Update personality profile after interaction
   */
  async updatePersonality(
    fanId: string,
    creatorId: string,
    feedback: InteractionFeedback
  ): Promise<PersonalityProfile> {
    // This would typically fetch the current profile from repository
    // For now, we'll create a minimal implementation
    // In production, this should integrate with the repository
    
    const defaultProfile = this.getDefaultProfile(fanId);
    return this.adjustTone(defaultProfile, feedback);
  }

  // ============================================================================
  // RETRY AND RESILIENCE METHODS
  // ============================================================================

  /**
   * Execute function with retry logic and exponential backoff
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.retryConfig.initialDelay;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        console.warn('[PersonalityCalibrator] Operation failed, retrying', {
          operationName,
          attempt,
          maxAttempts: this.retryConfig.maxAttempts,
          error: lastError.message,
          nextRetryIn: attempt < this.retryConfig.maxAttempts ? delay : 'N/A'
        });

        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Exponential backoff
        delay = Math.min(
          delay * this.retryConfig.backoffFactor,
          this.retryConfig.maxDelay
        );
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Analyze interaction patterns
   * 
   * @param interactions - Array of interaction events
   * @returns Analysis results
   * @throws Error if analysis fails
   */
  private analyzeInteractions(interactions: InteractionEvent[]): InteractionAnalysis {
    const messageInteractions = interactions.filter(i => i.type === 'message');
    const purchaseInteractions = interactions.filter(i => i.type === 'purchase');

    // Analyze message characteristics
    const messageLengths = messageInteractions
      .filter(i => i.content)
      .map(i => i.content!.length);

    const avgMessageLength = messageLengths.length > 0
      ? messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length
      : 100;

    // Count emojis in messages
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojiCounts = messageInteractions
      .filter(i => i.content)
      .map(i => (i.content!.match(emojiRegex) || []).length);

    const avgEmojiCount = emojiCounts.length > 0
      ? emojiCounts.reduce((a, b) => a + b, 0) / emojiCounts.length
      : 0;

    // Extract all emojis
    const allEmojis = messageInteractions
      .filter(i => i.content)
      .flatMap(i => i.content!.match(emojiRegex) || []);

    // Calculate response times (simplified)
    const responseTimes = messageInteractions
      .slice(1)
      .map((msg, i) => {
        const prevMsg = messageInteractions[i];
        return msg.timestamp.getTime() - prevMsg.timestamp.getTime();
      });

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 3600000; // 1 hour default

    // Engagement indicators
    const hasPositiveEngagement = purchaseInteractions.length > 0;
    const messageFrequency = interactions.length / Math.max(1, this.getDaysSinceFirst(interactions));

    return {
      avgMessageLength,
      avgEmojiCount,
      allEmojis,
      avgResponseTime,
      hasPositiveEngagement,
      messageFrequency,
      purchaseCount: purchaseInteractions.length,
      totalInteractions: interactions.length
    };
  }

  /**
   * Calculate optimal tone based on analysis
   */
  private calculateOptimalTone(analysis: InteractionAnalysis): PersonalityProfile['tone'] {
    // High engagement + purchases = flirty works well
    if (analysis.hasPositiveEngagement && analysis.purchaseCount > 2) {
      return 'flirty';
    }

    // High message frequency = playful
    if (analysis.messageFrequency > 5) {
      return 'playful';
    }

    // Low emoji usage = professional
    if (analysis.avgEmojiCount < 0.5) {
      return 'professional';
    }

    // Default to friendly
    return 'friendly';
  }

  /**
   * Calculate emoji frequency
   */
  private calculateEmojiFrequency(analysis: InteractionAnalysis): number {
    // Normalize to 0-1 range (assume max 5 emojis per message)
    const frequency = Math.min(analysis.avgEmojiCount / 5, 1);
    return Math.round(frequency * 100) / 100; // Round to 2 decimals
  }

  /**
   * Calculate message length preference
   */
  private calculateMessageLength(analysis: InteractionAnalysis): PersonalityProfile['messageLengthPreference'] {
    if (analysis.avgMessageLength < 50) {
      return 'short';
    } else if (analysis.avgMessageLength < 150) {
      return 'medium';
    } else {
      return 'long';
    }
  }

  /**
   * Calculate punctuation style
   */
  private calculatePunctuationStyle(analysis: InteractionAnalysis): PersonalityProfile['punctuationStyle'] {
    // If using lots of emojis, likely casual
    if (analysis.avgEmojiCount > 2) {
      return 'casual';
    }

    // Professional tone suggests proper punctuation
    return 'proper';
  }

  /**
   * Extract preferred emojis
   */
  private extractPreferredEmojis(analysis: InteractionAnalysis): string[] {
    // Count emoji frequency
    const emojiFrequency: Record<string, number> = {};
    
    for (const emoji of analysis.allEmojis) {
      emojiFrequency[emoji] = (emojiFrequency[emoji] || 0) + 1;
    }

    // Get top 5 most used emojis
    return Object.entries(emojiFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([emoji]) => emoji);
  }

  /**
   * Calculate response speed preference
   */
  private calculateResponseSpeed(analysis: InteractionAnalysis): PersonalityProfile['responseSpeed'] {
    const avgMinutes = analysis.avgResponseTime / 60000;

    if (avgMinutes < 5) {
      return 'immediate';
    } else if (avgMinutes < 60) {
      return 'delayed';
    } else {
      return 'variable';
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(interactionCount: number, analysis: InteractionAnalysis): number {
    // Base confidence on interaction count
    let confidence = Math.min(interactionCount / 20, 0.8); // Max 0.8 from count

    // Boost if we have purchases (strong signal)
    if (analysis.hasPositiveEngagement) {
      confidence += 0.1;
    }

    // Boost if high message frequency (more data)
    if (analysis.messageFrequency > 3) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }

  /**
   * Get days since first interaction
   */
  private getDaysSinceFirst(interactions: InteractionEvent[]): number {
    if (interactions.length === 0) return 1;

    const first = interactions[0].timestamp.getTime();
    const last = interactions[interactions.length - 1].timestamp.getTime();
    const days = (last - first) / (1000 * 60 * 60 * 24);

    return Math.max(days, 1);
  }

  /**
   * Get default personality profile
   */
  private getDefaultProfile(fanId: string): PersonalityProfile {
    return {
      fanId,
      tone: 'friendly',
      emojiFrequency: 0.5,
      messageLengthPreference: 'medium',
      punctuationStyle: 'casual',
      preferredEmojis: ['😊', '❤️', '🔥', '😘', '💕'],
      responseSpeed: 'variable',
      confidenceScore: 0.3,
      lastCalibrated: new Date(),
      interactionCount: 0
    };
  }
}

/**
 * Interaction analysis result
 */
interface InteractionAnalysis {
  avgMessageLength: number;
  avgEmojiCount: number;
  allEmojis: string[];
  avgResponseTime: number;
  hasPositiveEngagement: boolean;
  messageFrequency: number;
  purchaseCount: number;
  totalInteractions: number;
}

// Export singleton instance
export const personalityCalibrator = new PersonalityCalibrator();
