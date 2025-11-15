/**
 * OnlyFans AI User Memory System - Service Interfaces
 * 
 * Service interfaces defining the contracts for memory operations,
 * personality calibration, preference learning, and emotion analysis.
 */

import type {
  MemoryContext,
  MemoryStats,
  InteractionEvent,
  PersonalityProfile,
  InteractionFeedback,
  ResponseStyle,
  FanPreferences,
  PreferenceScore,
  ContentItem,
  ContentRecommendation,
  EmotionalAnalysis,
  EmotionalState,
  DisengagementSignal,
  ConversationMessage,
  FanMemoryRecord,
  FanPreferencesRecord,
  PersonalityProfileRecord,
  EngagementMetricsRecord,
  EmotionalStateRecord
} from './types';

// ============================================================================
// USER MEMORY SERVICE
// ============================================================================

/**
 * Main service interface for memory operations
 */
export interface IUserMemoryService {
  /**
   * Get complete memory context for a fan
   */
  getMemoryContext(fanId: string, creatorId: string): Promise<MemoryContext>;

  /**
   * Save a new interaction to memory
   */
  saveInteraction(interaction: InteractionEvent): Promise<void>;

  /**
   * Clear all memory for a fan (GDPR compliance)
   */
  clearMemory(fanId: string, creatorId: string): Promise<void>;

  /**
   * Get memories for multiple fans (bulk operation)
   */
  getMemoriesForFans(
    fanIds: string[],
    creatorId: string
  ): Promise<Map<string, MemoryContext>>;

  /**
   * Get engagement score for a fan
   */
  getEngagementScore(fanId: string, creatorId: string): Promise<number>;

  /**
   * Get memory statistics for a creator
   */
  getMemoryStats(creatorId: string): Promise<MemoryStats>;
}

// ============================================================================
// PERSONALITY CALIBRATOR
// ============================================================================

/**
 * Service interface for personality calibration
 */
export interface IPersonalityCalibrator {
  /**
   * Calibrate personality based on interaction history
   */
  calibratePersonality(
    fanId: string,
    interactionHistory: InteractionEvent[]
  ): Promise<PersonalityProfile>;

  /**
   * Adjust tone based on feedback
   */
  adjustTone(
    currentProfile: PersonalityProfile,
    feedback: InteractionFeedback
  ): PersonalityProfile;

  /**
   * Get optimal response style for a fan
   */
  getOptimalResponseStyle(
    fanId: string,
    context: MemoryContext
  ): ResponseStyle;

  /**
   * Update personality profile after interaction
   */
  updatePersonality(
    fanId: string,
    creatorId: string,
    feedback: InteractionFeedback
  ): Promise<PersonalityProfile>;
}

// ============================================================================
// PREFERENCE LEARNING ENGINE
// ============================================================================

/**
 * Service interface for preference learning
 */
export interface IPreferenceLearningEngine {
  /**
   * Learn from a new interaction
   */
  learnFromInteraction(interaction: InteractionEvent): Promise<void>;

  /**
   * Get predicted preferences for a fan
   */
  getPredictedPreferences(
    fanId: string,
    creatorId: string
  ): Promise<FanPreferences>;

  /**
   * Update preference score for a category
   */
  updatePreferenceScore(
    fanId: string,
    creatorId: string,
    category: string,
    delta: number
  ): Promise<void>;

  /**
   * Get content recommendations based on preferences
   */
  getContentRecommendations(
    fanId: string,
    creatorId: string,
    availableContent: ContentItem[]
  ): Promise<ContentRecommendation[]>;

  /**
   * Analyze purchase patterns
   */
  analyzePurchasePatterns(
    fanId: string,
    creatorId: string
  ): Promise<{
    preferredDays: number[];
    preferredHours: number[];
    averageAmount: number;
  }>;
}

// ============================================================================
// EMOTION ANALYZER
// ============================================================================

/**
 * Service interface for emotion analysis
 */
export interface IEmotionAnalyzer {
  /**
   * Analyze sentiment of a message
   */
  analyzeMessage(message: string): Promise<EmotionalAnalysis>;

  /**
   * Get current emotional state for a fan
   */
  getEmotionalState(
    fanId: string,
    creatorId: string,
    recentMessages: ConversationMessage[]
  ): Promise<EmotionalState>;

  /**
   * Detect disengagement signals
   */
  detectDisengagement(
    fanId: string,
    creatorId: string,
    context: MemoryContext
  ): Promise<DisengagementSignal | null>;

  /**
   * Update emotional state after interaction
   */
  updateEmotionalState(
    fanId: string,
    creatorId: string,
    sentiment: 'positive' | 'negative' | 'neutral',
    intensity: number
  ): Promise<void>;
}

// ============================================================================
// MEMORY REPOSITORY
// ============================================================================

/**
 * Repository interface for data persistence
 */
