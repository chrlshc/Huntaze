/**
 * Azure Preference Learning Engine
 * 
 * Updated PreferenceLearningEngine using Azure OpenAI for preference analysis.
 * 
 * Features:
 * - Azure OpenAI for preference analysis
 * - Preference scoring with confidence
 * - Content recommendation with Azure insights
 * - Purchase pattern analysis
 * - Optimal timing calculation
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { AzureOpenAIService } from './azure-openai.service';
import { CircuitBreaker, CircuitBreakerState } from './circuit-breaker';
import { AzureCostTrackingService } from './cost-tracking.service';
import type { GenerationOptions, ChatMessage } from './azure-openai.types';
import type { PersonalityProfile } from './personality-calibrator.azure';
import type { EmotionalContext } from './emotional-state-sync.azure';

// ============================================================================
// TYPES
// ============================================================================

export interface UserPreferences {
  fanId: string;
  creatorId: string;
  topicInterests: Record<string, number>; // topic -> score (0-1)
  contentTypePreferences: ContentTypePreference[];
  communicationPreferences: CommunicationPreferences;
  purchasePatterns: PurchasePatterns;
  optimalTiming: OptimalTiming;
  confidence: number;
  lastUpdated: Date;
}

export interface ContentTypePreference {
  type: 'photo' | 'video' | 'text' | 'audio' | 'ppv' | 'bundle';
  score: number; // 0-1
  engagementRate: number;
  purchaseRate: number;
}

export interface CommunicationPreferences {
  preferredTone: 'casual' | 'flirty' | 'professional' | 'playful';
  messageLength: 'short' | 'medium' | 'long';
  emojiUsage: 'none' | 'minimal' | 'moderate' | 'heavy';
  responseExpectation: 'immediate' | 'within_hour' | 'within_day' | 'flexible';
}

export interface PurchasePatterns {
  averageSpend: number;
  purchaseFrequency: 'rare' | 'occasional' | 'regular' | 'frequent';
  preferredPriceRange: { min: number; max: number };
  impulseScore: number; // 0-1, likelihood of impulse purchases
  bestDayOfWeek: number; // 0-6
  bestTimeOfDay: number; // 0-23
}

export interface OptimalTiming {
  bestEngagementHours: number[];
  bestEngagementDays: number[];
  responseTimePreference: number; // minutes
  activityPattern: 'morning' | 'afternoon' | 'evening' | 'night' | 'variable';
}

export interface ContentRecommendation {
  contentType: string;
  topic: string;
  suggestedPrice?: number;
  confidence: number;
  reasoning: string;
  timing: {
    bestTime: Date;
    urgency: 'low' | 'medium' | 'high';
  };
}

export interface PreferenceLearningResult {
  preferences: UserPreferences;
  recommendations: ContentRecommendation[];
  tokensUsed: number;
  latencyMs: number;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class PreferenceLearningError extends Error {
  constructor(
    message: string,
    public readonly code: PreferenceLearningErrorCode,
    public readonly fanId?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PreferenceLearningError';
  }
}

export enum PreferenceLearningErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class AzurePreferenceLearningEngine {
  private azureOpenAI: AzureOpenAIService;
  private circuitBreaker: CircuitBreaker;
  private costTracker: AzureCostTrackingService;
  private preferencesCache: Map<string, { preferences: UserPreferences; timestamp: number }>;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Use GPT-3.5 Turbo for cost efficiency
    this.azureOpenAI = new AzureOpenAIService('gpt-35-turbo-prod');
    
    this.circuitBreaker = new CircuitBreaker({
      name: 'azure-preference-learning',
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 120000,
    });

    this.costTracker = new AzureCostTrackingService();
    this.preferencesCache = new Map();
  }

  /**
   * Learn preferences from interaction history
   */
  async learnPreferences(
    fanId: string,
    creatorId: string,
    interactionHistory: InteractionData[],
    personalityProfile?: PersonalityProfile,
    emotionalContext?: EmotionalContext
  ): Promise<PreferenceLearningResult> {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();
    const cacheKey = `${fanId}:${creatorId}`;

    try {
      // Input validation
      if (!fanId || !creatorId) {
        throw new PreferenceLearningError(
          'fanId and creatorId are required',
          PreferenceLearningErrorCode.INVALID_INPUT,
          fanId
        );
      }

      // Check cache
      const cached = this.getCachedPreferences(cacheKey);
      if (cached && interactionHistory.length === 0) {
        return {
          preferences: cached,
          recommendations: [],
          tokensUsed: 0,
          latencyMs: Date.now() - startTime,
        };
      }

      console.log('[AzurePreferenceLearning] Learning preferences', {
        fanId,
        creatorId,
        interactionCount: interactionHistory.length,
        correlationId,
      });

      // Execute with circuit breaker
      const result = await this.circuitBreaker.execute(async () => {
        return await this.performLearning(
          fanId,
          creatorId,
          interactionHistory,
          personalityProfile,
          emotionalContext,
          correlationId
        );
      });

      // Cache preferences
      this.cachePreferences(cacheKey, result.preferences);

      // Track cost
      await this.costTracker.trackUsage({
        operation: 'preference_learning',
        deployment: 'gpt-35-turbo-prod',
        tokensInput: Math.floor(result.tokensUsed * 0.7),
        tokensOutput: Math.floor(result.tokensUsed * 0.3),
        accountId: fanId,
        correlationId,
      });

      console.log('[AzurePreferenceLearning] Learning completed', {
        fanId,
        creatorId,
        confidence: result.preferences.confidence,
        recommendationCount: result.recommendations.length,
        latencyMs: result.latencyMs,
        correlationId,
      });

      return result;

    } catch (error) {
      console.error('[AzurePreferenceLearning] Learning failed', {
        fanId,
        creatorId,
        error: error instanceof Error ? error.message : String(error),
        correlationId,
      });

      if (this.circuitBreaker.getState() === CircuitBreakerState.OPEN) {
        return {
          preferences: this.getDefaultPreferences(fanId, creatorId),
          recommendations: [],
          tokensUsed: 0,
          latencyMs: Date.now() - startTime,
        };
      }

      throw this.wrapError(error, fanId);
    }
  }

  /**
   * Generate content recommendations
   */
  async generateRecommendations(
    preferences: UserPreferences,
    emotionalContext?: EmotionalContext
  ): Promise<ContentRecommendation[]> {
    const correlationId = crypto.randomUUID();

    console.log('[AzurePreferenceLearning] Generating recommendations', {
      fanId: preferences.fanId,
      correlationId,
    });

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a content recommendation expert. Generate personalized content recommendations based on user preferences.

Output JSON array of recommendations:
[{
  "contentType": string,
  "topic": string,
  "suggestedPrice": number (optional),
  "confidence": number (0-1),
  "reasoning": string,
  "timing": { "urgency": "low" | "medium" | "high" }
}]

Consider:
- User's topic interests and engagement patterns
- Purchase history and price sensitivity
- Current emotional state if provided
- Optimal timing based on activity patterns`,
      },
      {
        role: 'user',
        content: `Generate 3 content recommendations for this user:

Preferences:
- Top interests: ${Object.entries(preferences.topicInterests)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([topic, score]) => `${topic} (${(score * 100).toFixed(0)}%)`)
          .join(', ')}
