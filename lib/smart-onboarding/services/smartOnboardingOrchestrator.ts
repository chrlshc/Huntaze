/**
 * Smart Onboarding System - Main Orchestrator Service
 * 
 * Handles onboarding journey orchestration with AI-driven personalization
 * 
 * @module SmartOnboardingOrchestrator
 */

import { Pool } from 'pg';
import { 
  OnboardingContext,
  OnboardingJourney
} from '../interfaces/services';
import {
  UserProfile,
  UserPersona,
  LearningPath,
  BehaviorEvent,
  InteractionEvent,
  InteractionPattern,
  OnboardingStep,
  AdaptationDecision,
  OnboardingState,
  JourneyStatus,
  StepResult,
  InterventionTrigger,
  AdaptationPoint
} from '../types';
import { MLPersonalizationEngineImpl } from './mlPersonalizationEngine';
import { BehavioralAnalyticsServiceImpl } from './behavioralAnalyticsService';
import { smartOnboardingCache } from '../config/redis';
import { smartOnboardingDb } from '../config/database';
import { retryWithBackoff, RetryOptions } from '../utils/retryStrategy';
import { logger } from '@/lib/utils/logger';

/**
 * API Response Types for type safety
 */
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Type aliases for API responses
type JourneyAPIResponse = APIResponse<OnboardingJourney>;
type AdaptationAPIResponse = APIResponse<AdaptationDecision>;

/**
 * Error codes for API operations
 */
enum OrchestratorErrorCode {
  JOURNEY_NOT_FOUND = 'JOURNEY_NOT_FOUND',
  INVALID_STATE = 'INVALID_STATE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  ML_ENGINE_ERROR = 'ML_ENGINE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

/**
 * Custom error class for orchestrator operations
 */
class OrchestratorError extends Error {
  constructor(
    public code: OrchestratorErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'OrchestratorError';
  }
}

// Journey State Manager
class JourneyStateManager {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async createJourney(userId: string, persona: UserPersona, learningPath: LearningPath): Promise<OnboardingJourney> {
    const journeyId = `journey_${userId}_${Date.now()}`;
    
    logger.info('Creating onboarding journey', {
      userId,
      journeyId,
      personaType: persona.personaType,
      pathStrategy: learningPath.strategy
    });

