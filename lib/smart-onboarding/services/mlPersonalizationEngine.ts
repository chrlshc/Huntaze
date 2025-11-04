// Smart Onboarding System - ML Personalization Engine Implementation

import { Pool } from 'pg';
import { 
  MLPersonalizationEngine,
  OnboardingContext,
  ContentRecommendation
} from '../interfaces/services';
import {
  UserProfile,
  UserPersona,
  LearningPath,
  BehaviorEvent,
  InteractionPattern,
  ProficiencyLevel,
  SuccessPrediction,
  PersonaType,
  LearningStyle,
  OnboardingApproach,
  PersonaCharacteristic,
  PredictedBehavior
} from '../types';
import { smartOnboardingCache } from '../config/redis';
import { ML_MODEL_TYPES } from '../config/database';
import { Path } from 'three';
import { Path } from 'three';

// User Persona Classifier
class UserPersonaClassifier {
  private readonly personaWeights = {
    content_creator: {
      socialConnections: 0.3,
      contentGoals: 0.4,
      technicalProficiency: 0.2,
      platformPreferences: 0.1
    },
    business_user: {
      timeConstraints: 0.4,
      contentGoals: 0.3,
      technicalProficiency: 0.2,
      previousExperience: 0.1
    },
    influencer: {
      socialConnections: 0.4,
      platformPreferences: 0.3,
      contentGoals: 0.2,
      technicalProficiency: 0.1
    },
    agency: {
      technicalProficiency: 0.4,
      contentGoals: 0.3,
      timeConstraints: 0.2,
      previousExperience: 0.1
    },
    casual_user: {
      learningStyle: 0.4,
      timeConstraints: 0.3,
      technicalProficiency: 0.2,
      previousExperience: 0.1
    }
  };

  classifyPersona(profile: UserProfile): UserPersona {
    const scores = this.calculatePersonaScores(profile);
    const topPersona = this.getTopPersona(scores);
    
    return {
      personaType: topPersona.type,
      confidenceScore: topPersona.score,
      characteristics: this.extractCharacteristics(profile, topPersona.type),
      predictedBehaviors: this.predictBehaviors(topPersona.type, profile),
      recommendedApproach: this.getRecommendedApproach(topPersona.type),
      lastUpdated: new Date()
    };
  }

  private calculatePersonaScores(profile: UserProfile): Record<PersonaType, number> {
    const scores: Record<PersonaType, number> = {
      content_creator: 0,
      business_user: 0,
      influencer: 0,
      agency: 0,
      casual_user: 0
    };

    // Content Creator scoring
    scores.content_creator += this.scoreContentCreator(profile);
    
    // Business User scoring  
    scores.business_user += this.scoreBusinessUser(profile);
    
    // Influencer scoring
    scores.influencer += this.scoreInfluencer(profile);
    
    // Agency scoring
    scores.agency += this.scoreAgency(profile);
    
    // Casual User scoring
    scores.casual_user += this.scoreCasualUser(profile);

    return scores;
  }

  private scoreContentCreator(profile: UserProfile): number {
    let score = 0;
    
    // Social connections weight
    if (profile.socialConnections.length > 0) {
      score += 0.3 * Math.min(1, profile.socialConnections.length / 3);
    }
    
    // Content creation goals
    const creationGoals = profile.contentCreationGoals.filter(
      goal => ['growth', 'engagement', 'content_quality'].includes(goal.type)
    );
    score += 0.4 * Math.min(1, creationGoals.length / 3);
    
    // Technical proficiency
    const proficiencyScore = this.getProficiencyScore(profile.technicalProficiency);
    score += 0.2 * proficiencyScore;
    
    // Platform preferences
    score += 0.1 * Math.min(1, profile.platformPreferences.length / 2);
    
    return score;
  } 
 private scoreBusinessUser(profile: UserProfile): number {
    let score = 0;
    
    // Time constraints (business users are typically time-constrained)
    if (profile.timeConstraints.urgencyLevel === 'high') {
      score += 0.4 * 0.8;
    } else if (profile.timeConstraints.urgencyLevel === 'medium') {
      score += 0.4 * 0.5;
    }
    
    // Business-focused goals
    const businessGoals = profile.contentCreationGoals.filter(
      goal => ['monetization', 'brand_awareness'].includes(goal.type)
    );
    score += 0.3 * Math.min(1, businessGoals.length / 2);
    
    // Technical proficiency (business users often have moderate proficiency)
    if (profile.technicalProficiency === 'intermediate' || profile.technicalProficiency === 'advanced') {
      score += 0.2 * 0.7;
    }
    
    // Previous experience
    if (profile.previousExperience === 'intermediate' || profile.previousExperience === 'advanced') {
      score += 0.1 * 0.8;
    }
    
    return score;
  }

  private scoreInfluencer(profile: UserProfile): number {
    let score = 0;
    
    // Social connections (influencers have multiple platforms)
    const verifiedConnections = profile.socialConnections.filter(conn => conn.isVerified);
    const highFollowerConnections = profile.socialConnections.filter(conn => 
      conn.followerCount && conn.followerCount > 10000
    );
    
    score += 0.4 * Math.min(1, (verifiedConnections.length + highFollowerConnections.length) / 3);
    
    // Platform preferences (influencers are active on multiple platforms)
    score += 0.3 * Math.min(1, profile.platformPreferences.length / 4);
    
    // Growth and engagement goals
    const influencerGoals = profile.contentCreationGoals.filter(
      goal => ['growth', 'engagement', 'monetization'].includes(goal.type)
    );
    score += 0.2 * Math.min(1, influencerGoals.length / 3);
    
    // Technical proficiency
    const proficiencyScore = this.getProficiencyScore(profile.technicalProficiency);
    score += 0.1 * proficiencyScore;
    
    return score;
  }

  private scoreAgency(profile: UserProfile): number {
    let score = 0;
    
    // High technical proficiency
    if (profile.technicalProficiency === 'advanced' || profile.technicalProficiency === 'expert') {
      score += 0.4 * 0.9;
    }
    
    // Professional goals
    const professionalGoals = profile.contentCreationGoals.filter(
      goal => ['monetization', 'brand_awareness', 'content_quality'].includes(goal.type)
    );
    score += 0.3 * Math.min(1, professionalGoals.length / 3);
    
    // Time constraints (agencies often have tight deadlines)
    if (profile.timeConstraints.urgencyLevel === 'high') {
      score += 0.2 * 0.8;
    }
    
    // Extensive previous experience
    if (profile.previousExperience === 'advanced') {
      score += 0.1 * 1.0;
    }
    
    return score;
  }

  private scoreCasualUser(profile: UserProfile): number {
    let score = 0;
    
    // Learning style preference (casual users prefer guided learning)
    if (profile.learningStyle === 'guided' || profile.learningStyle === 'visual') {
      score += 0.4 * 0.8;
    }
    
    // Flexible time constraints
    if (profile.timeConstraints.urgencyLevel === 'low') {
      score += 0.3 * 0.7;
    }
    
    // Lower technical proficiency
    if (profile.technicalProficiency === 'beginner' || profile.technicalProficiency === 'intermediate') {
      score += 0.2 * 0.6;
    }
    
    // Limited previous experience
    if (profile.previousExperience === 'none' || profile.previousExperience === 'basic') {
      score += 0.1 * 0.8;
    }
    
    return score;
  }

  private getProficiencyScore(proficiency: ProficiencyLevel): number {
    const scores = {
      beginner: 0.2,
      intermediate: 0.5,
      advanced: 0.8,
      expert: 1.0
    };
    return scores[proficiency] || 0.2;
  }

  private getTopPersona(scores: Record<PersonaType, number>): { type: PersonaType; score: number } {
    let topType: PersonaType = 'casual_user';
    let topScore = 0;
    
    for (const [type, score] of Object.entries(scores)) {
      if (score > topScore) {
        topScore = score;
        topType = type as PersonaType;
      }
    }
    
    return { type: topType, score: Math.min(1, topScore) };
  }

  private extractCharacteristics(profile: UserProfile, personaType: PersonaType): PersonaCharacteristic[] {
    const characteristics: PersonaCharacteristic[] = [];
    
    // Technical proficiency characteristic
    characteristics.push({
      trait: 'technical_proficiency',
      value: this.getProficiencyScore(profile.technicalProficiency),
      confidence: 0.9
    });
    
    // Time availability
    const timeScore = profile.timeConstraints.urgencyLevel === 'low' ? 0.8 : 
                     profile.timeConstraints.urgencyLevel === 'medium' ? 0.5 : 0.2;
    characteristics.push({
      trait: 'time_availability',
      value: timeScore,
      confidence: 0.8
    });
    
    // Social media experience
    const socialScore = Math.min(1, profile.socialConnections.length / 5);
    characteristics.push({
      trait: 'social_media_experience',
      value: socialScore,
      confidence: 0.7
    });
    
    // Goal orientation
    const goalScore = Math.min(1, profile.contentCreationGoals.length / 4);
    characteristics.push({
      trait: 'goal_orientation',
      value: goalScore,
      confidence: 0.8
    });
    
    return characteristics;
  }

