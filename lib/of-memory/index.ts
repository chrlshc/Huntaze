/**
 * OnlyFans AI User Memory System
 * 
 * Main export file for the memory system
 */

// Types
export * from './types';

// Interfaces
export * from './interfaces';

// Utilities
export * from './utils';

// Re-export commonly used types for convenience
export type {
  MemoryContext,
  ConversationMessage,
  PersonalityProfile,
  FanPreferences,
  EmotionalState,
  EngagementMetrics,
  InteractionEvent,
  ResponseStyle,
  ContentRecommendation
} from './types';

export type {
  IUserMemoryService,
  IPersonalityCalibrator,
  IPreferenceLearningEngine,
  IEmotionAnalyzer,
  IMemoryRepository,
  ICacheManager
} from './interfaces';
