/**
 * Feature Unlocker Service
 * Manages feature unlock conditions and triggers
 */

import { featureUnlockRepository } from '../db/repositories/featureUnlockRepository';
import { onboardingEventsRepository } from '../db/repositories/onboardingEventsRepository';
import { oauthAccountsRepository } from '../db/repositories/oauthAccountsRepository';

export type UnlockConditionType = 
  | 'platform_connection'
  | 'step_completion'
  | 'time_based'
  | 'level_based'
  | 'multiple_platforms';

export interface UnlockCondition {
  type: UnlockConditionType;
  requirement: string | number | string[];
  description: string;
}

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'analytics' | 'automation' | 'crm' | 'advanced';
  priority: number;
  unlockConditions: UnlockCondition[];
  dependencies: string[]; // Other feature IDs that must be unlocked first
  icon?: string;
  benefits: string[];
}

export interface UnlockResult {
  success: boolean;
  featureId: string;
  message: string;
  newlyUnlocked: string[];
  celebrationData?: {
    title: string;
    description: string;
    benefits: string[];
  };
}

export interface FeatureStatus {
  featureId: string;
  isUnlocked: boolean;
  progress: number; // 0-100
  conditionsMet: boolean[];
  nextRequirement?: string;
}

// Feature definitions
const FEATURE_DEFINITIONS: Record<string, FeatureDefinition> = {
  // Basic Content Creation
  basic_content_creation: {
    id: 'basic_content_creation',
    name: 'Basic Content Creation',
    description: 'Create and edit content with simple tools',
    category: 'content',
    priority: 1,
    unlockConditions: [
      {
        type: 'platform_connection',
        requirement: 1,
        description: 'Connect your first platform'
      }
    ],
    dependencies: [],
    benefits: [
      'Text editor with formatting',
      'Image upload',
      'Basic scheduling'
    ]
  },

  // Content Creation
  content_creation: {
    id: 'content_creation',
    name: 'Advanced Content Creation',
    description: 'Full content creation suite with media editing',
    category: 'content',
    priority: 2,
    unlockConditions: [
      {
        type: 'platform_connection',
        requirement: 1,
        description: 'Connect at least one platform'
      },
      {
        type: 'step_completion',
        requirement: 'ai_configuration',
        description: 'Complete AI configuration'
      }
    ],
    dependencies: ['basic_content_creation'],
    benefits: [
      'Rich text editor',
      'Image editing tools',
      'Video trimming',
      'AI content suggestions',
      'Template library'
    ]
  },

  // Cross-Platform Scheduling
  cross_platform_scheduling: {
    id: 'cross_platform_scheduling',
    name: 'Cross-Platform Scheduling',
    description: 'Schedule content across multiple platforms simultaneously',
    category: 'content',
    priority: 3,
    unlockConditions: [
      {
        type: 'multiple_platforms',
        requirement: 2,
        description: 'Connect at least 2 platforms'
      }
    ],
    dependencies: ['content_creation'],
    benefits: [
      'Multi-platform posting',
      'Unified calendar view',
      'Platform-specific optimization',
      'Bulk scheduling'
    ]
  },

  // Basic Analytics
  basic_analytics: {
    id: 'basic_analytics',
    name: 'Basic Analytics',
    description: 'View performance metrics for your content',
    category: 'analytics',
    priority: 2,
    unlockConditions: [
      {
        type: 'platform_connection',
        requirement: 1,
        description: 'Connect at least one platform'
      },
      {
        type: 'time_based',
        requirement: 1,
        description: 'Active for at least 1 day'
      }
    ],
    dependencies: [],
    benefits: [
      'Views and engagement metrics',
      'Performance charts',
      'Best posting times'
    ]
  },

  // Advanced Analytics
  advanced_analytics: {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Deep insights and trend analysis',
    category: 'analytics',
    priority: 4,
    unlockConditions: [
      {
        type: 'multiple_platforms',
        requirement: 2,
        description: 'Connect at least 2 platforms'
      },
      {
        type: 'time_based',
        requirement: 7,
        description: 'Active for at least 7 days'
      }
    ],
    dependencies: ['basic_analytics'],
    benefits: [
      'Cross-platform comparison',
      'Audience insights',
      'Trend predictions',
      'Custom reports',
      'Export data'
    ]
  },

  // AI Content Generation
  ai_content_generation: {
    id: 'ai_content_generation',
    name: 'AI Content Generation',
    description: 'Generate content ideas and captions with AI',
    category: 'automation',
    priority: 3,
    unlockConditions: [
      {
        type: 'step_completion',
        requirement: 'ai_configuration',
        description: 'Complete AI configuration step'
      }
    ],
    dependencies: ['content_creation'],
    benefits: [
      'AI-generated captions',
      'Content ideas',
      'Hashtag suggestions',
      'Tone adjustment'
    ]
  },

  // Bulk Operations
  bulk_operations: {
    id: 'bulk_operations',
    name: 'Bulk Operations',
    description: 'Manage multiple content items at once',
    category: 'automation',
    priority: 4,
    unlockConditions: [
      {
        type: 'multiple_platforms',
        requirement: 2,
        description: 'Connect at least 2 platforms'
      },
      {
        type: 'level_based',
        requirement: 'advanced',
        description: 'Reach Advanced creator level'
      }
    ],
    dependencies: ['cross_platform_scheduling'],
    benefits: [
      'Bulk edit',
      'Bulk schedule',
      'Bulk delete',
      'CSV import/export'
    ]
  },

  // CRM & Messaging
  crm_messaging: {
    id: 'crm_messaging',
    name: 'CRM & Messaging',
    description: 'Manage fan relationships and conversations',
    category: 'crm',
    priority: 5,
    unlockConditions: [
      {
        type: 'platform_connection',
        requirement: 'onlyfans',
        description: 'Connect OnlyFans account'
      }
    ],
    dependencies: [],
    benefits: [
      'Fan database',
      'Message templates',
      'Conversation tracking',
      'Bulk messaging',
      'AI message suggestions'
    ]
  },

  // AB Testing
  ab_testing: {
    id: 'ab_testing',
    name: 'A/B Testing',
    description: 'Test different content variations',
    category: 'advanced',
    priority: 5,
    unlockConditions: [
      {
        type: 'multiple_platforms',
        requirement: 2,
        description: 'Connect at least 2 platforms'
      },
      {
        type: 'level_based',
        requirement: 'advanced',
        description: 'Reach Advanced creator level'
      }
    ],
    dependencies: ['advanced_analytics'],
    benefits: [
      'Create content variations',
      'Automatic distribution',
      'Performance comparison',
      'Winner selection'
    ]
  },

  // API Access
  api_access: {
    id: 'api_access',
    name: 'API Access',
    description: 'Programmatic access to your data',
    category: 'advanced',
    priority: 6,
    unlockConditions: [
      {
        type: 'level_based',
        requirement: 'expert',
        description: 'Reach Expert creator level'
      },
      {
        type: 'time_based',
        requirement: 30,
        description: 'Active for at least 30 days'
      }
    ],
    dependencies: [],
    benefits: [
      'REST API access',
      'Webhooks',
      'Custom integrations',
      'API documentation'
    ]
  }
};