  private predictBehaviors(personaType: PersonaType, profile: UserProfile): PredictedBehavior[] {
    const behaviors: PredictedBehavior[] = [];
    
    switch (personaType) {
      case 'content_creator':
        behaviors.push(
          { behavior: 'explores_advanced_features', probability: 0.8, impact: 'positive' },
          { behavior: 'completes_onboarding_quickly', probability: 0.7, impact: 'positive' },
          { behavior: 'engages_with_tutorials', probability: 0.6, impact: 'positive' }
        );
        break;
        
      case 'business_user':
        behaviors.push(
          { behavior: 'skips_optional_steps', probability: 0.8, impact: 'neutral' },
          { behavior: 'focuses_on_roi_features', probability: 0.9, impact: 'positive' },
          { behavior: 'prefers_quick_setup', probability: 0.8, impact: 'positive' }
        );
        break;
        
      case 'influencer':
        behaviors.push(
          { behavior: 'connects_multiple_platforms', probability: 0.9, impact: 'positive' },
          { behavior: 'explores_analytics_features', probability: 0.8, impact: 'positive' },
          { behavior: 'shares_experience_socially', probability: 0.7, impact: 'positive' }
        );
        break;
        
      case 'agency':
        behaviors.push(
          { behavior: 'customizes_extensively', probability: 0.9, impact: 'positive' },
          { behavior: 'completes_all_steps', probability: 0.8, impact: 'positive' },
          { behavior: 'provides_detailed_feedback', probability: 0.6, impact: 'positive' }
        );
        break;
        
      case 'casual_user':
        behaviors.push(
          { behavior: 'needs_guidance', probability: 0.8, impact: 'neutral' },
          { behavior: 'takes_time_to_complete', probability: 0.7, impact: 'neutral' },
          { behavior: 'may_abandon_if_complex', probability: 0.6, impact: 'negative' }
        );
        break;
    }
    
    return behaviors;
  }

  private getRecommendedApproach(personaType: PersonaType): OnboardingApproach {
    const approaches: Record<PersonaType, OnboardingApproach> = {
      content_creator: {
        pacing: 'medium',
        complexity: 'moderate',
        interactivity: 'high',
        supportLevel: 'moderate'
      },
      business_user: {
        pacing: 'fast',
        complexity: 'simple',
        interactivity: 'medium',
        supportLevel: 'minimal'
      },
      influencer: {
        pacing: 'fast',
        complexity: 'moderate',
        interactivity: 'high',
        supportLevel: 'moderate'
      },
      agency: {
        pacing: 'medium',
        complexity: 'advanced',
        interactivity: 'medium',
        supportLevel: 'extensive'
      },
      casual_user: {
        pacing: 'slow',
        complexity: 'simple',
        interactivity: 'high',
        supportLevel: 'extensive'
      }
    };
    
    return approaches[personaType];
  }
}

// Technical Proficiency Assessor
class TechnicalProficiencyAssessor {
  assessProficiency(interactionPatterns: InteractionPattern[]): ProficiencyLevel {
    if (interactionPatterns.length === 0) {
      return 'beginner';
    }
    
    let score = 0;
    let totalWeight = 0;
    
    // Analyze navigation efficiency
    const navigationScore = this.assessNavigationEfficiency(interactionPatterns);
    score += navigationScore * 0.3;
    totalWeight += 0.3;
    
    // Analyze task completion speed
    const speedScore = this.assessCompletionSpeed(interactionPatterns);
    score += speedScore * 0.25;
    totalWeight += 0.25;
    
    // Analyze error frequency
    const errorScore = this.assessErrorFrequency(interactionPatterns);
    score += errorScore * 0.2;
    totalWeight += 0.2;
    
    // Analyze feature usage
    const featureScore = this.assessFeatureUsage(interactionPatterns);
    score += featureScore * 0.15;
    totalWeight += 0.15;
    
    // Analyze help-seeking behavior
    const helpScore = this.assessHelpSeekingBehavior(interactionPatterns);
    score += helpScore * 0.1;
    totalWeight += 0.1;
    
    const finalScore = totalWeight > 0 ? score / totalWeight : 0;
    
    if (finalScore >= 0.8) return 'expert';
    if (finalScore >= 0.6) return 'advanced';
    if (finalScore >= 0.4) return 'intermediate';
    return 'beginner';
  }

  private assessNavigationEfficiency(patterns: InteractionPattern[]): number {
    // Simplified assessment - in real implementation, this would analyze actual navigation patterns
    const avgClicksPerTask = patterns.reduce((sum, p) => sum + (p.clickCount || 0), 0) / patterns.length;
    
    if (avgClicksPerTask <= 3) return 1.0; // Very efficient
    if (avgClicksPerTask <= 5) return 0.8; // Efficient
    if (avgClicksPerTask <= 8) return 0.6; // Moderate
    if (avgClicksPerTask <= 12) return 0.4; // Inefficient
    return 0.2; // Very inefficient
  }

  private assessCompletionSpeed(patterns: InteractionPattern[]): number {
    const avgCompletionTime = patterns.reduce((sum, p) => sum + (p.completionTime || 0), 0) / patterns.length;
    
    // Normalize based on expected completion times (in seconds)
    if (avgCompletionTime <= 30) return 1.0;
    if (avgCompletionTime <= 60) return 0.8;
    if (avgCompletionTime <= 120) return 0.6;
    if (avgCompletionTime <= 300) return 0.4;
    return 0.2;
  }

  private assessErrorFrequency(patterns: InteractionPattern[]): number {
    const avgErrors = patterns.reduce((sum, p) => sum + (p.errorCount || 0), 0) / patterns.length;
    
    if (avgErrors === 0) return 1.0;
    if (avgErrors <= 1) return 0.8;
    if (avgErrors <= 2) return 0.6;
    if (avgErrors <= 4) return 0.4;
    return 0.2;
  }

  private assessFeatureUsage(patterns: InteractionPattern[]): number {
    const advancedFeatureUsage = patterns.filter(p => p.usedAdvancedFeatures).length;
    const usageRatio = advancedFeatureUsage / patterns.length;
    
    return Math.min(1, usageRatio * 2); // Scale up to reward advanced feature usage
  }

  private assessHelpSeekingBehavior(patterns: InteractionPattern[]): number {
    const helpRequests = patterns.reduce((sum, p) => sum + (p.helpRequests || 0), 0);
    const avgHelpRequests = helpRequests / patterns.length;
    
    // Lower help requests indicate higher proficiency
    if (avgHelpRequests === 0) return 1.0;
    if (avgHelpRequests <= 0.5) return 0.8;
    if (avgHelpRequests <= 1) return 0.6;
    if (avgHelpRequests <= 2) return 0.4;
    return 0.2;
  }
}

// Learning Path Predictor
class LearningPathPredictor {
  private readonly pathTemplates: Record<PersonaType, Partial<LearningPath>> = {
    content_creator: {
      estimatedDuration: 20,
      difficultyProgression: [
        { stepId: 'intro', level: 1, factors: [{ type: 'cognitive_load', weight: 0.3, value: 0.2 }] },
        { stepId: 'platform_connect', level: 2, factors: [{ type: 'technical_complexity', weight: 0.4, value: 0.4 }] },
        { stepId: 'content_creation', level: 3, factors: [{ type: 'cognitive_load', weight: 0.5, value: 0.6 }] }
      ]
    },
    business_user: {
      estimatedDuration: 15,
      difficultyProgression: [
        { stepId: 'quick_setup', level: 1, factors: [{ type: 'time_pressure', weight: 0.4, value: 0.3 }] },
        { stepId: 'roi_features', level: 2, factors: [{ type: 'technical_complexity', weight: 0.3, value: 0.4 }] }
      ]
    },
    influencer: {
      estimatedDuration: 25,
      difficultyProgression: [
        { stepId: 'multi_platform', level: 2, factors: [{ type: 'technical_complexity', weight: 0.4, value: 0.5 }] },
        { stepId: 'analytics_setup', level: 3, factors: [{ type: 'cognitive_load', weight: 0.5, value: 0.7 }] }
      ]
    },
    agency: {
      estimatedDuration: 35,
      difficultyProgression: [
        { stepId: 'advanced_config', level: 4, factors: [{ type: 'technical_complexity', weight: 0.6, value: 0.8 }] },
        { stepId: 'team_setup', level: 3, factors: [{ type: 'cognitive_load', weight: 0.4, value: 0.6 }] }
      ]
    },
    casual_user: {
      estimatedDuration: 30,
      difficultyProgression: [
        { stepId: 'guided_intro', level: 1, factors: [{ type: 'cognitive_load', weight: 0.2, value: 0.2 }] },
        { stepId: 'basic_features', level: 2, factors: [{ type: 'technical_complexity', weight: 0.3, value: 0.3 }] }
      ]
    }
  };

  predictOptimalPath(userId: string, persona: UserPersona, context: OnboardingContext): LearningPath {
    const template = this.pathTemplates[persona.personaType];
    
    return {
      pathId: `path_${persona.personaType}_${userId}_${Date.now()}`,
      steps: this.generateOptimizedSteps(persona, context),
      estimatedDuration: this.adjustDurationForUser(template.estimatedDuration || 20, persona),
      difficultyProgression: template.difficultyProgression || [],
      personalizedContent: this.generatePersonalizedContent(persona),
      adaptationPoints: this.generateAdaptationPoints(persona),
      createdAt: new Date(),
      version: 1
    };
  }

  private generateOptimizedSteps(persona: UserPersona, context: OnboardingContext): any[] {
    // This would generate actual step configurations based on persona
    // For now, returning a simplified structure
    return [
      {
        id: 'welcome',
        type: 'introduction',
        personalizedContent: { variation: persona.personaType },
        adaptationTriggers: []
      }
    ];
  }

