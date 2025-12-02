/**
 * Azure OpenAI Personality Calibrator
 * 
 * Migrated PersonalityCalibrator service using Azure OpenAI GPT-4
 * for intelligent personality profile generation with confidence scores.
 * 
 * Features:
 * - GPT-4 powered personality analysis with structured JSON output
 * - Few-shot learning examples for personality types
 * - Profile update logic (every 5 interactions)
 * - Personality-based tone adaptation
 * - Confidence scoring (0-1 range)
 * - Circuit breaker integration
 * - Cost tracking via Application Insights
 * 
 * Requirements: 4.1, 4.3, 10.1, 10.2
 */

import { AzureOpenAIService } from './azure-openai.service';
import { AZURE_OPENAI_CONFIG } from './azure-openai.config';
import { CircuitBreaker, CircuitBreakerState } from './circuit-breaker';
import { AzureCostTrackingService } from './cost-tracking.service';
import type { GenerationOptions, ChatMessage } from './azure-openai.types';

// ============================================================================
// TYPES
// ============================================================================

export interface PersonalityProfile {
  fanId: string;
  tone: 'flirty' | 'friendly' | 'professional' | 'playful' | 'dominant';
  emojiFrequency: number; // 0-1
  messageLengthPreference: 'short' | 'medium' | 'long';
  punctuationStyle: 'casual' | 'proper';
  preferredEmojis: string[];
  responseSpeed: 'immediate' | 'delayed' | 'variable';
  confidenceScore: number; // 0-1
  lastCalibrated: Date;
  interactionCount: number;
  // Azure-specific additions
  personalityTraits?: PersonalityTraits;
  communicationStyle?: CommunicationStyle;
}

export interface PersonalityTraits {
  openness: number; // 0-1
  agreeableness: number; // 0-1
  extraversion: number; // 0-1
  conscientiousness: number; // 0-1
  emotionalStability: number; // 0-1
}

export interface CommunicationStyle {
  formality: number; // 0-1 (0=casual, 1=formal)
  expressiveness: number; // 0-1
  directness: number; // 0-1
  humor: number; // 0-1
}

