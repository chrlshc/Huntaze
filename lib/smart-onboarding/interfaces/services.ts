// Smart Onboarding System - Service Interfaces

import {
  PersonaType,
  UserProfile,
  OnboardingJourney,
  OnboardingStep,
  InteractionEvent,
  StruggleMetrics,
  InterventionPlan,
  OnboardingResult,
  UserPersona,
  OnboardingContext,
  LearningPath,
  BehaviorEvent,
  ContentRecommendation,
  InteractionPattern,
  ProficiencyLevel,
  EngagementAnalysis,
  BehavioralInsights,
  InterventionTrigger,
  HelpContent,
  ComplexIssue,
  EscalationTicket,
  InterventionOutcome,
  SuccessPrediction,
  Intervention,
  InterventionTiming,
  BehaviorPattern,
  StepContent,
  PersonalizedContent,
  ContentVariation,
  UserFeedback,
  AdaptationTrigger,
  EngagementRecommendation,
  ModelMetrics,
  SessionSummary,
  AnalyticsDashboard,
  InterventionHistory,
  TimingPrediction,
  PathEffectiveness,
  CohortCriteria,
  CohortInsights,
  OutcomeData,
  PathPerformanceData,
  CompletionCriteria,
  ValidationRule
} from '../types';

// Re-export commonly used types from ../types for convenience
export type {
  OnboardingContext,
  UserProfile,
  OnboardingJourney,
  OnboardingStep,
  InteractionEvent,
  StruggleMetrics,
  InterventionPlan,
  OnboardingResult,
  UserPersona,
  LearningPath,
  BehaviorEvent,
  ContentRecommendation,
  InteractionPattern,
  ProficiencyLevel,
  EngagementAnalysis,
  BehavioralInsights,
  InterventionTrigger,
  HelpContent,
  ComplexIssue,
  EscalationTicket,
  InterventionOutcome,
  SuccessPrediction,
  Intervention,
  InterventionTiming,
  BehaviorPattern,
  StepContent,
  PersonalizedContent,
  ContentVariation,
  UserFeedback,
  AdaptationTrigger,
  EngagementRecommendation,
  ModelMetrics,
  SessionSummary,
  AnalyticsDashboard,
  InterventionHistory,
  TimingPrediction,
  PathEffectiveness,
  CohortCriteria,
  CohortInsights,
  OutcomeData,
  PathPerformanceData,
  CompletionCriteria,
  ValidationRule
};

// Core Smart Onboarding Service Interface
export interface SmartOnboardingService {
  /**
   * Initialize a new user journey with AI-powered personalization
   */
  initializeUserJourney(userId: string, profileData: UserProfile): Promise<OnboardingJourney>;

  /**
   * Update user progress and trigger real-time adaptations
   */
  updateUserProgress(userId: string, stepId: string, interactionData: InteractionEvent): Promise<void>;

  /**
   * Get the next optimal step based on ML predictions
   */
  getNextOptimalStep(userId: string): Promise<OnboardingStep>;

  /**
   * Handle user struggle with proactive interventions
   */
  handleUserStruggle(userId: string, struggleIndicators: StruggleMetrics): Promise<InterventionPlan>;

  /**
   * Complete the onboarding process and generate insights
   */
  completeOnboarding(userId: string): Promise<OnboardingResult>;

  /**
   * Resume an incomplete onboarding journey
   */
  resumeJourney(userId: string): Promise<OnboardingJourney>;

  /**
   * Get current journey status and progress
   */
  getJourneyStatus(userId: string): Promise<OnboardingJourney>;

  /**
   * Pause an active journey
   */
  pauseJourney(userId: string, reason?: string): Promise<void>;
}

// ML Personalization Engine Interface
export interface MLPersonalizationEngine {
  /**
   * Analyze user profile and generate persona classification
   */
  analyzeUserProfile(profileData: UserProfile): Promise<UserPersona>;

  /**
   * Predict optimal learning path based on user context
   */
  predictOptimalPath(userId: string, currentContext: OnboardingContext): Promise<LearningPath>;

  /**
   * Update user behavioral model with new interaction data
   */
  updateUserModel(userId: string, behaviorData: BehaviorEvent[]): Promise<void>;