  private adjustDurationForUser(baseDuration: number, persona: UserPersona): number {
    let adjustmentFactor = 1.0;
    
    // Adjust based on predicted behaviors
    persona.predictedBehaviors.forEach(behavior => {
      if (behavior.behavior === 'completes_onboarding_quickly' && behavior.probability > 0.7) {
        adjustmentFactor *= 0.8;
      } else if (behavior.behavior === 'takes_time_to_complete' && behavior.probability > 0.7) {
        adjustmentFactor *= 1.3;
      }
    });
    
    return Math.round(baseDuration * adjustmentFactor);
  }

  private generatePersonalizedContent(persona: UserPersona): any[] {
    return [
      {
        stepId: 'welcome',
        contentVariations: [
          {
            id: `welcome_${persona.personaType}`,
            type: 'default',
            targetPersona: [persona.personaType],
            effectivenessScore: 0.8
          }
        ],
        selectedVariation: `welcome_${persona.personaType}`,
        adaptationHistory: []
      }
    ];
  }

  private generateAdaptationPoints(persona: UserPersona): any[] {
    return [
      {
        stepId: 'welcome',
        triggers: [
          {
            type: 'engagement_drop',
            threshold: 0.4,
            timeWindow: 30
          }
        ],
        possibleActions: [
          {
            type: 'content_change',
            parameters: { newVariation: 'simplified' },
            expectedImpact: 0.3
          }
        ],
        decisionTree: []
      }
    ];
  }
}

// Advanced Content Recommendation Engine
class AdvancedContentRecommendationEngine {
  private readonly contentDatabase = {
    videos: [
      {
        id: 'creator_intro_video',
        title: 'Content Creator Quick Start',
        description: 'Learn the essentials for content creators',
        duration: 300, // 5 minutes
        difficulty: 2,
        tags: ['content_creation', 'beginner', 'overview'],
        personaRelevance: { content_creator: 0.9, influencer: 0.8, casual_user: 0.6 },
        learningObjectives: ['platform_overview', 'basic_features', 'first_steps']
      },
      {
        id: 'business_roi_video',
        title: 'ROI-Focused Platform Tour',
        description: 'Discover features that drive business results',
        duration: 240,
        difficulty: 1,
        tags: ['business', 'roi', 'efficiency'],
        personaRelevance: { business_user: 0.95, agency: 0.8, content_creator: 0.4 },
        learningObjectives: ['roi_features', 'analytics', 'automation']
      }
    ],
    interactive: [
      {
        id: 'hands_on_tutorial',
        title: 'Interactive Platform Walkthrough',
        description: 'Learn by doing with guided interactions',
        duration: 600, // 10 minutes
        difficulty: 2,
        tags: ['interactive', 'hands_on', 'guided'],
        personaRelevance: { casual_user: 0.9, content_creator: 0.7, influencer: 0.6 },
        learningObjectives: ['hands_on_experience', 'feature_discovery', 'confidence_building']
      }
    ],
    text: [
      {
        id: 'comprehensive_guide',
        title: 'Complete Platform Documentation',
        description: 'Detailed written guide covering all features',
        duration: 900, // 15 minutes
        difficulty: 3,
        tags: ['comprehensive', 'detailed', 'reference'],
        personaRelevance: { agency: 0.9, business_user: 0.7, content_creator: 0.5 },
        learningObjectives: ['comprehensive_understanding', 'reference_material', 'advanced_features']
      }
    ]
  };

  private readonly recommendationModels = {
    collaborative_filtering: {
      weight: 0.3,
      enabled: true
    },
    content_based: {
      weight: 0.4,
      enabled: true
    },
    contextual: {
      weight: 0.2,
      enabled: true
    },
    behavioral: {
      weight: 0.1,
      enabled: true
    }
  };

  async generateAdvancedRecommendations(
    userId: string,
    persona: UserPersona,
    contentType: string,
    context: OnboardingContext,
    behaviorHistory: BehaviorEvent[]
  ): Promise<ContentRecommendation> {
    // Get content candidates
    const candidates = this.getContentCandidates(contentType);
    
    // Score candidates using multiple recommendation approaches
    const scoredContent = await this.scoreContentCandidates(
      candidates, userId, persona, context, behaviorHistory
    );
    
    // Select top recommendations
    const topRecommendations = this.selectTopRecommendations(scoredContent, 3);
    
    // Generate reasoning and alternatives
    const reasoning = this.generateAdvancedReasoning(persona, context, behaviorHistory, topRecommendations);
    const alternatives = this.generateContextualAlternatives(persona, contentType, context);
    
    return {
      stepId: context.currentStep,
      recommendations: topRecommendations,
      reasoning,
      confidence: this.calculateAdvancedConfidence(persona, topRecommendations, behaviorHistory),
      alternatives
    };
  }

  private getContentCandidates(contentType: string): any[] {
    if (contentType === 'all') {
      return [
        ...this.contentDatabase.videos,
        ...this.contentDatabase.interactive,
        ...this.contentDatabase.text
      ];
    }
    
    return this.contentDatabase[contentType] || [];
  }

  private async scoreContentCandidates(
    candidates: any[],
    userId: string,
    persona: UserPersona,
    context: OnboardingContext,
    behaviorHistory: BehaviorEvent[]
  ): Promise<Array<{content: any, score: number, breakdown: any}>> {
    const scoredContent = [];

    for (const content of candidates) {
      const scores = {
        collaborative: await this.calculateCollaborativeScore(content, userId, persona),
        contentBased: this.calculateContentBasedScore(content, persona, context),
        contextual: this.calculateContextualScore(content, context, behaviorHistory),
        behavioral: this.calculateBehavioralScore(content, behaviorHistory)
      };

      const totalScore = this.calculateWeightedScore(scores);
      
      scoredContent.push({
        content: {
          contentId: content.id,
          type: this.inferContentType(content),
          title: content.title,
          description: content.description,
          estimatedTime: Math.ceil(content.duration / 60), // Convert to minutes
          difficulty: content.difficulty,
          relevanceScore: totalScore,
          personalizationFactors: this.extractPersonalizationFactors(content, persona, scores)
        },
        score: totalScore,
        breakdown: scores
      });
    }

    return scoredContent.sort((a, b) => b.score - a.score);
  }

  private async calculateCollaborativeScore(content: any, userId: string, persona: UserPersona): Promise<number> {
    // Simulate collaborative filtering based on similar users
    // In a real implementation, this would use actual user interaction data
    const similarUserPreferences = await this.getSimilarUserPreferences(persona.personaType);
    
    const contentPopularity = similarUserPreferences[content.id] || 0.5;
    const personaRelevance = content.personaRelevance[persona.personaType] || 0.3;
    
    return (contentPopularity + personaRelevance) / 2;
  }

  private calculateContentBasedScore(content: any, persona: UserPersona, context: OnboardingContext): number {
    let score = 0;
    
    // Base persona relevance
    score += (content.personaRelevance[persona.personaType] || 0.3) * 0.5;
    
    // Difficulty match
    const userProficiency = this.extractTechnicalProficiency(persona);
    const difficultyMatch = 1 - Math.abs(content.difficulty / 5 - userProficiency);
    score += difficultyMatch * 0.3;
    
    // Learning objective alignment
    const objectiveAlignment = this.calculateObjectiveAlignment(content, persona);
    score += objectiveAlignment * 0.2;
    
    return Math.min(1, score);
  }

