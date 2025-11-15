/**
 * OnlyFans AI User Memory System - Type Definitions
 * 
 * Core types and interfaces for the persistent memory system that enables
 * AI personality calibration, preference learning, and emotional state tracking.
 */

// ============================================================================
// CORE MEMORY TYPES
// ============================================================================

/**
 * Complete memory context for a fan, aggregating all memory data
 */
export interface MemoryContext {
  fanId: string;
  creatorId: string;
  recentMessages: ConversationMessage[];
  personalityProfile: PersonalityProfile;
  preferences: FanPreferences;
  emotionalState: EmotionalState;
  engagementMetrics: EngagementMetrics;
  lastInteraction: Date;
}

/**
 * A single conversation message with metadata
 */
export interface ConversationMessage {
  id: string;
  content: string;
  sender: 'fan' | 'creator' | 'ai';
  timestamp: Date;
  sentiment: 'positive' | 'negative' | 'neutral' | null;
  topics: string[];
  metadata: Record<string, any>;
}

/**
 * Interaction event for tracking and learning
 */
export interface InteractionEvent {
  fanId: string;
  creatorId: string;
  type: 'message' | 'purchase' | 'tip' | 'like' | 'view';
  content?: string;
  amount?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Memory statistics for a creator
 */
export interface MemoryStats {
  totalFans: number;
  fansWithMemory: number;
  totalMessages: number;
  totalInteractions: number;
  avgEngagementScore: number;
  calibratedProfiles: number;
  lastUpdated: Date;
}

// ============================================================================
// PERSONALITY TYPES
// ============================================================================

/**
 * AI personality profile calibrated for a specific fan
 */
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
}

/**
 * Feedback from an interaction used for calibration
 */
export interface InteractionFeedback {
  fanId: string;
  messageId: string;
  responseTime: number; // seconds
  fanEngaged: boolean; // did fan respond positively
  purchaseMade: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
}

/**
 * Optimal response style configuration
 */
export interface ResponseStyle {
  maxLength: number;
  emojiCount: number;
  tone: string;
  topics: string[];
  avoidTopics: string[];
}

// ============================================================================
// PREFERENCE TYPES
// ============================================================================

/**
 * Learned preferences for a fan
 */
export interface FanPreferences {
  fanId: string;
  contentPreferences: Record<string, PreferenceScore>;
  topicInterests: Record<string, number>;
  purchasePatterns: PurchasePattern[];
  communicationPreferences: CommunicationPreference;
  lastUpdated: Date;
}

/**
 * Preference score with confidence tracking
 */
export interface PreferenceScore {
  category: string;
  score: number; // 0-1
  confidence: number; // 0-1
  evidenceCount: number;
  lastInteraction: Date;
}

/**
 * Purchase behavior pattern
 */
export interface PurchasePattern {
  contentType: 'ppv' | 'tip' | 'custom';
  averageAmount: number;
  frequency: number; // purchases per month
  preferredDays: number[]; // 0-6 (Sunday-Saturday)
  preferredHours: number[]; // 0-23
}

/**
 * Communication preferences
 */
export interface CommunicationPreference {
  preferredResponseTime: 'immediate' | 'delayed' | 'flexible';
  messageFrequency: 'high' | 'medium' | 'low';
  preferredMessageLength: 'short' | 'medium' | 'long';
  likesEmojis: boolean;
  likesGifs: boolean;
}

/**
 * Content item for recommendations
 */
export interface ContentItem {
  id: string;
  type: 'ppv' | 'post' | 'custom';
  category: string;
  price: number;
  topics: string[];
  createdAt: Date;
}

/**
 * Content recommendation with scoring
 */
export interface ContentRecommendation {
  contentId: string;
  score: number; // 0-1
  reason: string;
  optimalTiming?: {
    day: number;
    hour: number;
  };
}

// ============================================================================
// EMOTIONAL STATE TYPES
// ============================================================================

/**
 * Emotional state tracking for a fan
 */
