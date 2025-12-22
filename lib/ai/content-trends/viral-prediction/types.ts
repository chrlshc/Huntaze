/**
 * Viral Prediction Engine Types
 * 
 * Type definitions for viral mechanism analysis, emotional triggers,
 * and content replicability scoring.
 */

// ============================================================================
// Core Viral Analysis Types
// ============================================================================

/**
 * Types of viral mechanisms that drive content success
 */
export type ViralMechanismType =
  | 'authenticity'
  | 'controversy'
  | 'humor'
  | 'surprise'
  | 'social_proof'
  | 'curiosity_gap'
  | 'emotional_resonance'
  | 'relatability'
  | 'aspiration'
  | 'fear_of_missing_out'
  | 'nostalgia'
  | 'outrage'
  | 'inspiration'
  | 'educational_value';

/**
 * Emotional trigger categories
 */
export type EmotionalTriggerCategory =
  | 'joy'
  | 'surprise'
  | 'anger'
  | 'fear'
  | 'sadness'
  | 'disgust'
  | 'anticipation'
  | 'trust'
  | 'curiosity'
  | 'empathy'
  | 'pride'
  | 'envy';

/**
 * Visual element types detected in content
 */
export type VisualElementType =
  | 'face'
  | 'text_overlay'
  | 'product'
  | 'logo'
  | 'scene_transition'
  | 'special_effect'
  | 'color_scheme'
  | 'composition'
  | 'movement'
  | 'lighting';

// ============================================================================
// Viral Mechanism Analysis
// ============================================================================

/**
 * Represents a single viral mechanism identified in content
 */
export interface ViralMechanism {
  /** Type of viral mechanism */
  type: ViralMechanismType;
  /** Strength of the mechanism (0-1) */
  strength: number;
  /** Human-readable description */
  description: string;
  /** How easily this mechanism can be replicated (0-1) */
  replicabilityFactor: number;
  /** Specific examples from the content */
  examples: string[];
  /** Timestamp ranges where mechanism is present (for video) */
  timestamps?: Array<{ start: number; end: number }>;
}

/**
 * Cognitive dissonance analysis
 */
export interface DissonanceAnalysis {
  /** Whether cognitive dissonance is present */
  isPresent: boolean;
  /** Type of dissonance */
  type?: 'expectation_violation' | 'belief_challenge' | 'identity_conflict' | 'value_contradiction';
  /** Strength of the dissonance (0-1) */
  strength: number;
  /** Description of the dissonance */
  description: string;
  /** Elements creating the dissonance */
  elements: string[];
  /** Resolution provided (if any) */
  resolution?: string;
}

/**
 * Emotional trigger detected in content
 */
export interface EmotionalTrigger {
  /** Category of emotion */
  category: EmotionalTriggerCategory;
  /** Intensity of the trigger (0-1) */
  intensity: number;
  /** What triggers this emotion */
  trigger: string;
  /** When in the content this occurs */
  timing: 'hook' | 'buildup' | 'climax' | 'resolution' | 'throughout';
  /** Specific content elements */
  elements: string[];
  /** Confidence in detection (0-1) */
  confidence: number;
}

/**
 * Visual element detected in content
 */
export interface VisualElement {
  /** Type of visual element */
  type: VisualElementType;
  /** Description of the element */
  description: string;
  /** Prominence in the content (0-1) */
  prominence: number;
  /** Impact on engagement (0-1) */
  engagementImpact: number;
  /** Position in frame (if applicable) */
  position?: { x: number; y: number; width: number; height: number };
  /** Timestamp (for video) */
  timestamp?: number;
}

// ============================================================================
// Engagement and Metrics
// ============================================================================

/**
 * Engagement metrics for content
 */
export interface EngagementMetrics {
  /** Total views */
  views: number;
  /** Total likes */
  likes: number;
  /** Total shares */
  shares: number;
  /** Total comments */
  comments: number;
  /** Engagement rate (interactions / views) */
  engagementRate: number;
  /** Velocity metrics */
  velocity: {
    viewsPerHour: number;
    likesPerHour: number;
    sharesPerHour: number;
  };
  /** Benchmark comparison */
  benchmark?: {
    platformAverage: number;
    categoryAverage: number;
    percentile: number;
  };
}

/**
 * Engagement data with temporal analysis
 */
export interface EngagementData extends EngagementMetrics {
  /** Time series data */
  timeSeries?: Array<{
    timestamp: Date;
    views: number;
    likes: number;
    shares: number;
    comments: number;
  }>;
  /** Peak engagement periods */
  peakPeriods?: Array<{
    start: Date;
    end: Date;
    metric: 'views' | 'likes' | 'shares' | 'comments';
    value: number;
  }>;
  /** Audience retention (for video) */
  retention?: Array<{
    timestamp: number;
    percentage: number;
  }>;
}

// ============================================================================
// Complete Viral Analysis
// ============================================================================

/**
 * Complete viral analysis result
 */