  private calculateContextualScore(content: any, context: OnboardingContext, behaviorHistory: BehaviorEvent[]): number {
    let score = 0.5; // Base score
    
    // Time of day factor
    const hour = new Date().getHours();
    if (content.duration > 600 && (hour < 9 || hour > 17)) {
      score -= 0.2; // Penalize long content outside work hours
    }
    
    // Session length factor
    const avgSessionLength = this.calculateAverageSessionLength(behaviorHistory);
    if (content.duration > avgSessionLength * 1.5) {
      score -= 0.15; // Penalize content longer than typical session
    }
    
    // Recent content type preferences
    const recentContentTypes = this.getRecentContentTypePreferences(behaviorHistory);
    const contentType = this.inferContentType(content);
    if (recentContentTypes[contentType] > 0.6) {
      score += 0.1; // Boost preferred content types
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private calculateBehavioralScore(content: any, behaviorHistory: BehaviorEvent[]): number {
    if (behaviorHistory.length === 0) return 0.5;
    
    let score = 0.5;
    
    // Engagement with similar content
    const similarContentEngagement = this.calculateSimilarContentEngagement(content, behaviorHistory);
    score += (similarContentEngagement - 0.5) * 0.4;
    
    // Completion rate for similar difficulty
    const completionRate = this.calculateDifficultyCompletionRate(content.difficulty, behaviorHistory);
    score += (completionRate - 0.5) * 0.3;
    
    // Time preference alignment
    const timeAlignment = this.calculateTimePreferenceAlignment(content, behaviorHistory);
    score += (timeAlignment - 0.5) * 0.3;
    
    return Math.max(0, Math.min(1, score));
  }

  private calculateWeightedScore(scores: any): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [model, config] of Object.entries(this.recommendationModels)) {
      if (config.enabled && scores[model.replace('_', '')]) {
        totalScore += scores[model.replace('_', '')] * config.weight;
        totalWeight += config.weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }

  private selectTopRecommendations(scoredContent: any[], count: number): any[] {
    return scoredContent.slice(0, count).map(item => item.content);
  }

  private generateAdvancedReasoning(
    persona: UserPersona,
    context: OnboardingContext,
    behaviorHistory: BehaviorEvent[],
    recommendations: any[]
  ): any {
    const primaryFactors = [];
    
    // Persona-based reasoning
    primaryFactors.push(`persona_${persona.personaType}`);
    
    // Behavior-based reasoning
    if (behaviorHistory.length > 0) {
      const avgEngagement = behaviorHistory.reduce((sum, e) => sum + e.engagementScore, 0) / behaviorHistory.length;
      if (avgEngagement > 0.7) {
        primaryFactors.push('high_engagement_user');
      } else if (avgEngagement < 0.4) {
        primaryFactors.push('struggling_user');
      }
    }
    
    // Context-based reasoning
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      primaryFactors.push('work_hours');
    }
    
    return {
      primaryFactors,
      userPersona: persona.personaType,
      learningStyle: this.inferLearningStyleFromBehavior(behaviorHistory),
      currentContext: context.currentStep,
      historicalPerformance: this.calculateHistoricalPerformance(behaviorHistory),
      adaptationTriggers: this.identifyAdaptationTriggers(behaviorHistory),
      confidenceFactors: this.extractConfidenceFactors(persona, recommendations)
    };
  }

  private generateContextualAlternatives(persona: UserPersona, contentType: string, context: OnboardingContext): any[] {
    const alternatives = [];
    
    // Low engagement alternative
    alternatives.push({
      scenario: 'low_engagement',
      recommendation: {
        contentId: 'simplified_interactive',
        type: 'interactive',
        title: 'Quick Interactive Guide',
        description: 'A simplified, engaging walkthrough'
      },
      conditions: ['engagement_score < 0.4'],
      expectedImpact: 0.3
    });
    
    // Time constraint alternative
    alternatives.push({
      scenario: 'time_constrained',
      recommendation: {
        contentId: 'quick_overview',
        type: 'video',
        title: '2-Minute Quick Start',
        description: 'Essential features in under 2 minutes'
      },
      conditions: ['session_time_remaining < 5'],
      expectedImpact: 0.2
    });
    
    // High proficiency alternative
    if (this.extractTechnicalProficiency(persona) > 0.7) {
      alternatives.push({
        scenario: 'advanced_user',
        recommendation: {
          contentId: 'advanced_features',
          type: 'text',
          title: 'Advanced Features Guide',
          description: 'Skip basics and explore advanced capabilities'
        },
        conditions: ['technical_proficiency > 0.7'],
        expectedImpact: 0.4
      });
    }
    
    return alternatives;
  }

  private calculateAdvancedConfidence(persona: UserPersona, recommendations: any[], behaviorHistory: BehaviorEvent[]): number {
    let confidence = persona.confidenceScore * 0.4; // Base persona confidence
    
    // Recommendation quality
    if (recommendations.length > 0) {
      const avgRelevance = recommendations.reduce((sum, rec) => sum + rec.relevanceScore, 0) / recommendations.length;
      confidence += avgRelevance * 0.3;
    }
    
    // Behavioral data quality
    if (behaviorHistory.length > 10) {
      confidence += 0.2; // More data = higher confidence
    } else if (behaviorHistory.length > 5) {
      confidence += 0.1;
    }
    
    // Consistency check
    const consistencyScore = this.calculateRecommendationConsistency(recommendations);
    confidence += consistencyScore * 0.1;
    
    return Math.min(1, confidence);
  }

  // Helper methods
  private async getSimilarUserPreferences(personaType: PersonaType): Promise<Record<string, number>> {
    // Mock implementation - would query actual user preference data
    const mockPreferences = {
      content_creator: { 'creator_intro_video': 0.8, 'hands_on_tutorial': 0.7 },
      business_user: { 'business_roi_video': 0.9, 'comprehensive_guide': 0.6 },
      influencer: { 'creator_intro_video': 0.7, 'hands_on_tutorial': 0.8 },
      agency: { 'comprehensive_guide': 0.9, 'business_roi_video': 0.7 },
      casual_user: { 'hands_on_tutorial': 0.9, 'creator_intro_video': 0.6 }
    };
    
    return mockPreferences[personaType] || {};
  }

  private extractTechnicalProficiency(persona: UserPersona): number {
    const proficiencyChar = persona.characteristics.find(c => c.trait === 'technical_proficiency');
    return proficiencyChar?.value || 0.5;
  }

  private calculateObjectiveAlignment(content: any, persona: UserPersona): number {
    // Simplified alignment calculation
    const personaObjectives = {
      content_creator: ['platform_overview', 'basic_features', 'content_creation'],
      business_user: ['roi_features', 'analytics', 'efficiency'],
      influencer: ['platform_overview', 'analytics', 'growth'],
      agency: ['comprehensive_understanding', 'advanced_features', 'automation'],
      casual_user: ['basic_features', 'hands_on_experience', 'confidence_building']
    };
    
    const userObjectives = personaObjectives[persona.personaType] || [];
    const matchingObjectives = content.learningObjectives.filter(obj => userObjectives.includes(obj));
    
    return matchingObjectives.length / Math.max(content.learningObjectives.length, userObjectives.length);
  }

  private inferContentType(content: any): string {
    if (content.id.includes('video')) return 'video';
    if (content.id.includes('interactive') || content.id.includes('tutorial')) return 'interactive';
    return 'text';
  }

  private calculateAverageSessionLength(behaviorHistory: BehaviorEvent[]): number {
    if (behaviorHistory.length === 0) return 300; // 5 minutes default
    
    const sessionLengths = new Map();
    behaviorHistory.forEach(event => {
      if (!sessionLengths.has(event.sessionId)) {
        sessionLengths.set(event.sessionId, []);
      }
      sessionLengths.get(event.sessionId).push(event.timestamp);
    });
    
    let totalLength = 0;
    let sessionCount = 0;
    
    sessionLengths.forEach(timestamps => {
      if (timestamps.length > 1) {
        const length = timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime();
        totalLength += length;
        sessionCount++;
      }
    });
    
    return sessionCount > 0 ? totalLength / sessionCount / 1000 : 300; // Convert to seconds
  }

  private getRecentContentTypePreferences(behaviorHistory: BehaviorEvent[]): Record<string, number> {
    const recentEvents = behaviorHistory.slice(0, 20); // Last 20 events
    const typeCount = {};
    
    recentEvents.forEach(event => {
      const contentType = event.interactionData.contentType || 'unknown';
      typeCount[contentType] = (typeCount[contentType] || 0) + 1;
    });
    
    const total = recentEvents.length;
    const preferences = {};
    
    Object.keys(typeCount).forEach(type => {
      preferences[type] = typeCount[type] / total;
    });
    
    return preferences;
  }

  private calculateSimilarContentEngagement(content: any, behaviorHistory: BehaviorEvent[]): number {
    const contentType = this.inferContentType(content);
    const similarEvents = behaviorHistory.filter(e => 
      e.interactionData.contentType === contentType
    );
    
    if (similarEvents.length === 0) return 0.5;
    
    return similarEvents.reduce((sum, e) => sum + e.engagementScore, 0) / similarEvents.length;
  }

  private calculateDifficultyCompletionRate(difficulty: number, behaviorHistory: BehaviorEvent[]): number {
    const difficultyEvents = behaviorHistory.filter(e => 
      e.interactionData.difficulty === difficulty
    );
    
    if (difficultyEvents.length === 0) return 0.5;
    
    const completedEvents = difficultyEvents.filter(e => e.eventType === 'step_completed');
    return completedEvents.length / difficultyEvents.length;
  }

  private calculateTimePreferenceAlignment(content: any, behaviorHistory: BehaviorEvent[]): number {
    const contentDuration = content.duration;
    const userPreferredDurations = behaviorHistory
      .filter(e => e.interactionData.timeSpent)
      .map(e => e.interactionData.timeSpent);
    
    if (userPreferredDurations.length === 0) return 0.5;
    
    const avgPreferredDuration = userPreferredDurations.reduce((sum, d) => sum + d, 0) / userPreferredDurations.length;
    const difference = Math.abs(contentDuration - avgPreferredDuration);
    
    return Math.max(0, 1 - (difference / Math.max(contentDuration, avgPreferredDuration)));
  }

  private inferLearningStyleFromBehavior(behaviorHistory: BehaviorEvent[]): string {
    const contentTypeEngagement = {};
    
    behaviorHistory.forEach(event => {
      const contentType = event.interactionData.contentType;
      if (contentType) {
        if (!contentTypeEngagement[contentType]) {
          contentTypeEngagement[contentType] = [];
        }
        contentTypeEngagement[contentType].push(event.engagementScore);
      }
    });
    
    let bestType = 'mixed';
    let bestScore = 0;
    
    Object.keys(contentTypeEngagement).forEach(type => {
      const scores = contentTypeEngagement[type];
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestType = type;
      }
    });
    
    return bestType;
  }

  private calculateHistoricalPerformance(behaviorHistory: BehaviorEvent[]): number {
    if (behaviorHistory.length === 0) return 0.5;
    
    const completionEvents = behaviorHistory.filter(e => e.eventType === 'step_completed');
    const errorEvents = behaviorHistory.filter(e => e.eventType === 'error');
    
    const completionRate = completionEvents.length / behaviorHistory.length;
    const errorRate = errorEvents.length / behaviorHistory.length;
    
    return Math.max(0, completionRate - errorRate * 0.5);
  }

