import {
  HelpContent,
  HelpLevel,
  HelpContext,
  AIHelpGenerator
} from '../interfaces/services';
// Local interfaces for contextual help (not previously exported)
interface ProgressiveDisclosureLevel {
  level: number;
  type: 'hint' | 'guidance' | 'tutorial';
  content: string;
  trigger: string;
  duration: number;
}

interface ProgressiveDisclosure {
  id: string;
  userId: string;
  baseHelpId: string;
  levels: ProgressiveDisclosureLevel[];
  currentLevel: number;
  createdAt: Date;
}

interface HelpPersonalization {
  technicalProficiency: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';
  platformPreferences: string[];
  preferredTone?: 'friendly' | 'formal' | 'concise' | 'casual' | 'professional';
  languageLevel?: 'simple' | 'standard' | 'advanced';
}

interface HelpEffectiveness {
  id: string;
  userId: string;
  helpContentId: string;
  helpType: HelpContent['type'];
  userResponse: {
    helpful: boolean;
    timeToResponse: number;
    actionTaken?: string;
    completedTask?: boolean;
    requestedMoreHelp?: boolean;
  };
  effectiveness: number;
  improvementSuggestions: string[];
  trackedAt: Date;
}

interface ContextualHelpService {
  generateContextualHelp(userId: string, context: HelpContext, userState: any): Promise<HelpContent>;
  implementProgressiveDisclosure(userId: string, baseHelp: HelpContent, userInteraction: any): Promise<ProgressiveDisclosure>;
  personalizeHelpContent(userId: string, baseContent: HelpContent, personalization: HelpPersonalization): Promise<HelpContent>;
  trackHelpEffectiveness(userId: string, helpContent: HelpContent, userResponse: any): Promise<HelpEffectiveness>;
  optimizeHelpContent(helpContentId: string, effectivenessData: HelpEffectiveness[]): Promise<HelpContent>;
}
import { logger } from '../../utils/logger';
import { redisClient } from '../config/redis';

export class ContextualHelpServiceImpl implements ContextualHelpService {
  private aiHelpGenerator: AIHelpGenerator;
  private helpCache: Map<string, HelpContent> = new Map();
  private userHelpHistory: Map<string, HelpContent[]> = new Map();

  constructor(aiHelpGenerator: AIHelpGenerator) {
    this.aiHelpGenerator = aiHelpGenerator;
  }

  async generateContextualHelp(
    userId: string,
    context: HelpContext,
    userState: any
  ): Promise<HelpContent> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(userId, context);
      const cached = await this.getCachedHelp(cacheKey);
      if (cached) {
        logger.info(`Returning cached help for user ${userId}`);
        return cached;
      }

      // Generate personalized help content
      const helpContent = await this.createPersonalizedHelp(userId, context, userState);
      
      // Cache the help content
      await this.cacheHelpContent(cacheKey, helpContent);
      
      // Track help generation
      await this.trackHelpGeneration(userId, helpContent);

      logger.info(`Generated contextual help for user ${userId}:`, {
        stepId: context.currentStep,
        helpType: helpContent.type,
        level: helpContent.level
      });