  /**
   * Generate personalized content recommendations
   */
  generateContentRecommendations(userId: string, contentType: string): Promise<ContentRecommendation[]>;

  /**
   * Assess user's technical proficiency from interaction patterns
   */
  assessTechnicalProficiency(interactionPatterns: InteractionPattern[]): Promise<ProficiencyLevel>;

  /**
   * Predict user success probability
   */
  predictSuccessProbability(userId: string): Promise<SuccessPrediction>;

  /**
   * Retrain models with new user data
   */
  retrainModels(trainingData: BehaviorEvent[]): Promise<void>;

  /**
   * Get model performance metrics
   */
  getModelMetrics(): Promise<ModelMetrics>;
}

// Behavioral Analytics Service Interface
export interface BehavioralAnalyticsService {
  /**
   * Track real-time user interaction events
   */
  trackInteraction(userId: string, event: InteractionEvent): Promise<void>;

  /**
   * Analyze user engagement patterns over time window
   */
  analyzeEngagementPatterns(userId: string, timeWindow: number): Promise<EngagementAnalysis>;

  /**
   * Detect struggle indicators in real-time
   */
  detectStruggleIndicators(userId: string): Promise<StruggleMetrics>;

  /**
   * Generate comprehensive behavioral insights
   */
  generateBehavioralInsights(userId: string): Promise<BehavioralInsights>;

  /**
   * Calculate real-time engagement score
   */
  calculateEngagementScore(interactionHistory: InteractionEvent[]): Promise<number>;

  /**
   * Start real-time monitoring for a user session
   */
  startMonitoring(userId: string, sessionId: string): Promise<void>;

  /**
   * Stop monitoring and generate session summary
   */
  stopMonitoring(userId: string, sessionId: string): Promise<SessionSummary>;

  /**
   * Get real-time analytics dashboard data
   */
  getDashboardData(userId: string): Promise<AnalyticsDashboard>;
}

// Intervention Engine Interface
export interface InterventionEngine {
  /**
   * Start monitoring user progress for intervention opportunities
   */
  monitorUserProgress(userId: string): Promise<void>;

  /**
   * Trigger intervention based on detected issues
   */
  triggerIntervention(userId: string, triggerReason: InterventionTrigger): Promise<InterventionPlan>;

  /**
   * Provide contextual help based on current user state
   */
  provideContextualHelp(userId: string, context: OnboardingContext): Promise<HelpContent>;

  /**
   * Escalate complex issues to human support
   */
  escalateToHuman(userId: string, issue: ComplexIssue): Promise<EscalationTicket>;

  /**
   * Track effectiveness of delivered interventions
   */
  trackInterventionEffectiveness(interventionId: string, outcome: InterventionOutcome): Promise<void>;

  /**
   * Get intervention history for a user
   */
  getInterventionHistory(userId: string): Promise<InterventionHistory>;

  /**
   * Update intervention strategies based on effectiveness data
   */
  optimizeInterventionStrategies(): Promise<void>;
}

// Predictive Modeling Service Interface
export interface PredictiveModelingService {
  /**
   * Forecast user success probability
   */
  forecastUserSuccess(userId: string): Promise<SuccessPrediction>;

  /**
   * Recommend interventions based on risk assessment
   */
  recommendInterventions(userId: string, riskFactors: string[]): Promise<InterventionRecommendation[]>;

  /**
   * Predict optimal content delivery timing
   */
  predictOptimalTiming(userId: string, contentId: string): Promise<TimingPrediction>;

  /**
   * Assess learning path effectiveness
   */
  assessPathEffectiveness(pathId: string): Promise<PathEffectiveness>;

  /**
   * Generate cohort-based insights
   */
  generateCohortInsights(cohortCriteria: CohortCriteria): Promise<CohortInsights>;

  /**
   * Update prediction models with new outcome data
   */
  updatePredictionModels(outcomeData: OutcomeData[]): Promise<void>;
}

// Learning Path Optimizer Interface
export interface LearningPathOptimizer {
  /**
   * Optimize learning path based on user cohort performance
   */
  optimizePath(pathId: string, performanceData: PathPerformanceData): Promise<LearningPath>;

  /**
   * Continuously optimize paths using reinforcement learning
   */
  continuousOptimization(): Promise<void>;

