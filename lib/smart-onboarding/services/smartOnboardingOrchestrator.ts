// Smart Onboarding System - Main Orchestrator Service

import { Pool } from 'pg';
import { 
  SmartOnboardingOrchestrator,
  OnboardingContext,
  OnboardingJourney,
  JourneyStep,
  AdaptationDecision
} from '../interfaces/services';
import {
  UserProfile,
  UserPersona,
  LearningPath,
  BehaviorEvent,
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

// Journey State Manager
class JourneyStateManager {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async createJourney(userId: string, persona: UserPersona, learningPath: LearningPath): Promise<OnboardingJourney> {
    const journeyId = `journey_${userId}_${Date.now()}`;
    
    const journey: OnboardingJourney = {
      id: journeyId,
      userId,
      status: 'active',
      currentStepIndex: 0,
      steps: this.initializeJourneySteps(learningPath),
      personalization: {
        persona,
        learningPath,
        adaptationHistory: [],
        interventionHistory: []
      },
      progress: {
        completedSteps: 0,
        totalSteps: learningPath.steps.length,
        estimatedTimeRemaining: learningPath.estimatedDuration,
        engagementScore: 0.5,
        difficultyLevel: 1
      },
      metadata: {
        startedAt: new Date(),
        lastActiveAt: new Date(),
        version: '1.0'
      }
    };

    // Store journey in database
    await this.storeJourney(journey);
    
    // Cache journey for quick access
    await smartOnboardingCache.setOnboardingJourney(journeyId, journey);
    
    return journey;
  }

  async updateJourneyState(journeyId: string, updates: Partial<OnboardingJourney>): Promise<OnboardingJourney> {
    // Get current journey
    let journey = await smartOnboardingCache.getOnboardingJourney(journeyId);
    if (!journey) {
      journey = await this.loadJourneyFromDb(journeyId);
    }

    if (!journey) {
      throw new Error(`Journey ${journeyId} not found`);
    }

    // Apply updates
    const updatedJourney = {
      ...journey,
      ...updates,
      metadata: {
        ...journey.metadata,
        lastActiveAt: new Date()
      }
    };

    // Update cache and database
    await smartOnboardingCache.setOnboardingJourney(journeyId, updatedJourney);
    await this.storeJourney(updatedJourney);

    return updatedJourney;
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
    let journey = await smartOnboardingCache.getOnboardingJourney(journeyId);
    if (!journey) {
      journey = await this.loadJourneyFromDb(journeyId);
      if (journey) {
        await smartOnboardingCache.setOnboardingJourney(journeyId, journey);
      }
    }

    if (!journey) {
      throw new Error(`Journey ${journeyId} not found`);
    }

    return journey;
  }

  private initializeJourneySteps(learningPath: LearningPath): JourneyStep[] {
    return learningPath.steps.map((step, index) => ({
      id: step.id,
      type: step.type,
      title: step.title || `Step ${index + 1}`,
      description: step.description || '',
      content: step.content || {},
      estimatedTime: step.estimatedTime || 5,
      difficulty: step.difficulty || 1,
      isOptional: step.isOptional || false,
      adaptationPoints: step.adaptationPoints || [],
      status: 'pending',
      startedAt: undefined,
      completedAt: undefined,
      result: undefined
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
    return {
      id: row.id,
      userId: row.user_id,
      status: row.status,
      currentStepIndex: row.current_step_index,
      steps: JSON.parse(row.steps),
      personalization: JSON.parse(row.personalization),
      progress: JSON.parse(row.progress),
      metadata: JSON.parse(row.metadata)
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
      helpRequests: behaviorData.filter(e => e.eventType === 'help_requested').length,
      strugglingIndicators: []
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
    const engagementScore = await this.analyticsService.calculateEngagementScore(userId, behaviorData);
    const currentProficiency = await this.mlEngine.assessTechnicalProficiency(
      behaviorData.map(e => ({
        userId: e.userId,
        stepId: e.stepId,
        clickCount: e.interactionData.clickPatterns?.length || 0,
        errorCount: e.eventType === 'error' ? 1 : 0,
        helpRequests: e.eventType === 'help_requested' ? 1 : 0,
        usedAdvancedFeatures: e.interactionData.advancedFeatureUsed || false,
        timestamp: e.timestamp
      }))
    );

    return {
      engagementScore,
      currentProficiency,
      recentBehaviorTrends: this.analyzeBehaviorTrends(behaviorData),
      motivationLevel: this.assessMotivationLevel(behaviorData),
      frustrationLevel: this.assessFrustrationLevel(behaviorData)
    };
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
    const goalProgressEvents = behaviorData.filter(e => e.eventType === 'goal_progress');
    const completionEvents = behaviorData.filter(e => e.eventType === 'step_completed');
    
    const motivationScore = (goalProgressEvents.length * 0.3 + completionEvents.length * 0.7) / behaviorData.length;
    return Math.min(1, motivationScore * 2);
  }

  private assessFrustrationLevel(behaviorData: BehaviorEvent[]): number {
    const errorEvents = behaviorData.filter(e => e.eventType === 'error');
    const helpEvents = behaviorData.filter(e => e.eventType === 'help_requested');
    const backtrackEvents = behaviorData.filter(e => e.eventType === 'step_backtrack');
    
    const frustrationScore = (errorEvents.length * 0.4 + helpEvents.length * 0.3 + backtrackEvents.length * 0.3) / behaviorData.length;
    return Math.min(1, frustrationScore * 3);
  }
}

// Main Smart Onboarding Orchestrator Implementation
export class SmartOnboardingOrchestratorImpl implements SmartOnboardingOrchestrator {
  private db: Pool;
  private mlEngine: MLPersonalizationEngineImpl;
  private analyticsService: BehavioralAnalyticsServiceImpl;
  private journeyManager: JourneyStateManager;
  private progressionEngine: AIStepProgressionEngine;

  constructor() {
    this.db = smartOnboardingDb;
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
        currentStep: 'start',
        sessionId: `session_${userId}_${Date.now()}`,
        userAgent: '', // Would be provided by client
        timestamp: new Date()
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
        trigger: trigger.type,
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
      const preparationStep: JourneyStep = {
        id: `prep_${currentStep.id}`,
        type: 'preparation',
        title: 'Preparation Step',
        description: 'Additional preparation before the main step',
        content: decision.parameters,
        estimatedTime: 3,
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
    switch (trigger.type) {
      case 'engagement_drop':
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
        
      case 'error_spike':
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