export interface EmotionalState {
  currentSentiment: 'positive' | 'negative' | 'neutral';
  sentimentHistory: SentimentDataPoint[];
  dominantEmotions: string[];
  engagementLevel: 'high' | 'medium' | 'low';
  lastPositiveInteraction: Date | null;
  lastNegativeInteraction: Date | null;
}

/**
 * Sentiment data point for history tracking
 */
export interface SentimentDataPoint {
  timestamp: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  intensity: number; // 0-1
}

/**
 * Emotional analysis result
 */
export interface EmotionalAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: Record<string, number>; // joy: 0.8, excitement: 0.6, etc.
  intensity: number; // 0-1
}

/**
 * Disengagement signal detection
 */
export interface DisengagementSignal {
  type: 'short_responses' | 'long_delays' | 'negative_sentiment' | 'reduced_frequency';
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  suggestedAction: string;
}

// ============================================================================
// ENGAGEMENT METRICS TYPES
// ============================================================================

/**
 * Engagement metrics for a fan
 */
export interface EngagementMetrics {
  fanId: string;
  creatorId: string;
  engagementScore: number; // 0-1
  totalMessages: number;
  totalPurchases: number;
  totalRevenue: number;
  avgResponseTimeSeconds: number | null;
  lastInteraction: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

/**
 * Fan memory database record
 */
export interface FanMemoryRecord {
  id: string;
  fan_id: string;
  creator_id: string;
  message_content: string;
  sender: 'fan' | 'creator' | 'ai';
  sentiment: 'positive' | 'negative' | 'neutral' | null;
  topics: string[];
  metadata: Record<string, any>;
  created_at: Date;
}

/**
 * Fan preferences database record
 */
export interface FanPreferencesRecord {
  id: string;
  fan_id: string;
  creator_id: string;
  content_preferences: Record<string, any>;
  topic_interests: Record<string, number>;
  purchase_patterns: any[];
  communication_preferences: Record<string, any>;
  last_updated: Date;
}

/**
 * Personality profile database record
 */
export interface PersonalityProfileRecord {
  id: string;
  fan_id: string;
  creator_id: string;
  tone: string;
  emoji_frequency: number;
  message_length_preference: string;
  punctuation_style: string;
  preferred_emojis: string[];
  response_speed: string;
  confidence_score: number;
  interaction_count: number;
  last_calibrated: Date;
}

/**
 * Engagement metrics database record
 */
export interface EngagementMetricsRecord {
  id: string;
  fan_id: string;
  creator_id: string;
  engagement_score: number;
  total_messages: number;
  total_purchases: number;
  total_revenue: number;
  avg_response_time_seconds: number | null;
  last_interaction: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Emotional state database record
 */
export interface EmotionalStateRecord {
  id: string;
  fan_id: string;
  creator_id: string;
  current_sentiment: string;
  sentiment_history: any[];
  dominant_emotions: string[];
  engagement_level: string;
  last_positive_interaction: Date | null;
  last_negative_interaction: Date | null;
  updated_at: Date;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Memory error types
 */
export enum MemoryErrorType {
  MEMORY_NOT_FOUND = 'MEMORY_NOT_FOUND',
  CACHE_UNAVAILABLE = 'CACHE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CALIBRATION_FAILED = 'CALIBRATION_FAILED',
  INVALID_DATA = 'INVALID_DATA',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

/**
 * Memory error class
 */
export class MemoryError extends Error {
  constructor(
    public type: MemoryErrorType,
    public message: string,
    public recoverable: boolean = true,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'MemoryError';
  }
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Memory system configuration
 */
export interface MemoryConfig {
  cache: {
    ttl: {
      messages: number; // seconds
      personality: number;
      preferences: number;
      engagement: number;
      emotion: number;
    };
    maxMessagesCached: number;
  };
  database: {
    connectionPoolSize: number;
    queryTimeout: number;
  };
  retention: {
    messageRetentionDays: number; // GDPR: 24 months = 730 days
  };
  performance: {
    maxBulkFans: number;
    calibrationThreshold: number; // min interactions before calibration
  };
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number; // milliseconds
  monitoringPeriod: number; // milliseconds
}