  /**
   * A/B test different path variations
   */
  runPathExperiment(experimentConfig: PathExperiment): Promise<ExperimentResults>;

  /**
   * Measure path effectiveness across user segments
   */
  measurePathEffectiveness(pathId: string, segmentCriteria: SegmentCriteria): Promise<EffectivenessMetrics>;

  /**
   * Generate path recommendations for new user personas
   */
  generatePathRecommendations(persona: UserPersona): Promise<PathRecommendation[]>;

  /**
   * Update path based on real-time performance feedback
   */
  updatePathRealtime(pathId: string, performanceFeedback: PerformanceFeedback): Promise<void>;
}

// Engagement Scoring System Interface
export interface EngagementScoringSystem {
  /**
   * Calculate real-time engagement score
   */
  calculateRealTimeScore(userId: string, interactionData: InteractionEvent[]): Promise<number>;

  /**
   * Monitor engagement trends over time
   */
  monitorEngagementTrends(userId: string): Promise<EngagementTrends>;

  /**
   * Detect engagement anomalies
   */
  detectEngagementAnomalies(userId: string): Promise<EngagementAnomaly[]>;

  /**
   * Predict future engagement levels
   */
  predictEngagement(userId: string, timeHorizon: number): Promise<EngagementPrediction>;

  /**
   * Generate engagement improvement recommendations
   */
  generateEngagementRecommendations(userId: string): Promise<EngagementRecommendation[]>;

  /**
   * Calibrate scoring algorithms based on outcome data
   */
  calibrateScoring(calibrationData: CalibrationData[]): Promise<void>;
}

// Dynamic Content Adapter Interface
export interface DynamicContentAdapter {
  /**
   * Adapt content based on user engagement and proficiency
   */
  adaptContent(userId: string, stepId: string, adaptationTriggers: AdaptationTrigger[]): Promise<AdaptedContent>;

  /**
   * Adjust content complexity in real-time
   */
  adjustComplexity(userId: string, currentComplexity: number, targetComplexity: number): Promise<ContentAdjustment>;

  /**
   * Personalize content presentation style
   */
  personalizePresentation(userId: string, content: StepContent): Promise<PersonalizedContent>;

  /**
   * Generate alternative content variations
   */
  generateContentVariations(originalContent: StepContent, targetPersona: UserPersona): Promise<ContentVariation[]>;

  /**
   * Test content effectiveness across user segments
   */
  testContentEffectiveness(contentId: string, testConfig: ContentTest): Promise<ContentTestResults>;

  /**
   * Optimize content based on performance metrics
   */
  optimizeContent(contentId: string, performanceMetrics: ContentMetrics): Promise<OptimizedContent>;
}

// Contextual Help System Interface
export interface ContextualHelpSystem {
  /**
   * Generate contextual help based on user state
   */
  generateContextualHelp(userId: string, context: OnboardingContext): Promise<HelpContent>;

  /**
   * Provide progressive assistance (hints → guidance → full help)
   */
  provideProgressiveAssistance(userId: string, assistanceLevel: AssistanceLevel): Promise<ProgressiveHelp>;

  /**
   * Create interactive tutorials for complex tasks
   */
  createInteractiveTutorial(taskId: string, userProficiency: ProficiencyLevel): Promise<InteractiveTutorial>;

  /**
   * Generate FAQ responses based on common user questions
   */
  generateFAQResponse(question: string, userContext: OnboardingContext): Promise<FAQResponse>;

  /**
   * Track help effectiveness and user satisfaction
   */
  trackHelpEffectiveness(helpId: string, userFeedback: UserFeedback): Promise<void>;

  /**
   * Update help content based on effectiveness metrics
   */
  updateHelpContent(helpId: string, effectivenessData: HelpEffectivenessData): Promise<void>;
}

// Supporting Types for Service Interfaces
// Note: Core types like InteractionEvent, OnboardingContext, InterventionPlan, and OnboardingResult
// are now imported from '../types' to avoid duplication

// ModelMetrics, SessionSummary, AnalyticsDashboard, and InterventionHistory
// are now imported from '../types' to avoid duplication

export interface InterventionRecommendation {
  type: string;
  priority: number;
  description: string;
  expectedEffectiveness: number;
  timing: InterventionTiming;
}