export interface InteractionEvent {
  id: string;
  type: 'message' | 'purchase' | 'tip' | 'subscription' | 'view';
  timestamp: Date;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface InteractionFeedback {
  fanEngaged: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  responseTime?: number;
  purchaseMade?: boolean;
}

export interface ResponseStyle {
  maxLength: number;
  emojiCount: number;
  tone: PersonalityProfile['tone'];
  topics: string[];
  avoidTopics: string[];
}

export interface MemoryContext {
  personalityProfile: PersonalityProfile;
  preferences: {
    topicInterests: Record<string, number>;
  };
}

export interface CalibrationResult {
  profile: PersonalityProfile;
  tokensUsed: number;
  cost: number;
  latencyMs: number;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class AzureCalibrationError extends Error {
  constructor(
    message: string,
    public readonly code: AzureCalibrationErrorCode,
    public readonly fanId?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AzureCalibrationError';
  }
}

export enum AzureCalibrationErrorCode {
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  INVALID_INPUT = 'INVALID_INPUT',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  PROFILE_GENERATION_FAILED = 'PROFILE_GENERATION_FAILED',
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  AZURE_API_ERROR = 'AZURE_API_ERROR',
  JSON_PARSE_ERROR = 'JSON_PARSE_ERROR',
}

// ============================================================================
// FEW-SHOT EXAMPLES
// ============================================================================

const FEW_SHOT_EXAMPLES = `
Example 1:
Input: Fan sends short messages with lots of emojis (❤️🔥😘), responds quickly, has made 3 purchases
Output: {"tone":"flirty","emojiFrequency":0.8,"messageLengthPreference":"short","punctuationStyle":"casual","preferredEmojis":["❤️","🔥","😘","💕","😍"],"responseSpeed":"immediate","confidenceScore":0.85,"personalityTraits":{"openness":0.7,"agreeableness":0.8,"extraversion":0.9,"conscientiousness":0.5,"emotionalStability":0.7},"communicationStyle":{"formality":0.2,"expressiveness":0.9,"directness":0.6,"humor":0.7}}

Example 2:
Input: Fan sends long, detailed messages with proper grammar, no emojis, responds after hours
Output: {"tone":"professional","emojiFrequency":0.1,"messageLengthPreference":"long","punctuationStyle":"proper","preferredEmojis":[],"responseSpeed":"delayed","confidenceScore":0.75,"personalityTraits":{"openness":0.6,"agreeableness":0.7,"extraversion":0.4,"conscientiousness":0.9,"emotionalStability":0.8},"communicationStyle":{"formality":0.8,"expressiveness":0.4,"directness":0.7,"humor":0.3}}

Example 3:
Input: Fan uses playful language, moderate emojis (😊🎉), medium message length, active engagement
Output: {"tone":"playful","emojiFrequency":0.5,"messageLengthPreference":"medium","punctuationStyle":"casual","preferredEmojis":["😊","🎉","😄","✨","💫"],"responseSpeed":"variable","confidenceScore":0.7,"personalityTraits":{"openness":0.8,"agreeableness":0.75,"extraversion":0.7,"conscientiousness":0.6,"emotionalStability":0.75},"communicationStyle":{"formality":0.3,"expressiveness":0.7,"directness":0.5,"humor":0.8}}
`;

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class AzurePersonalityCalibrator {
  private azureOpenAI: AzureOpenAIService;
  private circuitBreaker: CircuitBreaker;
  private costTracker: AzureCostTrackingService;
  private profileCache: Map<string, { profile: PersonalityProfile; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MIN_INTERACTIONS_FOR_CALIBRATION = 5;
  private readonly RECALIBRATION_INTERVAL = 5; // Every 5 interactions

  constructor() {
    // Use GPT-4 standard tier for personality analysis (good balance of quality/cost)
    this.azureOpenAI = new AzureOpenAIService('gpt-4-standard-prod');
    
    this.circuitBreaker = new CircuitBreaker({
      name: 'azure-personality-calibrator',
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 120000, // 2 minutes
    });

    this.costTracker = new AzureCostTrackingService();
    this.profileCache = new Map();
  }

  /**
   * Calibrate personality using Azure OpenAI GPT-4
   * Uses structured JSON output for reliable parsing
   * 
   * @param fanId - Unique fan identifier
   * @param interactionHistory - Array of interaction events
   * @returns Calibration result with profile and metrics
   */
  async calibratePersonality(
    fanId: string,
    interactionHistory: InteractionEvent[]
  ): Promise<CalibrationResult> {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Input validation
      this.validateInput(fanId, interactionHistory);

      console.log('[AzurePersonalityCalibrator] Starting calibration', {
        fanId,
        interactionCount: interactionHistory.length,
        correlationId,
      });

      // Check if we have enough data
      if (interactionHistory.length < this.MIN_INTERACTIONS_FOR_CALIBRATION) {
        console.log('[AzurePersonalityCalibrator] Insufficient data, using default profile', {
          fanId,
          interactionCount: interactionHistory.length,
          correlationId,
        });
        return {
          profile: this.getDefaultProfile(fanId),
          tokensUsed: 0,
          cost: 0,
          latencyMs: Date.now() - startTime,
        };
      }

      // Check cache
      const cached = this.getCachedProfile(fanId);
      if (cached) {
        console.log('[AzurePersonalityCalibrator] Using cached profile', {
          fanId,
          correlationId,
        });
        return {
          profile: cached,
          tokensUsed: 0,
          cost: 0,
          latencyMs: Date.now() - startTime,
        };
      }

      // Execute with circuit breaker
      const result = await this.circuitBreaker.execute(async () => {
        return await this.performAzureCalibration(fanId, interactionHistory, correlationId);
      });

      // Cache the result
      this.cacheProfile(fanId, result.profile);

      // Track cost
      await this.costTracker.trackUsage({
        operation: 'personality_calibration',
        deployment: 'gpt-4-standard-prod',
        tokensInput: Math.floor(result.tokensUsed * 0.7), // Estimate
        tokensOutput: Math.floor(result.tokensUsed * 0.3),
        accountId: fanId,
        correlationId,
      });

      console.log('[AzurePersonalityCalibrator] Calibration completed', {
        fanId,
        tone: result.profile.tone,
        confidenceScore: result.profile.confidenceScore,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        correlationId,
      });

      return result;

    } catch (error) {
      console.error('[AzurePersonalityCalibrator] Calibration failed', {
        fanId,
        error: error instanceof Error ? error.message : String(error),
        correlationId,
      });

      // Return default profile on circuit breaker open
      if (this.circuitBreaker.getState() === CircuitBreakerState.OPEN) {
        console.warn('[AzurePersonalityCalibrator] Circuit breaker open, using default profile', {
          fanId,
          correlationId,
        });
        return {
          profile: this.getDefaultProfile(fanId),
          tokensUsed: 0,
          cost: 0,
          latencyMs: Date.now() - startTime,
        };
      }

      throw this.wrapError(error, fanId);
    }
  }

  /**
   * Perform the actual Azure OpenAI calibration
   */
  private async performAzureCalibration(
    fanId: string,
    interactionHistory: InteractionEvent[],
    correlationId: string
  ): Promise<CalibrationResult> {
    const startTime = Date.now();

    // Prepare interaction summary for the prompt
    const interactionSummary = this.summarizeInteractions(interactionHistory);

    // Build the prompt with few-shot examples
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an expert personality analyst for a content creator platform. 
Analyze fan interaction patterns and generate a personality profile.
Always respond with valid JSON matching the exact schema provided.
Use the few-shot examples as guidance for your analysis.

${FEW_SHOT_EXAMPLES}

Output Schema:
{
  "tone": "flirty" | "friendly" | "professional" | "playful" | "dominant",
  "emojiFrequency": number (0-1),
  "messageLengthPreference": "short" | "medium" | "long",
  "punctuationStyle": "casual" | "proper",
  "preferredEmojis": string[],
  "responseSpeed": "immediate" | "delayed" | "variable",
  "confidenceScore": number (0-1),
  "personalityTraits": {
    "openness": number (0-1),
    "agreeableness": number (0-1),
    "extraversion": number (0-1),
    "conscientiousness": number (0-1),
    "emotionalStability": number (0-1)
  },
  "communicationStyle": {
    "formality": number (0-1),
    "expressiveness": number (0-1),
    "directness": number (0-1),
    "humor": number (0-1)
  }
}`,
      },
      {
        role: 'user',
        content: `Analyze this fan's interaction history and generate a personality profile:

Fan ID: ${fanId}
Total Interactions: ${interactionHistory.length}

Interaction Summary:
${interactionSummary}

Generate a JSON personality profile based on this data.`,
      },
    ];

    // Call Azure OpenAI with JSON mode
    const options: GenerationOptions = {
      temperature: 0.3, // Lower temperature for consistent analysis
      maxTokens: 1000,
      responseFormat: { type: 'json_object' },
    };

    const response = await this.azureOpenAI.chat(messages, options);
    const latencyMs = Date.now() - startTime;

    // Parse the JSON response
    let profileData: Partial<PersonalityProfile>;
    try {
      profileData = JSON.parse(response.text);
    } catch (parseError) {
      throw new AzureCalibrationError(
        'Failed to parse Azure OpenAI response as JSON',
        AzureCalibrationErrorCode.JSON_PARSE_ERROR,
        fanId,
        parseError instanceof Error ? parseError : undefined
      );
    }

    // Build the complete profile
    const profile: PersonalityProfile = {
      fanId,
      tone: profileData.tone || 'friendly',
      emojiFrequency: this.clamp(profileData.emojiFrequency || 0.5, 0, 1),
      messageLengthPreference: profileData.messageLengthPreference || 'medium',
      punctuationStyle: profileData.punctuationStyle || 'casual',
      preferredEmojis: profileData.preferredEmojis || ['😊', '❤️', '🔥'],
      responseSpeed: profileData.responseSpeed || 'variable',
      confidenceScore: this.clamp(profileData.confidenceScore || 0.5, 0, 1),
      lastCalibrated: new Date(),
      interactionCount: interactionHistory.length,
      personalityTraits: profileData.personalityTraits,
      communicationStyle: profileData.communicationStyle,
    };

    return {
      profile,
      tokensUsed: response.usage.totalTokens,
      cost: this.calculateCost(response.usage.promptTokens, response.usage.completionTokens),
      latencyMs,
    };
  }

  /**
   * Adjust tone based on feedback using Azure OpenAI
   */
  async adjustTone(
    currentProfile: PersonalityProfile,
    feedback: InteractionFeedback
  ): Promise<PersonalityProfile> {
    const correlationId = crypto.randomUUID();

    console.log('[AzurePersonalityCalibrator] Adjusting tone', {
      fanId: currentProfile.fanId,
      currentTone: currentProfile.tone,
      fanEngaged: feedback.fanEngaged,
      sentiment: feedback.sentiment,
      correlationId,
    });

    // Simple rule-based adjustment (can be enhanced with Azure OpenAI)
    const toneAdjustments: Record<string, string[]> = {
      flirty: ['playful', 'friendly'],
      friendly: ['flirty', 'playful', 'professional'],
      professional: ['friendly'],
      playful: ['flirty', 'friendly'],
      dominant: ['playful', 'flirty'],
    };

    let newTone = currentProfile.tone;

    // Adjust based on engagement
    if (!feedback.fanEngaged && feedback.sentiment === 'negative') {
      const alternatives = toneAdjustments[currentProfile.tone] || ['friendly'];
      newTone = alternatives[0] as PersonalityProfile['tone'];
    }

    // Adjust confidence based on feedback
    const confidenceDelta = feedback.fanEngaged ? 0.05 : -0.02;
    const newConfidence = this.clamp(currentProfile.confidenceScore + confidenceDelta, 0, 1);

    const updatedProfile: PersonalityProfile = {
      ...currentProfile,
      tone: newTone,
      confidenceScore: newConfidence,
      lastCalibrated: new Date(),
      interactionCount: currentProfile.interactionCount + 1,
    };

    // Check if recalibration is needed
    if (updatedProfile.interactionCount % this.RECALIBRATION_INTERVAL === 0) {
      console.log('[AzurePersonalityCalibrator] Recalibration threshold reached', {
        fanId: currentProfile.fanId,
        interactionCount: updatedProfile.interactionCount,
        correlationId,
      });
      // Mark for recalibration by invalidating cache
      this.invalidateCache(currentProfile.fanId);
    }

    console.log('[AzurePersonalityCalibrator] Tone adjusted', {
      fanId: currentProfile.fanId,
      oldTone: currentProfile.tone,
      newTone,
      confidenceChange: confidenceDelta,
      correlationId,
    });

    return updatedProfile;
  }

  /**
   * Get optimal response style for a fan
   */
  getOptimalResponseStyle(fanId: string, context: MemoryContext): ResponseStyle {
    const profile = context.personalityProfile;
    const preferences = context.preferences;

    // Calculate max length based on preference
    const maxLengthMap = {
      short: 100,
      medium: 200,
      long: 400,
    };
    const maxLength = maxLengthMap[profile.messageLengthPreference];

    // Calculate emoji count based on frequency
    const emojiCount = Math.round(profile.emojiFrequency * 5);

    // Extract topics from preferences
    const topics = Object.entries(preferences.topicInterests)
      .filter(([_, score]) => score > 0.6)
      .map(([topic]) => topic);

    const avoidTopics = Object.entries(preferences.topicInterests)
      .filter(([_, score]) => score < 0.3)
      .map(([topic]) => topic);

    return {
      maxLength,
      emojiCount,
      tone: profile.tone,
      topics,
      avoidTopics,
    };
  }

  /**
   * Check if profile needs recalibration
   */
  needsRecalibration(profile: PersonalityProfile): boolean {
    // Recalibrate every 5 interactions
    if (profile.interactionCount % this.RECALIBRATION_INTERVAL === 0) {
      return true;
    }

    // Recalibrate if confidence is low
    if (profile.confidenceScore < 0.4) {
      return true;
    }

    // Recalibrate if profile is older than 24 hours
    const hoursSinceCalibration = 
      (Date.now() - profile.lastCalibrated.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCalibration > 24) {
      return true;
    }

    return false;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private validateInput(fanId: string, interactionHistory: InteractionEvent[]): void {
    if (!fanId || typeof fanId !== 'string') {
      throw new AzureCalibrationError(
        'Invalid fanId provided',
        AzureCalibrationErrorCode.INVALID_INPUT,
        fanId
      );
    }

    if (!Array.isArray(interactionHistory)) {
      throw new AzureCalibrationError(
        'interactionHistory must be an array',
        AzureCalibrationErrorCode.INVALID_INPUT,
        fanId
      );
    }
  }

  private summarizeInteractions(interactions: InteractionEvent[]): string {
    const messageInteractions = interactions.filter(i => i.type === 'message');
    const purchaseInteractions = interactions.filter(i => i.type === 'purchase');
    const tipInteractions = interactions.filter(i => i.type === 'tip');

    // Analyze message characteristics
    const messageLengths = messageInteractions
      .filter(i => i.content)
      .map(i => i.content!.length);
    const avgMessageLength = messageLengths.length > 0
      ? Math.round(messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length)
      : 0;

    // Count emojis
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const allEmojis = messageInteractions
      .filter(i => i.content)
      .flatMap(i => i.content!.match(emojiRegex) || []);
    
    const emojiFrequency = messageInteractions.length > 0
      ? (allEmojis.length / messageInteractions.length).toFixed(2)
      : '0';

    // Get sample messages (last 5)
    const sampleMessages = messageInteractions
      .slice(-5)
      .filter(i => i.content)
      .map(i => `"${i.content!.substring(0, 100)}${i.content!.length > 100 ? '...' : ''}"`)
      .join('\n');

    return `
- Message count: ${messageInteractions.length}
- Purchase count: ${purchaseInteractions.length}
- Tip count: ${tipInteractions.length}
- Average message length: ${avgMessageLength} characters
- Emoji frequency: ${emojiFrequency} per message
- Most used emojis: ${[...new Set(allEmojis)].slice(0, 5).join(' ') || 'none'}
- Sample messages:
${sampleMessages || 'No messages available'}
`;
  }

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
      interactionCount: 0,
    };
  }

  private getCachedProfile(fanId: string): PersonalityProfile | null {
    const cached = this.profileCache.get(fanId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.profile;
    }
    return null;
  }

  private cacheProfile(fanId: string, profile: PersonalityProfile): void {
    this.profileCache.set(fanId, { profile, timestamp: Date.now() });
  }

  private invalidateCache(fanId: string): void {
    this.profileCache.delete(fanId);
  }

  private calculateCost(promptTokens: number, completionTokens: number): number {
    // GPT-4 pricing: $0.03/1K input, $0.06/1K output
    return (promptTokens * 0.03 + completionTokens * 0.06) / 1000;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private wrapError(error: unknown, fanId: string): AzureCalibrationError {
    if (error instanceof AzureCalibrationError) {
      return error;
    }

    return new AzureCalibrationError(
      error instanceof Error ? error.message : 'Unknown calibration error',
      AzureCalibrationErrorCode.ANALYSIS_FAILED,
      fanId,
      error instanceof Error ? error : undefined
    );
  }
}

// Export singleton instance
export const azurePersonalityCalibrator = new AzurePersonalityCalibrator();