  private identifyAdaptationTriggers(behaviorHistory: BehaviorEvent[]): string[] {
    const triggers = [];
    
    const avgEngagement = behaviorHistory.reduce((sum, e) => sum + e.engagementScore, 0) / behaviorHistory.length;
    if (avgEngagement < 0.4) {
      triggers.push('low_engagement');
    }
    
    const errorRate = behaviorHistory.filter(e => e.eventType === 'error').length / behaviorHistory.length;
    if (errorRate > 0.2) {
      triggers.push('high_error_rate');
    }
    
    const helpRequests = behaviorHistory.filter(e => e.eventType === 'help_requested').length;
    if (helpRequests > behaviorHistory.length * 0.3) {
      triggers.push('frequent_help_requests');
    }
    
    return triggers;
  }

  private extractConfidenceFactors(persona: UserPersona, recommendations: any[]): string[] {
    const factors = [];
    
    if (persona.confidenceScore > 0.8) {
      factors.push('high_persona_confidence');
    }
    
    if (recommendations.length > 0 && recommendations[0].relevanceScore > 0.8) {
      factors.push('high_relevance_match');
    }
    
    if (recommendations.length >= 3) {
      factors.push('multiple_options_available');
    }
    
    return factors;
  }

  private extractPersonalizationFactors(content: any, persona: UserPersona, scores: any): string[] {
    const factors = [];
    
    if (scores.contentBased > 0.7) {
      factors.push('persona_match');
    }
    
    if (scores.behavioral > 0.7) {
      factors.push('behavior_aligned');
    }
    
    if (content.difficulty <= 2 && this.extractTechnicalProficiency(persona) < 0.5) {
      factors.push('beginner_friendly');
    }
    
    if (content.duration <= 300) {
      factors.push('quick_consumption');
    }
    
    return factors;
  }

  private calculateRecommendationConsistency(recommendations: any[]): number {
    if (recommendations.length < 2) return 1.0;
    
    // Check if recommendations have similar relevance scores (consistency indicator)
    const scores = recommendations.map(r => r.relevanceScore);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
    
    return Math.max(0, 1 - variance);
  }
}

// Legacy Content Recommendation Engine (for backward compatibility)
class ContentRecommendationEngine {
  generateRecommendations(
    userId: string, 
    persona: UserPersona, 
    contentType: string,
    context: OnboardingContext
  ): ContentRecommendation {
    const recommendations = this.getRecommendationsForPersona(persona, contentType);
    const reasoning = this.generateReasoning(persona, contentType, context);
    
    return {
      stepId: context.currentStep,
      recommendations,
      reasoning,
      confidence: this.calculateConfidence(persona, recommendations),
      alternatives: this.generateAlternatives(persona, contentType)
    };
  }

  private getRecommendationsForPersona(persona: UserPersona, contentType: string): any[] {
    const baseRecommendations = {
      content_creator: [
        {
          contentId: 'creator_tutorial_video',
          type: 'video',
          title: 'Content Creator Quick Start',
          description: 'Learn the essentials for content creators',
          estimatedTime: 5,
          difficulty: 2,
          relevanceScore: 0.9,
          personalizationFactors: ['video_preference', 'quick_learning']
        }
      ],
      business_user: [
        {
          contentId: 'business_roi_guide',
          type: 'interactive',
          title: 'ROI-Focused Setup Guide',
          description: 'Get started with features that drive business results',
          estimatedTime: 3,
          difficulty: 1,
          relevanceScore: 0.95,
          personalizationFactors: ['efficiency_focus', 'roi_oriented']
        }
      ],
      // Add other persona types...
    };

    return baseRecommendations[persona.personaType] || [];
  }

  private generateReasoning(persona: UserPersona, contentType: string, context: OnboardingContext): any {
    return {
      primaryFactors: [`persona_${persona.personaType}`, `content_${contentType}`],
      userPersona: persona.personaType,
      learningStyle: 'visual', // This would be determined from persona
      currentContext: context.currentStep,
      historicalPerformance: 0.8 // This would be calculated from past interactions
    };
  }

  private calculateConfidence(persona: UserPersona, recommendations: any[]): number {
    // Base confidence on persona confidence and recommendation quality
    const personaConfidence = persona.confidenceScore;
    const recommendationQuality = recommendations.length > 0 
      ? recommendations.reduce((sum, rec) => sum + rec.relevanceScore, 0) / recommendations.length
      : 0.5;
    
    return (personaConfidence + recommendationQuality) / 2;
  }

  private generateAlternatives(persona: UserPersona, contentType: string): any[] {
    return [
      {
        scenario: 'low_engagement',
        recommendation: {
          contentId: 'simplified_version',
          type: 'text',
          title: 'Simplified Guide',
          description: 'A simpler version for better understanding'
        },
        conditions: ['engagement_score < 0.4']
      }
    ];
  }
}

// Main ML Personalization Engine Implementation
export class MLPersonalizationEngineImpl implements MLPersonalizationEngine {
  private db: Pool;
  private personaClassifier: UserPersonaClassifier;
  private proficiencyAssessor: TechnicalProficiencyAssessor;
  private pathPredictor: LearningPathPredictor;
  private advancedPathPredictor: AdvancedLearningPathPredictor;
  private contentEngine: ContentRecommendationEngine;
  private advancedContentEngine: AdvancedContentRecommendationEngine;

  constructor(db: Pool) {
    this.db = db;
    this.personaClassifier = new UserPersonaClassifier();
    this.proficiencyAssessor = new TechnicalProficiencyAssessor();
    this.pathPredictor = new LearningPathPredictor();
    this.advancedPathPredictor = new AdvancedLearningPathPredictor();
    this.contentEngine = new ContentRecommendationEngine();
    this.advancedContentEngine = new AdvancedContentRecommendationEngine();
  }

  async analyzeUserProfile(profileData: UserProfile): Promise<UserPersona> {
    try {
      // Classify user persona
      const persona = this.personaClassifier.classifyPersona(profileData);
      
      // Cache the persona
      await smartOnboardingCache.setUserPersona(profileData.id, persona);
      
      // Store in database for training data
      await this.storePersonaData(profileData.id, persona);
      
      return persona;
    } catch (error) {
      console.error('Error analyzing user profile:', error);
      throw error;
    }
  }

  async predictOptimalPath(userId: string, currentContext: OnboardingContext): Promise<LearningPath> {
    try {
      // Get user persona
      let persona = await smartOnboardingCache.getUserPersona(userId);
      if (!persona) {
        // Fallback to default persona if not found
        persona = {
          personaType: 'casual_user',
          confidenceScore: 0.5,
          characteristics: [],
          predictedBehaviors: [],
          recommendedApproach: {
            pacing: 'medium',
            complexity: 'simple',
            interactivity: 'medium',
            supportLevel: 'moderate'
          },
          lastUpdated: new Date()
        };
      }
      
      // Get user behavior history for advanced prediction
      const behaviorHistory = await this.getUserBehaviorHistory(userId);
      
      // Use advanced predictor if we have sufficient behavior data
      let learningPath: LearningPath;
      if (behaviorHistory.length >= 5) {
        learningPath = await this.advancedPathPredictor.predictOptimalLearningPath(
          userId, persona, behaviorHistory, currentContext
        );
      } else {
        // Fallback to basic predictor for new users
        learningPath = this.pathPredictor.predictOptimalPath(userId, persona, currentContext);
      }
      
      // Cache the learning path
      await smartOnboardingCache.setLearningPath(learningPath.pathId, learningPath);
      
      return learningPath;
    } catch (error) {
      console.error('Error predicting optimal path:', error);
      throw error;
    }
  }

  async updateUserModel(userId: string, behaviorData: BehaviorEvent[]): Promise<void> {
    try {
      if (behaviorData.length === 0) return;
      
      // Extract interaction patterns from behavior data
      const interactionPatterns = this.extractInteractionPatterns(behaviorData);
      
      // Reassess technical proficiency
      const newProficiency = this.proficiencyAssessor.assessProficiency(interactionPatterns);
      
      // Get current persona
      const currentPersona = await smartOnboardingCache.getUserPersona(userId);
      if (currentPersona) {
        // Update persona characteristics based on new behavior
        const updatedPersona = await this.updatePersonaWithBehavior(currentPersona, behaviorData, newProficiency);
        
        // Cache updated persona
        await smartOnboardingCache.setUserPersona(userId, updatedPersona);
        
        // Store training data
        await this.storeTrainingData(userId, behaviorData, updatedPersona);
      }
    } catch (error) {
      console.error('Error updating user model:', error);
      throw error;
    }
  }

  async generateContentRecommendations(userId: string, contentType: string): Promise<ContentRecommendation[]> {
    try {
      // Get user persona and context
      const persona = await smartOnboardingCache.getUserPersona(userId);
      if (!persona) {
        return [];
      }
      
      const context: OnboardingContext = {
        userId,
        currentStep: 'current', // This would be determined from actual context
        sessionId: 'session',
        userAgent: '',
        timestamp: new Date()
      };
      
      // Get behavior history for advanced recommendations
      const behaviorHistory = await this.getUserBehaviorHistory(userId);
      
      // Use advanced engine if we have sufficient behavior data
      let recommendation: ContentRecommendation;
      if (behaviorHistory.length >= 3) {
        recommendation = await this.advancedContentEngine.generateAdvancedRecommendations(
          userId, persona, contentType, context, behaviorHistory
        );
      } else {
        // Fallback to basic engine for new users
        recommendation = this.contentEngine.generateRecommendations(
          userId, persona, contentType, context
        );
      }
      
      return [recommendation];
    } catch (error) {
      console.error('Error generating content recommendations:', error);
      return [];
    }
  }

