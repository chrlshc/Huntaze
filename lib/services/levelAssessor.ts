/**
 * Level Assessor Service
 * Evaluates user questionnaire responses and assigns appropriate creator levels
 */

export type CreatorLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface QuestionnaireResponse {
  experienceLevel: 'none' | 'some' | 'moderate' | 'extensive';
  platformFamiliarity: string[]; // Array of platform names
  contentCreationFrequency: 'never' | 'occasionally' | 'weekly' | 'daily';
  technicalComfort: 'low' | 'medium' | 'high' | 'very_high';
  aiExperience: 'none' | 'basic' | 'intermediate' | 'advanced';
  goals: string[]; // Array of goal IDs
}

export interface LevelConfig {
  level: CreatorLevel;
  aiVerbosity: 'detailed' | 'balanced' | 'concise' | 'minimal';
  uiComplexity: 'simple' | 'standard' | 'advanced' | 'expert';
  helpFrequency: 'high' | 'medium' | 'low' | 'minimal';
  suggestedFeatures: string[];
  description: string;
}

export interface LevelAssessment {
  level: CreatorLevel;
  score: number;
  config: LevelConfig;
  reasoning: string[];
}

// Level configurations
const LEVEL_CONFIGS: Record<CreatorLevel, LevelConfig> = {
  beginner: {
    level: 'beginner',
    aiVerbosity: 'detailed',
    uiComplexity: 'simple',
    helpFrequency: 'high',
    suggestedFeatures: [
      'basic_content_creation',
      'simple_scheduling',
      'platform_connection_wizard',
      'guided_tutorials'
    ],
    description: 'New to content creation with guided assistance'
  },
  intermediate: {
    level: 'intermediate',
    aiVerbosity: 'balanced',
    uiComplexity: 'standard',
    helpFrequency: 'medium',
    suggestedFeatures: [
      'content_creation',
      'scheduling',
      'basic_analytics',
      'platform_management',
      'ai_suggestions'
    ],
    description: 'Comfortable with content creation, learning advanced features'
  },
  advanced: {
    level: 'advanced',
    aiVerbosity: 'concise',
    uiComplexity: 'advanced',
    helpFrequency: 'low',
    suggestedFeatures: [
      'advanced_analytics',
      'bulk_operations',
      'automation',
      'cross_platform_optimization',
      'ab_testing',
      'crm'
    ],
    description: 'Experienced creator optimizing workflows'
  },
  expert: {
    level: 'expert',
    aiVerbosity: 'minimal',
    uiComplexity: 'expert',
    helpFrequency: 'minimal',
    suggestedFeatures: [
      'api_access',
      'custom_integrations',
      'advanced_automation',
      'team_collaboration',
      'white_label',
      'enterprise_features'
    ],
    description: 'Professional creator with advanced technical needs'
  }
};

// Scoring weights
const WEIGHTS = {
  experienceLevel: 30,
  platformFamiliarity: 20,
  contentCreationFrequency: 25,
  technicalComfort: 15,
  aiExperience: 10
};

export class LevelAssessorService {
  /**
   * Evaluate questionnaire and assign creator level
   */
  assessLevel(responses: QuestionnaireResponse): LevelAssessment {
    const score = this.calculateScore(responses);
    const level = this.determineLevel(score);
    const config = LEVEL_CONFIGS[level];
    const reasoning = this.generateReasoning(responses, level);

    return {
      level,
      score,
      config,
      reasoning
    };
  }

  /**
   * Calculate total score from questionnaire responses
   */
  private calculateScore(responses: QuestionnaireResponse): number {
    let totalScore = 0;

    // Experience level scoring
    const experienceScores = {
      none: 0,
      some: 30,
      moderate: 60,
      extensive: 100
    };
    totalScore += (experienceScores[responses.experienceLevel] * WEIGHTS.experienceLevel) / 100;

    // Platform familiarity scoring (more platforms = higher score)
    const platformScore = Math.min(responses.platformFamiliarity.length * 25, 100);
    totalScore += (platformScore * WEIGHTS.platformFamiliarity) / 100;

    // Content creation frequency scoring
    const frequencyScores = {
      never: 0,
      occasionally: 30,
      weekly: 65,
      daily: 100
    };
    totalScore += (frequencyScores[responses.contentCreationFrequency] * WEIGHTS.contentCreationFrequency) / 100;

    // Technical comfort scoring
    const technicalScores = {
      low: 0,
      medium: 40,
      high: 75,
      very_high: 100
    };
    totalScore += (technicalScores[responses.technicalComfort] * WEIGHTS.technicalComfort) / 100;

    // AI experience scoring
    const aiScores = {
      none: 0,
      basic: 35,
      intermediate: 70,
      advanced: 100
    };
    totalScore += (aiScores[responses.aiExperience] * WEIGHTS.aiExperience) / 100;

    return Math.round(totalScore);
  }

  /**
   * Determine creator level based on score
   */
  private determineLevel(score: number): CreatorLevel {
    if (score >= 75) return 'expert';
    if (score >= 55) return 'advanced';
    if (score >= 30) return 'intermediate';
    return 'beginner';
  }

