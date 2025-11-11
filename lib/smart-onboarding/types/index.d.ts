/**
 * Base interface for entities with unique identifiers
 */
export interface BaseEntity {
    id: string;
}
/**
 * Base interface for entities with timestamps
 */
export interface TimestampedEntity {
    createdAt: Date;
    updatedAt?: Date;
}
/**
 * Base interface for user-associated entities
 */
export interface UserAssociatedEntity extends BaseEntity {
    userId: string;
}
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type PersonaType = 'content_creator' | 'business_user' | 'influencer' | 'agency' | 'casual_user';
export type LearningStyle = 'visual' | 'hands_on' | 'guided' | 'exploratory';
export type ExperienceLevel = 'none' | 'basic' | 'intermediate' | 'advanced';
export type BehaviorEventType = 'click' | 'scroll' | 'hover' | 'focus' | 'blur' | 'keypress' | 'mouse_movement' | 'hesitation' | 'backtrack' | 'error' | 'help_request';
export type InterventionTrigger = 'struggle_detected' | 'low_engagement' | 'confusion_pattern' | 'time_threshold' | 'error_frequency';
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
export interface OnboardingJourney extends UserAssociatedEntity, TimestampedEntity {
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
/**
 * Represents the current context of a user's onboarding session
 * Used for making context-aware decisions and adaptations
 */
export interface OnboardingContext {
    userId: string;
    sessionId: string;
    currentStepId: string;
    completedSteps: string[];
    userProfile: UserProfile;
    userPersona: UserPersona;
    currentEngagement: number;
    recentInteractions: InteractionEvent[];
    strugglingIndicators: StruggleIndicator[];
    timeInCurrentStep: number;
    totalTimeSpent: number;
    deviceContext: {
        deviceType: 'desktop' | 'tablet' | 'mobile';
        screenSize: {
            width: number;
            height: number;
        };
        browserInfo: BrowserInfo;
    };
    timestamp: Date;
}
/**
 * Represents the final result of an onboarding journey
 * Used for analyzing onboarding success and generating insights
 */
export interface OnboardingResult {
    userId: string;
    journeyId: string;
    success: boolean;
    completionRate: number;
    totalTimeSpent: number;
    stepsCompleted: number;
    totalSteps: number;
    finalEngagementScore: number;
    interventionsUsed: number;
    strugglesEncountered: number;
    learningPathEffectiveness: number;
    userSatisfaction?: number;
    insights: {
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
    };
    completedAt: Date;
    metadata?: Record<string, any>;
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
    result?: StepResult;
    completedAt?: Date;
}
export interface StepResult {
    success: boolean;
    timeSpent?: number;
    expectedTime?: number;
    engagementScore?: number;
    errors?: Array<{
        message: string;
        timestamp: Date;
    }>;
    completionData?: Record<string, any>;
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
export interface BehaviorEvent extends UserAssociatedEntity {
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
    location: {
        x: number;
        y: number;
    };
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
    screenResolution: {
        width: number;
        height: number;
    };
    viewportSize: {
        width: number;
        height: number;
    };
    deviceType: 'desktop' | 'tablet' | 'mobile';
    browserInfo: BrowserInfo;
    simulationStep?: number;
    persona?: PersonaType;
    isSimulated?: boolean;
    sessionId?: string;
    journeyId?: string;
}
export interface BrowserInfo {
    name: string;
    version: string;
    language: string;
    timezone: string;
}
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
    timeWindow: {
        start: Date;
        end: Date;
    };
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
export interface Intervention extends UserAssociatedEntity, TimestampedEntity {
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
/**
 * Represents the outcome of a delivered intervention
 * Used for tracking intervention effectiveness and user response
 */
export interface InterventionOutcome {
    interventionId: string;
    userId: string;
    userResponse: 'accepted' | 'dismissed' | 'ignored' | 'completed';
    engagementChange: number;
    completionImpact: number;
    timeToResolution?: number;
    userFeedback?: UserFeedback;
    timestamp: Date;
    metadata?: Record<string, any>;
}
/**
 * Represents a planned intervention strategy
 * Used for coordinating multiple interventions and tracking their execution
 */
export interface InterventionPlan extends UserAssociatedEntity, TimestampedEntity {
    interventions: Intervention[];
    strategy: 'immediate' | 'delayed' | 'conditional' | 'sequential';
    priority: 'low' | 'medium' | 'high' | 'critical';
    triggers: InterventionTrigger[];
    expectedOutcome: {
        engagementImprovement: number;
        completionProbabilityIncrease: number;
        estimatedTimeToResolution: number;
    };
    createdAt: Date;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
}
/**
 * Historical record of interventions for a user
 * Used for analyzing intervention patterns and effectiveness over time
 */
export interface InterventionHistory {
    userId: string;
    interventions: Intervention[];
    totalInterventions: number;
    acceptanceRate: number;
    averageEffectiveness: number;
    mostEffectiveTypes: string[];
    timeRange: {
        start: Date;
        end: Date;
    };
}
export interface UserFeedback {
    rating: number;
    comment?: string;
    helpful: boolean;
    timestamp: Date;
    category?: 'content' | 'pacing' | 'difficulty' | 'clarity' | 'technical';
}
/**
 * Represents contextual help content for users
 * Used for providing targeted assistance based on user needs
 */
export interface HelpContent {
    id: string;
    type: 'tooltip' | 'tutorial' | 'documentation' | 'video' | 'interactive_guide' | 'faq';
    title: string;
    content: string;
    media?: MediaContent[];
    relatedTopics: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number;
    helpfulness?: number;
    tags: string[];
    lastUpdated: Date;
}
/**
 * Represents a complex issue that requires escalation
 * Used for identifying problems that need human intervention
 */
export interface ComplexIssue {
    id: string;
    userId: string;
    stepId: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    context: Record<string, any>;
    attemptedSolutions: string[];
    userFrustrationLevel: number;
    timestamp: Date;
    category: 'technical' | 'content' | 'navigation' | 'understanding' | 'other';
}
/**
 * Represents an escalation ticket for human support
 * Used for tracking issues that have been escalated beyond automated help
 */
export interface EscalationTicket extends UserAssociatedEntity, TimestampedEntity {
    issueId: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    description: string;
    context: Record<string, any>;
    assignedTo?: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    createdAt: Date;
    resolvedAt?: Date;
    resolution?: string;
    resolutionTime?: number;
}
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
export interface BehavioralInsights {
    userId: string;
    timeWindow: {
        start: Date;
        end: Date;
    };
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
/**
 * Represents a user interaction event during onboarding
 * Used for tracking and analyzing user behavior in real-time
 */
export interface InteractionEvent extends UserAssociatedEntity {
    sessionId: string;
    stepId: string;
    timestamp: Date;
    eventType: BehaviorEventType;
    interactionData: InteractionData;
    engagementScore: number;
    contextualData: ContextualData;
    metadata?: Record<string, any>;
}
/**
 * Represents detected interaction patterns in user behavior
 * Used for identifying behavioral trends and anomalies
 */
export interface InteractionPattern {
    type: 'click_pattern' | 'scroll_pattern' | 'navigation_pattern' | 'hesitation_pattern' | 'engagement_pattern';
    frequency: number;
    confidence: number;
    indicators: string[];
    timeWindow: {
        start: Date;
        end: Date;
    };
    significance: 'low' | 'medium' | 'high';
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
export interface PredictionRequest {
    userId: string;
    features: Record<string, any>;
    modelType?: string;
    context?: Record<string, any>;
}
export interface PredictionResult {
    userId: string;
    predictions: Record<string, any>;
    confidence: number;
    modelVersion: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
/**
 * Represents ML model performance metrics
 * Used for monitoring and evaluating model effectiveness
 */
export interface ModelMetrics {
    modelId: string;
    modelType: string;
    version: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    trainingDate: Date;
    lastEvaluated: Date;
    sampleSize: number;
    performanceTrend: 'improving' | 'stable' | 'declining';
    metadata?: Record<string, any>;
}
/**
 * Represents a summary of a user monitoring session
 * Used for analyzing session-level behavior and outcomes
 */
export interface SessionSummary {
    sessionId: string;
    userId: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    stepsVisited: string[];
    stepsCompleted: string[];
    totalInteractions: number;
    averageEngagement: number;
    strugglesDetected: number;
    interventionsTriggered: number;
    outcome: 'completed' | 'abandoned' | 'paused';
    insights: string[];
}
/**
 * Represents real-time analytics dashboard data
 * Used for displaying comprehensive user analytics
 */
export interface AnalyticsDashboard {
    realTimeMetrics: {
        activeUsers: number;
        averageEngagement: number;
        completionRate: number;
        interventionRate: number;
    };
    engagementTrends: {
        trend: 'increasing' | 'stable' | 'decreasing';
        changeRate: number;
        predictions: Array<{
            timepoint: Date;
            predictedScore: number;
            confidence: number;
            factors: Array<{
                name: string;
                value: number;
                weight: number;
                confidence: number;
            }>;
        }>;
        anomalies: Array<{
            type: 'spike' | 'drop' | 'plateau';
            severity: number;
            timestamp: Date;
            possibleCauses: string[];
        }>;
    };
    progressSummary: {
        totalUsers: number;
        completedJourneys: number;
        averageCompletionTime: number;
        topStruggles: string[];
    };
    alerts: Array<{
        type: 'performance' | 'engagement' | 'system' | 'user_experience';
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        timestamp: Date;
        actionRequired: boolean;
    }>;
}
/**
 * Represents timing prediction for content delivery
 * Used for optimizing when to present content to users
 */
export interface TimingPrediction {
    contentId: string;
    userId: string;
    optimalTime: Date;
    confidence: number;
    factors: {
        userEngagement: number;
        timeOfDay: number;
        dayOfWeek: number;
        userAvailability: number;
    };
    alternativeTimes: Date[];
}
/**
 * Represents effectiveness metrics for a learning path
 * Used for evaluating and optimizing learning paths
 */
export interface PathEffectiveness {
    pathId: string;
    completionRate: number;
    averageTimeToComplete: number;
    averageEngagement: number;
    userSatisfaction: number;
    strugglesPerUser: number;
    interventionsPerUser: number;
    successRate: number;
    cohortSize: number;
    lastEvaluated: Date;
    recommendations: string[];
}
/**
 * Represents criteria for defining a user cohort
 * Used for cohort-based analysis and insights
 */
export interface CohortCriteria {
    personaTypes?: PersonaType[];
    proficiencyLevels?: ProficiencyLevel[];
    learningStyles?: LearningStyle[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    minEngagement?: number;
    completionStatus?: ('completed' | 'active' | 'abandoned')[];
    customFilters?: Record<string, any>;
}
/**
 * Represents insights derived from cohort analysis
 * Used for understanding patterns across user groups
 */
export interface CohortInsights {
    cohortId: string;
    criteria: CohortCriteria;
    userCount: number;
    metrics: {
        averageCompletionRate: number;
        averageEngagement: number;
        averageTimeToComplete: number;
        successRate: number;
    };
    patterns: {
        commonStrugglePoints: string[];
        effectiveInterventions: string[];
        preferredContentTypes: string[];
    };
    recommendations: {
        pathOptimizations: string[];
        contentImprovements: string[];
        interventionStrategies: string[];
    };
    generatedAt: Date;
}
/**
 * Represents outcome data for model training
 * Used for updating prediction models with real results
 */
export interface OutcomeData {
    userId: string;
    journeyId: string;
    success: boolean;
    completionTime: number;
    engagementScore: number;
    interventionsUsed: number;
    pathId: string;
    features: Record<string, any>;
    timestamp: Date;
}
/**
 * Represents performance data for a learning path
 * Used for path optimization and improvement
 */
export interface PathPerformanceData {
    pathId: string;
    userOutcomes: OutcomeData[];
    stepPerformance: {
        stepId: string;
        completionRate: number;
        averageTime: number;
        struggleRate: number;
        skipRate: number;
    }[];
    overallMetrics: {
        totalUsers: number;
        completionRate: number;
        averageEngagement: number;
        successRate: number;
    };
    timeRange: {
        start: Date;
        end: Date;
    };
}
/**
 * Metric point for time-series data
 */
export type MetricPoint = {
    ts: number;
    value: number;
};
/**
 * Real-time system metrics
 */
export type RealTimeMetrics = {
    activeUsers: number;
    avgLatencyMs: number;
    errorRate: number;
};
/**
 * Engagement trend data
 */
export type EngagementTrend = {
    name: string;
    series: MetricPoint[];
};
/**
 * Progress summary statistics
 */
export type ProgressSummary = {
    completed: number;
    inProgress: number;
    blocked: number;
};
/**
 * System alert
 */
export type Alert = {
    code: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    ts: number;
};
/**
 * Adaptation record
 */
export type Adaptation = {
    ruleId: string;
    reason: string;
    ts: number;
    delta?: Record<string, unknown>;
};
/**
 * Deep partial type for nested objects
 */
export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
/**
 * Non-empty array type
 */
export type NonEmptyArray<T> = [T, ...T[]];
/**
 * Cross-environment timer handle
 */
export type TimerHandle = ReturnType<typeof setInterval>;
/**
 * Performance task with abort signal support
 */
export type PerfTask = (signal?: AbortSignal) => Promise<void>;
/**
 * Event bus payload types
 */
export type PerfEvents = {
    tick: {
        cpu: number;
        mem: number;
    };
    scale: {
        from: number;
        to: number;
    };
};
export type EventName = keyof PerfEvents;
export type EventPayload<K extends EventName> = PerfEvents[K];