      return helpContent;
    } catch (error) {
      logger.error(`Failed to generate contextual help for user ${userId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async implementProgressiveDisclosure(
    userId: string,
    baseHelp: HelpContent,
    userInteraction: any
  ): Promise<ProgressiveDisclosure> {
    try {
      const disclosure: ProgressiveDisclosure = {
        id: `disclosure_${Date.now()}_${userId}`,
        userId,
        baseHelpId: baseHelp.id,
        levels: [],
        currentLevel: 0,
        createdAt: new Date()
      };

      // Level 1: Subtle hints
      disclosure.levels.push({
        level: 1,
        type: 'hint',
        content: await this.generateHintContent(baseHelp, userInteraction),
        trigger: 'user_hesitation',
        duration: 10000 // 10 seconds
      });

      // Level 2: Contextual guidance
      disclosure.levels.push({
        level: 2,
        type: 'guidance',
        content: await this.generateGuidanceContent(baseHelp, userInteraction),
        trigger: 'continued_struggle',
        duration: 30000 // 30 seconds
      });

      // Level 3: Full tutorial
      disclosure.levels.push({
        level: 3,
        type: 'tutorial',
        content: await this.generateTutorialContent(baseHelp, userInteraction),
        trigger: 'explicit_request',
        duration: 0 // Until dismissed
      });

      // Cache progressive disclosure
      await redisClient.setex(
        `progressive_disclosure:${disclosure.id}`,
        3600, // 1 hour
        JSON.stringify(disclosure)
      );

      logger.info(`Created progressive disclosure for user ${userId}:`, {
        disclosureId: disclosure.id,
        levels: disclosure.levels.length
      });

      return disclosure;
    } catch (error) {
      logger.error(`Failed to implement progressive disclosure for user ${userId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async personalizeHelpContent(
    userId: string,
    baseContent: HelpContent,
    personalization: HelpPersonalization
  ): Promise<HelpContent> {
    try {
      const personalizedContent: HelpContent = {
        ...baseContent,
        id: `personalized_${baseContent.id}_${userId}`,
        personalizedFor: userId,
        createdAt: new Date()
      };

      // Adjust content based on user preferences
      personalizedContent.content = await this.adjustContentForUser(
        baseContent.content,
        personalization
      );

      // Adjust complexity based on technical proficiency
      if (personalization.technicalProficiency === 'beginner') {
        personalizedContent.complexity = 'simple';
        personalizedContent.content = await this.simplifyContent(personalizedContent.content);
      } else if (personalization.technicalProficiency === 'advanced') {
        personalizedContent.complexity = 'detailed';
        personalizedContent.content = await this.enhanceContent(personalizedContent.content);
      }

      // Adjust format based on learning style
      personalizedContent.format = this.selectOptimalFormat(personalization.learningStyle);

      // Add personalized examples
    if (personalization.platformPreferences.length > 0) {
        personalizedContent.examples = await this.generatePersonalizedExamples(
          baseContent.context || {},
          personalization.platformPreferences
        );
      }

      logger.info(`Personalized help content for user ${userId}:`, {
        originalId: baseContent.id,
        personalizedId: personalizedContent.id,
        complexity: personalizedContent.complexity,
        format: personalizedContent.format
      });

      return personalizedContent;
    } catch (error) {
      logger.error(`Failed to personalize help content for user ${userId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async trackHelpEffectiveness(
    userId: string,
    helpContent: HelpContent,
    userResponse: any
  ): Promise<HelpEffectiveness> {
    try {
      const effectiveness: HelpEffectiveness = {
        id: `effectiveness_${Date.now()}_${userId}`,
        userId,
        helpContentId: helpContent.id,
        helpType: helpContent.type,
        userResponse: {
          helpful: userResponse.helpful,
          timeToResponse: userResponse.timeToResponse,
          actionTaken: userResponse.actionTaken,
          completedTask: userResponse.completedTask,
          requestedMoreHelp: userResponse.requestedMoreHelp
        },
        effectiveness: this.calculateEffectivenessScore(userResponse),
        improvementSuggestions: await this.generateImprovementSuggestions(
          helpContent,
          userResponse
        ),
        trackedAt: new Date()
      };

      // Store effectiveness data
      await redisClient.setex(
        `help_effectiveness:${effectiveness.id}`,
        86400, // 24 hours
        JSON.stringify(effectiveness)
      );

      // Update user help history
      await this.updateUserHelpHistory(userId, effectiveness);

      // Update global help effectiveness metrics
      await this.updateGlobalEffectivenessMetrics(effectiveness);

      logger.info(`Tracked help effectiveness:`, {
        helpContentId: helpContent.id,
        userId,
        effectiveness: effectiveness.effectiveness,
        helpful: userResponse.helpful
      });

      return effectiveness;
    } catch (error) {
      logger.error(`Failed to track help effectiveness:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async optimizeHelpContent(
    helpContentId: string,
    effectivenessData: HelpEffectiveness[]
  ): Promise<HelpContent> {
    try {
      // Analyze effectiveness patterns
      const analysis = this.analyzeEffectivenessPatterns(effectivenessData);
      
      // Get original help content
      const originalContent = await this.getHelpContent(helpContentId);
      if (!originalContent) {
        throw new Error(`Help content not found: ${helpContentId}`);
      }

      // Generate optimized version
      const optimizedContent: HelpContent = {
        ...originalContent,
        id: `optimized_${originalContent.id}_${Date.now()}`,
        version: (originalContent.version || 1) + 1,
        optimizedFrom: originalContent.id,
        createdAt: new Date()
      };

      // Apply optimizations based on analysis
      if (analysis.needsSimplification) {
        optimizedContent.content = await this.simplifyContent(originalContent.content);
        optimizedContent.complexity = 'simple';
      }

      if (analysis.needsMoreExamples) {
        optimizedContent.examples = await this.generateMoreExamples(originalContent.context || {});
      }

      if (analysis.needsVisualAids) {
        optimizedContent.format = 'visual';
        optimizedContent.visualAids = await this.generateVisualAids(originalContent.context || {});
      }

      if (analysis.needsInteractivity) {
        optimizedContent.interactive = true;
        optimizedContent.interactiveElements = await this.generateInteractiveElements(
          originalContent.context || {}
        );
      }

      // Cache optimized content
      await this.cacheHelpContent(`optimized_${helpContentId}`, optimizedContent);

      logger.info(`Optimized help content:`, {
        originalId: originalContent.id,
        optimizedId: optimizedContent.id,
        version: optimizedContent.version,
        optimizations: Object.keys(analysis).filter(key => analysis[key])
      });

      return optimizedContent;
    } catch (error) {
      logger.error(`Failed to optimize help content ${helpContentId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private async createPersonalizedHelp(
    userId: string,
    context: HelpContext,
    userState: any
  ): Promise<HelpContent> {
    // Get user personalization data
    const personalization = await this.getUserPersonalization(userId);
    
    // Generate base help content using AI
    const baseContent = await this.aiHelpGenerator.generateHelp(context, userState);
    
    // Personalize the content
    const personalizedContent = await this.personalizeHelpContent(
      userId,
      baseContent,
      personalization
    );

    return personalizedContent;
  }

  private async generateHintContent(baseHelp: HelpContent, userInteraction: any): Promise<any> {
    return {
      type: 'hint',
      message: 'Try clicking on the highlighted area to continue.',
      visual: {
        highlight: userInteraction.suggestedElement,
        animation: 'pulse'
      },
      dismissible: true
    };
  }

  private async generateGuidanceContent(baseHelp: HelpContent, userInteraction: any): Promise<any> {
    return {
      type: 'guidance',
      message: 'Let me show you how to complete this step.',
      steps: [
        'First, locate the button on the right side',
        'Click on it to open the menu',
        'Select your preferred option'
      ],
      visual: {
        arrows: true,
        overlay: true
      },
      dismissible: true
    };
  }

  private async generateTutorialContent(baseHelp: HelpContent, userInteraction: any): Promise<any> {
    return {
      type: 'tutorial',
      message: 'Complete interactive tutorial',
      interactive: true,
      steps: [
        {
          title: 'Understanding the Interface',
          content: 'This is your main dashboard...',
          action: 'highlight_dashboard'
        },
        {
          title: 'Making Your First Connection',
          content: 'To connect your social media...',
          action: 'guide_connection'
        }
      ],
      dismissible: false,
      completionRequired: true
    };
  }

  private async adjustContentForUser(
    content: string,
    personalization: HelpPersonalization
  ): Promise<string> {
    // Adjust tone based on user preferences
    let adjustedContent = content;

    if (personalization.preferredTone === 'casual') {
      adjustedContent = adjustedContent.replace(/Please/g, 'Just');
      adjustedContent = adjustedContent.replace(/You should/g, 'You can');
    } else if (personalization.preferredTone === 'professional') {
      adjustedContent = adjustedContent.replace(/Just/g, 'Please');
      adjustedContent = adjustedContent.replace(/You can/g, 'You should');
    }

    // Adjust language complexity
    if (personalization.languageLevel === 'simple') {
      adjustedContent = await this.simplifyLanguage(adjustedContent);
    }

    return adjustedContent;
  }

  private async simplifyContent(content: string): Promise<string> {
    // Use AI to simplify content
    return await this.aiHelpGenerator.simplifyText(content);
  }

  private async enhanceContent(content: string): Promise<string> {
    // Use AI to add more technical details
    return await this.aiHelpGenerator.enhanceText(content);
  }

  private selectOptimalFormat(learningStyle: string): string {
    const formatMap: Record<string, string> = {
      'visual': 'video',
      'auditory': 'audio',
      'kinesthetic': 'interactive',
      'reading': 'text'
    };

    return formatMap[learningStyle] || 'mixed';
  }

  private async generatePersonalizedExamples(
    context: any,
    platformPreferences: string[]
  ): Promise<any[]> {
    const examples = [];
    
    for (const platform of platformPreferences.slice(0, 2)) { // Limit to 2 examples
      examples.push({
        platform,
        scenario: `Example for ${platform} users`,
        steps: [`Connect your ${platform} account`, `Configure ${platform} settings`]
      });
    }

    return examples;
  }

  private calculateEffectivenessScore(userResponse: any): number {
    let score = 0;

    if (userResponse.helpful) score += 40;
    if (userResponse.completedTask) score += 30;
    if (userResponse.timeToResponse < 30000) score += 20; // Responded within 30 seconds
    if (!userResponse.requestedMoreHelp) score += 10;

    return Math.min(100, score);
  }

  private async generateImprovementSuggestions(
    helpContent: HelpContent,
    userResponse: any
  ): Promise<string[]> {
    const suggestions = [];

    if (!userResponse.helpful) {
      suggestions.push('Consider simplifying the language');
      suggestions.push('Add more visual elements');
    }

    if (!userResponse.completedTask) {
      suggestions.push('Break down into smaller steps');
      suggestions.push('Add interactive elements');
    }

    if (userResponse.requestedMoreHelp) {
      suggestions.push('Provide more detailed explanations');
      suggestions.push('Include additional examples');
    }

    return suggestions;
  }

  private analyzeEffectivenessPatterns(effectivenessData: HelpEffectiveness[]): any {
    const analysis = {
      needsSimplification: false,
      needsMoreExamples: false,
      needsVisualAids: false,
      needsInteractivity: false
    };

    const avgEffectiveness = effectivenessData.reduce((sum, data) => 
      sum + data.effectiveness, 0) / effectivenessData.length;

    if (avgEffectiveness < 60) {
      analysis.needsSimplification = true;
    }

    const requestedMoreHelp = effectivenessData.filter(data => 
      data.userResponse.requestedMoreHelp).length;
    
    if (requestedMoreHelp > effectivenessData.length * 0.3) {
      analysis.needsMoreExamples = true;
    }

    const lowCompletionRate = effectivenessData.filter(data => 
      !data.userResponse.completedTask).length;
    
    if (lowCompletionRate > effectivenessData.length * 0.4) {
      analysis.needsVisualAids = true;
      analysis.needsInteractivity = true;
    }

    return analysis;
  }

  private async simplifyLanguage(text: string): Promise<string> {
    // Use AI to simplify language
    return await this.aiHelpGenerator.simplifyLanguage(text);
  }

  private async generateMoreExamples(context: any): Promise<any[]> {
    return await this.aiHelpGenerator.generateExamples(context, 3);
  }

  private async generateVisualAids(context: any): Promise<any[]> {
    return await this.aiHelpGenerator.generateVisualAids(context);
  }

  private async generateInteractiveElements(context: any): Promise<any[]> {
    return await this.aiHelpGenerator.generateInteractiveElements(context);
  }

  private generateCacheKey(userId: string, context: HelpContext): string {
    return `help:${userId}:${context.currentStep}:${context.userAction || 'default'}`;
  }

  private async getCachedHelp(cacheKey: string): Promise<HelpContent | null> {
    const cached = await redisClient.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  private async cacheHelpContent(cacheKey: string, helpContent: HelpContent): Promise<void> {
    await redisClient.setex(
      cacheKey,
      1800, // 30 minutes
      JSON.stringify(helpContent)
    );
  }

  private async trackHelpGeneration(userId: string, helpContent: HelpContent): Promise<void> {
    const trackingData = {
      userId,
      helpContentId: helpContent.id,
      generatedAt: new Date(),
      type: helpContent.type,
      level: helpContent.level
    };

    await redisClient.setex(
      `help_generation:${helpContent.id}`,
      86400, // 24 hours
      JSON.stringify(trackingData)
    );
  }

  private async getUserPersonalization(userId: string): Promise<HelpPersonalization> {
    const cached = await redisClient.get(`user_personalization:${userId}`);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Default personalization
    return {
      technicalProficiency: 'intermediate',
      learningStyle: 'mixed',
      preferredTone: 'friendly',
      languageLevel: 'standard',
      platformPreferences: []
    };
  }

  private async getHelpContent(helpContentId: string): Promise<HelpContent | null> {
    // This would typically fetch from database
    const cached = await redisClient.get(`help_content:${helpContentId}`);
    return cached ? JSON.parse(cached) : null;
  }

  private async updateUserHelpHistory(userId: string, effectiveness: HelpEffectiveness): Promise<void> {
    const historyKey = `help_history:${userId}`;
    const history = await redisClient.get(historyKey);
    const userHistory = history ? JSON.parse(history) : [];
    
    userHistory.push(effectiveness);
    
    // Keep only last 20 entries
    const trimmedHistory = userHistory.slice(-20);
    
    await redisClient.setex(
      historyKey,
      86400, // 24 hours
      JSON.stringify(trimmedHistory)
    );
  }

  private async updateGlobalEffectivenessMetrics(effectiveness: HelpEffectiveness): Promise<void> {
    const metricsKey = `global_help_metrics:${effectiveness.helpType}`;
    const metrics = await redisClient.get(metricsKey);
    const currentMetrics = metrics ? JSON.parse(metrics) : {
      totalHelps: 0,
      totalEffectiveness: 0,
      averageEffectiveness: 0
    };

    currentMetrics.totalHelps += 1;
    currentMetrics.totalEffectiveness += effectiveness.effectiveness;
    currentMetrics.averageEffectiveness = currentMetrics.totalEffectiveness / currentMetrics.totalHelps;

    await redisClient.setex(
      metricsKey,
      86400, // 24 hours
      JSON.stringify(currentMetrics)
    );
  }
}
