import { 
  ProactiveAssistanceService,
  StruggleIndicator,
  AssistanceLevel,
  ProactiveAction,
  UserBehaviorPattern,
  InterventionTiming,
  AssistanceConfig
} from '../interfaces/services';
import { BehavioralAnalyticsService } from './behavioralAnalyticsService';
// Note: Do not import the legacy InterventionEngine here to keep it out of the type graph
import { logger } from '../../utils/logger';
import { redisClient } from '../config/redis';

export class ProactiveAssistanceServiceImpl implements ProactiveAssistanceService {
  private behavioralAnalytics: BehavioralAnalyticsService;
  private assistanceConfig: AssistanceConfig;
  private activeAssistance: Map<string, ProactiveAction[]> = new Map();

  constructor(
    behavioralAnalytics: BehavioralAnalyticsService,
    _interventionEngine?: unknown,
    config?: AssistanceConfig
  ) {
    this.behavioralAnalytics = behavioralAnalytics;
    this.assistanceConfig = config || this.getDefaultConfig();
  }

  async detectStruggleIndicators(userId: string): Promise<StruggleIndicator[]> {
    try {
      const indicators: StruggleIndicator[] = [];
      
      // Get recent behavioral data
      const recentBehavior = await this.getRecentBehaviorData(userId);
      const engagementMetrics = await this.behavioralAnalytics.analyzeEngagementPatterns(
        userId, 
        this.assistanceConfig.analysisWindow
      );

      // Mouse hesitation patterns
      const mouseHesitation = this.detectMouseHesitation(recentBehavior);
      if (mouseHesitation.detected) {
        indicators.push({
          type: 'mouse_hesitation',
          severity: mouseHesitation.severity,
          confidence: mouseHesitation.confidence,
          detectedAt: new Date(),
          metadata: mouseHesitation.metadata
        });
      }

      // Click pattern analysis
      const clickPatterns = this.analyzeClickPatterns(recentBehavior);
      if (clickPatterns.indicatesStruggle) {
        indicators.push({
          type: 'erratic_clicking',
          severity: clickPatterns.severity,
          confidence: clickPatterns.confidence,
          detectedAt: new Date(),
          metadata: clickPatterns.metadata
        });
      }

      // Time-based indicators
      const timeIndicators = this.analyzeTimeSpentIndicators(recentBehavior);
      for (const indicator of timeIndicators) {
        indicators.push(indicator);
      }

      // Scroll behavior analysis
      const scrollIndicators = this.analyzeScrollBehavior(recentBehavior);
      if (scrollIndicators.length > 0) {
        indicators.push(...scrollIndicators);
      }

      // Engagement drop detection
      if (engagementMetrics.score < this.assistanceConfig.engagementThreshold) {
        indicators.push({
          type: 'low_engagement',
          severity: this.calculateEngagementSeverity(engagementMetrics.score),
          confidence: 0.9,
          detectedAt: new Date(),
          metadata: {
            currentScore: engagementMetrics.score,
            threshold: this.assistanceConfig.engagementThreshold,
            trend: engagementMetrics.trend
          }
        });
      }

      logger.info(`Detected ${indicators.length} struggle indicators for user ${userId}`);
      return indicators;
    } catch (error) {
      logger.error(`Failed to detect struggle indicators for user ${userId}:`, error);
      throw error;
    }
  }