    try {
      const steps = this.initializeJourneySteps(learningPath);
      
      const journey: OnboardingJourney = {
        id: journeyId,
        userId,
        status: 'active',
        currentStep: steps[0],
        completedSteps: [],
        personalizedPath: learningPath,
        engagementHistory: [],
        interventions: [],
        predictedSuccessRate: 0.7,
        estimatedCompletionTime: learningPath.estimatedDuration,
        adaptationHistory: [],
        startedAt: new Date(),
        lastActiveAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Initialize new properties
        steps,
        currentStepIndex: 0,
        personalization: {
          interventionHistory: [],
          adaptationHistory: []
        },
        progress: {
          totalSteps: steps.length,
          completedSteps: 0,
          estimatedTimeRemaining: learningPath.estimatedDuration,
          engagementScore: 0.5
        },
        metadata: {
          lastActiveAt: new Date()
        }
      };

      // Store journey in database with retry
      await retryWithBackoff(
        () => this.storeJourney(journey),
        { maxRetries: 3, initialDelay: 1000 }
      );
      
      // Cache journey for quick access (non-critical, don't fail on error)
      try {
        // TODO: Implement setOnboardingJourney in cache
        // await smartOnboardingCache.setOnboardingJourney(journeyId, journey);
      } catch (cacheError) {
        logger.warn('Failed to cache journey', { journeyId, error: cacheError });
      }
      
      logger.info('Journey created successfully', { journeyId, stepCount: steps.length });
      return journey;

    } catch (error) {
      logger.error('Failed to create journey', error instanceof Error ? error : new Error(String(error)), { userId, journeyId });
      throw new OrchestratorError(
        OrchestratorErrorCode.DATABASE_ERROR,
        'Failed to create onboarding journey',
        { userId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  async updateJourneyState(journeyId: string, updates: Partial<OnboardingJourney>): Promise<OnboardingJourney> {
    logger.info('Updating journey state', { journeyId, updates: Object.keys(updates) });

    try {
      // Get current journey with retry
      const journey = await retryWithBackoff(
        () => this.loadJourneyFromDb(journeyId),
        { maxRetries: 2, initialDelay: 500 }
      );

      if (!journey) {
        throw new OrchestratorError(
          OrchestratorErrorCode.JOURNEY_NOT_FOUND,
          `Journey not found: ${journeyId}`,
          { journeyId }
        );
      }

      // Apply updates with proper metadata merging
      const updatedJourney = {
        ...journey,
        ...updates,
        metadata: {
          ...(journey.metadata || {}),
          ...(updates.metadata || {}),
          lastActiveAt: new Date()
        },
        updatedAt: new Date()
      };

      // Update database with retry
      await retryWithBackoff(
        () => this.storeJourney(updatedJourney),
        { maxRetries: 3, initialDelay: 1000 }
      );

      // Update cache (non-critical)
      try {
        // TODO: Implement setOnboardingJourney in cache
        // await smartOnboardingCache.setOnboardingJourney(journeyId, updatedJourney);
      } catch (cacheError) {
        logger.warn('Failed to update journey cache', { journeyId, error: cacheError });
      }

      logger.info('Journey state updated', { journeyId, status: updatedJourney.status });
      return updatedJourney;

    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error;
      }
      
      logger.error('Failed to update journey state', error instanceof Error ? error : new Error(String(error)), { journeyId });
      throw new OrchestratorError(
        OrchestratorErrorCode.DATABASE_ERROR,
        'Failed to update journey state',
        { journeyId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  async progressToNextStep(journeyId: string, stepResult: StepResult): Promise<OnboardingJourney> {
    const journey = await this.getJourney(journeyId);
    
    // Update current step with result
    if (journey.steps[journey.currentStepIndex]) {
      journey.steps[journey.currentStepIndex].result = stepResult;
      journey.steps[journey.currentStepIndex].completedAt = new Date();
    }

    // Calculate new progress
    const completedSteps = journey.progress.completedSteps + 1;
    const progressPercentage = completedSteps / journey.progress.totalSteps;
    
    // Update journey state
    const updates: Partial<OnboardingJourney> = {
      currentStepIndex: Math.min(journey.currentStepIndex + 1, journey.steps.length - 1),
      progress: {
        ...journey.progress,
        completedSteps,
        estimatedTimeRemaining: Math.max(0, journey.progress.estimatedTimeRemaining - (stepResult.timeSpent || 0))
      }
    };

    // Check if journey is complete
    if (completedSteps >= journey.progress.totalSteps) {
      updates.status = 'completed';
      updates.metadata = {
        ...journey.metadata,
        completedAt: new Date()
      };
    }

    return await this.updateJourneyState(journeyId, updates);
  }

  async getJourney(journeyId: string): Promise<OnboardingJourney> {
    logger.info('Fetching journey', { journeyId });

    try {
      // Try cache first (TODO: implement cache methods)
      // let journey = await smartOnboardingCache.getOnboardingJourney(journeyId);
      
      // Load from database with retry
      const journey = await retryWithBackoff(
        () => this.loadJourneyFromDb(journeyId),
        { maxRetries: 2, initialDelay: 500 }
      );

      if (!journey) {
        throw new OrchestratorError(
          OrchestratorErrorCode.JOURNEY_NOT_FOUND,
          `Journey not found: ${journeyId}`,
          { journeyId }
        );
      }

      // Update cache (non-critical)
      try {
        // TODO: Implement setOnboardingJourney in cache
        // await smartOnboardingCache.setOnboardingJourney(journeyId, journey);
      } catch (cacheError) {
        logger.warn('Failed to cache journey', { journeyId, error: cacheError });
      }

      return journey;

    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error;
      }
      
      logger.error('Failed to fetch journey', error instanceof Error ? error : new Error(String(error)), { journeyId });
      throw new OrchestratorError(
        OrchestratorErrorCode.DATABASE_ERROR,
        'Failed to fetch journey',
        { journeyId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private initializeJourneySteps(learningPath: LearningPath): OnboardingStep[] {
    return learningPath.steps.map((step, index) => ({
      id: step.id,
      type: step.type,
      title: step.title || `Step ${index + 1}`,
      description: step.description || '',
      content: step.content || {},
      estimatedDuration: step.estimatedDuration || step.estimatedTime || 5,
      estimatedTime: step.estimatedTime || step.estimatedDuration || 5,
      prerequisites: step.prerequisites || [],
      learningObjectives: step.learningObjectives || [],
      adaptationRules: step.adaptationRules || [],
      completionCriteria: step.completionCriteria || {
        type: 'interaction_based' as const,
        threshold: 1,
        conditions: []
      },
      difficulty: step.difficulty || 1,
      isOptional: step.isOptional || false,
      adaptationPoints: step.adaptationPoints || [],
      status: 'pending' as const,
      startedAt: undefined,
      completedAt: undefined,
      result: undefined,
      personalizedContent: step.personalizedContent,
      adaptationTriggers: step.adaptationTriggers,
      successPrediction: step.successPrediction
    }));
  }

  private async storeJourney(journey: OnboardingJourney): Promise<void> {
    const query = `
      INSERT INTO smart_onboarding_journeys 
      (id, user_id, status, current_step_index, steps, personalization, progress, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        current_step_index = EXCLUDED.current_step_index,
        steps = EXCLUDED.steps,
        personalization = EXCLUDED.personalization,
        progress = EXCLUDED.progress,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `;

    await this.db.query(query, [
      journey.id,
      journey.userId,
      journey.status,
      journey.currentStepIndex,
      JSON.stringify(journey.steps),
      JSON.stringify(journey.personalization),
      JSON.stringify(journey.progress),
      JSON.stringify(journey.metadata)
    ]);
  }

  private async loadJourneyFromDb(journeyId: string): Promise<OnboardingJourney | null> {
    const query = `
      SELECT * FROM smart_onboarding_journeys 
      WHERE id = $1
    `;

    const result = await this.db.query(query, [journeyId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const steps = JSON.parse(row.steps);
    const personalization = JSON.parse(row.personalization);
    const progress = JSON.parse(row.progress);
    const metadata = JSON.parse(row.metadata);
    
    return {
      id: row.id,
      userId: row.user_id,
      status: row.status,
      currentStepIndex: row.current_step_index,
      steps,
      personalization,
      progress,
      metadata,
      // Required properties from OnboardingJourney interface
      currentStep: steps[row.current_step_index] || steps[0],
      completedSteps: steps.filter((s: any) => s.status === 'completed'),
      personalizedPath: JSON.parse(row.personalized_path || '{}'),
      engagementHistory: JSON.parse(row.engagement_history || '[]'),
      interventions: JSON.parse(row.interventions || '[]'),
      predictedSuccessRate: row.predicted_success_rate || 0.7,
      estimatedCompletionTime: row.estimated_completion_time || 0,
      adaptationHistory: JSON.parse(row.adaptation_history || '[]'),
      startedAt: new Date(row.started_at),
      lastActiveAt: new Date(row.last_active_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

// Step Progression Logic with AI-driven Decision Making
class AIStepProgressionEngine {
  private mlEngine: MLPersonalizationEngineImpl;
  private analyticsService: BehavioralAnalyticsServiceImpl;

  constructor(mlEngine: MLPersonalizationEngineImpl, analyticsService: BehavioralAnalyticsServiceImpl) {
    this.mlEngine = mlEngine;
    this.analyticsService = analyticsService;
  }

  async determineNextStep(
    journey: OnboardingJourney, 
    currentStepResult: StepResult,
    behaviorData: BehaviorEvent[]
  ): Promise<AdaptationDecision> {
    // Analyze current step performance
    const stepAnalysis = await this.analyzeStepPerformance(currentStepResult, behaviorData);
    
    // Get user's current state
    const userState = await this.assessUserState(journey.userId, behaviorData);
    
    // Check for intervention triggers
    const interventionNeeded = await this.checkInterventionTriggers(journey, stepAnalysis, userState);
    
    if (interventionNeeded) {
      return await this.generateInterventionDecision(journey, stepAnalysis, userState);
    }

    // Determine optimal next step
    return await this.generateProgressionDecision(journey, stepAnalysis, userState);
  }

  private async analyzeStepPerformance(stepResult: StepResult, behaviorData: BehaviorEvent[]): Promise<any> {
    const analysis = {
      completionTime: stepResult.timeSpent || 0,
      successRate: stepResult.success ? 1 : 0,
      engagementLevel: stepResult.engagementScore || 0.5,
      errorCount: stepResult.errors?.length || 0,
      helpRequests: behaviorData.filter(e => e.eventType === 'help_request').length,
      strugglingIndicators: [] as string[]
    };

    // Identify struggling indicators
    if (analysis.completionTime > (stepResult.expectedTime || 300) * 1.5) {
      analysis.strugglingIndicators.push('slow_completion');
    }
    
    if (analysis.errorCount > 2) {
      analysis.strugglingIndicators.push('high_error_rate');
    }
    
    if (analysis.engagementLevel < 0.4) {
      analysis.strugglingIndicators.push('low_engagement');
    }
    
    if (analysis.helpRequests > 1) {
      analysis.strugglingIndicators.push('frequent_help_seeking');
    }

    return analysis;
  }

  private async assessUserState(userId: string, behaviorData: BehaviorEvent[]): Promise<any> {
    // Get current engagement and proficiency
    const interactionEvents: InteractionEvent[] = behaviorData.map(e => ({
      id: e.id,
      userId: e.userId,
      sessionId: (e.contextualData as any)?.sessionId || '',
      stepId: e.stepId,
      timestamp: e.timestamp,
      eventType: e.eventType,
      interactionData: e.interactionData,
      engagementScore: e.engagementScore || 0,
      contextualData: e.contextualData
    }));

    const engagementScore = await this.analyticsService.calculateEngagementScore(interactionEvents);
    const interactionPatterns = this.toInteractionPatterns(behaviorData);
    const currentProficiency = await this.mlEngine.assessTechnicalProficiency(interactionPatterns);

    return {
      engagementScore,
      currentProficiency,
      recentBehaviorTrends: this.analyzeBehaviorTrends(behaviorData),
      motivationLevel: this.assessMotivationLevel(behaviorData),
      frustrationLevel: this.assessFrustrationLevel(behaviorData)
    };
  }

  // Map raw behavior events to coarse interaction patterns for proficiency assessment
  private toInteractionPatterns(events: BehaviorEvent[]): InteractionPattern[] {
    if (!events.length) {
      const now = new Date();
      return [{
        type: 'engagement_pattern',
        frequency: 0,
        confidence: 0.5,
        indicators: [],
        timeWindow: { start: now, end: now },
        significance: 'low'
      }];
    }

    const start = events[0].timestamp;
    const end = events[events.length - 1].timestamp;
    const durationSec = Math.max(1, (end.getTime() - start.getTime()) / 1000);
    const freqPerMin = (events.length / durationSec) * 60;
    const errorCount = events.filter(e => e.eventType === 'error').length;
    const helpCount = events.filter(e => e.eventType === 'help_request').length;

    const significance: InteractionPattern['significance'] =
      freqPerMin > 10 || errorCount > 5 ? 'high' : freqPerMin > 3 ? 'medium' : 'low';

    const indicators: string[] = [];
    if (errorCount > 0) indicators.push('error_activity');
    if (helpCount > 0) indicators.push('help_seeking');

    return [{
      type: 'engagement_pattern',
      frequency: freqPerMin,
      confidence: 0.7,
      indicators,
      timeWindow: { start, end },
      significance
    }];
  }

  private async checkInterventionTriggers(
    journey: OnboardingJourney, 
    stepAnalysis: any, 
    userState: any
  ): Promise<boolean> {
    const triggers = [
      // Low engagement trigger
      userState.engagementScore < 0.3,
      
      // High error rate trigger
      stepAnalysis.errorCount > 3,
      
      // Excessive time spent trigger
      stepAnalysis.completionTime > 600, // 10 minutes
      
      // Multiple struggling indicators
      stepAnalysis.strugglingIndicators.length >= 2,
      
      // High frustration level
      userState.frustrationLevel > 0.7
    ];

    return triggers.some(trigger => trigger);
  }

  private async generateInterventionDecision(
    journey: OnboardingJourney, 
    stepAnalysis: any, 
    userState: any
  ): Promise<AdaptationDecision> {
    const interventions = [];

    // Determine appropriate interventions
    if (userState.engagementScore < 0.3) {
      interventions.push({
        type: 'engagement_boost',
        action: 'show_motivational_content',
        parameters: { contentType: 'encouragement', duration: 30 }
      });
    }

    if (stepAnalysis.strugglingIndicators.includes('high_error_rate')) {
      interventions.push({
        type: 'assistance',
        action: 'provide_guided_help',
        parameters: { helpLevel: 'detailed', showHints: true }
      });
    }

    if (stepAnalysis.strugglingIndicators.includes('slow_completion')) {
      interventions.push({
        type: 'simplification',
        action: 'break_down_step',
        parameters: { subSteps: 2, addExplanations: true }
      });
    }

    return {
      type: 'intervention',
      action: 'apply_interventions',
      interventions,
      reasoning: `User showing ${stepAnalysis.strugglingIndicators.length} struggling indicators`,
      confidence: 0.8,
      expectedImpact: 0.4
    };
  }

  private async generateProgressionDecision(
    journey: OnboardingJourney, 
    stepAnalysis: any, 
    userState: any
  ): Promise<AdaptationDecision> {
    const nextStepIndex = journey.currentStepIndex + 1;
    
    // Check if we're at the end
    if (nextStepIndex >= journey.steps.length) {
      return {
        type: 'completion',
        action: 'complete_journey',
        reasoning: 'All steps completed successfully',
        confidence: 1.0,
        expectedImpact: 1.0
      };
    }

    const nextStep = journey.steps[nextStepIndex];
    
    // Determine if step should be adapted
    if (userState.currentProficiency === 'expert' && nextStep.difficulty <= 2) {
      return {
        type: 'adaptation',
        action: 'skip_or_accelerate',
        parameters: { 
          skipBasicSteps: true, 
          acceleratedContent: true 
        },
        reasoning: 'User proficiency exceeds step difficulty',
        confidence: 0.9,
        expectedImpact: 0.3
      };
    }

    if (userState.currentProficiency === 'beginner' && nextStep.difficulty >= 3) {
      return {
        type: 'adaptation',
        action: 'add_preparation_step',
        parameters: { 
          preparationContent: true, 
          additionalExplanations: true 
        },
        reasoning: 'Step difficulty exceeds user proficiency',
        confidence: 0.8,
        expectedImpact: 0.4
      };
    }

    // Standard progression
    return {
      type: 'progression',
      action: 'proceed_to_next_step',
      reasoning: 'Normal progression based on performance',
      confidence: 0.7,
      expectedImpact: 0.2
    };
  }

  private analyzeBehaviorTrends(behaviorData: BehaviorEvent[]): any {
    const recentEvents = behaviorData.slice(-10); // Last 10 events
    
    return {
      engagementTrend: this.calculateTrend(recentEvents.map(e => e.engagementScore)),
      errorTrend: this.calculateTrend(recentEvents.map(e => e.eventType === 'error' ? 1 : 0)),
      speedTrend: this.calculateTrend(recentEvents.map(e => e.interactionData.timeSpent || 0))
    };
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (Math.abs(difference) < 0.1) return 'stable';
    return difference > 0 ? 'increasing' : 'decreasing';
  }

  private assessMotivationLevel(behaviorData: BehaviorEvent[]): number {
    const completionEvents = behaviorData.filter(e => e.eventType === 'step_completed');
    const motivationScore = completionEvents.length / Math.max(1, behaviorData.length);
    return Math.max(0, Math.min(1, motivationScore));
  }

  private assessFrustrationLevel(behaviorData: BehaviorEvent[]): number {
    const errorEvents = behaviorData.filter(e => e.eventType === 'error');
    const helpEvents = behaviorData.filter(e => e.eventType === 'help_request');
    const backtrackEvents = behaviorData.filter(e => e.eventType === 'backtrack');
    const frustrationScore = (errorEvents.length * 0.4 + helpEvents.length * 0.3 + backtrackEvents.length * 0.3) / Math.max(1, behaviorData.length);
    return Math.max(0, Math.min(1, frustrationScore));
  }
}

// Main Smart Onboarding Orchestrator Implementation
export class SmartOnboardingOrchestratorImpl {
  private db: Pool;
  private mlEngine: MLPersonalizationEngineImpl;
  private analyticsService: BehavioralAnalyticsServiceImpl;
  private journeyManager: JourneyStateManager;
  private progressionEngine: AIStepProgressionEngine;

  constructor() {
    this.db = smartOnboardingDb.getPool();
    this.mlEngine = new MLPersonalizationEngineImpl(this.db);
    this.analyticsService = new BehavioralAnalyticsServiceImpl(this.db);
    this.journeyManager = new JourneyStateManager(this.db);
    this.progressionEngine = new AIStepProgressionEngine(this.mlEngine, this.analyticsService);
  }

  async startOnboardingJourney(userId: string, profileData: UserProfile): Promise<OnboardingJourney> {
    try {
      // Analyze user profile and generate persona
      const persona = await this.mlEngine.analyzeUserProfile(profileData);
      
      // Create onboarding context
      const context: OnboardingContext = {
        userId,
        sessionId: `session_${userId}_${Date.now()}`,
        currentStepId: 'start',
        completedSteps: [],
        userProfile: {
          id: userId,
          email: '',
          socialConnections: [],
          technicalProficiency: 'beginner',
          contentCreationGoals: [],
          platformPreferences: [],
          learningStyle: 'visual',
          timeConstraints: { availableHoursPerWeek: 0, preferredTimeSlots: [], urgencyLevel: 'low' },
          previousExperience: 'none',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        userPersona: {
          personaType: 'casual_user',
          confidenceScore: 0.5,
          characteristics: [],
          predictedBehaviors: [],
          recommendedApproach: { pacing: 'medium', complexity: 'simple', interactivity: 'medium', supportLevel: 'moderate' },
          lastUpdated: new Date(),
        },
        currentEngagement: 0.5,
        recentInteractions: [],
        strugglingIndicators: [],
        timeInCurrentStep: 0,
        totalTimeSpent: 0,
        deviceContext: {
          deviceType: 'desktop',
          screenSize: { width: 1920, height: 1080 },
          browserInfo: { name: 'unknown', version: '1.0', language: 'en', timezone: 'UTC' },
        },
        timestamp: new Date(),
      };
      
      // Predict optimal learning path
      const learningPath = await this.mlEngine.predictOptimalPath(userId, context);
      
      // Create journey
      const journey = await this.journeyManager.createJourney(userId, persona, learningPath);
      
      // Log journey start
      await this.logJourneyEvent(journey.id, 'journey_started', {
        persona: persona.personaType,
        pathStrategy: learningPath.strategy,
        estimatedDuration: learningPath.estimatedDuration
      });
      
      return journey;
      
    } catch (error) {
      console.error('Error starting onboarding journey:', error);
      throw error;
    }
  }

  async processStepCompletion(
    journeyId: string, 
    stepResult: StepResult, 
    behaviorData: BehaviorEvent[]
  ): Promise<OnboardingJourney> {
    try {
      // Get current journey
      const journey = await this.journeyManager.getJourney(journeyId);
      
      // Update user model with new behavior data
      await this.mlEngine.updateUserModel(journey.userId, behaviorData);
      
      // Determine next step using AI
      const decision = await this.progressionEngine.determineNextStep(journey, stepResult, behaviorData);
      
      // Apply decision
      const updatedJourney = await this.applyAdaptationDecision(journey, decision, stepResult);
      
      // Log step completion
      await this.logJourneyEvent(journeyId, 'step_completed', {
        stepId: journey.steps[journey.currentStepIndex]?.id,
        result: stepResult,
        decision: decision.type,
        adaptations: decision.interventions || []
      });
      
      return updatedJourney;
      
    } catch (error) {
      console.error('Error processing step completion:', error);
      throw error;
    }
  }

  async adaptJourneyInRealTime(
    journeyId: string, 
    trigger: InterventionTrigger, 
    behaviorData: BehaviorEvent[]
  ): Promise<OnboardingJourney> {
    try {
      const journey = await this.journeyManager.getJourney(journeyId);
      
      // Generate adaptation based on trigger
      const adaptation = await this.generateRealTimeAdaptation(journey, trigger, behaviorData);
      
      // Apply adaptation
      const updatedJourney = await this.applyRealTimeAdaptation(journey, adaptation);
      
      // Log adaptation
      await this.logJourneyEvent(journeyId, 'real_time_adaptation', {
        trigger: trigger,
        adaptation: adaptation.type,
        reason: adaptation.reasoning
      });
      
      return updatedJourney;
      
    } catch (error) {
      console.error('Error adapting journey in real-time:', error);
      throw error;
    }
  }

  async getJourneyStatus(journeyId: string): Promise<OnboardingJourney> {
    return await this.journeyManager.getJourney(journeyId);
  }

  async pauseJourney(journeyId: string): Promise<OnboardingJourney> {
    return await this.journeyManager.updateJourneyState(journeyId, { 
      status: 'paused',
      metadata: {
        pausedAt: new Date()
      }
    });
  }

  async resumeJourney(journeyId: string): Promise<OnboardingJourney> {
    return await this.journeyManager.updateJourneyState(journeyId, { 
      status: 'active',
      metadata: {
        resumedAt: new Date()
      }
    });
  }

  async completeJourney(journeyId: string): Promise<OnboardingJourney> {
    const journey = await this.journeyManager.updateJourneyState(journeyId, { 
      status: 'completed',
      metadata: {
        completedAt: new Date()
      }
    });

    // Log journey completion
    await this.logJourneyEvent(journeyId, 'journey_completed', {
      totalSteps: journey.progress.totalSteps,
      completedSteps: journey.progress.completedSteps,
      finalEngagementScore: journey.progress.engagementScore
    });

    return journey;
  }

  // Private helper methods
  private async applyAdaptationDecision(
    journey: OnboardingJourney, 
    decision: AdaptationDecision, 
    stepResult: StepResult
  ): Promise<OnboardingJourney> {
    let updatedJourney = journey;

    switch (decision.type) {
      case 'progression':
        updatedJourney = await this.journeyManager.progressToNextStep(journey.id, stepResult);
        break;
        
      case 'intervention':
        updatedJourney = await this.applyInterventions(journey, decision.interventions || []);
        break;
        
      case 'adaptation':
        updatedJourney = await this.applyStepAdaptation(journey, decision);
        break;
        
      case 'completion':
        updatedJourney = await this.completeJourney(journey.id);
        break;
    }

    return updatedJourney;
  }

  private async applyInterventions(journey: OnboardingJourney, interventions: any[]): Promise<OnboardingJourney> {
    const updates: Partial<OnboardingJourney> = {
      personalization: {
        ...journey.personalization,
        interventionHistory: [
          ...journey.personalization.interventionHistory,
          {
            timestamp: new Date(),
            interventions,
            stepIndex: journey.currentStepIndex
          }
        ]
      }
    };

    return await this.journeyManager.updateJourneyState(journey.id, updates);
  }

  private async applyStepAdaptation(journey: OnboardingJourney, decision: AdaptationDecision): Promise<OnboardingJourney> {
    const currentStep = journey.steps[journey.currentStepIndex];
    
    if (decision.action === 'skip_or_accelerate') {
      // Skip to next significant step
      const nextStepIndex = Math.min(journey.currentStepIndex + 2, journey.steps.length - 1);
      return await this.journeyManager.updateJourneyState(journey.id, {
        currentStepIndex: nextStepIndex
      });
    }
    
    if (decision.action === 'add_preparation_step') {
      // Insert preparation step
      const preparationStep: OnboardingStep = {
        id: `prep_${currentStep.id}`,
        type: 'preparation',
        title: 'Preparation Step',
        description: 'Additional preparation before the main step',
        content: (decision.parameters as any) || {},
        estimatedDuration: 3,
        estimatedTime: 3,
        prerequisites: [],
        learningObjectives: [],
        adaptationRules: [],
        completionCriteria: {
          type: 'interaction_based',
          threshold: 1,
          conditions: []
        },
        difficulty: Math.max(1, currentStep.difficulty - 1),
        isOptional: false,
        adaptationPoints: [],
        status: 'pending'
      };
      
      const updatedSteps = [...journey.steps];
      updatedSteps.splice(journey.currentStepIndex + 1, 0, preparationStep);
      
      return await this.journeyManager.updateJourneyState(journey.id, {
        steps: updatedSteps,
        progress: {
          ...journey.progress,
          totalSteps: updatedSteps.length
        }
      });
    }

    return journey;
  }

  private async generateRealTimeAdaptation(
    journey: OnboardingJourney, 
    trigger: InterventionTrigger, 
    behaviorData: BehaviorEvent[]
  ): Promise<AdaptationDecision> {
    // Simplified real-time adaptation logic
    switch (trigger) {
      case 'low_engagement':
        return {
          type: 'intervention',
          action: 'boost_engagement',
          interventions: [{
            type: 'motivation',
            action: 'show_progress_celebration',
            parameters: { showAchievements: true }
          }],
          reasoning: 'Engagement dropped below threshold',
          confidence: 0.7,
          expectedImpact: 0.3
        };
        
      case 'error_frequency':
        return {
          type: 'intervention',
          action: 'provide_assistance',
          interventions: [{
            type: 'help',
            action: 'show_contextual_help',
            parameters: { helpLevel: 'detailed' }
          }],
          reasoning: 'High error rate detected',
          confidence: 0.8,
          expectedImpact: 0.4
        };
        
      default:
        return {
          type: 'progression',
          action: 'continue',
          reasoning: 'No specific adaptation needed',
          confidence: 0.5,
          expectedImpact: 0.1
        };
    }
  }

  private async applyRealTimeAdaptation(
    journey: OnboardingJourney, 
    adaptation: AdaptationDecision
  ): Promise<OnboardingJourney> {
    // Apply real-time adaptations without changing step progression
    const updates: Partial<OnboardingJourney> = {
      personalization: {
        ...journey.personalization,
        adaptationHistory: [
          ...journey.personalization.adaptationHistory,
          {
            timestamp: new Date(),
            adaptation,
            stepIndex: journey.currentStepIndex,
            trigger: 'real_time'
          }
        ]
      }
    };

    return await this.journeyManager.updateJourneyState(journey.id, updates);
  }

  private async logJourneyEvent(journeyId: string, eventType: string, data: any): Promise<void> {
    const query = `
      INSERT INTO smart_onboarding_journey_events 
      (journey_id, event_type, event_data, timestamp)
      VALUES ($1, $2, $3, NOW())
    `;

    await this.db.query(query, [journeyId, eventType, JSON.stringify(data)]);
  }
}
