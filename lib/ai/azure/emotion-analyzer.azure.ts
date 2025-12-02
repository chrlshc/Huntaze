/**
 * Azure OpenAI Emotion Analyzer
 * 
 * Migrated EmotionAnalyzer service using Azure OpenAI GPT-3.5 Turbo
 * for cost-efficient multi-dimensional emotion detection.
 * 
 * Features:
 * - GPT-3.5 Turbo for cost efficiency
 * - Multi-dimensional emotion detection
 * - Sentiment analysis (positive/neutral/negative)
 * - Emotion intensity scoring (0-1)
 * - 2-minute emotion caching with TTL
 * - Circuit breaker integration
 * 
 * Requirements: 4.2
 */

import { AzureOpenAIService } from './azure-openai.service';
import { CircuitBreaker, CircuitBreakerState } from './circuit-breaker';
import { AzureCostTrackingService } from './cost-tracking.service';
import type { GenerationOptions, ChatMessage } from './azure-openai.types';

// ============================================================================
// TYPES
// ============================================================================

export interface EmotionAnalysisResult {
  messageId: string;
  timestamp: Date;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1 to 1
  emotions: EmotionDimension[];
  dominantEmotion: EmotionDimension;
  intensity: number; // 0-1 overall intensity
  confidence: number; // 0-1
  tokensUsed: number;
  latencyMs: number;
}

export interface EmotionDimension {
  name: EmotionType;
  score: number; // 0-1
  intensity: number; // 0-1
}

export type EmotionType =
  | 'joy'
  | 'sadness'
  | 'anger'
  | 'fear'
  | 'surprise'
  | 'disgust'
  | 'trust'
  | 'anticipation'
  | 'love'
  | 'excitement'
  | 'frustration'
  | 'curiosity';

export interface EmotionalState {
  fanId: string;
  creatorId: string;
  currentEmotion: EmotionDimension;
  emotionHistory: EmotionDimension[];
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class EmotionAnalysisError extends Error {
  constructor(
    message: string,
    public readonly code: EmotionAnalysisErrorCode,
    public readonly messageId?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'EmotionAnalysisError';
  }
}

export enum EmotionAnalysisErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  AZURE_API_ERROR = 'AZURE_API_ERROR',
  JSON_PARSE_ERROR = 'JSON_PARSE_ERROR',
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class AzureEmotionAnalyzer {
  private azureOpenAI: AzureOpenAIService;
  private circuitBreaker: CircuitBreaker;
  private costTracker: AzureCostTrackingService;
  private emotionCache: Map<string, { result: EmotionAnalysisResult; timestamp: number }>;
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly SIGNIFICANT_CHANGE_THRESHOLD = 0.3;

  constructor() {
    // Use GPT-3.5 Turbo for cost efficiency
    this.azureOpenAI = new AzureOpenAIService('gpt-35-turbo-prod');
    
    this.circuitBreaker = new CircuitBreaker({
      name: 'azure-emotion-analyzer',
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 120000,
    });

    this.costTracker = new AzureCostTrackingService();
    this.emotionCache = new Map();
  }

  /**
   * Analyze emotions in a message using Azure OpenAI
   */
  async analyzeEmotion(
    message: string,
    messageId: string,
    context?: { fanId?: string; previousEmotions?: EmotionDimension[] }
  ): Promise<EmotionAnalysisResult> {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Input validation
      if (!message || typeof message !== 'string') {
        throw new EmotionAnalysisError(
          'Invalid message provided',
          EmotionAnalysisErrorCode.INVALID_INPUT,
          messageId
        );
      }

      if (!messageId) {
        throw new EmotionAnalysisError(
          'messageId is required',
          EmotionAnalysisErrorCode.INVALID_INPUT
        );
      }

      // Check cache
      const cached = this.getCachedResult(messageId);
      if (cached) {
        console.log('[AzureEmotionAnalyzer] Using cached result', {
          messageId,
          correlationId,
        });
        return cached;
      }

      console.log('[AzureEmotionAnalyzer] Analyzing emotion', {
        messageId,
        messageLength: message.length,
        correlationId,
      });

      // Execute with circuit breaker
      const result = await this.circuitBreaker.execute(async () => {
        return await this.performAnalysis(message, messageId, context, correlationId);
      });

      // Cache the result
      this.cacheResult(messageId, result);

      // Track cost
      await this.costTracker.trackUsage({
        operation: 'emotion_analysis',
        deployment: 'gpt-35-turbo-prod',
        tokensInput: Math.floor(result.tokensUsed * 0.7),
        tokensOutput: Math.floor(result.tokensUsed * 0.3),
        accountId: context?.fanId || 'unknown',
        correlationId,
      });

      console.log('[AzureEmotionAnalyzer] Analysis completed', {
        messageId,
        sentiment: result.sentiment,
        dominantEmotion: result.dominantEmotion.name,
        intensity: result.intensity,
        latencyMs: result.latencyMs,
        correlationId,
      });

      return result;

    } catch (error) {
      console.error('[AzureEmotionAnalyzer] Analysis failed', {
        messageId,
        error: error instanceof Error ? error.message : String(error),
        correlationId,
      });

      if (this.circuitBreaker.getState() === CircuitBreakerState.OPEN) {
        return this.getDefaultResult(messageId, startTime);
      }

      throw this.wrapError(error, messageId);
    }
  }