export class FeatureUnlockerService {
  /**
   * Get all feature definitions
   */
  getAllFeatures(): FeatureDefinition[] {
    return Object.values(FEATURE_DEFINITIONS);
  }

  /**
   * Get feature definition by ID
   */
  getFeature(featureId: string): FeatureDefinition | null {
    return FEATURE_DEFINITIONS[featureId] || null;
  }

  /**
   * Check if conditions are met for a feature
   */
  async checkUnlockConditions(
    userId: string,
    featureId: string
  ): Promise<{ met: boolean; progress: number; details: string[] }> {
    const feature = this.getFeature(featureId);
    if (!feature) {
      return { met: false, progress: 0, details: ['Feature not found'] };
    }

    const details: string[] = [];
    let metCount = 0;

    for (const condition of feature.unlockConditions) {
      const isMet = await this.checkCondition(userId, condition);
      if (isMet) {
        metCount++;
        details.push(`✓ ${condition.description}`);
      } else {
        details.push(`✗ ${condition.description}`);
      }
    }

    const progress = (metCount / feature.unlockConditions.length) * 100;
    const met = metCount === feature.unlockConditions.length;

    return { met, progress, details };
  }

  /**
   * Check a single unlock condition
   */
  private async checkCondition(
    userId: string,
    condition: UnlockCondition
  ): Promise<boolean> {
    switch (condition.type) {
      case 'platform_connection':
        if (Array.isArray(condition.requirement)) {
          return false; // Platform connection doesn't support array requirements
        }
        return this.checkPlatformConnection(userId, condition.requirement);

      case 'step_completion':
        return this.checkStepCompletion(userId, condition.requirement as string);

      case 'time_based':
        return this.checkTimeBased(userId, condition.requirement as number);

      case 'level_based':
        return this.checkLevelBased(userId, condition.requirement as string);

      case 'multiple_platforms':
        return this.checkMultiplePlatforms(userId, condition.requirement as number);

      default:
        return false;
    }
  }