  async calculateAssistanceLevel(
    userId: string, 
    indicators: StruggleIndicator[]
  ): Promise<AssistanceLevel> {
    try {
      if (indicators.length === 0) {
        return 'none';
      }

      // Calculate weighted severity score
      let totalSeverity = 0;
      let totalConfidence = 0;
      
      for (const indicator of indicators) {
        const severityWeight = this.getSeverityWeight(indicator.severity);
        totalSeverity += severityWeight * indicator.confidence;
        totalConfidence += indicator.confidence;
      }

      const averageSeverity = totalSeverity / totalConfidence;

      // Determine assistance level based on severity and user history
      const userHistory = await this.getUserAssistanceHistory(userId);
      const adjustedSeverity = this.adjustSeverityBasedOnHistory(averageSeverity, userHistory);

      if (adjustedSeverity >= 0.8) {
        return 'high';
      } else if (adjustedSeverity >= 0.6) {
        return 'medium';
      } else if (adjustedSeverity >= 0.3) {
        return 'low';
      } else {
        return 'none';
      }
    } catch (error) {
      logger.error(`Failed to calculate assistance level for user ${userId}:`, error);
      return 'none';
    }
  }

  async generateProactiveActions(
    userId: string, 
    assistanceLevel: AssistanceLevel,
    indicators: StruggleIndicator[]
  ): Promise<ProactiveAction[]> {
    try {
      const actions: ProactiveAction[] = [];
      
      if (assistanceLevel === 'none') {
        return actions;
      }

      // Get user context for personalization
      const userContext = await this.getUserContext(userId);
      
      // Generate actions based on assistance level and indicators
      switch (assistanceLevel) {
        case 'low':
          actions.push(...await this.generateLowLevelActions(userId, indicators, userContext));
          break;
        
        case 'medium':
          actions.push(...await this.generateMediumLevelActions(userId, indicators, userContext));
          break;
        
        case 'high':
          actions.push(...await this.generateHighLevelActions(userId, indicators, userContext));
          break;
      }

      // Store actions for tracking
      this.activeAssistance.set(userId, actions);
      
      // Cache actions
      await redisClient.setex(
        `proactive_actions:${userId}`,
        1800, // 30 minutes
        JSON.stringify(actions)
      );

      logger.info(`Generated ${actions.length} proactive actions for user ${userId} (level: ${assistanceLevel})`);
      return actions;
    } catch (error) {
      logger.error(`Failed to generate proactive actions for user ${userId}:`, error);
      throw error;
    }
  }

  async optimizeInterventionTiming(
    userId: string, 
    action: ProactiveAction
  ): Promise<InterventionTiming> {
    try {
      const userBehavior = await this.getRecentBehaviorData(userId);
      const currentEngagement = await this.getCurrentEngagementLevel(userId);
      
      // Calculate optimal timing based on user state and action type
      const timing: InterventionTiming = {
        delay: this.calculateOptimalDelay(action, currentEngagement),
        priority: this.calculateActionPriority(action, userBehavior),
        conditions: this.generateTimingConditions(action, userBehavior),
        maxWaitTime: this.calculateMaxWaitTime(action),
        retryStrategy: this.generateRetryStrategy(action)
      };

      logger.info(`Optimized intervention timing for user ${userId}:`, timing);
      return timing;
    } catch (error) {
      logger.error(`Failed to optimize intervention timing for user ${userId}:`, error);
      throw error;
    }
  }

  async trackAssistanceEffectiveness(
    userId: string, 
    action: ProactiveAction, 
    outcome: any
  ): Promise<void> {
    try {
      const effectiveness = {
        actionId: action.id,
        userId,
        actionType: action.type,
        successful: outcome.successful,
        userResponse: outcome.userResponse,
        timeToResponse: outcome.timeToResponse,
        engagementImprovement: outcome.engagementImprovement,
        trackedAt: new Date()
      };

      // Store effectiveness data
      await redisClient.setex(
        `assistance_effectiveness:${action.id}`,
        86400, // 24 hours
        JSON.stringify(effectiveness)
      );

      // Update user assistance history
      await this.updateUserAssistanceHistory(userId, effectiveness);

      logger.info(`Tracked assistance effectiveness:`, {
        actionId: action.id,
        userId,
        successful: outcome.successful
      });
    } catch (error) {
      logger.error(`Failed to track assistance effectiveness:`, error);
      throw error;
    }
  }