  /**
   * Perform the actual emotion analysis
   */
  private async performAnalysis(
    message: string,
    messageId: string,
    context: { fanId?: string; previousEmotions?: EmotionDimension[] } | undefined,
    correlationId: string
  ): Promise<EmotionAnalysisResult> {
    const startTime = Date.now();

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an expert emotion analyst. Analyze the emotional content of messages and return structured JSON.

Analyze for these emotions: joy, sadness, anger, fear, surprise, disgust, trust, anticipation, love, excitement, frustration, curiosity.

Output JSON schema:
{
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentScore": number (-1 to 1),
  "emotions": [{ "name": string, "score": number (0-1), "intensity": number (0-1) }],
  "overallIntensity": number (0-1),
  "confidence": number (0-1)
}

Rules:
- Include only emotions with score > 0.1
- Sort emotions by score descending
- sentimentScore: -1 = very negative, 0 = neutral, 1 = very positive
- Be precise with intensity levels`,
      },
      {
        role: 'user',
        content: `Analyze the emotions in this message:\n\n"${message}"${
          context?.previousEmotions?.length
            ? `\n\nPrevious emotional context: ${JSON.stringify(context.previousEmotions.slice(0, 3))}`
            : ''
        }`,
      },
    ];

    const options: GenerationOptions = {
      temperature: 0.2,
      maxTokens: 500,
      responseFormat: { type: 'json_object' },
    };

    const response = await this.azureOpenAI.chat(messages, options);
    const latencyMs = Date.now() - startTime;

    // Parse response
    let analysisData: {
      sentiment: 'positive' | 'neutral' | 'negative';
      sentimentScore: number;
      emotions: Array<{ name: string; score: number; intensity: number }>;
      overallIntensity: number;
      confidence: number;
    };

    try {
      analysisData = JSON.parse(response.text);
    } catch (parseError) {
      throw new EmotionAnalysisError(
        'Failed to parse emotion analysis response',
        EmotionAnalysisErrorCode.JSON_PARSE_ERROR,
        messageId,
        parseError instanceof Error ? parseError : undefined
      );
    }

    // Build emotion dimensions
    const emotions: EmotionDimension[] = (analysisData.emotions || [])
      .filter((e) => e.score > 0.1)
      .map((e) => ({
        name: e.name as EmotionType,
        score: this.clamp(e.score, 0, 1),
        intensity: this.clamp(e.intensity, 0, 1),
      }))
      .sort((a, b) => b.score - a.score);

    // Determine dominant emotion
    const dominantEmotion = emotions[0] || {
      name: 'neutral' as EmotionType,
      score: 0.5,
      intensity: 0.3,
    };

    return {
      messageId,
      timestamp: new Date(),
      sentiment: analysisData.sentiment || 'neutral',
      sentimentScore: this.clamp(analysisData.sentimentScore || 0, -1, 1),
      emotions,
      dominantEmotion,
      intensity: this.clamp(analysisData.overallIntensity || 0.5, 0, 1),
      confidence: this.clamp(analysisData.confidence || 0.7, 0, 1),
      tokensUsed: response.usage.totalTokens,
      latencyMs,
    };
  }

  /**
   * Detect significant emotional state change
   */
  detectSignificantChange(
    previousState: EmotionDimension | null,
    currentState: EmotionDimension
  ): boolean {
    if (!previousState) return true;

    const scoreDiff = Math.abs(currentState.score - previousState.score);
    const intensityDiff = Math.abs(currentState.intensity - previousState.intensity);
    const emotionChanged = previousState.name !== currentState.name;

    return (
      scoreDiff > this.SIGNIFICANT_CHANGE_THRESHOLD ||
      intensityDiff > this.SIGNIFICANT_CHANGE_THRESHOLD ||
      emotionChanged
    );
  }

  /**
   * Calculate emotional trend
   */
  calculateTrend(emotionHistory: EmotionDimension[]): 'improving' | 'stable' | 'declining' {
    if (emotionHistory.length < 2) return 'stable';

    const recentEmotions = emotionHistory.slice(-5);
    const positiveEmotions = ['joy', 'love', 'excitement', 'trust', 'anticipation'];
    
    const scores = recentEmotions.map((e) =>
      positiveEmotions.includes(e.name) ? e.score : -e.score
    );

    const avgFirst = scores.slice(0, Math.floor(scores.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(scores.length / 2);
    const avgSecond = scores.slice(Math.floor(scores.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(scores.length / 2);

    const diff = avgSecond - avgFirst;

    if (diff > 0.15) return 'improving';
    if (diff < -0.15) return 'declining';
    return 'stable';
  }

  /**
   * Get dominant emotion from multiple emotions
   */
  getDominantEmotion(emotions: EmotionDimension[]): EmotionDimension {
    if (emotions.length === 0) {
      return { name: 'neutral' as EmotionType, score: 0.5, intensity: 0.3 };
    }

    // Sort by score * intensity for weighted dominance
    const sorted = [...emotions].sort(
      (a, b) => b.score * b.intensity - a.score * a.intensity
    );

    return sorted[0];
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getCachedResult(messageId: string): EmotionAnalysisResult | null {
    const cached = this.emotionCache.get(messageId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    return null;
  }

  private cacheResult(messageId: string, result: EmotionAnalysisResult): void {
    this.emotionCache.set(messageId, { result, timestamp: Date.now() });
    
    // Clean old entries
    if (this.emotionCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of this.emotionCache.entries()) {
        if (now - value.timestamp > this.CACHE_TTL) {
          this.emotionCache.delete(key);
        }
      }
    }
  }

  private getDefaultResult(messageId: string, startTime: number): EmotionAnalysisResult {
    return {
      messageId,
      timestamp: new Date(),
      sentiment: 'neutral',
      sentimentScore: 0,
      emotions: [{ name: 'neutral' as EmotionType, score: 0.5, intensity: 0.3 }],
      dominantEmotion: { name: 'neutral' as EmotionType, score: 0.5, intensity: 0.3 },
      intensity: 0.3,
      confidence: 0.3,
      tokensUsed: 0,
      latencyMs: Date.now() - startTime,
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private wrapError(error: unknown, messageId: string): EmotionAnalysisError {
    if (error instanceof EmotionAnalysisError) {
      return error;
    }

    return new EmotionAnalysisError(
      error instanceof Error ? error.message : 'Unknown analysis error',
      EmotionAnalysisErrorCode.ANALYSIS_FAILED,
      messageId,
      error instanceof Error ? error : undefined
    );
  }
}

// Export singleton instance
export const azureEmotionAnalyzer = new AzureEmotionAnalyzer();