// TimingPrediction, PathEffectiveness, CohortCriteria, CohortInsights,
// OutcomeData, and PathPerformanceData are now imported from '../types' to avoid duplication

export interface PathExperiment {
  name: string;
  variations: PathVariation[];
  targetUsers: UserSegment;
  duration: number;
  successMetrics: string[];
}

export interface ExperimentResults {
  experimentId: string;
  winningVariation: string;
  statisticalSignificance: number;
  results: VariationResult[];
}

export interface SegmentCriteria {
  demographics: Record<string, any>;
  behaviorPatterns: string[];
  performanceThresholds: Record<string, number>;
}

export interface EffectivenessMetrics {
  completionRate: number;
  engagementScore: number;
  timeToCompletion: number;
  userSatisfaction: number;
  learningEffectiveness: number;
}

export interface PathRecommendation {
  pathId: string;
  suitabilityScore: number;
  reasoning: string;
  expectedOutcomes: ExpectedOutcome[];
}

export interface PerformanceFeedback {
  userId: string;
  stepId: string;
  performance: number;
  feedback: string;
  timestamp: Date;
}

export interface EngagementTrends {
  trend: 'increasing' | 'stable' | 'decreasing';
  changeRate: number;
  predictions: EngagementPrediction[];
  anomalies: EngagementAnomaly[];
}

export interface EngagementAnomaly {
  type: 'spike' | 'drop' | 'plateau';
  severity: number;
  timestamp: Date;
  possibleCauses: string[];
}

export interface EngagementPrediction {
  timepoint: Date;
  predictedScore: number;
  confidence: number;
  factors: PredictionFactor[];
}

export interface CalibrationData {
  userId: string;
  actualEngagement: number;
  predictedEngagement: number;
  contextFactors: Record<string, any>;
}

export interface AdaptedContent {
  originalContent: StepContent;
  adaptedContent: StepContent;
  adaptationReason: string;
  expectedImprovement: number;
}

export interface ContentAdjustment {
  adjustmentType: 'simplify' | 'elaborate' | 'restructure';
  adjustedContent: StepContent;
  complexityChange: number;
}

export interface ContentTest {
  variations: ContentVariation[];
  targetSegment: UserSegment;
  duration: number;
  metrics: string[];
}

export interface ContentTestResults {
  winningVariation: string;
  performanceMetrics: Record<string, number>;
  userFeedback: UserFeedback[];
}

export interface ContentMetrics {
  engagementRate: number;
  completionRate: number;
  timeSpent: number;
  userSatisfaction: number;
  learningEffectiveness: number;
}

export interface OptimizedContent {
  contentId: string;
  optimizedVersion: StepContent;
  improvements: ContentImprovement[];
  expectedImpact: number;
}

export interface AssistanceLevel {
  level: 'hint' | 'guidance' | 'full_help' | 'tutorial';
  intensity: number;
}

export interface ProgressiveHelp {
  currentLevel: AssistanceLevel;
  content: HelpContent;
  nextLevel?: AssistanceLevel;
  escalationTriggers: string[];
}

export interface InteractiveTutorial {
  id: string;
  steps: TutorialStep[];
  estimatedDuration: number;
  completionCriteria: CompletionCriteria;
}

export interface TutorialStep {
  id: string;
  instruction: string;
  targetElement?: string;
  validation: ValidationRule[];
  hints: string[];
}

export interface FAQResponse {
  question: string;
  answer: string;
  confidence: number;
  relatedQuestions: string[];
  helpfulResources: Resource[];
}

export interface Resource {
  type: 'article' | 'video' | 'tutorial' | 'documentation';
  title: string;
  url: string;
  relevanceScore: number;
}

export interface HelpEffectivenessData {
  helpId: string;
  userFeedback: UserFeedback[];
  usageMetrics: UsageMetrics;
  outcomeMetrics: OutcomeMetrics;
}

export interface UsageMetrics {
  viewCount: number;
  averageTimeSpent: number;
  completionRate: number;
  returnRate: number;
}

export interface OutcomeMetrics {
  problemResolutionRate: number;
  userSatisfactionScore: number;
  taskCompletionImprovement: number;
}

