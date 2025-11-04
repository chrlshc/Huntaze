// Smart Onboarding System - Database Configuration and Schemas

export const SMART_ONBOARDING_TABLES = {
  // Core tables
  USER_PROFILES: 'smart_onboarding_user_profiles',
  ONBOARDING_JOURNEYS: 'smart_onboarding_journeys',
  ONBOARDING_STEPS: 'smart_onboarding_steps',
  LEARNING_PATHS: 'smart_onboarding_learning_paths',
  
  // Behavioral analytics tables
  BEHAVIOR_EVENTS: 'smart_onboarding_behavior_events',
  INTERACTION_DATA: 'smart_onboarding_interaction_data',
  ENGAGEMENT_METRICS: 'smart_onboarding_engagement_metrics',
  STRUGGLE_INDICATORS: 'smart_onboarding_struggle_indicators',
  
  // ML and AI tables
  USER_PERSONAS: 'smart_onboarding_user_personas',
  PREDICTION_MODELS: 'smart_onboarding_prediction_models',
  MODEL_TRAINING_DATA: 'smart_onboarding_model_training_data',
  SUCCESS_PREDICTIONS: 'smart_onboarding_success_predictions',
  
  // Intervention tables
  INTERVENTIONS: 'smart_onboarding_interventions',
  INTERVENTION_OUTCOMES: 'smart_onboarding_intervention_outcomes',
  HELP_CONTENT: 'smart_onboarding_help_content',
  ESCALATION_TICKETS: 'smart_onboarding_escalation_tickets',
  
  // Content and personalization tables
  CONTENT_VARIATIONS: 'smart_onboarding_content_variations',
  PERSONALIZED_CONTENT: 'smart_onboarding_personalized_content',
  CONTENT_RECOMMENDATIONS: 'smart_onboarding_content_recommendations',
  ADAPTATION_HISTORY: 'smart_onboarding_adaptation_history',
  
  // Analytics and reporting tables
  BEHAVIORAL_INSIGHTS: 'smart_onboarding_behavioral_insights',
  PATH_PERFORMANCE: 'smart_onboarding_path_performance',
  EXPERIMENT_RESULTS: 'smart_onboarding_experiment_results',
  SYSTEM_METRICS: 'smart_onboarding_system_metrics'
} as const;

export const DATABASE_INDEXES = {
  // Performance indexes for real-time queries
  BEHAVIOR_EVENTS_USER_TIME: 'idx_behavior_events_user_timestamp',
  ENGAGEMENT_METRICS_USER_TIME: 'idx_engagement_metrics_user_timestamp',
  INTERVENTIONS_USER_STATUS: 'idx_interventions_user_status',
  JOURNEYS_USER_STATUS: 'idx_journeys_user_status',
  
  // ML model indexes
  PREDICTIONS_USER_TIME: 'idx_predictions_user_timestamp',
  PERSONAS_USER_CONFIDENCE: 'idx_personas_user_confidence',
  
  // Analytics indexes
  PATH_PERFORMANCE_TIME: 'idx_path_performance_timestamp',
  SYSTEM_METRICS_TIME: 'idx_system_metrics_timestamp'
} as const;

export const CACHE_KEYS = {
  // User-specific cache keys
  USER_PROFILE: (userId: string) => `smart_onboarding:user_profile:${userId}`,
  USER_JOURNEY: (userId: string) => `smart_onboarding:user_journey:${userId}`,
  USER_PERSONA: (userId: string) => `smart_onboarding:user_persona:${userId}`,
  ENGAGEMENT_SCORE: (userId: string) => `smart_onboarding:engagement_score:${userId}`,
  
  // Content cache keys
  LEARNING_PATH: (pathId: string) => `smart_onboarding:learning_path:${pathId}`,
  STEP_CONTENT: (stepId: string) => `smart_onboarding:step_content:${stepId}`,
  CONTENT_RECOMMENDATIONS: (userId: string, stepId: string) => 
    `smart_onboarding:content_recommendations:${userId}:${stepId}`,
  
  // ML model cache keys
  MODEL_PREDICTIONS: (userId: string, modelType: string) => 
    `smart_onboarding:predictions:${modelType}:${userId}`,
  SUCCESS_PREDICTION: (userId: string) => `smart_onboarding:success_prediction:${userId}`,
  
  // System cache keys
  SYSTEM_METRICS: 'smart_onboarding:system_metrics',
  ACTIVE_EXPERIMENTS: 'smart_onboarding:active_experiments',
  MODEL_PERFORMANCE: (modelId: string) => `smart_onboarding:model_performance:${modelId}`
} as const;