export interface ViralAnalysis {
  /** Unique analysis ID */
  id: string;
  /** Content ID being analyzed */
  contentId: string;
  /** Platform source */
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter';
  /** Cognitive dissonance analysis */
  cognitiveDissonance: DissonanceAnalysis;
  /** Emotional triggers identified */
  emotionalTriggers: EmotionalTrigger[];
  /** Visual elements detected */
  visualElements: VisualElement[];
  /** Engagement metrics */
  engagementMetrics: EngagementData;
  /** Overall replicability score (0-100) */
  replicabilityScore: number;
  /** Viral mechanisms identified */
  viralMechanisms: ViralMechanism[];
  /** Dense caption from visual analysis */
  denseCaption?: string;
  /** Actionable insights */
  insights: ActionableInsight[];
  /** Recommendations for replication */
  recommendations: ReplicationRecommendation[];
  /** Analysis metadata */
  metadata: {
    analyzedAt: Date;
    processingTimeMs: number;
    modelsUsed: string[];
    confidence: number;
  };
}

/**
 * Actionable insight from analysis
 */
export interface ActionableInsight {
  /** Insight category */
  category: 'hook' | 'narrative' | 'visual' | 'audio' | 'timing' | 'engagement';
  /** The insight */
  insight: string;
  /** Impact level */
  impact: 'high' | 'medium' | 'low';
  /** Specific recommendation */
  recommendation: string;
  /** Supporting evidence */
  evidence: string[];
  /** Confidence in insight (0-1) */
  confidence: number;
}

/**
 * Recommendation for replicating viral success
 */
export interface ReplicationRecommendation {
  /** Priority of recommendation */
  priority: number;
  /** What to replicate */
  element: string;
  /** How to adapt it */
  adaptation: string;
  /** Why it works */
  rationale: string;
  /** Difficulty to implement */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Expected impact */
  expectedImpact: 'high' | 'medium' | 'low';
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Multimodal content for analysis
 */
export interface MultimodalContent {
  /** Content ID */
  id: string;
  /** Platform */
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter';
  /** Content URL */
  url: string;
  /** Media type */
  mediaType: 'video' | 'image' | 'carousel' | 'text';
  /** Text content (caption, description) */
  textContent?: {
    caption?: string;
    description?: string;
    hashtags: string[];
    mentions: string[];
  };
  /** Visual analysis results (from Llama Vision) */
  visualAnalysis?: {
    denseCaption: string;
    detectedElements: VisualElement[];
    ocrText?: string;
    facialExpressions?: Array<{
      expression: string;
      confidence: number;
      timestamp?: number;
    }>;
    editingDynamics?: {
      cutFrequency: number;
      transitionTypes: string[];
      pacing: 'slow' | 'medium' | 'fast';
    };
  };
  /** Engagement metrics */
  engagement: EngagementMetrics;
  /** Author information */
  author?: {
    username: string;
    followerCount: number;
    verified: boolean;
    averageEngagement?: number;
  };
  /** Content metadata */
  metadata: {
    createdAt: Date;
    duration?: number;
    language?: string;
    category?: string;
  };
}

/**
 * Configuration for viral analysis
 */
export interface ViralAnalysisConfig {
  /** Minimum confidence threshold for mechanisms */
  minConfidence: number;
  /** Include detailed reasoning */
  includeReasoning: boolean;
  /** Maximum mechanisms to return */
  maxMechanisms: number;
  /** Focus areas for analysis */
  focusAreas?: ViralMechanismType[];
  /** Industry context for relevance scoring */
  industryContext?: string;
  /** Target audience for recommendations */
  targetAudience?: {
    ageRange?: [number, number];
    interests?: string[];
    platforms?: string[];
  };
}

// ============================================================================
// Scoring Types
// ============================================================================

/**
 * Detailed replicability score breakdown
 */
export interface ReplicabilityScoreBreakdown {
  /** Overall score (0-100) */
  overall: number;
  /** Component scores */
  components: {
    /** How easy to replicate the hook */
    hookReplicability: number;
    /** How easy to replicate the narrative */
    narrativeReplicability: number;
    /** How easy to replicate visual elements */
    visualReplicability: number;
    /** How transferable to other contexts */
    contextTransferability: number;
    /** Resource requirements */
    resourceRequirements: number;
  };
  /** Factors affecting score */
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative';
    weight: number;
    description: string;
  }>;
  /** Confidence in score */
  confidence: number;
}

/**
 * Viral potential prediction
 */
export interface ViralPotentialPrediction {
  /** Predicted viral probability (0-1) */
  probability: number;
  /** Confidence interval */
  confidenceInterval: [number, number];
  /** Key factors */
  keyFactors: Array<{
    factor: string;
    contribution: number;
    direction: 'positive' | 'negative';
  }>;
  /** Similar successful content */
  similarSuccesses?: Array<{
    contentId: string;
    similarity: number;
    performance: EngagementMetrics;
  }>;
  /** Risk factors */
  riskFactors: string[];
  /** Optimal posting time */
  optimalTiming?: {
    dayOfWeek: number;
    hourOfDay: number;
    timezone: string;
  };
}
