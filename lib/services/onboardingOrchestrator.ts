/**
 * Onboarding Orchestrator Service
 * Manages the complete onboarding flow and coordinates all services
 */

import { onboardingProfileRepository } from '../db/repositories/onboardingProfileRepository';
import { featureUnlockRepository } from '../db/repositories/featureUnlockRepository';
import { onboardingEventsRepository } from '../db/repositories/onboardingEventsRepository';
import { levelAssessor, QuestionnaireResponse, CreatorLevel } from './levelAssessor';
import { featureUnlocker } from './featureUnlocker';
import { aiAdapter } from './aiAdapter';

export type OnboardingGoal = 'content_creation' | 'growth' | 'monetization' | 'automation';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'assessment' | 'goal_selection' | 'platform_connection' | 'ai_config' | 'completion';
  required: boolean;
  estimatedMinutes: number;
  order: number;
}

export interface OnboardingPath {
  steps: OnboardingStep[];
  totalSteps: number;
  estimatedTotalMinutes: number;
  currentStep: number;
}

export interface OnboardingProgress {
  userId: string;
  currentStep: string;
  completedSteps: string[];
  skippedSteps: string[];
  progress: number;
  creatorLevel: CreatorLevel;
  goals: OnboardingGoal[];
  estimatedTimeRemaining: number;
}

export interface StepCompletionResult {
  success: boolean;
  nextStep?: OnboardingStep;
  unlockedFeatures: string[];
  message: string;
  progress: number;
}

// Define all onboarding steps
const ALL_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Get started with your content creation journey',
    type: 'assessment',
    required: true,
    estimatedMinutes: 1,
    order: 1
  },
  {
    id: 'creator_assessment',
    title: 'Creator Assessment',
    description: 'Help us understand your experience level',
    type: 'assessment',
    required: true,
    estimatedMinutes: 3,
    order: 2
  },
  {
    id: 'goal_selection',
    title: 'Choose Your Goals',
    description: 'What do you want to achieve?',
    type: 'goal_selection',
    required: true,
    estimatedMinutes: 2,
    order: 3
  },
  {
    id: 'first_platform',
    title: 'Connect Your First Platform',
    description: 'Link your social media account',
    type: 'platform_connection',
    required: true,
    estimatedMinutes: 3,
    order: 4
  },
  {
    id: 'ai_configuration',
    title: 'Configure AI Assistant',
    description: 'Personalize your AI helper',
    type: 'ai_config',
    required: true,
    estimatedMinutes: 2,
    order: 5
  },
  {
    id: 'additional_platforms',
    title: 'Connect More Platforms',
    description: 'Unlock cross-platform features',
    type: 'platform_connection',
    required: false,
    estimatedMinutes: 5,
    order: 6
  },
  {
    id: 'completion',
    title: 'You\'re All Set!',
    description: 'Start creating amazing content',
    type: 'completion',
    required: true,
    estimatedMinutes: 1,
    order: 7
  }
];

export class OnboardingOrchestratorService {
  /**
   * Start onboarding for a new user
   */
  async startOnboarding(userId: string): Promise<OnboardingProgress> {
    // Create initial profile
    const profile = await onboardingProfileRepository.create({
      userId,
      creatorLevel: 'beginner',
      primaryGoals: [],
      customPath: []
    });

    // Initialize feature unlock state with all features locked
    const allFeatures = featureUnlocker.getAllFeatures().map(f => f.id);
    await featureUnlockRepository.create(userId, allFeatures);

    // Log start event
    await onboardingEventsRepository.create({
      userId,
      eventType: 'onboarding_started',
      stepId: 'welcome'
    });

    return this.getProgress(userId);
  }

  /**
   * Generate personalized onboarding path based on goals
   */
  generatePath(goals: OnboardingGoal[], level: CreatorLevel): OnboardingPath {
    let steps = [...ALL_STEPS];

    // Customize based on goals
    if (goals.includes('monetization')) {
      // Add monetization-specific steps
      steps.push({
        id: 'monetization_setup',
        title: 'Monetization Setup',
        description: 'Set up your revenue streams',
        type: 'platform_connection',
        required: false,
        estimatedMinutes: 5,
        order: 6.5
      });
    }

    // Sort by order
    steps.sort((a, b) => a.order - b.order);

    // Adjust time estimates based on level
    const timeMultiplier = level === 'beginner' ? 1.5 : level === 'expert' ? 0.7 : 1;
    steps = steps.map(step => ({
      ...step,
      estimatedMinutes: Math.round(step.estimatedMinutes * timeMultiplier)
    }));

    const totalMinutes = steps.reduce((sum, step) => sum + step.estimatedMinutes, 0);

    return {
      steps,
      totalSteps: steps.length,
      estimatedTotalMinutes: totalMinutes,
      currentStep: 0
    };
  }