- Preferred content: ${preferences.contentTypePreferences
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((p) => p.type)
          .join(', ')}
- Purchase frequency: ${preferences.purchasePatterns.purchaseFrequency}
- Price range: $${preferences.purchasePatterns.preferredPriceRange.min}-$${preferences.purchasePatterns.preferredPriceRange.max}
${emotionalContext ? `- Current emotion: ${emotionalContext.currentEmotion.name} (${(emotionalContext.currentEmotion.intensity * 100).toFixed(0)}% intensity)` : ''}`,
      },
    ];

    const response = await this.azureOpenAI.chat(messages, {
      temperature: 0.5,
      maxTokens: 800,
      responseFormat: { type: 'json_object' },
    });

    try {
      const data = JSON.parse(response.text);
      const recommendations = Array.isArray(data) ? data : data.recommendations || [];
      
      return recommendations.map((rec: Record<string, unknown>) => ({
        contentType: String(rec.contentType || 'photo'),
        topic: String(rec.topic || 'general'),
        suggestedPrice: typeof rec.suggestedPrice === 'number' ? rec.suggestedPrice : undefined,
        confidence: this.clamp(Number(rec.confidence) || 0.5, 0, 1),
        reasoning: String(rec.reasoning || ''),
        timing: {
          bestTime: new Date(),
          urgency: (rec.timing as Record<string, unknown>)?.urgency as 'low' | 'medium' | 'high' || 'medium',
        },
      }));
    } catch {
      return [];
    }
  }

  /**
   * Calculate optimal timing for content
   */
  calculateOptimalTiming(preferences: UserPreferences): OptimalTiming {
    return preferences.optimalTiming;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async performLearning(
    fanId: string,
    creatorId: string,
    interactionHistory: InteractionData[],
    personalityProfile: PersonalityProfile | undefined,
    emotionalContext: EmotionalContext | undefined,
    correlationId: string
  ): Promise<PreferenceLearningResult> {
    const startTime = Date.now();

    // Analyze interactions locally first
    const localAnalysis = this.analyzeInteractionsLocally(interactionHistory);

    // Use Azure OpenAI for deeper insights if enough data
    let aiInsights: Partial<UserPreferences> = {};
    let tokensUsed = 0;

    if (interactionHistory.length >= 5) {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `Analyze user interaction patterns and extract preferences. Output JSON:
{
  "topicInterests": { "topic": score },
  "communicationPreferences": { "preferredTone": string, "messageLength": string, "emojiUsage": string },
  "purchasePatterns": { "impulseScore": number, "purchaseFrequency": string },
  "confidence": number
}`,
        },
        {
          role: 'user',
          content: `Analyze these interactions:
- Messages: ${localAnalysis.messageCount}
- Purchases: ${localAnalysis.purchaseCount}
- Avg message length: ${localAnalysis.avgMessageLength}
- Emoji usage: ${localAnalysis.emojiFrequency}
- Topics mentioned: ${localAnalysis.topics.join(', ')}
${personalityProfile ? `- Personality: ${personalityProfile.tone}` : ''}
${emotionalContext ? `- Emotional trend: ${emotionalContext.trend}` : ''}`,
        },
      ];

      const response = await this.azureOpenAI.chat(messages, {
        temperature: 0.3,
        maxTokens: 600,
        responseFormat: { type: 'json_object' },
      });

      tokensUsed = response.usage.totalTokens;

      try {
        aiInsights = JSON.parse(response.text);
      } catch {
        // Use local analysis only
      }
    }

    // Merge local and AI analysis
    const preferences = this.mergeAnalysis(
      fanId,
      creatorId,
      localAnalysis,
      aiInsights
    );

    // Generate recommendations
    const recommendations = await this.generateRecommendations(preferences, emotionalContext);

    return {
      preferences,
      recommendations,
      tokensUsed,
      latencyMs: Date.now() - startTime,
    };
  }

  private analyzeInteractionsLocally(interactions: InteractionData[]): LocalAnalysis {
    const messages = interactions.filter((i) => i.type === 'message');
    const purchases = interactions.filter((i) => i.type === 'purchase');

    const messageLengths = messages
      .filter((m) => m.content)
      .map((m) => m.content!.length);

    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu;
    const emojiCounts = messages
      .filter((m) => m.content)
      .map((m) => (m.content!.match(emojiRegex) || []).length);

    // Extract topics (simplified)
    const topics = new Set<string>();
    const topicKeywords: Record<string, string[]> = {
      fitness: ['gym', 'workout', 'exercise', 'fit'],
      fashion: ['outfit', 'dress', 'style', 'clothes'],
      travel: ['trip', 'vacation', 'travel', 'beach'],
      food: ['food', 'eat', 'dinner', 'lunch'],
      gaming: ['game', 'play', 'stream', 'gaming'],
    };

    for (const msg of messages) {
      if (!msg.content) continue;
      const lower = msg.content.toLowerCase();
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some((kw) => lower.includes(kw))) {
          topics.add(topic);
        }
      }
    }

    return {
      messageCount: messages.length,
      purchaseCount: purchases.length,
      avgMessageLength:
        messageLengths.length > 0
          ? messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length
          : 0,
      emojiFrequency:
        emojiCounts.length > 0
          ? emojiCounts.reduce((a, b) => a + b, 0) / emojiCounts.length
          : 0,
      topics: Array.from(topics),
      totalSpend: purchases.reduce((sum, p) => sum + (p.amount || 0), 0),
    };
  }

  private mergeAnalysis(
    fanId: string,
    creatorId: string,
    local: LocalAnalysis,
    ai: Partial<UserPreferences>
  ): UserPreferences {
    const topicInterests: Record<string, number> = ai.topicInterests || {};
    for (const topic of local.topics) {
      topicInterests[topic] = Math.max(topicInterests[topic] || 0, 0.6);
    }

    return {
      fanId,
      creatorId,
      topicInterests,
      contentTypePreferences: [
        { type: 'photo', score: 0.8, engagementRate: 0.7, purchaseRate: 0.3 },
        { type: 'video', score: 0.6, engagementRate: 0.5, purchaseRate: 0.4 },
        { type: 'text', score: 0.4, engagementRate: 0.3, purchaseRate: 0.1 },
      ],
      communicationPreferences: {
        preferredTone: (ai.communicationPreferences?.preferredTone as CommunicationPreferences['preferredTone']) || 'casual',
        messageLength: local.avgMessageLength > 100 ? 'long' : local.avgMessageLength > 50 ? 'medium' : 'short',
        emojiUsage: local.emojiFrequency > 2 ? 'heavy' : local.emojiFrequency > 0.5 ? 'moderate' : 'minimal',
        responseExpectation: 'within_hour',
      },
      purchasePatterns: {
        averageSpend: local.purchaseCount > 0 ? local.totalSpend / local.purchaseCount : 0,
        purchaseFrequency: local.purchaseCount > 10 ? 'frequent' : local.purchaseCount > 5 ? 'regular' : local.purchaseCount > 0 ? 'occasional' : 'rare',
        preferredPriceRange: { min: 5, max: 50 },
        impulseScore: Number(ai.purchasePatterns?.impulseScore) || 0.5,
        bestDayOfWeek: 5, // Friday
        bestTimeOfDay: 20, // 8 PM
      },
      optimalTiming: {
        bestEngagementHours: [19, 20, 21, 22],
        bestEngagementDays: [4, 5, 6], // Thu, Fri, Sat
        responseTimePreference: 30,
        activityPattern: 'evening',
      },
      confidence: Number(ai.confidence) || (local.messageCount > 10 ? 0.7 : 0.4),
      lastUpdated: new Date(),
    };
  }

  private getCachedPreferences(key: string): UserPreferences | null {
    const cached = this.preferencesCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.preferences;
    }
    return null;
  }

  private cachePreferences(key: string, preferences: UserPreferences): void {
    this.preferencesCache.set(key, { preferences, timestamp: Date.now() });
  }

  private getDefaultPreferences(fanId: string, creatorId: string): UserPreferences {
    return {
      fanId,
      creatorId,
      topicInterests: {},
      contentTypePreferences: [
        { type: 'photo', score: 0.5, engagementRate: 0.5, purchaseRate: 0.2 },
      ],
      communicationPreferences: {
        preferredTone: 'casual',
        messageLength: 'medium',
        emojiUsage: 'moderate',
        responseExpectation: 'within_hour',
      },
      purchasePatterns: {
        averageSpend: 0,
        purchaseFrequency: 'rare',
        preferredPriceRange: { min: 5, max: 25 },
        impulseScore: 0.3,
        bestDayOfWeek: 5,
        bestTimeOfDay: 20,
      },
      optimalTiming: {
        bestEngagementHours: [19, 20, 21],
        bestEngagementDays: [5, 6],
        responseTimePreference: 60,
        activityPattern: 'evening',
      },
      confidence: 0.3,
      lastUpdated: new Date(),
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private wrapError(error: unknown, fanId: string): PreferenceLearningError {
    if (error instanceof PreferenceLearningError) return error;
    return new PreferenceLearningError(
      error instanceof Error ? error.message : 'Unknown error',
      PreferenceLearningErrorCode.ANALYSIS_FAILED,
      fanId,
      error instanceof Error ? error : undefined
    );
  }
}

// Helper types
interface InteractionData {
  type: 'message' | 'purchase' | 'tip' | 'view';
  content?: string;
  amount?: number;
  timestamp: Date;
}

interface LocalAnalysis {
  messageCount: number;
  purchaseCount: number;
  avgMessageLength: number;
  emojiFrequency: number;
  topics: string[];
  totalSpend: number;
}

// Export singleton
export const azurePreferenceLearningEngine = new AzurePreferenceLearningEngine();