  private detectMouseHesitation(behaviorData: any): any {
    const mouseMovements = behaviorData.mouseMovements || [];
    
    if (mouseMovements.length === 0) {
      return { detected: false };
    }

    // Analyze mouse movement patterns for hesitation
    let hesitationCount = 0;
    let totalHesitationTime = 0;
    
    for (let i = 1; i < mouseMovements.length; i++) {
      const timeDiff = mouseMovements[i].timestamp - mouseMovements[i-1].timestamp;
      const distance = this.calculateMouseDistance(mouseMovements[i-1], mouseMovements[i]);
      
      // Detect hesitation: long pause with minimal movement
      if (timeDiff > 2000 && distance < 50) { // 2 seconds, 50 pixels
        hesitationCount++;
        totalHesitationTime += timeDiff;
      }
    }

    const detected = hesitationCount >= 3 || totalHesitationTime > 10000; // 10 seconds total
    
    return {
      detected,
      severity: totalHesitationTime > 20000 ? 'high' : 'medium',
      confidence: Math.min(hesitationCount / 5, 1),
      metadata: {
        hesitationCount,
        totalHesitationTime,
        averageHesitationTime: hesitationCount > 0 ? totalHesitationTime / hesitationCount : 0
      }
    };
  }

  private analyzeClickPatterns(behaviorData: any): any {
    const clickEvents = behaviorData.clickEvents || [];
    
    if (clickEvents.length < 3) {
      return { indicatesStruggle: false };
    }

    // Analyze for rapid repeated clicks (frustration indicator)
    let rapidClickSequences = 0;
    let clicksOnSameElement = 0;
    
    for (let i = 1; i < clickEvents.length; i++) {
      const timeDiff = clickEvents[i].timestamp - clickEvents[i-1].timestamp;
      const sameElement = clickEvents[i].elementId === clickEvents[i-1].elementId;
      
      if (timeDiff < 1000 && sameElement) { // Rapid clicks on same element
        rapidClickSequences++;
      }
      
      if (sameElement) {
        clicksOnSameElement++;
      }
    }

    const indicatesStruggle = rapidClickSequences >= 2 || clicksOnSameElement > clickEvents.length * 0.6;
    
    return {
      indicatesStruggle,
      severity: rapidClickSequences >= 4 ? 'high' : 'medium',
      confidence: Math.min((rapidClickSequences + clicksOnSameElement) / 10, 1),
      metadata: {
        rapidClickSequences,
        clicksOnSameElement,
        totalClicks: clickEvents.length
      }
    };
  }

  private analyzeTimeSpentIndicators(behaviorData: any): StruggleIndicator[] {
    const indicators: StruggleIndicator[] = [];
    const timeOnStep = behaviorData.timeOnCurrentStep || 0;
    const expectedTime = behaviorData.expectedStepTime || 60000; // 1 minute default
    
    // Excessive time indicator
    if (timeOnStep > expectedTime * 3) {
      indicators.push({
        type: 'excessive_time',
        severity: timeOnStep > expectedTime * 5 ? 'high' : 'medium',
        confidence: 0.8,
        detectedAt: new Date(),
        metadata: {
          timeOnStep,
          expectedTime,
          ratio: timeOnStep / expectedTime
        }
      });
    }

    // Inactivity indicator
    const lastActivity = behaviorData.lastActivityTime || Date.now();
    const inactivityTime = Date.now() - lastActivity;
    
    if (inactivityTime > 30000) { // 30 seconds of inactivity
      indicators.push({
        type: 'inactivity',
        severity: inactivityTime > 120000 ? 'high' : 'medium', // 2 minutes
        confidence: 0.9,
        detectedAt: new Date(),
        metadata: {
          inactivityTime,
          lastActivity: new Date(lastActivity)
        }
      });
    }

    return indicators;
  }