  /**
   * Get current onboarding progress
   */
  async getProgress(userId: string): Promise<OnboardingProgress> {
    const profile = await onboardingProfileRepository.findByUserId(userId);
    
    if (!profile) {
      throw new Error('Onboarding profile not found');
    }

    const path = this.generatePath(
      profile.primaryGoals as OnboardingGoal[],
      profile.creatorLevel as CreatorLevel
    );

    const completedCount = profile.completedSteps.length;
    const totalSteps = path.steps.filter(s => s.required).length;
    const remainingSteps = path.steps.filter(
      s => !profile.completedSteps.includes(s.id)
    );
    const estimatedTimeRemaining = remainingSteps.reduce(
      (sum, step) => sum + step.estimatedMinutes,
      0
    );

    return {
      userId,
      currentStep: profile.currentStep || 'welcome',
      completedSteps: profile.completedSteps,
      skippedSteps: profile.skippedSteps || [],
      progress: profile.progressPercentage,
      creatorLevel: profile.creatorLevel as CreatorLevel,
      goals: profile.primaryGoals as OnboardingGoal[],
      estimatedTimeRemaining
    };
  }

  /**
   * Complete a step
   */
  async completeStep(
    userId: string,
    stepId: string,
    data?: any
  ): Promise<StepCompletionResult> {
    const profile = await onboardingProfileRepository.findByUserId(userId);
    
    if (!profile) {
      throw new Error('Onboarding profile not found');
    }

    // Validate step
    const step = ALL_STEPS.find(s => s.id === stepId);
    if (!step) {
      return {
        success: false,
        unlockedFeatures: [],
        message: 'Invalid step',
        progress: profile.progressPercentage
      };
    }

    // Handle specific step logic
    await this.handleStepCompletion(userId, stepId, data);

    // Update profile
    const updatedProfile = await onboardingProfileRepository.completeStep(userId, stepId);

    // Check for feature unlocks
    const unlockedFeatures = await featureUnlocker.checkAndUnlockEligibleFeatures(userId);

    // Log completion event
    await onboardingEventsRepository.create({
      userId,
      eventType: 'step_completed',
      stepId,
      metadata: { unlockedFeatures }
    });

    // Get next step
    const path = this.generatePath(
      updatedProfile.primaryGoals as OnboardingGoal[],
      updatedProfile.creatorLevel as CreatorLevel
    );
    const nextStep = path.steps.find(
      s => !updatedProfile.completedSteps.includes(s.id) && 
           !updatedProfile.skippedSteps?.includes(s.id)
    );

    return {
      success: true,
      nextStep,
      unlockedFeatures,
      message: `${step.title} completed!`,
      progress: updatedProfile.progressPercentage
    };
  }

  /**
   * Handle step-specific completion logic
   */
  private async handleStepCompletion(
    userId: string,
    stepId: string,
    data?: any
  ): Promise<void> {
    switch (stepId) {
      case 'creator_assessment':
        if (data?.responses) {
          const assessment = levelAssessor.assessLevel(data.responses as QuestionnaireResponse);
          await onboardingProfileRepository.update(userId, {
            creatorLevel: assessment.level
          });
        }
        break;

      case 'goal_selection':
        if (data?.goals) {
          await onboardingProfileRepository.update(userId, {
            primaryGoals: data.goals
          });
        }
        break;

      case 'ai_configuration':
        // AI config would be saved to user preferences
        break;

      default:
        break;
    }
  }