  /**
   * Check platform connection condition
   */
  private async checkPlatformConnection(
    userId: string,
    requirement: string | number
  ): Promise<boolean> {
    try {
      const userIdNum = parseInt(userId, 10);
      const accounts = await oauthAccountsRepository.findByUser(userIdNum);
      
      if (typeof requirement === 'number') {
        return accounts.length >= requirement;
      }
      
      // Check for specific platform
      return accounts.some(acc => acc.provider === requirement);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check step completion condition
   */
  private async checkStepCompletion(
    userId: string,
    stepId: string
  ): Promise<boolean> {
    try {
      const count = await onboardingEventsRepository.countEventsByType(
        userId,
        'step_completed'
      );
      return count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check time-based condition
   */
  private async checkTimeBased(
    userId: string,
    days: number
  ): Promise<boolean> {
    try {
      const events = await onboardingEventsRepository.findByUserIdAndType(
        userId,
        'onboarding_started',
        1
      );
      
      if (events.length === 0) return false;
      
      const startDate = new Date(events[0].timestamp);
      const daysSinceStart = Math.floor(
        (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return daysSinceStart >= days;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check level-based condition
   */
  private async checkLevelBased(
    userId: string,
    requiredLevel: string
  ): Promise<boolean> {
    // This would check the user's creator level from onboarding_profiles
    // For now, return false as placeholder
    return false;
  }

  /**
   * Check multiple platforms condition
   */
  private async checkMultiplePlatforms(
    userId: string,
    count: number
  ): Promise<boolean> {
    return this.checkPlatformConnection(userId, count);
  }

  /**
   * Attempt to unlock a feature
   */
  async unlockFeature(userId: string, featureId: string): Promise<UnlockResult> {
    const feature = this.getFeature(featureId);
    if (!feature) {
      return {
        success: false,
        featureId,
        message: 'Feature not found',
        newlyUnlocked: []
      };
    }

    // Check if already unlocked
    const isUnlocked = await featureUnlockRepository.isFeatureUnlocked(userId, featureId);
    if (isUnlocked) {
      return {
        success: true,
        featureId,
        message: 'Feature already unlocked',
        newlyUnlocked: []
      };
    }

    // Check dependencies
    for (const depId of feature.dependencies) {
      const depUnlocked = await featureUnlockRepository.isFeatureUnlocked(userId, depId);
      if (!depUnlocked) {
        return {
          success: false,
          featureId,
          message: `Dependency not met: ${depId}`,
          newlyUnlocked: []
        };
      }
    }

    // Check unlock conditions
    const { met } = await this.checkUnlockConditions(userId, featureId);
    if (!met) {
      return {
        success: false,
        featureId,
        message: 'Unlock conditions not met',
        newlyUnlocked: []
      };
    }

    // Unlock the feature
    await featureUnlockRepository.unlockFeature({ userId, featureId });

    // Log unlock event
    await onboardingEventsRepository.create({
      userId,
      eventType: 'feature_unlocked',
      metadata: { featureId, featureName: feature.name }
    });

    return {
      success: true,
      featureId,
      message: `${feature.name} unlocked!`,
      newlyUnlocked: [featureId],
      celebrationData: {
        title: `🎉 ${feature.name} Unlocked!`,
        description: feature.description,
        benefits: feature.benefits
      }
    };
  }

  /**
   * Check and unlock all eligible features for a user
   */
  async checkAndUnlockEligibleFeatures(userId: string): Promise<string[]> {
    const unlockedFeatures: string[] = [];
    const lockedFeatures = await featureUnlockRepository.getLockedFeatures(userId);

    for (const featureId of lockedFeatures) {
      const result = await this.unlockFeature(userId, featureId);
      if (result.success && result.newlyUnlocked.length > 0) {
        unlockedFeatures.push(...result.newlyUnlocked);
      }
    }

    return unlockedFeatures;
  }

  /**
   * Get feature status for a user
   */
  async getFeatureStatus(userId: string, featureId: string): Promise<FeatureStatus> {
    const feature = this.getFeature(featureId);
    if (!feature) {
      return {
        featureId,
        isUnlocked: false,
        progress: 0,
        conditionsMet: [],
        nextRequirement: 'Feature not found'
      };
    }

    const isUnlocked = await featureUnlockRepository.isFeatureUnlocked(userId, featureId);
    const { met, progress, details } = await this.checkUnlockConditions(userId, featureId);

    const conditionsMet = await Promise.all(
      feature.unlockConditions.map(cond => this.checkCondition(userId, cond))
    );

    const nextUnmetIndex = conditionsMet.findIndex(met => !met);
    const nextRequirement = nextUnmetIndex >= 0
      ? feature.unlockConditions[nextUnmetIndex].description
      : undefined;

    return {
      featureId,
      isUnlocked,
      progress,
      conditionsMet,
      nextRequirement
    };
  }

  /**
   * Get all feature statuses for a user
   */
  async getAllFeatureStatuses(userId: string): Promise<FeatureStatus[]> {
    const features = this.getAllFeatures();
    return Promise.all(
      features.map(f => this.getFeatureStatus(userId, f.id))
    );
  }

  /**
   * Get features by category
   */
  getFeaturesByCategory(category: FeatureDefinition['category']): FeatureDefinition[] {
    return this.getAllFeatures().filter(f => f.category === category);
  }

  /**
   * Get recommended next features to unlock
   */
  async getRecommendedFeatures(userId: string, limit = 3): Promise<FeatureDefinition[]> {
    const statuses = await this.getAllFeatureStatuses(userId);
    
    // Filter locked features with some progress
    const candidates = statuses
      .filter(s => !s.isUnlocked && s.progress > 0)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, limit);

    return candidates
      .map(s => this.getFeature(s.featureId))
      .filter((f): f is FeatureDefinition => f !== null);
  }
}

// Export singleton instance
export const featureUnlocker = new FeatureUnlockerService();