  private analyzeScrollBehavior(behaviorData: any): StruggleIndicator[] {
    const indicators: StruggleIndicator[] = [];
    const scrollEvents = behaviorData.scrollEvents || [];
    
    if (scrollEvents.length === 0) {
      return indicators;
    }

    // Analyze for excessive scrolling (confusion indicator)
    let rapidScrolls = 0;
    let backtrackScrolls = 0;
    
    for (let i = 1; i < scrollEvents.length; i++) {
      const timeDiff = scrollEvents[i].timestamp - scrollEvents[i-1].timestamp;
      const direction = scrollEvents[i].direction;
      const prevDirection = scrollEvents[i-1].direction;
      
      if (timeDiff < 500) { // Rapid scrolling
        rapidScrolls++;
      }
      
      if (direction !== prevDirection) { // Direction change (backtracking)
        backtrackScrolls++;
      }
    }

    if (rapidScrolls > scrollEvents.length * 0.5) {
      indicators.push({
        type: 'excessive_scrolling',
        severity: 'medium',
        confidence: 0.7,
        detectedAt: new Date(),
        metadata: {
          rapidScrolls,
          totalScrolls: scrollEvents.length,
          rapidScrollRatio: rapidScrolls / scrollEvents.length
        }
      });
    }

    if (backtrackScrolls > scrollEvents.length * 0.3) {
      indicators.push({
        type: 'scroll_confusion',
        severity: 'medium',
        confidence: 0.8,
        detectedAt: new Date(),
        metadata: {
          backtrackScrolls,
          totalScrolls: scrollEvents.length,
          backtrackRatio: backtrackScrolls / scrollEvents.length
        }
      });
    }

    return indicators;
  }

  private calculateEngagementSeverity(score: number): 'low' | 'medium' | 'high' {
    if (score < 30) return 'high';
    if (score < 50) return 'medium';
    return 'low';
  }

  private getSeverityWeight(severity: 'low' | 'medium' | 'high'): number {
    const weights = { low: 0.3, medium: 0.6, high: 1.0 };
    return weights[severity];
  }

  private async generateLowLevelActions(
    userId: string, 
    indicators: StruggleIndicator[], 
    userContext: any
  ): Promise<ProactiveAction[]> {
    return [
      {
        id: `low_action_${Date.now()}_${userId}`,
        type: 'subtle_hint',
        content: {
          message: 'Need a quick tip? Hover over any element for more information.',
          style: 'subtle',
          position: 'bottom-right'
        },
        timing: {
          delay: 10000, // 10 seconds
          conditions: ['user_idle']
        },
        priority: 'low',
        createdAt: new Date()
      }
    ];
  }

  private async generateMediumLevelActions(
    userId: string, 
    indicators: StruggleIndicator[], 
    userContext: any
  ): Promise<ProactiveAction[]> {
    return [
      {
        id: `medium_action_${Date.now()}_${userId}`,
        type: 'contextual_help',
        content: {
          message: 'It looks like you might need some guidance. Would you like me to show you around?',
          style: 'friendly',
          position: 'center'
        },
        timing: {
          delay: 5000, // 5 seconds
          conditions: ['struggle_detected']
        },
        priority: 'medium',
        createdAt: new Date()
      }
    ];
  }

  private async generateHighLevelActions(
    userId: string, 
    indicators: StruggleIndicator[], 
    userContext: any
  ): Promise<ProactiveAction[]> {
    return [
      {
        id: `high_action_${Date.now()}_${userId}`,
        type: 'guided_tutorial',
        content: {
          message: 'Let me walk you through this step by step to make it easier.',
          style: 'supportive',
          position: 'overlay'
        },
        timing: {
          delay: 2000, // 2 seconds
          conditions: ['immediate']
        },
        priority: 'high',
        createdAt: new Date()
      }
    ];
  }

  private calculateOptimalDelay(action: ProactiveAction, engagement: number): number {
    // Base delay on action priority and user engagement
    const baseDelay = action.priority === 'high' ? 2000 : 
                     action.priority === 'medium' ? 5000 : 10000;
    
    // Adjust based on engagement (lower engagement = shorter delay)
    const engagementMultiplier = Math.max(0.5, engagement / 100);
    
    return Math.round(baseDelay * engagementMultiplier);
  }