// Additional supporting interfaces
export interface RealTimeMetrics {
  activeUsers: number;
  averageEngagement: number;
  completionRate: number;
  interventionRate: number;
}

export interface ProgressSummary {
  totalUsers: number;
  completedJourneys: number;
  averageCompletionTime: number;
  topStruggles: string[];
}

export interface Alert {
  type: 'performance' | 'engagement' | 'system' | 'user_experience';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  actionRequired: boolean;
}

export interface UserMetric {
  userId: string;
  completionTime: number;
  engagementScore: number;
  strugglesEncountered: number;
  interventionsReceived: number;
}

export interface StepMetric {
  stepId: string;
  averageCompletionTime: number;
  completionRate: number;
  averageEngagement: number;
  commonStruggles: string[];
}

export interface PathVariation {
  id: string;
  name: string;
  steps: OnboardingStep[];
  targetPersona: PersonaType[];
}

export interface UserSegment {
  criteria: SegmentCriteria;
  size: number;
  characteristics: Record<string, any>;
}

export interface VariationResult {
  variationId: string;
  metrics: Record<string, number>;
  userFeedback: UserFeedback[];
  statisticalSignificance: number;
}

export interface ExpectedOutcome {
  metric: string;
  expectedValue: number;
  confidence: number;
}

export interface OnboardingInsights {
  strengths: string[];
  improvementAreas: string[];
  personalizedRecommendations: string[];
  nextSteps: string[];
}

export interface LearningOutcome {
  skill: string;
  proficiencyGained: number;
  assessmentScore: number;
  retentionPrediction: number;
}

export interface CohortRecommendation {
  type: 'path_optimization' | 'content_adjustment' | 'intervention_strategy';
  description: string;
  expectedImpact: number;
  implementation: string;
}

export interface TimingFactor {
  factor: string;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface PredictionFactor {
  name: string;
  value: number;
  weight: number;
  confidence: number;
}

export interface ContentImprovement {
  type: 'clarity' | 'engagement' | 'accessibility' | 'personalization';
  description: string;
  impact: number;
}

// CompletionCriteria and ValidationRule are now imported from '../types' to avoid duplication

// AI Help Generator Interface
export interface AIHelpGenerator {
  /**
   * Generate contextual help content based on user state and context
   */
  generateHelp(context: HelpContext, userState: any): Promise<HelpContent>;

  /**
   * Simplify text for beginner users
   */
  simplifyText(text: string): Promise<string>;

  /**
   * Enhance text with more technical details for advanced users
   */
  enhanceText(text: string): Promise<string>;

  /**
   * Simplify language and vocabulary
   */
  simplifyLanguage(text: string): Promise<string>;

  /**
   * Generate practical examples for the current context
   */
  generateExamples(context: any, count?: number): Promise<any[]>;

  /**
   * Generate visual aid suggestions
   */
  generateVisualAids(context: any): Promise<any[]>;

  /**
   * Generate interactive element suggestions
   */
  generateInteractiveElements(context: any): Promise<any[]>;
}

// Help Context Interface
export interface HelpContext {
  currentStep: string;
  userAction?: string;
  difficulty?: 'low' | 'medium' | 'high';
  topic?: string;
  userLevel?: string;
  stepId?: string;
}

// Help Level Type
export type HelpLevel = 'brief' | 'standard' | 'detailed';

// Adaptive Onboarding Integration Interface
export interface AdaptiveOnboardingIntegration {
  /**
   * Migrate user from existing onboarding to smart onboarding
   */
  migrateUser(userId: string, existingState: any): Promise<MigrationResult>;

  /**
   * Synchronize state between systems
   */
  synchronizeState(userId: string): Promise<void>;

  /**
   * Handle fallback to existing system
   */
  fallbackToExisting(userId: string, reason: string): Promise<void>;

  /**
   * Check if smart onboarding is available
   */
  isSmartOnboardingAvailable(): Promise<boolean>;

  /**
   * Get unified onboarding state
   */
  getUnifiedState(userId: string): Promise<OnboardingJourney>;
}

// Migration Result Interface
export interface MigrationResult {
  success: boolean;
  userId: string;
  message: string;
  migratedData: {
    profile: UserProfile;
    journey: OnboardingJourney;
    persona: UserPersona;
  } | null;
  warnings: string[];
  errors: string[];
}