  async assessTechnicalProficiency(interactionPatterns: InteractionPattern[]): Promise<ProficiencyLevel> {
    try {
      return this.proficiencyAssessor.assessProficiency(interactionPatterns);
    } catch (error) {
      console.error('Error assessing technical proficiency:', error);
      return 'beginner';
    }
  }

  async predictSuccessProbability(userId: string): Promise<SuccessPrediction> {
    try {
      // Get user persona and recent behavior
      const persona = await smartOnboardingCache.getUserPersona(userId);
      const engagementScore = await smartOnboardingCache.getEngagementScore(userId) || 0.5;
      
      // Calculate success probability based on persona and engagement
      const baseProbability = this.calculateBaseProbability(persona);
      const engagementAdjustment = (engagementScore - 0.5) * 0.4; // ±0.2 adjustment
      const currentProbability = Math.max(0, Math.min(1, baseProbability + engagementAdjustment));
      
      const prediction: SuccessPrediction = {
        userId,
        currentProbability,
        factors: [
          {
            type: 'engagement',
            impact: engagementAdjustment,
            confidence: 0.8,
            trend: engagementScore > 0.6 ? 'positive' : engagementScore < 0.4 ? 'negative' : 'stable'
          }
        ],
        riskFactors: this.identifyRiskFactors(persona, engagementScore),
        recommendations: this.generateSuccessRecommendations(currentProbability, engagementScore),
        confidence: persona?.confidenceScore || 0.5,
        lastUpdated: new Date()
      };
      
      // Cache the prediction
      await smartOnboardingCache.setSuccessPrediction(userId, prediction);
      
      return prediction;
    } catch (error) {
      console.error('Error predicting success probability:', error);
      throw error;
    }
  }

  async retrainModels(trainingData: BehaviorEvent[]): Promise<void> {
    try {
      // In a real implementation, this would retrain ML models
      // For now, we'll just log the training data size
      console.log(`Retraining models with ${trainingData.length} behavior events`);
      
      // Store training data for future model updates
      await this.storeModelTrainingData(trainingData);
    } catch (error) {
      console.error('Error retraining models:', error);
      throw error;
    }
  }

