/**
 * Azure Emotional State Synchronization Service
 * 
 * Manages emotional state changes and synchronizes with Memory Service.
 * 
 * Features:
 * - Emotional state change detection (>0.3 threshold)
 * - Memory Service update on state changes
 * - Emotional trend tracking
 * - Dominant emotion prioritization
 * 
 * Requirements: 4.4, 4.5
 */

import {
  AzureEmotionAnalyzer,
  type EmotionAnalysisResult,
  type EmotionDimension,
  type EmotionalState,
  type EmotionType,
} from './emotion-analyzer.azure';
import { AzureCostTrackingService } from './cost-tracking.service';

// ============================================================================
// TYPES
// ============================================================================

export interface EmotionalStateUpdate {
  fanId: string;
  creatorId: string;
  previousState: EmotionalState | null;
  newState: EmotionalState;
  changeDetected: boolean;
  changeType: 'significant' | 'minor' | 'none';
  timestamp: Date;
  correlationId: string;
}

export interface EmotionalContext {
  currentEmotion: EmotionDimension;
  recentEmotions: EmotionDimension[];
  trend: 'improving' | 'stable' | 'declining';
  dominantEmotionOverTime: EmotionType;
  averageIntensity: number;
  volatility: number; // 0-1, how much emotions fluctuate
}

export interface MemoryServiceUpdate {
  fanId: string;
  creatorId: string;
  emotionalContext: EmotionalContext;
  timestamp: Date;
  correlationId: string;
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class AzureEmotionalStateSync {
  private emotionAnalyzer: AzureEmotionAnalyzer;
  private costTracker: AzureCostTrackingService;
  private stateStore: Map<string, EmotionalState>;
  private readonly SIGNIFICANT_CHANGE_THRESHOLD = 0.3;
  private readonly HISTORY_SIZE = 20;
  private memoryServiceCallback?: (update: MemoryServiceUpdate) => Promise<void>;

  constructor() {
    this.emotionAnalyzer = new AzureEmotionAnalyzer();
    this.costTracker = new AzureCostTrackingService();
    this.stateStore = new Map();
  }

  /**
   * Register callback for Memory Service updates
   */
  onMemoryServiceUpdate(callback: (update: MemoryServiceUpdate) => Promise<void>): void {
    this.memoryServiceCallback = callback;
  }

  /**
   * Process a new message and update emotional state
   */
  async processMessage(
    message: string,
    messageId: string,
    fanId: string,
    creatorId: string
  ): Promise<EmotionalStateUpdate> {
    const correlationId = crypto.randomUUID();
    const stateKey = `${fanId}:${creatorId}`;

    console.log('[AzureEmotionalStateSync] Processing message', {
      fanId,
      creatorId,
      messageId,
      correlationId,
    });

    // Get previous state
    const previousState = this.stateStore.get(stateKey) || null;

    // Analyze emotion
    const analysisResult = await this.emotionAnalyzer.analyzeEmotion(
      message,
      messageId,
      {
        fanId,
        previousEmotions: previousState?.emotionHistory,
      }
    );

    // Build new state
    const newState = this.buildNewState(
      fanId,
      creatorId,
      analysisResult,
      previousState
    );

    // Detect change
    const changeDetected = this.emotionAnalyzer.detectSignificantChange(
      previousState?.currentEmotion || null,
      newState.currentEmotion
    );

    const changeType = this.classifyChange(previousState, newState);

    // Store new state
    this.stateStore.set(stateKey, newState);

    // Update Memory Service if significant change
    if (changeDetected && this.memoryServiceCallback) {
      const emotionalContext = this.buildEmotionalContext(newState);
      
      await this.memoryServiceCallback({
        fanId,
        creatorId,
        emotionalContext,
        timestamp: new Date(),
        correlationId,
      });

      console.log('[AzureEmotionalStateSync] Memory Service updated', {
        fanId,
        creatorId,
        changeType,
        dominantEmotion: newState.currentEmotion.name,
        correlationId,
      });
    }

    const update: EmotionalStateUpdate = {
      fanId,
      creatorId,
      previousState,
      newState,
      changeDetected,
      changeType,
      timestamp: new Date(),
      correlationId,
    };

    console.log('[AzureEmotionalStateSync] State update complete', {
      fanId,
      creatorId,
      changeDetected,
      changeType,
      trend: newState.trend,
      correlationId,
    });

    return update;
  }

  /**
   * Get current emotional state for a fan-creator pair
   */
  getEmotionalState(fanId: string, creatorId: string): EmotionalState | null {
    return this.stateStore.get(`${fanId}:${creatorId}`) || null;
  }

  /**
   * Get emotional context for response generation
   */
  getEmotionalContext(fanId: string, creatorId: string): EmotionalContext | null {
    const state = this.getEmotionalState(fanId, creatorId);
    if (!state) return null;

    return this.buildEmotionalContext(state);
  }

  /**
   * Get dominant emotion over time
   */
  getDominantEmotionOverTime(fanId: string, creatorId: string): EmotionType {
    const state = this.getEmotionalState(fanId, creatorId);
    if (!state || state.emotionHistory.length === 0) {
      return 'neutral' as EmotionType;
    }

    // Count emotion occurrences weighted by score
    const emotionScores: Record<string, number> = {};
    
    for (const emotion of state.emotionHistory) {
      emotionScores[emotion.name] = (emotionScores[emotion.name] || 0) + emotion.score;
    }

    // Find highest scoring emotion
    let dominantEmotion: EmotionType = 'neutral' as EmotionType;
    let maxScore = 0;

    for (const [emotion, score] of Object.entries(emotionScores)) {
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion as EmotionType;
      }
    }

    return dominantEmotion;
  }