  /**
   * Generate reasoning for level assignment
   */
  private generateReasoning(responses: QuestionnaireResponse, level: CreatorLevel): string[] {
    const reasoning: string[] = [];

    // Experience reasoning
    if (responses.experienceLevel === 'extensive') {
      reasoning.push('Extensive content creation experience');
    } else if (responses.experienceLevel === 'none') {
      reasoning.push('New to content creation - starting with basics');
    }

    // Platform familiarity reasoning
    if (responses.platformFamiliarity.length >= 3) {
      reasoning.push(`Familiar with ${responses.platformFamiliarity.length} platforms`);
    } else if (responses.platformFamiliarity.length === 0) {
      reasoning.push('No prior platform experience - guided setup recommended');
    }

    // Frequency reasoning
    if (responses.contentCreationFrequency === 'daily') {
      reasoning.push('Daily content creation - advanced tools beneficial');
    } else if (responses.contentCreationFrequency === 'never') {
      reasoning.push('Starting content creation journey');
    }

    // Technical comfort reasoning
    if (responses.technicalComfort === 'very_high') {
      reasoning.push('High technical proficiency - can handle complex features');
    } else if (responses.technicalComfort === 'low') {
      reasoning.push('Prefers simple, intuitive interfaces');
    }

    // AI experience reasoning
    if (responses.aiExperience === 'advanced') {
      reasoning.push('Advanced AI user - minimal guidance needed');
    } else if (responses.aiExperience === 'none') {
      reasoning.push('New to AI tools - detailed explanations provided');
    }

    return reasoning;
  }

  /**
   * Get level configuration
   */
  getLevelConfig(level: CreatorLevel): LevelConfig {
    return LEVEL_CONFIGS[level];
  }

  /**
   * Get all level configurations
   */
  getAllLevelConfigs(): Record<CreatorLevel, LevelConfig> {
    return LEVEL_CONFIGS;
  }

  /**
   * Validate level change request
   */
  validateLevelChange(currentLevel: CreatorLevel, newLevel: CreatorLevel): {
    valid: boolean;
    message: string;
  } {
    const levels: CreatorLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(currentLevel);
    const newIndex = levels.indexOf(newLevel);

    // Allow any level change
    if (newIndex >= 0) {
      const direction = newIndex > currentIndex ? 'upgraded' : 'downgraded';
      return {
        valid: true,
        message: `Level ${direction} from ${currentLevel} to ${newLevel}`
      };
    }

    return {
      valid: false,
      message: 'Invalid level specified'
    };
  }

  /**
   * Get recommended level based on usage patterns
   */
  recommendLevelAdjustment(
    currentLevel: CreatorLevel,
    usageMetrics: {
      featuresUsed: string[];
      advancedFeaturesUsed: number;
      daysActive: number;
      contentCreated: number;
    }
  ): {
    recommended: CreatorLevel;
    shouldAdjust: boolean;
    reason: string;
  } {
    const levels: CreatorLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(currentLevel);

    // Check if user is ready for upgrade
    if (currentLevel === 'beginner' && usageMetrics.daysActive >= 7 && usageMetrics.contentCreated >= 10) {
      return {
        recommended: 'intermediate',
        shouldAdjust: true,
        reason: 'You\'ve been actively creating content. Ready for more advanced features?'
      };
    }

    if (currentLevel === 'intermediate' && usageMetrics.advancedFeaturesUsed >= 5 && usageMetrics.contentCreated >= 50) {
      return {
        recommended: 'advanced',
        shouldAdjust: true,
        reason: 'You\'re using advanced features regularly. Upgrade for more powerful tools?'
      };
    }

    if (currentLevel === 'advanced' && usageMetrics.advancedFeaturesUsed >= 10 && usageMetrics.daysActive >= 30) {
      return {
        recommended: 'expert',
        shouldAdjust: true,
        reason: 'You\'re a power user. Unlock expert-level features and customization?'
      };
    }

    // Check if user might benefit from downgrade
    if (currentIndex > 0 && usageMetrics.featuresUsed.length < 3 && usageMetrics.daysActive >= 14) {
      return {
        recommended: levels[currentIndex - 1],
        shouldAdjust: true,
        reason: 'Simplify your experience? A lower level might be more comfortable.'
      };
    }

    return {
      recommended: currentLevel,
      shouldAdjust: false,
      reason: 'Current level matches your usage patterns'
    };
  }

  /**
   * Get AI configuration for a level
   */
  getAIConfig(level: CreatorLevel): {
    verbosity: string;
    maxTokens: number;
    temperature: number;
    systemPromptModifier: string;
  } {
    const configs = {
      beginner: {
        verbosity: 'detailed',
        maxTokens: 500,
        temperature: 0.7,
        systemPromptModifier: 'Provide detailed, step-by-step explanations. Use simple language and avoid technical jargon. Include examples.'
      },
      intermediate: {
        verbosity: 'balanced',
        maxTokens: 350,
        temperature: 0.7,
        systemPromptModifier: 'Provide clear explanations with moderate detail. Use some technical terms but explain them when needed.'
      },
      advanced: {
        verbosity: 'concise',
        maxTokens: 250,
        temperature: 0.6,
        systemPromptModifier: 'Provide concise, technical responses. Assume familiarity with content creation concepts.'
      },
      expert: {
        verbosity: 'minimal',
        maxTokens: 150,
        temperature: 0.5,
        systemPromptModifier: 'Provide brief, technical responses. Focus on advanced insights and optimizations.'
      }
    };

    return configs[level];
  }
}

// Export singleton instance
export const levelAssessor = new LevelAssessorService();