  async getModelMetrics(): Promise<any> {
    try {
      // Return mock metrics - in real implementation, these would be actual model performance metrics
      return {
        accuracy: 0.85,
        precision: 0.82,
        recall: 0.88,
        f1Score: 0.85,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting model metrics:', error);
      throw error;
    }
  }

  // Helper methods
  private extractInteractionPatterns(behaviorData: BehaviorEvent[]): InteractionPattern[] {
    return behaviorData.map(event => ({
      userId: event.userId,
      stepId: event.stepId,
      completionTime: event.interactionData.timeSpent || 0,
      clickCount: event.interactionData.clickPatterns?.length || 0,
      errorCount: event.eventType === 'error' ? 1 : 0,
      helpRequests: event.eventType === 'help_requested' ? 1 : 0,
      usedAdvancedFeatures: event.interactionData.advancedFeatureUsed || false,
      timestamp: event.timestamp
    }));
  }

  private async updatePersonaWithBehavior(
    currentPersona: UserPersona, 
    behaviorData: BehaviorEvent[], 
    newProficiency: ProficiencyLevel
  ): Promise<UserPersona> {
    // Update characteristics based on new behavior
    const updatedCharacteristics = currentPersona.characteristics.map(char => {
      if (char.trait === 'technical_proficiency') {
        return {
          ...char,
          value: this.getProficiencyScore(newProficiency),
          confidence: Math.min(1, char.confidence + 0.1)
        };
      }
      return char;
    });

    return {
      ...currentPersona,
      characteristics: updatedCharacteristics,
      lastUpdated: new Date()
    };
  }

  private getProficiencyScore(proficiency: ProficiencyLevel): number {
    const scores = { beginner: 0.2, intermediate: 0.5, advanced: 0.8, expert: 1.0 };
    return scores[proficiency] || 0.2;
  }

  private calculateBaseProbability(persona: UserPersona | null): number {
    if (!persona) return 0.5;
    
    const personaProbabilities = {
      content_creator: 0.75,
      business_user: 0.8,
      influencer: 0.7,
      agency: 0.85,
      casual_user: 0.6
    };
    
    return personaProbabilities[persona.personaType] || 0.5;
  }

  private identifyRiskFactors(persona: UserPersona | null, engagementScore: number): any[] {
    const riskFactors = [];
    
    if (engagementScore < 0.4) {
      riskFactors.push({
        type: 'low_engagement',
        severity: 0.8,
        likelihood: 0.9,
        mitigationStrategies: ['provide_assistance', 'simplify_content', 'increase_interactivity']
      });
    }
    
    if (persona?.personaType === 'casual_user' && engagementScore < 0.5) {
      riskFactors.push({
        type: 'complexity_mismatch',
        severity: 0.6,
        likelihood: 0.7,
        mitigationStrategies: ['guided_tutorial', 'step_by_step_approach']
      });
    }
    
    return riskFactors;
  }

  private generateSuccessRecommendations(probability: number, engagementScore: number): any[] {
    const recommendations = [];
    
    if (probability < 0.6) {
      recommendations.push({
        type: 'intervention',
        description: 'Provide proactive assistance to improve success likelihood',
        expectedImpact: 0.2,
        urgency: 'high'
      });
    }
    
    if (engagementScore < 0.4) {
      recommendations.push({
        type: 'content_modification',
        description: 'Adjust content complexity and presentation style',
        expectedImpact: 0.15,
        urgency: 'medium'
      });
    }
    
    return recommendations;
  }

  private async storePersonaData(userId: string, persona: UserPersona): Promise<void> {
    const query = `
      INSERT INTO smart_onboarding_user_personas 
      (user_id, persona_type, confidence_score, characteristics, predicted_behaviors, recommended_approach, model_version)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, model_version) 
      DO UPDATE SET 
        persona_type = EXCLUDED.persona_type,
        confidence_score = EXCLUDED.confidence_score,
        characteristics = EXCLUDED.characteristics,
        predicted_behaviors = EXCLUDED.predicted_behaviors,
        recommended_approach = EXCLUDED.recommended_approach,
        updated_at = NOW()
    `;
    
    await this.db.query(query, [
      userId,
      persona.personaType,
      persona.confidenceScore,
      JSON.stringify(persona.characteristics),
      JSON.stringify(persona.predictedBehaviors),
      JSON.stringify(persona.recommendedApproach),
      'v1.0'
    ]);
  }

  private async storeTrainingData(userId: string, behaviorData: BehaviorEvent[], persona: UserPersona): Promise<void> {
    const query = `
      INSERT INTO smart_onboarding_model_training_data 
      (model_type, input_features, target_output, user_id, data_quality_score)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    const inputFeatures = {
      behaviorEvents: behaviorData.length,
      avgEngagement: behaviorData.reduce((sum, e) => sum + e.engagementScore, 0) / behaviorData.length,
      eventTypes: [...new Set(behaviorData.map(e => e.eventType))]
    };
    
    await this.db.query(query, [
      ML_MODEL_TYPES.USER_PERSONA_CLASSIFIER,
      JSON.stringify(inputFeatures),
      JSON.stringify(persona),
      userId,
      0.8
    ]);
  }

  private async storeModelTrainingData(trainingData: BehaviorEvent[]): Promise<void> {
    // Store aggregated training data for model retraining
    const query = `
      INSERT INTO smart_onboarding_model_training_data 
      (model_type, input_features, target_output, data_quality_score)
      VALUES ($1, $2, $3, $4)
    `;
    
    const features = {
      totalEvents: trainingData.length,
      timeRange: {
        start: trainingData[0]?.timestamp,
        end: trainingData[trainingData.length - 1]?.timestamp
      },
      eventTypeDistribution: this.calculateEventTypeDistribution(trainingData)
    };
    
    await this.db.query(query, [
      'batch_training_data',
      JSON.stringify(features),
      JSON.stringify({ processed: true }),
      0.9
    ]);
  }

  private calculateEventTypeDistribution(events: BehaviorEvent[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    events.forEach(event => {
      distribution[event.eventType] = (distribution[event.eventType] || 0) + 1;
    });
    return distribution;
  }

  private async getUserBehaviorHistory(userId: string): Promise<BehaviorEvent[]> {
    try {
      const query = `
        SELECT * FROM smart_onboarding_behavior_events 
        WHERE user_id = $1 
        ORDER BY timestamp DESC 
        LIMIT 100
      `;
      
      const result = await this.db.query(query, [userId]);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        sessionId: row.session_id,
        stepId: row.step_id,
        eventType: row.event_type,
        timestamp: row.timestamp,
        interactionData: JSON.parse(row.interaction_data || '{}'),
        engagementScore: row.engagement_score || 0.5,
        metadata: JSON.parse(row.metadata || '{}')
      }));
    } catch (error) {
      console.error('Error fetching user behavior history:', error);
      return [];
    }
  }
}

// Advanced Predictive Modeling for Learning Paths
class AdvancedLearningPathPredictor {
  private readonly featureWeights = {
    user_behavior: 0.35,
    persona_characteristics: 0.25,
    historical_performance: 0.20,
    contextual_factors: 0.15,
    temporal_patterns: 0.05
  };

  private readonly pathOptimizationModels = {
    completion_probability: {
      weights: { engagement: 0.4, proficiency: 0.3, time_spent: 0.2, help_requests: 0.1 },
      threshold: 0.7
    },
    learning_efficiency: {
      weights: { error_rate: 0.3, task_completion_speed: 0.3, feature_adoption: 0.2, retention: 0.2 },
      threshold: 0.6
    },
    satisfaction_score: {
      weights: { interaction_quality: 0.4, goal_achievement: 0.3, ease_of_use: 0.3 },
      threshold: 0.75
    }
  };

  async predictOptimalLearningPath(
    userId: string, 
    persona: UserPersona, 
    behaviorHistory: BehaviorEvent[],
    context: OnboardingContext
  ): Promise<LearningPath> {
    // Extract features for prediction
    const features = await this.extractPredictiveFeatures(userId, persona, behaviorHistory, context);
    
    // Generate path variations
    const pathVariations = this.generatePathVariations(persona, features);
    
    // Score each variation
    const scoredPaths = await this.scorePathVariations(pathVariations, features);
    
    // Select optimal path
    const optimalPath = this.selectOptimalPath(scoredPaths);
    
    // Add dynamic adaptation points
    optimalPath.adaptationPoints = this.generateDynamicAdaptationPoints(features, optimalPath);
    
    return optimalPath;
  }

  private async extractPredictiveFeatures(
    userId: string, 
    persona: UserPersona, 
    behaviorHistory: BehaviorEvent[],
    context: OnboardingContext
  ): Promise<any> {
    const features = {
      // User behavior features
      userBehavior: {
        avgEngagement: this.calculateAverageEngagement(behaviorHistory),
        interactionPatterns: this.analyzeInteractionPatterns(behaviorHistory),
        learningVelocity: this.calculateLearningVelocity(behaviorHistory),
        errorRecoveryRate: this.calculateErrorRecoveryRate(behaviorHistory),
        helpSeekingBehavior: this.analyzeHelpSeekingBehavior(behaviorHistory)
      },
      
      // Persona characteristics
      personaCharacteristics: {
        personaType: persona.personaType,
        confidenceScore: persona.confidenceScore,
        technicalProficiency: this.extractTechnicalProficiency(persona),
        learningStyle: this.inferLearningStyle(persona, behaviorHistory),
        motivationLevel: this.assessMotivationLevel(persona, behaviorHistory)
      },
      
      // Historical performance (from similar users)
      historicalPerformance: await this.getHistoricalPerformanceData(persona.personaType),
      
      // Contextual factors
      contextualFactors: {
        timeOfDay: new Date().getHours(),
        sessionLength: context.sessionId ? await this.getSessionLength(context.sessionId) : 0,
        deviceType: this.inferDeviceType(context.userAgent),
        previousSessions: await this.getPreviousSessionCount(userId)
      },
      
      // Temporal patterns
      temporalPatterns: {
        dayOfWeek: new Date().getDay(),
        timeInOnboarding: await this.getTimeInOnboarding(userId),
        sessionFrequency: await this.getSessionFrequency(userId)
      }
    };

    return features;
  }

  private generatePathVariations(persona: UserPersona, features: any): LearningPath[] {
    const baseTemplate = this.getBasePathTemplate(persona.personaType);
    const variations: LearningPath[] = [];

    // Generate different path variations based on features
    const variationStrategies = [
      'standard', 'accelerated', 'detailed', 'simplified', 'interactive'
    ];

    variationStrategies.forEach(strategy => {
      const variation = this.createPathVariation(baseTemplate, strategy, features);
      variations.push(variation);
    });

    return variations;
  }

  private createPathVariation(baseTemplate: any, strategy: string, features: any): LearningPath {
    const pathId = `path_${strategy}_${Date.now()}`;
    
    let steps = [...baseTemplate.steps];
    let estimatedDuration = baseTemplate.estimatedDuration;
    
    switch (strategy) {
      case 'accelerated':
        steps = this.optimizeForSpeed(steps, features);
        estimatedDuration *= 0.7;
        break;
        
      case 'detailed':
        steps = this.addDetailedExplanations(steps, features);
        estimatedDuration *= 1.3;
        break;
        
      case 'simplified':
        steps = this.simplifySteps(steps, features);
        estimatedDuration *= 1.1;
        break;
        
      case 'interactive':
        steps = this.addInteractiveElements(steps, features);
        estimatedDuration *= 1.2;
        break;
        
      default: // standard
        break;
    }

    return {
      pathId,
      steps,
      estimatedDuration: Math.round(estimatedDuration),
      difficultyProgression: this.calculateDifficultyProgression(steps),
      personalizedContent: this.generatePersonalizedContent(steps, features),
      adaptationPoints: [], // Will be filled later
      createdAt: new Date(),
      version: 1,
      strategy
    };
  }

  private async scorePathVariations(pathVariations: LearningPath[], features: any): Promise<Array<{path: LearningPath, score: number}>> {
    const scoredPaths = [];

    for (const path of pathVariations) {
      const score = await this.calculatePathScore(path, features);
      scoredPaths.push({ path, score });
    }

    return scoredPaths.sort((a, b) => b.score - a.score);
  }

  private async calculatePathScore(path: LearningPath, features: any): Promise<number> {
    let totalScore = 0;
    let totalWeight = 0;

    // Score based on completion probability
    const completionScore = this.predictCompletionProbability(path, features);
    totalScore += completionScore * this.pathOptimizationModels.completion_probability.threshold;
    totalWeight += this.pathOptimizationModels.completion_probability.threshold;

    // Score based on learning efficiency
    const efficiencyScore = this.predictLearningEfficiency(path, features);
    totalScore += efficiencyScore * this.pathOptimizationModels.learning_efficiency.threshold;
    totalWeight += this.pathOptimizationModels.learning_efficiency.threshold;

    // Score based on predicted satisfaction
    const satisfactionScore = this.predictSatisfactionScore(path, features);
    totalScore += satisfactionScore * this.pathOptimizationModels.satisfaction_score.threshold;
    totalWeight += this.pathOptimizationModels.satisfaction_score.threshold;

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private predictCompletionProbability(path: LearningPath, features: any): number {
    const model = this.pathOptimizationModels.completion_probability;
    let score = 0;

    // Factor in engagement level
    score += features.userBehavior.avgEngagement * model.weights.engagement;
    
    // Factor in technical proficiency
    score += features.personaCharacteristics.technicalProficiency * model.weights.proficiency;
    
    // Factor in time constraints (inverse relationship)
    const timeScore = Math.max(0, 1 - (path.estimatedDuration / 60)); // Normalize to hour
    score += timeScore * model.weights.time_spent;
    
    // Factor in help-seeking behavior (lower is better for completion)
    const helpScore = Math.max(0, 1 - features.userBehavior.helpSeekingBehavior);
    score += helpScore * model.weights.help_requests;

    return Math.min(1, score);
  }

  private predictLearningEfficiency(path: LearningPath, features: any): number {
    const model = this.pathOptimizationModels.learning_efficiency;
    let score = 0;

    // Factor in error recovery rate
    score += features.userBehavior.errorRecoveryRate * model.weights.error_rate;
    
    // Factor in learning velocity
    score += features.userBehavior.learningVelocity * model.weights.task_completion_speed;
    
    // Factor in interaction quality
    score += features.userBehavior.interactionPatterns.quality * model.weights.feature_adoption;
    
    // Factor in historical performance
    score += features.historicalPerformance.avgRetention * model.weights.retention;

    return Math.min(1, score);
  }

  private predictSatisfactionScore(path: LearningPath, features: any): number {
    const model = this.pathOptimizationModels.satisfaction_score;
    let score = 0;

    // Factor in interaction quality
    score += features.userBehavior.interactionPatterns.quality * model.weights.interaction_quality;
    
    // Factor in goal alignment
    const goalAlignment = this.calculateGoalAlignment(path, features.personaCharacteristics);
    score += goalAlignment * model.weights.goal_achievement;
    
    // Factor in complexity match
    const complexityMatch = this.calculateComplexityMatch(path, features.personaCharacteristics);
    score += complexityMatch * model.weights.ease_of_use;

    return Math.min(1, score);
  }

  private selectOptimalPath(scoredPaths: Array<{path: LearningPath, score: number}>): LearningPath {
    if (scoredPaths.length === 0) {
      throw new Error('No path variations available');
    }

    // Select the highest scoring path
    return scoredPaths[0].path;
  }

  private generateDynamicAdaptationPoints(features: any, path: LearningPath): any[] {
    const adaptationPoints = [];

    // Add adaptation points based on risk factors
    if (features.userBehavior.avgEngagement < 0.5) {
      adaptationPoints.push({
        stepId: 'engagement_checkpoint',
        triggers: [
          { type: 'engagement_drop', threshold: 0.3, timeWindow: 60 }
        ],
        possibleActions: [
          { type: 'simplify_content', expectedImpact: 0.2 },
          { type: 'add_interactivity', expectedImpact: 0.3 }
        ]
      });
    }

    if (features.personaCharacteristics.technicalProficiency < 0.4) {
      adaptationPoints.push({
        stepId: 'complexity_checkpoint',
        triggers: [
          { type: 'error_rate_high', threshold: 0.3, timeWindow: 120 }
        ],
        possibleActions: [
          { type: 'provide_guidance', expectedImpact: 0.4 },
          { type: 'break_down_steps', expectedImpact: 0.3 }
        ]
      });
    }

    return adaptationPoints;
  }

  // Helper methods for feature extraction
  private calculateAverageEngagement(behaviorHistory: BehaviorEvent[]): number {
    if (behaviorHistory.length === 0) return 0.5;
    return behaviorHistory.reduce((sum, event) => sum + event.engagementScore, 0) / behaviorHistory.length;
  }

  private analyzeInteractionPatterns(behaviorHistory: BehaviorEvent[]): any {
    const patterns = {
      clickFrequency: 0,
      scrollBehavior: 0,
      timeOnStep: 0,
      quality: 0.5
    };

    if (behaviorHistory.length === 0) return patterns;

    // Analyze click patterns
    const clickEvents = behaviorHistory.filter(e => e.interactionData.clickPatterns);
    patterns.clickFrequency = clickEvents.length / behaviorHistory.length;

    // Analyze time spent
    const timeEvents = behaviorHistory.filter(e => e.interactionData.timeSpent);
    patterns.timeOnStep = timeEvents.reduce((sum, e) => sum + (e.interactionData.timeSpent || 0), 0) / timeEvents.length;

    // Calculate overall quality score
    patterns.quality = Math.min(1, (patterns.clickFrequency + (patterns.timeOnStep / 60)) / 2);

    return patterns;
  }

  private calculateLearningVelocity(behaviorHistory: BehaviorEvent[]): number {
    if (behaviorHistory.length < 2) return 0.5;

    const completionEvents = behaviorHistory.filter(e => e.eventType === 'step_completed');
    if (completionEvents.length < 2) return 0.5;

    const timeSpan = completionEvents[completionEvents.length - 1].timestamp.getTime() - 
                   completionEvents[0].timestamp.getTime();
    const stepsCompleted = completionEvents.length;
    
    // Normalize velocity (steps per minute)
    const velocity = (stepsCompleted / (timeSpan / 60000));
    return Math.min(1, velocity / 2); // Normalize assuming 2 steps per minute is maximum
  }

  private calculateErrorRecoveryRate(behaviorHistory: BehaviorEvent[]): number {
    const errorEvents = behaviorHistory.filter(e => e.eventType === 'error');
    const recoveryEvents = behaviorHistory.filter(e => e.eventType === 'error_resolved');
    
    if (errorEvents.length === 0) return 1.0; // No errors is perfect recovery
    return recoveryEvents.length / errorEvents.length;
  }

  private analyzeHelpSeekingBehavior(behaviorHistory: BehaviorEvent[]): number {
    const helpEvents = behaviorHistory.filter(e => e.eventType === 'help_requested');
    return helpEvents.length / Math.max(1, behaviorHistory.length);
  }

  private extractTechnicalProficiency(persona: UserPersona): number {
    const proficiencyChar = persona.characteristics.find(c => c.trait === 'technical_proficiency');
    return proficiencyChar?.value || 0.5;
  }

  private inferLearningStyle(persona: UserPersona, behaviorHistory: BehaviorEvent[]): string {
    // Analyze behavior to infer learning style
    const videoInteractions = behaviorHistory.filter(e => e.interactionData.contentType === 'video').length;
    const textInteractions = behaviorHistory.filter(e => e.interactionData.contentType === 'text').length;
    const interactiveElements = behaviorHistory.filter(e => e.interactionData.contentType === 'interactive').length;

    if (videoInteractions > textInteractions && videoInteractions > interactiveElements) {
      return 'visual';
    } else if (interactiveElements > videoInteractions && interactiveElements > textInteractions) {
      return 'hands_on';
    } else {
      return 'reading';
    }
  }

  private assessMotivationLevel(persona: UserPersona, behaviorHistory: BehaviorEvent[]): number {
    // Assess motivation based on engagement patterns and goal-oriented behavior
    const goalEvents = behaviorHistory.filter(e => e.eventType === 'goal_progress');
    const avgEngagement = this.calculateAverageEngagement(behaviorHistory);
    
    return Math.min(1, (goalEvents.length / 10 + avgEngagement) / 2);
  }

  private async getHistoricalPerformanceData(personaType: PersonaType): Promise<any> {
    // In a real implementation, this would query historical data
    const mockData = {
      content_creator: { avgCompletion: 0.75, avgRetention: 0.8, avgSatisfaction: 0.7 },
      business_user: { avgCompletion: 0.85, avgRetention: 0.7, avgSatisfaction: 0.8 },
      influencer: { avgCompletion: 0.7, avgRetention: 0.75, avgSatisfaction: 0.75 },
      agency: { avgCompletion: 0.9, avgRetention: 0.85, avgSatisfaction: 0.85 },
      casual_user: { avgCompletion: 0.6, avgRetention: 0.65, avgSatisfaction: 0.7 }
    };
    
    return mockData[personaType] || mockData.casual_user;
  }

  private async getSessionLength(sessionId: string): Promise<number> {
    // Mock implementation - would query actual session data
    return Math.random() * 30 + 5; // 5-35 minutes
  }

  private inferDeviceType(userAgent: string): string {
    if (userAgent.includes('Mobile')) return 'mobile';
    if (userAgent.includes('Tablet')) return 'tablet';
    return 'desktop';
  }

  private async getPreviousSessionCount(userId: string): Promise<number> {
    // Mock implementation - would query actual session data
    return Math.floor(Math.random() * 5);
  }

  private async getTimeInOnboarding(userId: string): Promise<number> {
    // Mock implementation - would calculate actual time since onboarding start
    return Math.random() * 7; // 0-7 days
  }

  private async getSessionFrequency(userId: string): Promise<number> {
    // Mock implementation - would calculate sessions per day
    return Math.random() * 3 + 0.5; // 0.5-3.5 sessions per day
  }

  private getBasePathTemplate(personaType: PersonaType): any {
    // Return base template for the persona type
    return {
      steps: [
        { id: 'welcome', type: 'introduction', estimatedTime: 2 },
        { id: 'profile_setup', type: 'form', estimatedTime: 5 },
        { id: 'platform_connect', type: 'integration', estimatedTime: 8 },
        { id: 'first_content', type: 'creation', estimatedTime: 10 }
      ],
      estimatedDuration: 25
    };
  }

  private optimizeForSpeed(steps: any[], features: any): any[] {
    // Remove optional steps and streamline required ones
    return steps.filter(step => step.required !== false).map(step => ({
      ...step,
      estimatedTime: Math.max(1, step.estimatedTime * 0.7)
    }));
  }

  private addDetailedExplanations(steps: any[], features: any): any[] {
    // Add explanation steps and extend time
    return steps.map(step => ({
      ...step,
      estimatedTime: step.estimatedTime * 1.2,
      hasDetailedExplanation: true
    }));
  }

  private simplifySteps(steps: any[], features: any): any[] {
    // Break down complex steps into simpler ones
    return steps.flatMap(step => {
      if (step.estimatedTime > 5) {
        return [
          { ...step, id: `${step.id}_part1`, estimatedTime: Math.ceil(step.estimatedTime / 2) },
          { ...step, id: `${step.id}_part2`, estimatedTime: Math.floor(step.estimatedTime / 2) }
        ];
      }
      return [step];
    });
  }

  private addInteractiveElements(steps: any[], features: any): any[] {
    // Add interactive components to steps
    return steps.map(step => ({
      ...step,
      estimatedTime: step.estimatedTime * 1.1,
      hasInteractiveElements: true
    }));
  }

  private calculateDifficultyProgression(steps: any[]): any[] {
    return steps.map((step, index) => ({
      stepId: step.id,
      level: Math.min(5, Math.floor(index / 2) + 1),
      factors: [
        { type: 'cognitive_load', weight: 0.4, value: Math.min(1, index * 0.2) },
        { type: 'technical_complexity', weight: 0.6, value: Math.min(1, index * 0.15) }
      ]
    }));
  }

  private generatePersonalizedContent(steps: any[], features: any): any[] {
    return steps.map(step => ({
      stepId: step.id,
      contentVariations: [
        {
          id: `${step.id}_default`,
          type: 'default',
          targetPersona: [features.personaCharacteristics.personaType],
          effectivenessScore: 0.8
        }
      ],
      selectedVariation: `${step.id}_default`,
      adaptationHistory: []
    }));
  }

  private calculateGoalAlignment(path: LearningPath, personaCharacteristics: any): number {
    // Calculate how well the path aligns with user goals
    // This is a simplified implementation
    const personaGoalAlignment = {
      content_creator: 0.8,
      business_user: 0.9,
      influencer: 0.75,
      agency: 0.85,
      casual_user: 0.7
    };
    
    return personaGoalAlignment[personaCharacteristics.personaType] || 0.7;
  }

  private calculateComplexityMatch(path: LearningPath, personaCharacteristics: any): number {
    // Calculate how well the path complexity matches user proficiency
    const pathComplexity = path.difficultyProgression.reduce((sum, step) => 
      sum + step.level, 0) / path.difficultyProgression.length;
    
    const userProficiency = personaCharacteristics.technicalProficiency;
    
    // Optimal match is when complexity slightly exceeds proficiency
    const optimalComplexity = userProficiency * 1.2;
    const difference = Math.abs(pathComplexity - optimalComplexity);
    
    return Math.max(0, 1 - difference);
  }
}