  /**
   * Skip an optional step
   */
  async skipStep(userId: string, stepId: string): Promise<StepCompletionResult> {
    const step = ALL_STEPS.find(s => s.id === stepId);
    
    if (!step) {
      return {
        success: false,
        unlockedFeatures: [],
        message: 'Invalid step',
        progress: 0
      };
    }

    if (step.required) {
      return {
        success: false,
        unlockedFeatures: [],
        message: 'Cannot skip required step',
        progress: 0
      };
    }

    const updatedProfile = await onboardingProfileRepository.skipStep(userId, stepId);

    // Log skip event
    await onboardingEventsRepository.create({
      userId,
      eventType: 'step_skipped',
      stepId
    });

    // Get next step
    const path = this.generatePath(
      updatedProfile.primaryGoals as OnboardingGoal[],
      updatedProfile.creatorLevel as CreatorLevel
    );
    const nextStep = path.steps.find(
      s => !updatedProfile.completedSteps.includes(s.id) && 
           !updatedProfile.skippedSteps?.includes(s.id)
    );

    return {
      success: true,
      nextStep,
      unlockedFeatures: [],
      message: `${step.title} skipped`,
      progress: updatedProfile.progressPercentage
    };
  }

  /**
   * Get next recommended step
   */
  async getNextStep(userId: string): Promise<OnboardingStep | null> {
    const profile = await onboardingProfileRepository.findByUserId(userId);
    
    if (!profile) {
      return null;
    }

    const path = this.generatePath(
      profile.primaryGoals as OnboardingGoal[],
      profile.creatorLevel as CreatorLevel
    );

    return path.steps.find(
      s => !profile.completedSteps.includes(s.id) && 
           !profile.skippedSteps?.includes(s.id)
    ) || null;
  }

  /**
   * Check if onboarding is complete
   */
  async isOnboardingComplete(userId: string): Promise<boolean> {
    const profile = await onboardingProfileRepository.findByUserId(userId);
    
    if (!profile) {
      return false;
    }

    const requiredSteps = ALL_STEPS.filter(s => s.required);
    const completedRequired = requiredSteps.every(
      step => profile.completedSteps.includes(step.id)
    );

    if (completedRequired && !profile.completedAt) {
      // Mark as completed
      await onboardingProfileRepository.update(userId, {
        completedAt: new Date()
      });

      // Log completion event
      await onboardingEventsRepository.create({
        userId,
        eventType: 'onboarding_completed'
      });
    }

    return completedRequired;
  }

  /**
   * Resume onboarding from where user left off
   */
  async resumeOnboarding(userId: string): Promise<OnboardingProgress> {
    const profile = await onboardingProfileRepository.findByUserId(userId);
    
    if (!profile) {
      // Start new onboarding
      return this.startOnboarding(userId);
    }

    // Check if already completed
    const isComplete = await this.isOnboardingComplete(userId);
    if (isComplete) {
      return this.getProgress(userId);
    }

    // Log resume event
    await onboardingEventsRepository.create({
      userId,
      eventType: 'onboarding_resumed',
      stepId: profile.currentStep || undefined
    });

    return this.getProgress(userId);
  }

  /**
   * Update creator level
   */
  async updateCreatorLevel(
    userId: string,
    newLevel: CreatorLevel
  ): Promise<{ success: boolean; message: string }> {
    const profile = await onboardingProfileRepository.findByUserId(userId);
    
    if (!profile) {
      return { success: false, message: 'Profile not found' };
    }

    const validation = levelAssessor.validateLevelChange(
      profile.creatorLevel as CreatorLevel,
      newLevel
    );

    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    await onboardingProfileRepository.update(userId, {
      creatorLevel: newLevel
    });

    // Log level change event
    await onboardingEventsRepository.create({
      userId,
      eventType: 'level_changed',
      metadata: {
        oldLevel: profile.creatorLevel,
        newLevel
      }
    });

    // Check for new feature unlocks
    await featureUnlocker.checkAndUnlockEligibleFeatures(userId);

    return { success: true, message: validation.message };
  }

  /**
   * Get onboarding analytics for a user
   */
  async getUserAnalytics(userId: string) {
    const profile = await onboardingProfileRepository.findByUserId(userId);
    const events = await onboardingEventsRepository.getUserAnalytics(userId);
    const featureStats = await featureUnlockRepository.getStats(userId);

    return {
      profile,
      events,
      features: featureStats
    };
  }
}

// Export singleton instance
export const onboardingOrchestrator = new OnboardingOrchestratorService();