export const CACHE_TTL = {
  // Short-term cache (real-time data)
  ENGAGEMENT_SCORE: 60, // 1 minute
  BEHAVIOR_EVENTS: 300, // 5 minutes
  REAL_TIME_METRICS: 30, // 30 seconds
  
  // Medium-term cache (session data)
  USER_JOURNEY: 1800, // 30 minutes
  CONTENT_RECOMMENDATIONS: 900, // 15 minutes
  INTERVENTION_PLANS: 600, // 10 minutes
  
  // Long-term cache (stable data)
  USER_PROFILE: 3600, // 1 hour
  USER_PERSONA: 7200, // 2 hours
  LEARNING_PATH: 14400, // 4 hours
  STEP_CONTENT: 21600, // 6 hours
  
  // ML model cache
  MODEL_PREDICTIONS: 1800, // 30 minutes
  SUCCESS_PREDICTION: 3600, // 1 hour
  MODEL_PERFORMANCE: 86400, // 24 hours
  
  // System cache
  SYSTEM_METRICS: 300, // 5 minutes
  ACTIVE_EXPERIMENTS: 3600 // 1 hour
} as const;

export const WEBSOCKET_EVENTS = {
  // User journey events
  JOURNEY_STARTED: 'journey_started',
  STEP_STARTED: 'step_started',
  STEP_COMPLETED: 'step_completed',
  JOURNEY_COMPLETED: 'journey_completed',
  JOURNEY_PAUSED: 'journey_paused',
  JOURNEY_RESUMED: 'journey_resumed',
  
  // Engagement events
  ENGAGEMENT_CHANGED: 'engagement_changed',
  ENGAGEMENT_ALERT: 'engagement_alert',
  STRUGGLE_DETECTED: 'struggle_detected',
  
  // Intervention events
  INTERVENTION_TRIGGERED: 'intervention_triggered',
  INTERVENTION_DELIVERED: 'intervention_delivered',
  INTERVENTION_COMPLETED: 'intervention_completed',
  HELP_REQUESTED: 'help_requested',
  
  // Content events
  CONTENT_ADAPTED: 'content_adapted',
  CONTENT_RECOMMENDATION: 'content_recommendation',
  PATH_OPTIMIZED: 'path_optimized',
  
  // System events
  MODEL_UPDATED: 'model_updated',
  PERFORMANCE_ALERT: 'performance_alert',
  SYSTEM_HEALTH: 'system_health',
  EXPERIMENT_STARTED: 'experiment_started',
  EXPERIMENT_COMPLETED: 'experiment_completed'
} as const;

export const ML_MODEL_TYPES = {
  USER_PERSONA_CLASSIFIER: 'user_persona_classifier',
  ENGAGEMENT_PREDICTOR: 'engagement_predictor',
  SUCCESS_PREDICTOR: 'success_predictor',
  STRUGGLE_DETECTOR: 'struggle_detector',
  CONTENT_RECOMMENDER: 'content_recommender',
  PATH_OPTIMIZER: 'path_optimizer',
  INTERVENTION_SELECTOR: 'intervention_selector',
  PROFICIENCY_ASSESSOR: 'proficiency_assessor'
} as const;

export const PERFORMANCE_THRESHOLDS = {
  // Response time thresholds (milliseconds)
  EVENT_PROCESSING: 100,
  ML_PREDICTION: 2000,
  INTERVENTION_TRIGGER: 3000,
  CONTENT_ADAPTATION: 1000,
  
  // Engagement thresholds
  LOW_ENGAGEMENT: 40,
  MEDIUM_ENGAGEMENT: 60,
  HIGH_ENGAGEMENT: 80,
  
  // Success prediction thresholds
  LOW_SUCCESS_PROBABILITY: 30,
  MEDIUM_SUCCESS_PROBABILITY: 70,
  HIGH_SUCCESS_PROBABILITY: 85,
  
  // Struggle detection thresholds
  STRUGGLE_TIME_THRESHOLD: 15000, // 15 seconds
  ERROR_FREQUENCY_THRESHOLD: 3,
  HESITATION_THRESHOLD: 5000, // 5 seconds
  
  // System performance thresholds
  MAX_MEMORY_USAGE: 0.8, // 80%
  MAX_CPU_USAGE: 0.7, // 70%
  MIN_CACHE_HIT_RATE: 0.85, // 85%
  MAX_ERROR_RATE: 0.01 // 1%
} as const;