  private calculateActionPriority(action: ProactiveAction, behaviorData: any): number {
    // Calculate priority score based on action type and user behavior
    const basePriority = action.priority === 'high' ? 1.0 : 
                        action.priority === 'medium' ? 0.6 : 0.3;
    
    // Adjust based on behavior urgency
    const urgencyMultiplier = this.calculateBehaviorUrgency(behaviorData);
    
    return Math.min(1.0, basePriority * urgencyMultiplier);
  }

  private calculateBehaviorUrgency(behaviorData: any): number {
    // Calculate urgency based on behavior patterns
    let urgency = 1.0;
    
    if (behaviorData.errorCount > 3) urgency += 0.3;
    if (behaviorData.inactivityTime > 60000) urgency += 0.2;
    if (behaviorData.hesitationTime > 15000) urgency += 0.2;
    
    return Math.min(2.0, urgency);
  }

  private generateTimingConditions(action: ProactiveAction, behaviorData: any): string[] {
    const conditions = [];
    
    if (action.priority === 'high') {
      conditions.push('immediate');
    } else {
      conditions.push('user_idle', 'no_recent_interaction');
    }
    
    return conditions;
  }

  private calculateMaxWaitTime(action: ProactiveAction): number {
    return action.priority === 'high' ? 30000 : // 30 seconds
           action.priority === 'medium' ? 120000 : // 2 minutes
           300000; // 5 minutes
  }

  private generateRetryStrategy(action: ProactiveAction): any {
    return {
      maxRetries: action.priority === 'high' ? 3 : 1,
      retryDelay: 30000, // 30 seconds
      backoffMultiplier: 1.5
    };
  }

  private calculateMouseDistance(point1: any, point2: any): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private async getRecentBehaviorData(userId: string): Promise<any> {
    const cached = await redisClient.get(`behavior_data:${userId}`);
    return cached ? JSON.parse(cached) : {};
  }

  private async getUserContext(userId: string): Promise<any> {
    const cached = await redisClient.get(`user_context:${userId}`);
    return cached ? JSON.parse(cached) : {};
  }

  private async getCurrentEngagementLevel(userId: string): Promise<number> {
    const cached = await redisClient.get(`engagement_level:${userId}`);
    return cached ? parseFloat(cached) : 50; // Default to medium engagement
  }

  private async getUserAssistanceHistory(userId: string): Promise<any[]> {
    const cached = await redisClient.get(`assistance_history:${userId}`);
    return cached ? JSON.parse(cached) : [];
  }

  private adjustSeverityBasedOnHistory(severity: number, history: any[]): number {
    // Adjust severity based on user's assistance history
    if (history.length === 0) return severity;
    
    const recentFailures = history.filter(h => !h.successful && 
      Date.now() - new Date(h.trackedAt).getTime() < 300000 // Last 5 minutes
    ).length;
    
    // Increase severity if recent assistance was ineffective
    return Math.min(1.0, severity + (recentFailures * 0.1));
  }

  private async updateUserAssistanceHistory(userId: string, effectiveness: any): Promise<void> {
    const history = await this.getUserAssistanceHistory(userId);
    history.push(effectiveness);
    
    // Keep only last 50 entries
    const trimmedHistory = history.slice(-50);
    
    await redisClient.setex(
      `assistance_history:${userId}`,
      86400, // 24 hours
      JSON.stringify(trimmedHistory)
    );
  }

  private getDefaultConfig(): AssistanceConfig {
    return {
      analysisWindow: 300000, // 5 minutes
      engagementThreshold: 60,
      hesitationThreshold: 15000, // 15 seconds
      inactivityThreshold: 30000, // 30 seconds
      errorCountThreshold: 3,
      interventionCooldown: 60000 // 1 minute
    };
  }
}
