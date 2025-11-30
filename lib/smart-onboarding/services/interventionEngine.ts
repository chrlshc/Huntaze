import { 
  InterventionEngine, 
  InterventionTrigger, 
  InterventionPlan, 
  HelpContent, 
  ComplexIssue, 
  EscalationTicket, 
  InterventionOutcome,
  OnboardingContext,
  StruggleMetrics
} from '../interfaces/services';
import type { BehavioralAnalyticsService, SmartOnboardingOrchestrator } from '../interfaces/services';
import { logger } from '../../utils/logger';
import { redisClient } from '../config/redis';

export class InterventionEngineImpl {
  private behavioralAnalytics: BehavioralAnalyticsService;
  private orchestrator: SmartOnboardingOrchestrator;
  private activeMonitoring: Map<string, NodeJS.Timeout> = new Map();
  private interventionHistory: Map<string, InterventionPlan[]> = new Map();

  constructor(
    behavioralAnalytics: BehavioralAnalyticsService,
    orchestrator: SmartOnboardingOrchestrator
  ) {
    this.behavioralAnalytics = behavioralAnalytics;
    this.orchestrator = orchestrator;
  }

  async monitorUserProgress(userId: string): Promise<void> {
    try {
      // Clear existing monitoring for this user
      if (this.activeMonitoring.has(userId)) {
        clearInterval(this.activeMonitoring.get(userId)!);
      }

      // Set up real-time monitoring
      const monitoringInterval = setInterval(async () => {
        await this.checkForInterventionTriggers(userId);
      }, 5000); // Check every 5 seconds

      this.activeMonitoring.set(userId, monitoringInterval);

      logger.info(`Started monitoring user progress: ${userId}`);
    } catch (error) {
      logger.error(`Failed to start monitoring for user ${userId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async triggerIntervention(
    userId: string, 
    triggerReason: InterventionTrigger
  ): Promise<InterventionPlan> {
    try {
      const userState = await this.getUserState(userId);
      const struggleMetrics = await this.behavioralAnalytics.detectStruggleIndicators(userId);
      
      const interventionPlan = await this.createInterventionPlan(
        userId,
        triggerReason,
        userState,
        struggleMetrics
      );

      // Store intervention in history
      if (!this.interventionHistory.has(userId)) {
        this.interventionHistory.set(userId, []);
      }
      this.interventionHistory.get(userId)!.push(interventionPlan);

      // Cache intervention plan
      await redisClient.setex(
        `intervention:${userId}:${interventionPlan.id}`,
        3600, // 1 hour
        JSON.stringify(interventionPlan)
      );

      logger.info(`Triggered intervention for user ${userId}:`, {
        interventionId: interventionPlan.id,
        triggerReason: triggerReason.type,
        strategy: interventionPlan.strategy
      });

      return interventionPlan;
    } catch (error) {
      logger.error(`Failed to trigger intervention for user ${userId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async provideContextualHelp(
    userId: string, 
    context: OnboardingContext
  ): Promise<HelpContent> {
    try {
      const userState = await this.getUserState(userId);
      const engagementAnalysis = await this.behavioralAnalytics.analyzeEngagementPatterns(
        userId, 
        300 // Last 5 minutes
      );

      const helpContent = await this.generateContextualHelp(
        userId,
        context,
        userState,
        engagementAnalysis
      );

      // Track help content delivery
      await this.trackHelpContentDelivery(userId, helpContent);

      logger.info(`Provided contextual help for user ${userId}:`, {
        stepId: (context as any).currentStepId ?? (context as any).currentStep?.id,
        helpType: helpContent.type,
        contentLength: helpContent.content.length
      });

      return helpContent;
    } catch (error) {
      logger.error(`Failed to provide contextual help for user ${userId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async escalateToHuman(userId: string, issue: ComplexIssue): Promise<EscalationTicket> {
    try {
      const userState = await this.getUserState(userId);
      const interventionHistory = this.interventionHistory.get(userId) || [];
      
      const escalationTicket: EscalationTicket = {
        id: `escalation_${Date.now()}_${userId}`,
        userId,
        issue,
        userState,
        interventionHistory,
        createdAt: new Date(),
        priority: this.calculateEscalationPriority(issue, userState),
        assignedAgent: null,
        status: 'pending'
      };

      // Store escalation ticket
      await redisClient.setex(
        `escalation:${escalationTicket.id}`,
        86400, // 24 hours
        JSON.stringify(escalationTicket)
      );

      // Notify support team (implementation would depend on notification system)
      await this.notifySupportTeam(escalationTicket);

      logger.info(`Escalated issue to human support:`, {
        ticketId: escalationTicket.id,
        userId,
        issueType: issue.type,
        priority: escalationTicket.priority
      });

      return escalationTicket;
    } catch (error) {
      logger.error(`Failed to escalate issue for user ${userId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async trackInterventionEffectiveness(
    interventionId: string, 
    outcome: InterventionOutcome
  ): Promise<void> {
    try {
      const interventionKey = `intervention_outcome:${interventionId}`;
      
      await redisClient.setex(
        interventionKey,
        86400, // 24 hours
        JSON.stringify({
          interventionId,
          outcome,
          trackedAt: new Date()
        })
      );

      // Update intervention effectiveness metrics
      await this.updateInterventionMetrics(interventionId, outcome);

      logger.info(`Tracked intervention effectiveness:`, {
        interventionId,
        success: outcome.successful,
        userSatisfaction: outcome.userSatisfaction,
        timeToResolution: outcome.timeToResolution
      });
    } catch (error) {
      logger.error(`Failed to track intervention effectiveness:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private async checkForInterventionTriggers(userId: string): Promise<void> {
    try {
      const struggleMetrics = await this.behavioralAnalytics.detectStruggleIndicators(userId);
      const engagementScore = await this.behavioralAnalytics.calculateEngagementScore(
        await this.getRecentInteractions(userId)
      );

      // Check for various trigger conditions
      const triggers = await this.evaluateInterventionTriggers(
        userId,
        struggleMetrics,
        engagementScore
      );

      for (const trigger of triggers) {
        await this.triggerIntervention(userId, trigger);
      }
    } catch (error) {
      logger.error(`Error checking intervention triggers for user ${userId}:`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async evaluateInterventionTriggers(
    userId: string,
    struggleMetrics: StruggleMetrics,
    engagementScore: number
  ): Promise<InterventionTrigger[]> {
    const triggers: InterventionTrigger[] = [];

    // Low engagement trigger
    if (engagementScore < 60) {
      triggers.push({
        type: 'low_engagement',
        severity: engagementScore < 40 ? 'high' : 'medium',
        detectedAt: new Date(),
        metrics: { engagementScore }
      });
    }

    // Struggle indicators trigger
    if (struggleMetrics.hesitationTime > 15000) { // 15 seconds
      triggers.push({
        type: 'user_struggle',
        severity: struggleMetrics.hesitationTime > 30000 ? 'high' : 'medium',
        detectedAt: new Date(),
        metrics: { hesitationTime: struggleMetrics.hesitationTime }
      });
    }

    // Repeated errors trigger
    if (struggleMetrics.errorCount > 3) {
      triggers.push({
        type: 'repeated_errors',
        severity: 'high',
        detectedAt: new Date(),
        metrics: { errorCount: struggleMetrics.errorCount }
      });
    }

    // Time spent trigger
    if (struggleMetrics.timeOnStep > 300000) { // 5 minutes
      triggers.push({
        type: 'excessive_time',
        severity: 'medium',
        detectedAt: new Date(),
        metrics: { timeOnStep: struggleMetrics.timeOnStep }
      });
    }

    return triggers;
  }

  private async createInterventionPlan(
    userId: string,
    trigger: InterventionTrigger,
    userState: any,
    struggleMetrics: StruggleMetrics
  ): Promise<InterventionPlan> {
    const strategy = await this.selectInterventionStrategy(trigger, userState, struggleMetrics);
    
    return {
      id: `intervention_${Date.now()}_${userId}`,
      userId,
      trigger,
      strategy,
      type: this.getInterventionType(strategy),
      createdAt: new Date(),
      executedAt: null,
      completed: false,
      effectiveness: null,
      actions: await this.generateInterventionActions(strategy, userState),
      timing: await this.calculateOptimalTiming(userId, trigger),
      personalizedContent: await this.generatePersonalizedContent(userId, strategy)
    };
  }

  private async selectInterventionStrategy(
    trigger: InterventionTrigger,
    userState: any,
    struggleMetrics: StruggleMetrics
  ): Promise<any> {
    // Strategy selection based on trigger type and user context
    switch (trigger.type) {
      case 'low_engagement':
        return userState.technicalProficiency === 'beginner' 
          ? 'gentle_guidance' 
          : 'content_adaptation';
      
      case 'user_struggle':
        return struggleMetrics.errorCount > 2 
          ? 'step_by_step_help' 
          : 'contextual_hints';
      
      case 'repeated_errors':
        return 'interactive_tutorial';
      
      case 'excessive_time':
        return userState.learningStyle === 'visual' 
          ? 'visual_demonstration' 
          : 'simplified_explanation';
      
      default:
        return 'contextual_hints';
    }
  }

  private getInterventionType(strategy: any): any {
    const strategyTypeMap: Record<string, string> = {
      'gentle_guidance': 'proactive_hint',
      'content_adaptation': 'content_modification',
      'step_by_step_help': 'guided_tutorial',
      'contextual_hints': 'contextual_help',
      'interactive_tutorial': 'interactive_guide',
      'visual_demonstration': 'visual_aid',
      'simplified_explanation': 'content_simplification'
    };

    return strategyTypeMap[strategy] || 'contextual_help';
  }

  private async generateInterventionActions(
    strategy: any,
    userState: any
  ): Promise<any[]> {
    // Generate specific actions based on strategy
    const actions = [];

    switch (strategy) {
      case 'gentle_guidance':
        actions.push({
          type: 'show_hint',
          content: 'It looks like you might need some help. Would you like a quick tip?',
          timing: 'immediate'
        });
        break;

      case 'step_by_step_help':
        actions.push({
          type: 'start_tutorial',
          content: 'Let me walk you through this step by step',
          timing: 'immediate'
        });
        break;

      case 'content_adaptation':
        actions.push({
          type: 'simplify_content',
          content: 'Adjusting content complexity based on your preferences',
          timing: 'immediate'
        });
        break;

      default:
        actions.push({
          type: 'show_help',
          content: "Need assistance? I'm here to help!",
          timing: 'immediate'
        });
    }

    return actions;
  }

  private async calculateOptimalTiming(
    userId: string,
    trigger: InterventionTrigger
  ): Promise<number> {
    // Calculate optimal timing based on trigger severity and user context
    switch (trigger.severity) {
      case 'high':
        return 0; // Immediate
      case 'medium':
        return 3000; // 3 seconds
      case 'low':
        return 10000; // 10 seconds
      default:
        return 5000; // 5 seconds
    }
  }

  private async generatePersonalizedContent(
    userId: string,
    strategy: any
  ): Promise<any> {
    // Generate personalized content based on user profile and strategy
    return {
      message: `Personalized help content for strategy: ${strategy}`,
      tone: 'encouraging',
      complexity: 'appropriate',
      format: 'interactive'
    };
  }

  private async generateContextualHelp(
    userId: string,
    context: OnboardingContext,
    userState: any,
    engagementAnalysis: any
  ): Promise<HelpContent> {
    const stepId = (context as any).currentStepId ?? (context as any).currentStep?.id ?? 'unknown';
    return {
      id: `help_${Date.now()}_${userId}`,
      type: 'tooltip',
      content: `Contextual help for step: ${stepId}`,
      format: 'interactive',
      priority: 'medium',
      createdAt: new Date(),
      personalizedFor: userId,
      context: {
        stepId,
        userEngagement: (engagementAnalysis as any).averageScore ?? (engagementAnalysis as any).score ?? 0.5,
        suggestedActions: ['Try clicking here', 'Review the previous step']
      }
    };
  }

  private async getUserState(userId: string): Promise<any> {
    // Get current user state from cache or database
    const cached = await redisClient.get(`user_state:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fallback to default state
    return {
      userId,
      currentStep: 'unknown',
      technicalProficiency: 'intermediate',
      learningStyle: 'mixed',
      engagementLevel: 'medium',
      lastActivity: new Date()
    };
  }

  private async getRecentInteractions(userId: string): Promise<any[]> {
    // Get recent user interactions for analysis
    const cached = await redisClient.get(`recent_interactions:${userId}`);
    return cached ? JSON.parse(cached) : [];
  }

  private async trackHelpContentDelivery(userId: string, helpContent: HelpContent): Promise<void> {
    const trackingKey = `help_delivery:${userId}:${helpContent.id}`;
    await redisClient.setex(
      trackingKey,
      3600, // 1 hour
      JSON.stringify({
        helpContentId: helpContent.id,
        deliveredAt: new Date(),
        userId
      })
    );
  }

  private calculateEscalationPriority(issue: ComplexIssue, userState: any): 'low' | 'medium' | 'high' | 'critical' {
    // Calculate priority based on issue severity and user context
    if (issue.severity === 'critical' || userState.engagementLevel === 'very_low') {
      return 'critical';
    }
    if (issue.severity === 'high' || userState.engagementLevel === 'low') {
      return 'high';
    }
    if (issue.severity === 'medium') {
      return 'medium';
    }
    return 'low';
  }

  private async notifySupportTeam(escalationTicket: EscalationTicket): Promise<void> {
    // Implementation would depend on notification system
    logger.info(`Support team notified of escalation: ${escalationTicket.id}`);
  }

  private async updateInterventionMetrics(
    interventionId: string, 
    outcome: InterventionOutcome
  ): Promise<void> {
    // Update metrics for intervention effectiveness tracking
    const metricsKey = `intervention_metrics:${interventionId}`;
    await redisClient.setex(
      metricsKey,
      86400, // 24 hours
      JSON.stringify({
        interventionId,
        successful: outcome.successful,
        userSatisfaction: outcome.userSatisfaction,
        timeToResolution: outcome.timeToResolution,
        updatedAt: new Date()
      })
    );
  }

  // Cleanup method to stop monitoring when user completes onboarding
  async stopMonitoring(userId: string): Promise<void> {
    if (this.activeMonitoring.has(userId)) {
      clearInterval(this.activeMonitoring.get(userId)!);
      this.activeMonitoring.delete(userId);
      logger.info(`Stopped monitoring user: ${userId}`);
    }
  }
}