export const FEATURE_FLAGS = {
  // Core features
  SMART_ONBOARDING_ENABLED: 'smart_onboarding_enabled',
  BEHAVIORAL_ANALYTICS: 'behavioral_analytics_enabled',
  ML_PERSONALIZATION: 'ml_personalization_enabled',
  REAL_TIME_ADAPTATION: 'real_time_adaptation_enabled',
  
  // Advanced features
  PREDICTIVE_INTERVENTIONS: 'predictive_interventions_enabled',
  DYNAMIC_CONTENT_ADAPTATION: 'dynamic_content_adaptation_enabled',
  ADVANCED_ANALYTICS: 'advanced_analytics_enabled',
  A_B_TESTING: 'ab_testing_enabled',
  
  // Experimental features
  FEDERATED_LEARNING: 'federated_learning_enabled',
  ADVANCED_NLP: 'advanced_nlp_enabled',
  COMPUTER_VISION: 'computer_vision_enabled',
  VOICE_INTERACTION: 'voice_interaction_enabled'
} as const;

export const API_ENDPOINTS = {
  // Core onboarding endpoints
  INITIALIZE_JOURNEY: '/api/smart-onboarding/journey/initialize',
  UPDATE_PROGRESS: '/api/smart-onboarding/journey/progress',
  GET_NEXT_STEP: '/api/smart-onboarding/journey/next-step',
  COMPLETE_JOURNEY: '/api/smart-onboarding/journey/complete',
  
  // Behavioral analytics endpoints
  TRACK_INTERACTION: '/api/smart-onboarding/analytics/track',
  GET_ENGAGEMENT: '/api/smart-onboarding/analytics/engagement',
  GET_INSIGHTS: '/api/smart-onboarding/analytics/insights',
  
  // ML and AI endpoints
  GET_PERSONA: '/api/smart-onboarding/ml/persona',
  GET_PREDICTIONS: '/api/smart-onboarding/ml/predictions',
  GET_RECOMMENDATIONS: '/api/smart-onboarding/ml/recommendations',
  UPDATE_MODEL: '/api/smart-onboarding/ml/model/update',
  
  // Intervention endpoints
  TRIGGER_INTERVENTION: '/api/smart-onboarding/intervention/trigger',
  GET_HELP: '/api/smart-onboarding/intervention/help',
  ESCALATE_ISSUE: '/api/smart-onboarding/intervention/escalate',
  
  // Content endpoints
  ADAPT_CONTENT: '/api/smart-onboarding/content/adapt',
  GET_VARIATIONS: '/api/smart-onboarding/content/variations',
  OPTIMIZE_PATH: '/api/smart-onboarding/content/optimize-path',
  
  // Admin and monitoring endpoints
  GET_DASHBOARD: '/api/smart-onboarding/admin/dashboard',
  GET_METRICS: '/api/smart-onboarding/admin/metrics',
  MANAGE_EXPERIMENTS: '/api/smart-onboarding/admin/experiments',
  SYSTEM_HEALTH: '/api/smart-onboarding/admin/health'
} as const;

