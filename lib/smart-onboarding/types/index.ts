// Smart Onboarding System - Core Types and Interfaces

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type PersonaType = 'content_creator' | 'business_user' | 'influencer' | 'agency' | 'casual_user';
export type LearningStyle = 'visual' | 'hands_on' | 'guided' | 'exploratory';
export type ExperienceLevel = 'none' | 'basic' | 'intermediate' | 'advanced';
export type BehaviorEventType = 'click' | 'scroll' | 'hover' | 'focus' | 'blur' | 'keypress' | 'mouse_movement' | 'hesitation' | 'backtrack';
export type InterventionTrigger = 'struggle_detected' | 'low_engagement' | 'confusion_pattern' | 'time_threshold' | 'error_frequency';

// User Profile and Journey Models
export interface UserProfile {
  id: string;
  email: string;
  socialConnections: SocialConnection[];
  technicalProficiency: ProficiencyLevel;
  contentCreationGoals: CreationGoal[];
  platformPreferences: PlatformPreference[];
  learningStyle: LearningStyle;
  timeConstraints: TimeConstraints;
  previousExperience: ExperienceLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialConnection {
  platform: string;
  username: string;
  followerCount?: number;
  contentType: string[];
  isVerified: boolean;
  connectedAt: Date;
}

export interface CreationGoal {
  type: 'growth' | 'monetization' | 'engagement' | 'brand_awareness' | 'content_quality';
  priority: number;
  targetMetric?: string;
  targetValue?: number;
}

export interface PlatformPreference {
  platform: string;
  priority: number;
  contentTypes: string[];
  postingFrequency: string;
}

export interface TimeConstraints {
  availableHoursPerWeek: number;
  preferredTimeSlots: string[];
  urgencyLevel: 'low' | 'medium' | 'high';
}

// Onboarding Journey Models
export interface OnboardingJourney {
  id: string;
  userId: string;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  personalizedPath: LearningPath;
  engagementHistory: EngagementMetric[];
  interventions: Intervention[];
  predictedSuccessRate: number;
  estimatedCompletionTime: number;
  adaptationHistory: AdaptationEvent[];
  startedAt: Date;
  lastActiveAt: Date;
  completedAt?: Date;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
}

export interface OnboardingStep {
  id: string;
  type: 'introduction' | 'assessment' | 'tutorial' | 'practice' | 'configuration' | 'completion';
  title: string;
  description: string;
  content: StepContent;
  estimatedDuration: number;
  prerequisites: string[];
  learningObjectives: string[];
  adaptationRules: AdaptationRule[];
  completionCriteria: CompletionCriteria;
}

export interface StepContent {
  text?: string;
  media?: MediaContent[];
  interactive?: InteractiveElement[];
  quiz?: QuizQuestion[];
  tasks?: Task[];
}

export interface MediaContent {
  type: 'image' | 'video' | 'animation' | 'diagram';
  url: string;
  alt?: string;
  duration?: number;
}

export interface InteractiveElement {
  type: 'button' | 'form' | 'slider' | 'toggle' | 'demo';
  id: string;
  config: Record<string, any>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'open_ended';
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
}

export interface Task {
  id: string;
  description: string;
  type: 'click' | 'input' | 'navigation' | 'configuration';
  target?: string;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'pattern' | 'custom';
  value?: string | RegExp;
  message: string;
}

export interface CompletionCriteria {
  type: 'time_based' | 'interaction_based' | 'task_based' | 'assessment_based';
  threshold: number;
  conditions: string[];
}

export interface AdaptationRule {
  trigger: string;
  condition: string;
  action: 'skip' | 'simplify' | 'elaborate' | 'redirect' | 'assist';
  parameters: Record<string, any>;
}

// Behavioral Analytics Models
export interface BehaviorEvent {
  id: string;
  userId: string;
  timestamp: Date;
  eventType: BehaviorEventType;
  stepId: string;
  interactionData: InteractionData;
  engagementScore: number;
  contextualData: ContextualData;
}

export interface InteractionData {
  mouseMovements: MouseMovement[];
  clickPatterns: ClickPattern[];
  timeSpent: number;
  scrollBehavior: ScrollBehavior;
  hesitationIndicators: HesitationMetric[];
  keyboardActivity?: KeyboardActivity[];
}

export interface MouseMovement {
  x: number;
  y: number;
  timestamp: number;
  velocity: number;
  acceleration: number;
}

export interface ClickPattern {
  x: number;
  y: number;
  timestamp: number;
  element: string;
  duration: number;
  isDoubleClick: boolean;
}

export interface ScrollBehavior {
  direction: 'up' | 'down';
  distance: number;
  velocity: number;
  pauseDuration: number;
  timestamp: number;
}

export interface HesitationMetric {
  type: 'mouse_pause' | 'scroll_pause' | 'click_delay' | 'form_hesitation';
  duration: number;
  location: { x: number; y: number };
  timestamp: number;
}

export interface KeyboardActivity {
  key: string;
  timestamp: number;
  duration: number;
  isBackspace: boolean;
}

export interface ContextualData {
  currentUrl: string;
  referrer?: string;
  userAgent: string;
  screenResolution: { width: number; height: number };
  viewportSize: { width: number; height: number };
  deviceType: 'desktop' | 'tablet' | 'mobile';
  browserInfo: BrowserInfo;
}

export interface BrowserInfo {
  name: string;
  version: string;
  language: string;
  timezone: string;
}

// ML and AI Models
export interface UserPersona {
  personaType: PersonaType;
  confidenceScore: number;
  characteristics: PersonaCharacteristic[];
  predictedBehaviors: PredictedBehavior[];
  recommendedApproach: OnboardingApproach;
  lastUpdated: Date;
}

export interface PersonaCharacteristic {
  trait: string;
  value: number;
  confidence: number;
}

export interface PredictedBehavior {
  behavior: string;
  probability: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface OnboardingApproach {
  pacing: 'slow' | 'medium' | 'fast';
  complexity: 'simple' | 'moderate' | 'advanced';
  interactivity: 'low' | 'medium' | 'high';
  supportLevel: 'minimal' | 'moderate' | 'extensive';
}

export interface LearningPath {
  pathId: string;
  steps: OptimizedStep[];
  estimatedDuration: number;
  difficultyProgression: DifficultyLevel[];
  personalizedContent: PersonalizedContent[];
  adaptationPoints: AdaptationPoint[];
  createdAt: Date;
  version: number;
}

export interface OptimizedStep extends OnboardingStep {
  personalizedContent: PersonalizedContent;
  adaptationTriggers: AdaptationTrigger[];
  successPrediction: number;
}

export interface PersonalizedContent {
  stepId: string;
  contentVariations: ContentVariation[];
  selectedVariation: string;
  adaptationHistory: ContentAdaptation[];
}

export interface ContentVariation {
  id: string;
  type: 'default' | 'simplified' | 'detailed' | 'visual' | 'interactive';
  content: StepContent;
  targetPersona: PersonaType[];
  effectivenessScore: number;
}

export interface ContentAdaptation {
  timestamp: Date;
  fromVariation: string;
  toVariation: string;
  reason: string;
  effectiveness: number;
}

export interface AdaptationPoint {
  stepId: string;
  triggers: AdaptationTrigger[];
  possibleActions: AdaptationAction[];
  decisionTree: DecisionNode[];
}

export interface AdaptationTrigger {
  type: 'engagement_drop' | 'confusion_detected' | 'time_exceeded' | 'error_pattern' | 'success_pattern';
  threshold: number;
  timeWindow: number;
}

export interface AdaptationAction {
  type: 'content_change' | 'pace_adjustment' | 'help_offer' | 'skip_step' | 'add_practice';
  parameters: Record<string, any>;
  expectedImpact: number;
}

export interface DecisionNode {
  condition: string;
  action: AdaptationAction;
  children?: DecisionNode[];
}

export interface DifficultyLevel {
  stepId: string;
  level: number;
  factors: DifficultyFactor[];
}

export interface DifficultyFactor {
  type: 'cognitive_load' | 'technical_complexity' | 'time_pressure' | 'prerequisite_knowledge';
  weight: number;
  value: number;
}

// Engagement and Analytics Models
export interface EngagementMetric {
  timestamp: Date;
  score: number;
  factors: EngagementFactor[];
  trend: 'increasing' | 'stable' | 'decreasing';
  prediction: EngagementPrediction;
}

export interface EngagementFactor {
  type: 'attention' | 'interaction' | 'progress' | 'satisfaction' | 'confusion';
  value: number;
  weight: number;
  confidence: number;
}

export interface EngagementPrediction {
  nextScore: number;
  confidence: number;
  timeHorizon: number;
  riskFactors: string[];
}

export interface EngagementAnalysis {
  userId: string;
  timeWindow: { start: Date; end: Date };
  averageScore: number;
  trend: 'improving' | 'stable' | 'declining';
  patterns: EngagementPattern[];
  recommendations: EngagementRecommendation[];
}

export interface EngagementPattern {
  type: 'peak' | 'dip' | 'plateau' | 'oscillation';
  startTime: Date;
  endTime: Date;
  intensity: number;
  triggers: string[];
}

export interface EngagementRecommendation {
  type: 'intervention' | 'content_adjustment' | 'pacing_change' | 'support_offer';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImpact: number;
}

// Intervention Models
export interface Intervention {
  id: string;
  userId: string;
  type: 'proactive_help' | 'content_adjustment' | 'pace_change' | 'encouragement' | 'clarification';
  trigger: InterventionTrigger;
  content: InterventionContent;
  timing: InterventionTiming;
  effectiveness: InterventionEffectiveness;
  createdAt: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  status: 'pending' | 'delivered' | 'accepted' | 'dismissed' | 'completed';
}

export interface InterventionContent {
  title: string;
  message: string;
  actionButtons: ActionButton[];
  media?: MediaContent[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ActionButton {
  id: string;
  text: string;
  action: 'accept_help' | 'dismiss' | 'skip_step' | 'retry' | 'contact_support';
  style: 'primary' | 'secondary' | 'danger';
}

export interface InterventionTiming {
  delay: number;
  maxWaitTime: number;
  retryPolicy: RetryPolicy;
  contextualFactors: string[];
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
}

export interface InterventionEffectiveness {
  userResponse: 'accepted' | 'dismissed' | 'ignored';
  engagementChange: number;
  completionImpact: number;
  timeToResolution?: number;
  userFeedback?: UserFeedback;
}

export interface UserFeedback {
  rating: number;
  comment?: string;
  helpful: boolean;
  timestamp: Date;
}

// Struggle Detection Models
export interface StruggleMetrics {
  userId: string;
  stepId: string;
  overallScore: number;
  indicators: StruggleIndicator[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number;
  patterns: StrugglePattern[];
  recommendations: InterventionRecommendation[];
}

export interface StruggleIndicator {
  type: 'time_exceeded' | 'repeated_errors' | 'backtracking' | 'hesitation' | 'help_seeking' | 'abandonment_risk';
  value: number;
  threshold: number;
  confidence: number;
  timestamp: Date;
}

export interface StrugglePattern {
  type: 'error_loop' | 'confusion_spiral' | 'avoidance_behavior' | 'frustration_buildup';
  startTime: Date;
  duration: number;
  intensity: number;
  triggers: string[];
}

export interface InterventionRecommendation {
  type: 'immediate' | 'delayed' | 'conditional';
  intervention: Intervention;
  priority: number;
  expectedEffectiveness: number;
}

// Success Prediction Models
export interface SuccessPrediction {
  userId: string;
  currentProbability: number;
  factors: PredictionFactor[];
  riskFactors: RiskFactor[];
  recommendations: PredictionRecommendation[];
  confidence: number;
  lastUpdated: Date;
}

export interface PredictionFactor {
  type: 'engagement' | 'progress' | 'proficiency' | 'time_investment' | 'help_usage';
  impact: number;
  confidence: number;
  trend: 'positive' | 'negative' | 'stable';
}

export interface RiskFactor {
  type: 'low_engagement' | 'slow_progress' | 'frequent_errors' | 'time_pressure' | 'complexity_mismatch';
  severity: number;
  likelihood: number;
  mitigationStrategies: string[];
}

export interface PredictionRecommendation {
  type: 'path_adjustment' | 'intervention' | 'support_escalation' | 'content_modification';
  description: string;
  expectedImpact: number;
  urgency: 'low' | 'medium' | 'high';
}

// Behavioral Insights Models
export interface BehavioralInsights {
  userId: string;
  timeWindow: { start: Date; end: Date };
  patterns: BehaviorPattern[];
  preferences: UserPreference[];
  learningStyle: DetectedLearningStyle;
  recommendations: BehaviorRecommendation[];
  confidence: number;
}

export interface BehaviorPattern {
  type: 'interaction' | 'navigation' | 'learning' | 'engagement' | 'struggle';
  description: string;
  frequency: number;
  strength: number;
  contexts: string[];
}

export interface UserPreference {
  category: 'content_type' | 'pacing' | 'interaction_style' | 'support_level';
  preference: string;
  confidence: number;
  evidence: string[];
}

export interface DetectedLearningStyle {
  primary: LearningStyle;
  secondary?: LearningStyle;
  confidence: number;
  indicators: LearningStyleIndicator[];
}

export interface LearningStyleIndicator {
  style: LearningStyle;
  evidence: string;
  weight: number;
}

export interface BehaviorRecommendation {
  type: 'personalization' | 'optimization' | 'intervention';
  description: string;
  implementation: string;
  expectedBenefit: number;
}

// Content Recommendation Models
export interface ContentRecommendation {
  stepId: string;
  recommendations: RecommendationItem[];
  reasoning: RecommendationReasoning;
  confidence: number;
  alternatives: AlternativeRecommendation[];
}

export interface RecommendationItem {
  contentId: string;
  type: 'text' | 'video' | 'interactive' | 'quiz' | 'demo';
  title: string;
  description: string;
  estimatedTime: number;
  difficulty: number;
  relevanceScore: number;
  personalizationFactors: string[];
}

export interface RecommendationReasoning {
  primaryFactors: string[];
  userPersona: PersonaType;
  learningStyle: LearningStyle;
  currentContext: string;
  historicalPerformance: number;
}

export interface AlternativeRecommendation {
  scenario: string;
  recommendation: RecommendationItem;
  conditions: string[];
}

// Error Recovery Models
export interface ErrorRecoveryStrategy {
  fallbackToAdaptiveOnboarding(userId: string): Promise<void>;
  retryWithBackoff(operation: MLOperation, maxRetries: number): Promise<MLResult>;
  handleServiceUnavailable(service: ExternalService): Promise<FallbackResponse>;
  reconcileUserState(userId: string): Promise<ConsistentState>;
}

export interface MLOperation {
  type: string;
  parameters: Record<string, any>;
  timeout: number;
}

export interface MLResult {
  success: boolean;
  data?: any;
  error?: string;
  confidence?: number;
}

export interface ExternalService {
  name: string;
  endpoint: string;
  timeout: number;
}

export interface FallbackResponse {
  success: boolean;
  fallbackData: any;
  originalError: string;
}

export interface ConsistentState {
  userId: string;
  journey: OnboardingJourney;
  profile: UserProfile;
  lastSyncedAt: Date;
  conflicts: StateConflict[];
}

export interface StateConflict {
  field: string;
  localValue: any;
  remoteValue: any;
  resolution: 'local' | 'remote' | 'merge';
}

// API Response Models
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: Date;
  processingTime: number;
  version: string;
}

// Event Models for Real-time Communication
export interface OnboardingEvent {
  type: 'step_started' | 'step_completed' | 'engagement_changed' | 'intervention_triggered' | 'journey_completed';
  userId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface SystemEvent {
  type: 'model_updated' | 'performance_alert' | 'system_health' | 'data_quality_issue';
  severity: 'info' | 'warning' | 'error' | 'critical';
  data: Record<string, any>;
  timestamp: Date;
}

export interface AdaptationEvent {
  id: string;
  userId: string;
  stepId: string;
  timestamp: Date;
  type: 'content_change' | 'pace_adjustment' | 'difficulty_change' | 'intervention_triggered';
  trigger: string;
  action: AdaptationAction;
  effectiveness?: number;
  userResponse?: 'positive' | 'negative' | 'neutral';
}

// Data Processing Types
export interface ProcessedBehaviorData {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  eventType: string;
  stepId?: string;
  
  interactionMetrics: {
    timeSpent: number;
    clickCount: number;
    scrollDistance: number;
    hesitationTime: number;
    engagementScore: number;
  };
  
  behavioralIndicators: {
    isStruggling: boolean;
    confidenceLevel: 'low' | 'medium' | 'high';
    attentionLevel: 'distracted' | 'normal' | 'focused';
    learningVelocity: 'slow' | 'average' | 'fast';
  };
  
  contextData: {
    deviceType: string;
    userAgent: string;
    technicalProficiency: string;
    learningStyle: string;
    timeOfDay: number;
    dayOfWeek: number;
  };
  
  processingMetadata: {
    processedAt: Date;
    enrichmentVersion: string;
    validationPassed: boolean;
    dataQualityScore: number;
  };
}

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  qualityScore?: number;
  validatedAt: Date;
  validationTime?: number;
  metadata?: {
    strictMode: boolean;
    rulesApplied: number;
    dataCompleteness: number;
  };
}

export interface DataQualityMetrics {
  totalValidated: number;
  validationSuccessRate: number;
  averageQualityScore: number;
  qualityDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  lastUpdated: Date;
}

export interface EnrichmentContext {
  sessionData?: {
    sessionId: string;
    duration: number;
    completedSteps: string[];
    userAgent: string;
    deviceType: string;
  };
  userProfile?: {
    technicalProficiency: string;
    learningStyle: string;
    platformPreferences: string[];
    previousExperience: string;
  };
  timestamp: Date;
}

export interface MLTrainingDataset {
  id: string;
  createdAt: Date;
  criteria: {
    startDate: Date;
    endDate: Date;
    userIds?: string[];
    eventTypes?: string[];
    minQualityScore?: number;
  };
  rawData: any[];
  featureVectors: any[];
  aggregations: any[];
  metadata: {
    totalRecords: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    uniqueUsers: number;
    eventTypes: string[];
    qualityMetrics: any;
  };
}

export interface DataAggregation {
  userId: string;
  timeKey: string;
  level: string;
  metrics: {
    totalEvents: number;
    totalTimeSpent: number;
    totalClicks: number;
    totalScrollDistance: number;
    averageEngagementScore: number;
    strugglingEvents: number;
    completedSteps: Set<string>;
    uniqueSessions: Set<string>;
  };
  timestamp: Date;
}

export interface FeatureVector {
  userId?: string;
  ruleId?: string;
  extractedAt?: Date;
  features: Record<string, number>;
  labels: Record<string, boolean | number | string>;
  metadata: Record<string, any>;
}