export interface IMemoryRepository {
  // Fan memories
  saveFanMemory(memory: Omit<FanMemoryRecord, 'id' | 'created_at'>): Promise<FanMemoryRecord>;
  getFanMemory(fanId: string, creatorId: string): Promise<FanMemoryRecord[]>;
  getRecentMessages(
    fanId: string,
    creatorId: string,
    limit: number
  ): Promise<ConversationMessage[]>;

  // Preferences
  savePreferences(preferences: Omit<FanPreferencesRecord, 'id'>): Promise<FanPreferencesRecord>;
  getPreferences(
    fanId: string,
    creatorId: string
  ): Promise<FanPreferencesRecord | null>;

  // Personality profiles
  savePersonalityProfile(
    profile: Omit<PersonalityProfileRecord, 'id'>
  ): Promise<PersonalityProfileRecord>;
  getPersonalityProfile(
    fanId: string,
    creatorId: string
  ): Promise<PersonalityProfileRecord | null>;

  // Engagement metrics
  saveEngagementMetrics(
    metrics: Omit<EngagementMetricsRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<EngagementMetricsRecord>;
  getEngagementMetrics(
    fanId: string,
    creatorId: string
  ): Promise<EngagementMetricsRecord | null>;
  updateEngagementMetrics(
    fanId: string,
    creatorId: string,
    updates: Partial<EngagementMetricsRecord>
  ): Promise<EngagementMetricsRecord>;

  // Emotional states
  saveEmotionalState(
    state: Omit<EmotionalStateRecord, 'id' | 'updated_at'>
  ): Promise<EmotionalStateRecord>;
  getEmotionalState(
    fanId: string,
    creatorId: string
  ): Promise<EmotionalStateRecord | null>;

  // Bulk operations
  bulkGetMemories(
    fanIds: string[],
    creatorId: string
  ): Promise<Map<string, FanMemoryRecord[]>>;

  // Cleanup (GDPR)
  deleteMemory(fanId: string, creatorId: string): Promise<void>;
  cleanupOldMemories(olderThan: Date): Promise<number>;

  // Export (GDPR)
  exportFanData(fanId: string, creatorId: string): Promise<{
    memories: FanMemoryRecord[];
    preferences: FanPreferencesRecord | null;
    personality: PersonalityProfileRecord | null;
    metrics: EngagementMetricsRecord | null;
    emotional: EmotionalStateRecord | null;
  }>;
}

// ============================================================================
// CACHE MANAGER
// ============================================================================

/**
 * Cache manager interface for Redis operations
 */
export interface ICacheManager {
  /**
   * Get cached memory context
   */
  getMemoryContext(fanId: string, creatorId: string): Promise<MemoryContext | null>;

  /**
   * Set memory context in cache
   */
  setMemoryContext(
    fanId: string,
    creatorId: string,
    context: MemoryContext,
    ttl: number
  ): Promise<void>;

  /**
   * Get cached messages
   */
  getMessages(fanId: string, creatorId: string): Promise<ConversationMessage[] | null>;

  /**
   * Set messages in cache
   */
  setMessages(
    fanId: string,
    creatorId: string,
    messages: ConversationMessage[],
    ttl: number
  ): Promise<void>;

  /**
   * Get cached personality profile
   */
  getPersonalityProfile(
    fanId: string,
    creatorId: string
  ): Promise<PersonalityProfile | null>;

  /**
   * Set personality profile in cache
   */
  setPersonalityProfile(
    fanId: string,
    creatorId: string,
    profile: PersonalityProfile,
    ttl: number
  ): Promise<void>;

  /**
   * Get cached preferences
   */
  getPreferences(fanId: string, creatorId: string): Promise<FanPreferences | null>;

  /**
   * Set preferences in cache
   */
  setPreferences(
    fanId: string,
    creatorId: string,
    preferences: FanPreferences,
    ttl: number
  ): Promise<void>;

  /**
   * Get cached engagement score
   */
  getEngagementScore(fanId: string, creatorId: string): Promise<number | null>;

  /**
   * Set engagement score in cache
   */
  setEngagementScore(
    fanId: string,
    creatorId: string,
    score: number,
    ttl: number
  ): Promise<void>;

  /**
   * Invalidate all cache for a fan
   */
  invalidateFanCache(fanId: string, creatorId: string): Promise<void>;

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): Promise<void>;

  /**
   * Generate cache key
   */
  generateKey(fanId: string, creatorId: string, type: string): string;
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

/**
 * Circuit breaker interface for resilience
 */
export interface ICircuitBreaker {
  /**
   * Execute function with circuit breaker protection
   */
  execute<T>(fn: () => Promise<T>): Promise<T>;

  /**
   * Get circuit breaker state
   */
  getState(): 'closed' | 'open' | 'half-open';

  /**
   * Reset circuit breaker
   */
  reset(): void;

  /**
   * Get failure count
   */
  getFailureCount(): number;
}