export const ERROR_CODES = {
  // General errors
  INVALID_REQUEST: 'SMART_ONBOARDING_INVALID_REQUEST',
  UNAUTHORIZED: 'SMART_ONBOARDING_UNAUTHORIZED',
  FORBIDDEN: 'SMART_ONBOARDING_FORBIDDEN',
  NOT_FOUND: 'SMART_ONBOARDING_NOT_FOUND',
  
  // Journey errors
  JOURNEY_NOT_FOUND: 'SMART_ONBOARDING_JOURNEY_NOT_FOUND',
  JOURNEY_ALREADY_EXISTS: 'SMART_ONBOARDING_JOURNEY_ALREADY_EXISTS',
  JOURNEY_COMPLETED: 'SMART_ONBOARDING_JOURNEY_COMPLETED',
  INVALID_STEP: 'SMART_ONBOARDING_INVALID_STEP',
  
  // ML model errors
  MODEL_NOT_AVAILABLE: 'SMART_ONBOARDING_MODEL_NOT_AVAILABLE',
  PREDICTION_FAILED: 'SMART_ONBOARDING_PREDICTION_FAILED',
  MODEL_TRAINING_FAILED: 'SMART_ONBOARDING_MODEL_TRAINING_FAILED',
  INSUFFICIENT_DATA: 'SMART_ONBOARDING_INSUFFICIENT_DATA',
  
  // Analytics errors
  TRACKING_FAILED: 'SMART_ONBOARDING_TRACKING_FAILED',
  ANALYTICS_UNAVAILABLE: 'SMART_ONBOARDING_ANALYTICS_UNAVAILABLE',
  INVALID_METRICS: 'SMART_ONBOARDING_INVALID_METRICS',
  
  // Intervention errors
  INTERVENTION_FAILED: 'SMART_ONBOARDING_INTERVENTION_FAILED',
  HELP_UNAVAILABLE: 'SMART_ONBOARDING_HELP_UNAVAILABLE',
  ESCALATION_FAILED: 'SMART_ONBOARDING_ESCALATION_FAILED',
  
  // Content errors
  CONTENT_NOT_FOUND: 'SMART_ONBOARDING_CONTENT_NOT_FOUND',
  ADAPTATION_FAILED: 'SMART_ONBOARDING_ADAPTATION_FAILED',
  OPTIMIZATION_FAILED: 'SMART_ONBOARDING_OPTIMIZATION_FAILED',
  
  // System errors
  SERVICE_UNAVAILABLE: 'SMART_ONBOARDING_SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'SMART_ONBOARDING_RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'SMART_ONBOARDING_INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'SMART_ONBOARDING_EXTERNAL_SERVICE_ERROR'
} as const;

export const RATE_LIMITS = {
  // Per user rate limits (requests per minute)
  TRACK_INTERACTION: 1000, // High frequency for real-time tracking
  GET_RECOMMENDATIONS: 60,
  TRIGGER_INTERVENTION: 10,
  UPDATE_PROGRESS: 100,
  
  // Per IP rate limits (requests per minute)
  GENERAL_API: 1000,
  ML_ENDPOINTS: 100,
  ADMIN_ENDPOINTS: 60,
  
  // System-wide limits
  CONCURRENT_JOURNEYS: 10000,
  CONCURRENT_ML_PREDICTIONS: 500,
  CONCURRENT_INTERVENTIONS: 1000
} as const;

export const DATA_RETENTION = {
  // Behavioral data retention (days)
  BEHAVIOR_EVENTS: 90,
  INTERACTION_DATA: 30,
  ENGAGEMENT_METRICS: 365,
  
  // ML data retention (days)
  TRAINING_DATA: 730, // 2 years
  MODEL_PREDICTIONS: 180,
  EXPERIMENT_DATA: 365,
  
  // User data retention (days)
  COMPLETED_JOURNEYS: 1095, // 3 years
  ABANDONED_JOURNEYS: 365,
  USER_PROFILES: -1, // Indefinite (until user deletion)
  
  // System data retention (days)
  SYSTEM_METRICS: 90,
  ERROR_LOGS: 30,
  PERFORMANCE_LOGS: 7
} as const;

export const MONITORING_ALERTS = {
  // Performance alerts
  HIGH_RESPONSE_TIME: {
    threshold: 5000, // 5 seconds
    severity: 'warning'
  },
  LOW_SUCCESS_RATE: {
    threshold: 0.8, // 80%
    severity: 'critical'
  },
  HIGH_ERROR_RATE: {
    threshold: 0.05, // 5%
    severity: 'error'
  },
  
  // User experience alerts
  LOW_ENGAGEMENT: {
    threshold: 0.4, // 40%
    severity: 'warning'
  },
  HIGH_ABANDONMENT: {
    threshold: 0.3, // 30%
    severity: 'critical'
  },
  FREQUENT_INTERVENTIONS: {
    threshold: 5, // per user per session
    severity: 'warning'
  },
  
  // System health alerts
  HIGH_MEMORY_USAGE: {
    threshold: 0.9, // 90%
    severity: 'critical'
  },
  HIGH_CPU_USAGE: {
    threshold: 0.8, // 80%
    severity: 'warning'
  },
  LOW_CACHE_HIT_RATE: {
    threshold: 0.7, // 70%
    severity: 'warning'
  }
} as const;

// Database connection for Smart Onboarding
import { getPool } from '../../db';

export const smartOnboardingDb = {
  query: async (text: string, params?: any[]) => {
    const pool = getPool();
    return await pool.query(text, params);
  },
  getPool,
  tables: SMART_ONBOARDING_TABLES,
  cacheKeys: CACHE_KEYS,
  cacheTtl: CACHE_TTL
};