  /**
   * Calculate emotional volatility
   */
  calculateVolatility(emotionHistory: EmotionDimension[]): number {
    if (emotionHistory.length < 2) return 0;

    let totalChange = 0;
    for (let i = 1; i < emotionHistory.length; i++) {
      const prev = emotionHistory[i - 1];
      const curr = emotionHistory[i];
      
      const scoreDiff = Math.abs(curr.score - prev.score);
      const intensityDiff = Math.abs(curr.intensity - prev.intensity);
      const emotionChanged = prev.name !== curr.name ? 0.5 : 0;
      
      totalChange += scoreDiff + intensityDiff + emotionChanged;
    }

    // Normalize to 0-1
    return Math.min(totalChange / (emotionHistory.length - 1) / 2, 1);
  }

  /**
   * Clear emotional state for a fan-creator pair
   */
  clearState(fanId: string, creatorId: string): void {
    this.stateStore.delete(`${fanId}:${creatorId}`);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private buildNewState(
    fanId: string,
    creatorId: string,
    analysisResult: EmotionAnalysisResult,
    previousState: EmotionalState | null
  ): EmotionalState {
    // Build emotion history
    const emotionHistory = previousState?.emotionHistory
      ? [...previousState.emotionHistory, analysisResult.dominantEmotion]
      : [analysisResult.dominantEmotion];

    // Trim history to max size
    if (emotionHistory.length > this.HISTORY_SIZE) {
      emotionHistory.splice(0, emotionHistory.length - this.HISTORY_SIZE);
    }

    // Calculate trend
    const trend = this.emotionAnalyzer.calculateTrend(emotionHistory);

    return {
      fanId,
      creatorId,
      currentEmotion: analysisResult.dominantEmotion,
      emotionHistory,
      trend,
      lastUpdated: new Date(),
    };
  }

  private buildEmotionalContext(state: EmotionalState): EmotionalContext {
    const recentEmotions = state.emotionHistory.slice(-5);
    const dominantEmotionOverTime = this.getDominantEmotionOverTime(
      state.fanId,
      state.creatorId
    );

    const averageIntensity =
      recentEmotions.length > 0
        ? recentEmotions.reduce((sum, e) => sum + e.intensity, 0) / recentEmotions.length
        : 0.5;

    const volatility = this.calculateVolatility(state.emotionHistory);

    return {
      currentEmotion: state.currentEmotion,
      recentEmotions,
      trend: state.trend,
      dominantEmotionOverTime,
      averageIntensity,
      volatility,
    };
  }

  private classifyChange(
    previousState: EmotionalState | null,
    newState: EmotionalState
  ): 'significant' | 'minor' | 'none' {
    if (!previousState) return 'significant';

    const prev = previousState.currentEmotion;
    const curr = newState.currentEmotion;

    const scoreDiff = Math.abs(curr.score - prev.score);
    const intensityDiff = Math.abs(curr.intensity - prev.intensity);
    const emotionChanged = prev.name !== curr.name;

    if (
      scoreDiff > this.SIGNIFICANT_CHANGE_THRESHOLD ||
      intensityDiff > this.SIGNIFICANT_CHANGE_THRESHOLD ||
      emotionChanged
    ) {
      return 'significant';
    }

    if (scoreDiff > 0.1 || intensityDiff > 0.1) {
      return 'minor';
    }

    return 'none';
  }
}

// Export singleton instance
export const azureEmotionalStateSync = new AzureEmotionalStateSync();
