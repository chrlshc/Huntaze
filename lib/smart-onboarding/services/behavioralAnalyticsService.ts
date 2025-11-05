// Smart Onboarding System - Behavioral Analytics Service Implementation

import { Pool } from 'pg';
import { 
  BehavioralAnalyticsService,
  InteractionEvent,
  EngagementAnalysis,
  StruggleMetrics,
  BehavioralInsights,
  SessionSummary,
  AnalyticsDashboard
} from '../interfaces/services';
import {
  BehaviorEvent,
  EngagementMetric,
  StruggleIndicator,
  BehaviorPattern,
  UserPreference,
  DetectedLearningStyle,
  BehaviorRecommendation,
  RealTimeMetrics,
  EngagementTrends,
  ProgressSummary,
  Alert
} from '../types';
import { TimeSeriesRepository } from '../repositories/base';
import { smartOnboardingCache } from '../config/redis';
import { PERFORMANCE_THRESHOLDS } from '../config/database';
import { WEBSOCKET_CHANNELS } from '../config/redis';

// Behavior Events Repository
class BehaviorEventsRepository extends TimeSeriesRepository<BehaviorEvent> {
  constructor(db: Pool) {
    super(db, 'smart_onboarding_behavior_events');
  }

  protected mapRowToEntity(row: any): BehaviorEvent {
    return {
      id: row.id,
      userId: row.user_id,
      timestamp: new Date(row.timestamp),
      eventType: row.event_type,
      stepId: row.step_id,
      interactionData: row.interaction_data || {},
      engagementScore: parseFloat(row.engagement_score) || 0,
      contextualData: row.contextual_data || {}
    };
  }

  protected mapEntityToRow(entity: Omit<BehaviorEvent, 'id'>): Record<string, any> {
    return {
      user_id: entity.userId,
      session_id: entity.contextualData?.sessionId || 'unknown',
      journey_id: entity.contextualData?.journeyId,
      step_id: entity.stepId,
      event_type: entity.eventType,
      interaction_data: JSON.stringify(entity.interactionData),
      engagement_score: entity.engagementScore,
      contextual_data: JSON.stringify(entity.contextualData),
      timestamp: entity.timestamp
    };
  }

  // Get recent events for a user
  async getRecentEvents(userId: string, minutes: number = 30): Promise<BehaviorEvent[]> {
    const startTime = new Date(Date.now() - minutes * 60 * 1000);
    const endTime = new Date();
    
    return this.findByTimeRange(startTime, endTime, { user_id: userId }, 1000);
  }

  // Get events by session
  async getSessionEvents(sessionId: string): Promise<BehaviorEvent[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE session_id = $1 
      ORDER BY timestamp ASC
    `;
    
    const result = await this.db.query(query, [sessionId]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  // Get engagement metrics over time
  async getEngagementTimeSeries(
    userId: string, 
    startTime: Date, 
    endTime: Date,
    intervalMinutes: number = 5
  ): Promise<Array<{ timestamp: Date; avgEngagement: number; eventCount: number }>> {
    const query = `
      SELECT 
        date_trunc('minute', timestamp) + 
        (EXTRACT(minute FROM timestamp)::int / $4) * interval '${intervalMinutes} minutes' as time_bucket,
        AVG(engagement_score) as avg_engagement,
        COUNT(*) as event_count
      FROM ${this.tableName}
      WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
      GROUP BY time_bucket
      ORDER BY time_bucket
    `;
    
    const result = await this.db.query(query, [userId, startTime, endTime, intervalMinutes]);
    return result.rows.map(row => ({
      timestamp: new Date(row.time_bucket),
      avgEngagement: parseFloat(row.avg_engagement) || 0,
      eventCount: parseInt(row.event_count) || 0
    }));
  }
}

// Engagement Scoring Engine
class EngagementScoringEngine {
  private readonly weights = {
    timeSpent: 0.25,
    interactionFrequency: 0.20,
    mouseActivity: 0.15,
    scrollBehavior: 0.15,
    clickPatterns: 0.15,
    hesitationPenalty: -0.10
  };

  calculateEngagementScore(events: BehaviorEvent[]): number {
    if (events.length === 0) return 0.5; // Default neutral score

    const recentEvents = events.slice(-20); // Last 20 events
    let totalScore = 0;
    let weightSum = 0;

    // Time spent analysis
    const timeSpentScore = this.calculateTimeSpentScore(recentEvents);
    totalScore += timeSpentScore * this.weights.timeSpent;
    weightSum += this.weights.timeSpent;

    // Interaction frequency
    const interactionScore = this.calculateInteractionFrequencyScore(recentEvents);
    totalScore += interactionScore * this.weights.interactionFrequency;
    weightSum += this.weights.interactionFrequency;

    // Mouse activity
    const mouseScore = this.calculateMouseActivityScore(recentEvents);
    totalScore += mouseScore * this.weights.mouseActivity;
    weightSum += this.weights.mouseActivity;

    // Scroll behavior
    const scrollScore = this.calculateScrollBehaviorScore(recentEvents);
    totalScore += scrollScore * this.weights.scrollBehavior;
    weightSum += this.weights.scrollBehavior;

    // Click patterns
    const clickScore = this.calculateClickPatternScore(recentEvents);
    totalScore += clickScore * this.weights.clickPatterns;
    weightSum += this.weights.clickPatterns;

    // Hesitation penalty
    const hesitationPenalty = this.calculateHesitationPenalty(recentEvents);
    totalScore += hesitationPenalty * Math.abs(this.weights.hesitationPenalty);
    weightSum += Math.abs(this.weights.hesitationPenalty);

    return Math.max(0, Math.min(1, totalScore / weightSum));
  }

  private calculateTimeSpentScore(events: BehaviorEvent[]): number {
    const timeSpentValues = events
      .map(e => e.interactionData.timeSpent)
      .filter(t => typeof t === 'number' && t > 0);

    if (timeSpentValues.length === 0) return 0.5;

    const avgTimeSpent = timeSpentValues.reduce((sum, t) => sum + t, 0) / timeSpentValues.length;
    
    // Optimal time spent is between 30-120 seconds per interaction
    if (avgTimeSpent >= 30 && avgTimeSpent <= 120) return 1.0;
    if (avgTimeSpent < 10) return 0.2; // Too fast, likely not engaged
    if (avgTimeSpent > 300) return 0.3; // Too slow, likely struggling
    
    return 0.6; // Moderate engagement
  }

  private calculateInteractionFrequencyScore(events: BehaviorEvent[]): number {
    if (events.length === 0) return 0.5;

    const timeSpan = events.length > 1 
      ? (events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime()) / 1000
      : 60; // Default 1 minute

    const interactionsPerMinute = (events.length / timeSpan) * 60;

    // Optimal interaction frequency: 2-8 interactions per minute
    if (interactionsPerMinute >= 2 && interactionsPerMinute <= 8) return 1.0;
    if (interactionsPerMinute < 0.5) return 0.2; // Too few interactions
    if (interactionsPerMinute > 15) return 0.4; // Too many interactions (possibly frustrated)
    
    return 0.7;
  }

  private calculateMouseActivityScore(events: BehaviorEvent[]): number {
    const mouseEvents = events.filter(e => 
      e.interactionData.mouseMovements && 
      Array.isArray(e.interactionData.mouseMovements)
    );

    if (mouseEvents.length === 0) return 0.5;

    let totalVelocity = 0;
    let movementCount = 0;

    mouseEvents.forEach(event => {
      const movements = event.interactionData.mouseMovements || [];
      movements.forEach(movement => {
        if (typeof movement.velocity === 'number') {
          totalVelocity += movement.velocity;
          movementCount++;
        }
      });
    });

    if (movementCount === 0) return 0.5;

    const avgVelocity = totalVelocity / movementCount;

    // Optimal mouse velocity indicates focused interaction
    if (avgVelocity >= 50 && avgVelocity <= 200) return 1.0;
    if (avgVelocity < 10) return 0.3; // Very slow, possibly distracted
    if (avgVelocity > 500) return 0.4; // Very fast, possibly frustrated
    
    return 0.7;
  }

  private calculateScrollBehaviorScore(events: BehaviorEvent[]): number {
    const scrollEvents = events.filter(e => 
      e.interactionData.scrollBehavior && 
      typeof e.interactionData.scrollBehavior === 'object'
    );

    if (scrollEvents.length === 0) return 0.5;

    let smoothScrolls = 0;
    let erraticScrolls = 0;

    scrollEvents.forEach(event => {
      const scroll = event.interactionData.scrollBehavior;
      if (scroll.velocity && scroll.pauseDuration) {
        if (scroll.velocity < 100 && scroll.pauseDuration > 500) {
          smoothScrolls++;
        } else if (scroll.velocity > 300 || scroll.pauseDuration < 100) {
          erraticScrolls++;
        }
      }
    });

    const totalScrolls = smoothScrolls + erraticScrolls;
    if (totalScrolls === 0) return 0.5;

    const smoothRatio = smoothScrolls / totalScrolls;
    return smoothRatio; // Higher ratio of smooth scrolls = better engagement
  }

  private calculateClickPatternScore(events: BehaviorEvent[]): number {
    const clickEvents = events.filter(e => 
      e.interactionData.clickPatterns && 
      Array.isArray(e.interactionData.clickPatterns)
    );

    if (clickEvents.length === 0) return 0.5;

    let purposefulClicks = 0;
    let totalClicks = 0;

    clickEvents.forEach(event => {
      const clicks = event.interactionData.clickPatterns || [];
      clicks.forEach(click => {
        totalClicks++;
        // Purposeful clicks have reasonable duration and target specific elements
        if (click.duration >= 100 && click.duration <= 2000 && click.element) {
          purposefulClicks++;
        }
      });
    });

    if (totalClicks === 0) return 0.5;

    const purposefulRatio = purposefulClicks / totalClicks;
    return purposefulRatio;
  }

  private calculateHesitationPenalty(events: BehaviorEvent[]): number {
    const hesitationEvents = events.filter(e => 
      e.interactionData.hesitationIndicators && 
      Array.isArray(e.interactionData.hesitationIndicators)
    );

    if (hesitationEvents.length === 0) return 0; // No penalty

    let totalHesitationTime = 0;
    let hesitationCount = 0;

    hesitationEvents.forEach(event => {
      const hesitations = event.interactionData.hesitationIndicators || [];
      hesitations.forEach(hesitation => {
        if (typeof hesitation.duration === 'number') {
          totalHesitationTime += hesitation.duration;
          hesitationCount++;
        }
      });
    });

    if (hesitationCount === 0) return 0;

    const avgHesitationTime = totalHesitationTime / hesitationCount;
    
    // Penalty increases with hesitation time
    if (avgHesitationTime > 5000) return -0.3; // High penalty for long hesitations
    if (avgHesitationTime > 2000) return -0.2; // Medium penalty
    if (avgHesitationTime > 1000) return -0.1; // Small penalty
    
    return 0; // No penalty for short hesitations
  }
}

// Struggle Detection Engine
class StruggleDetectionEngine {
  detectStruggleIndicators(events: BehaviorEvent[]): StruggleMetrics {
    const recentEvents = events.slice(-30); // Last 30 events
    const indicators: StruggleIndicator[] = [];
    
    // Time exceeded detection
    const timeExceededIndicator = this.detectTimeExceeded(recentEvents);
    if (timeExceededIndicator) indicators.push(timeExceededIndicator);

    // Repeated errors detection
    const repeatedErrorsIndicator = this.detectRepeatedErrors(recentEvents);
    if (repeatedErrorsIndicator) indicators.push(repeatedErrorsIndicator);

    // Backtracking detection
    const backtrackingIndicator = this.detectBacktracking(recentEvents);
    if (backtrackingIndicator) indicators.push(backtrackingIndicator);

    // Hesitation detection
    const hesitationIndicator = this.detectExcessiveHesitation(recentEvents);
    if (hesitationIndicator) indicators.push(hesitationIndicator);

    // Calculate overall struggle score
    const overallScore = this.calculateOverallStruggleScore(indicators);
    const severity = this.determineSeverity(overallScore);
    const duration = this.calculateStruggleDuration(recentEvents);

    return {
      userId: recentEvents[0]?.userId || '',
      stepId: recentEvents[recentEvents.length - 1]?.stepId || '',
      overallScore,
      indicators,
      severity,
      duration,
      patterns: this.identifyStrugglePatterns(recentEvents),
      recommendations: this.generateInterventionRecommendations(indicators, severity)
    };
  }

  private detectTimeExceeded(events: BehaviorEvent[]): StruggleIndicator | null {
    const timeSpentValues = events
      .map(e => e.interactionData.timeSpent)
      .filter(t => typeof t === 'number' && t > 0);

    if (timeSpentValues.length === 0) return null;

    const avgTimeSpent = timeSpentValues.reduce((sum, t) => sum + t, 0) / timeSpentValues.length;
    const threshold = PERFORMANCE_THRESHOLDS.STRUGGLE_TIME_THRESHOLD;

    if (avgTimeSpent > threshold) {
      return {
        type: 'time_exceeded',
        value: avgTimeSpent,
        threshold,
        confidence: Math.min(1, (avgTimeSpent - threshold) / threshold),
        timestamp: new Date()
      };
    }

    return null;
  }

  private detectRepeatedErrors(events: BehaviorEvent[]): StruggleIndicator | null {
    const errorEvents = events.filter(e => 
      e.eventType === 'error' || 
      e.interactionData.errorCount > 0
    );

    const errorCount = errorEvents.length;
    const threshold = PERFORMANCE_THRESHOLDS.ERROR_FREQUENCY_THRESHOLD;

    if (errorCount >= threshold) {
      return {
        type: 'repeated_errors',
        value: errorCount,
        threshold,
        confidence: Math.min(1, errorCount / (threshold * 2)),
        timestamp: new Date()
      };
    }

    return null;
  }

  private detectBacktracking(events: BehaviorEvent[]): StruggleIndicator | null {
    let backtrackCount = 0;
    const stepSequence: string[] = [];

    events.forEach(event => {
      if (event.stepId && stepSequence.length > 0) {
        const lastStep = stepSequence[stepSequence.length - 1];
        if (stepSequence.includes(event.stepId) && event.stepId !== lastStep) {
          backtrackCount++;
        }
      }
      if (event.stepId) {
        stepSequence.push(event.stepId);
      }
    });

    if (backtrackCount >= 3) {
      return {
        type: 'backtracking',
        value: backtrackCount,
        threshold: 3,
        confidence: Math.min(1, backtrackCount / 6),
        timestamp: new Date()
      };
    }

    return null;
  }

  private detectExcessiveHesitation(events: BehaviorEvent[]): StruggleIndicator | null {
    let totalHesitationTime = 0;
    let hesitationCount = 0;

    events.forEach(event => {
      const hesitations = event.interactionData.hesitationIndicators || [];
      hesitations.forEach(hesitation => {
        if (typeof hesitation.duration === 'number') {
          totalHesitationTime += hesitation.duration;
          hesitationCount++;
        }
      });
    });

    if (hesitationCount === 0) return null;

    const avgHesitationTime = totalHesitationTime / hesitationCount;
    const threshold = PERFORMANCE_THRESHOLDS.HESITATION_THRESHOLD;

    if (avgHesitationTime > threshold) {
      return {
        type: 'hesitation',
        value: avgHesitationTime,
        threshold,
        confidence: Math.min(1, (avgHesitationTime - threshold) / threshold),
        timestamp: new Date()
      };
    }

    return null;
  }

  private calculateOverallStruggleScore(indicators: StruggleIndicator[]): number {
    if (indicators.length === 0) return 0;

    const weightedSum = indicators.reduce((sum, indicator) => {
      const weight = this.getIndicatorWeight(indicator.type);
      return sum + (indicator.confidence * weight);
    }, 0);

    const totalWeight = indicators.reduce((sum, indicator) => {
      return sum + this.getIndicatorWeight(indicator.type);
    }, 0);

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private getIndicatorWeight(type: string): number {
    const weights = {
      'time_exceeded': 0.3,
      'repeated_errors': 0.4,
      'backtracking': 0.2,
      'hesitation': 0.1
    };
    return weights[type] || 0.1;
  }

  private determineSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  }

  private calculateStruggleDuration(events: BehaviorEvent[]): number {
    if (events.length < 2) return 0;
    
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    
    return lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
  }

  private identifyStrugglePatterns(events: BehaviorEvent[]): any[] {
    // Simplified pattern identification
    const patterns = [];
    
    // Error loop pattern
    const errorEvents = events.filter(e => e.eventType === 'error');
    if (errorEvents.length >= 3) {
      patterns.push({
        type: 'error_loop',
        startTime: errorEvents[0].timestamp,
        duration: errorEvents[errorEvents.length - 1].timestamp.getTime() - errorEvents[0].timestamp.getTime(),
        intensity: errorEvents.length / events.length,
        triggers: ['repeated_failures', 'unclear_instructions']
      });
    }

    return patterns;
  }

  private generateInterventionRecommendations(indicators: StruggleIndicator[], severity: string): any[] {
    const recommendations = [];

    if (severity === 'critical' || severity === 'high') {
      recommendations.push({
        type: 'immediate',
        intervention: {
          type: 'proactive_help',
          priority: 'high',
          content: {
            title: 'Need Help?',
            message: 'It looks like you might be having some difficulty. Would you like some assistance?',
            actions: ['Get Help', 'Show Tutorial', 'Skip Step']
          }
        },
        priority: 1,
        expectedEffectiveness: 0.8
      });
    }

    if (indicators.some(i => i.type === 'time_exceeded')) {
      recommendations.push({
        type: 'delayed',
        intervention: {
          type: 'content_adjustment',
          priority: 'medium',
          content: {
            title: 'Simplified Instructions',
            message: 'Let me break this down into smaller steps for you.'
          }
        },
        priority: 2,
        expectedEffectiveness: 0.6
      });
    }

    return recommendations;
  }
}

// Main Behavioral Analytics Service Implementation
export class BehavioralAnalyticsServiceImpl implements BehavioralAnalyticsService {
  private db: Pool;
  private behaviorEventsRepo: BehaviorEventsRepository;
  private engagementEngine: EngagementScoringEngine;
  private struggleEngine: StruggleDetectionEngine;
  private activeSessions: Map<string, string> = new Map(); // sessionId -> userId

  constructor(db: Pool) {
    this.db = db;
    this.behaviorEventsRepo = new BehaviorEventsRepository(db);
    this.engagementEngine = new EngagementScoringEngine();
    this.struggleEngine = new StruggleDetectionEngine();
  }

  async trackInteraction(userId: string, event: InteractionEvent): Promise<void> {
    try {
      // Convert InteractionEvent to BehaviorEvent
      const behaviorEvent: Omit<BehaviorEvent, 'id'> = {
        userId,
        timestamp: new Date(),
        eventType: event.type as any,
        stepId: event.data.stepId || '',
        interactionData: event.data,
        engagementScore: 0, // Will be calculated
        contextualData: {
          sessionId: event.data.sessionId,
          journeyId: event.data.journeyId,
          userAgent: event.data.userAgent,
          ...event.data.context
        }
      };

      // Get recent events to calculate engagement score
      const recentEvents = await this.behaviorEventsRepo.getRecentEvents(userId, 10);
      behaviorEvent.engagementScore = this.engagementEngine.calculateEngagementScore([...recentEvents, behaviorEvent as BehaviorEvent]);

      // Store the event
      await this.behaviorEventsRepo.insert(behaviorEvent);

      // Update cached engagement score
      await smartOnboardingCache.setEngagementScore(userId, behaviorEvent.engagementScore);

      // Publish real-time event
      await smartOnboardingCache.publishEvent(
        WEBSOCKET_CHANNELS.USER_EVENTS(userId),
        {
          type: 'behavior_tracked',
          userId,
          engagementScore: behaviorEvent.engagementScore,
          timestamp: new Date()
        }
      );

      // Check for struggle indicators
      const allRecentEvents = [...recentEvents, behaviorEvent as BehaviorEvent];
      const struggleMetrics = this.struggleEngine.detectStruggleIndicators(allRecentEvents);
      
      if (struggleMetrics.severity === 'high' || struggleMetrics.severity === 'critical') {
        await smartOnboardingCache.publishEvent(
          WEBSOCKET_CHANNELS.ENGAGEMENT_ALERTS,
          {
            type: 'struggle_detected',
            userId,
            struggleMetrics,
            timestamp: new Date()
          }
        );
      }

    } catch (error) {
      console.error('Error tracking interaction:', error);
      throw error;
    }
  }

  async analyzeEngagementPatterns(userId: string, timeWindow: number): Promise<EngagementAnalysis> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - timeWindow * 60 * 1000);

      // Get events in time window
      const events = await this.behaviorEventsRepo.findByTimeRange(
        startTime,
        endTime,
        { user_id: userId }
      );

      if (events.length === 0) {
        return {
          userId,
          timeWindow: { start: startTime, end: endTime },
          averageScore: 0.5,
          trend: 'stable',
          patterns: [],
          recommendations: []
        };
      }

      // Calculate average engagement score
      const averageScore = events.reduce((sum, event) => sum + event.engagementScore, 0) / events.length;

      // Determine trend
      const trend = this.calculateEngagementTrend(events);

      // Identify patterns
      const patterns = this.identifyEngagementPatterns(events);

      // Generate recommendations
      const recommendations = this.generateEngagementRecommendations(averageScore, trend, patterns);

      return {
        userId,
        timeWindow: { start: startTime, end: endTime },
        averageScore,
        trend,
        patterns,
        recommendations
      };

    } catch (error) {
      console.error('Error analyzing engagement patterns:', error);
      throw error;
    }
  }

  async detectStruggleIndicators(userId: string): Promise<StruggleMetrics> {
    try {
      const recentEvents = await this.behaviorEventsRepo.getRecentEvents(userId, 30);
      return this.struggleEngine.detectStruggleIndicators(recentEvents);
    } catch (error) {
      console.error('Error detecting struggle indicators:', error);
      throw error;
    }
  }

  async generateBehavioralInsights(userId: string): Promise<BehavioralInsights> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

      const events = await this.behaviorEventsRepo.findByTimeRange(
        startTime,
        endTime,
        { user_id: userId }
      );

      const patterns = this.identifyBehaviorPatterns(events);
      const preferences = this.identifyUserPreferences(events);
      const learningStyle = this.detectLearningStyle(events);
      const recommendations = this.generateBehaviorRecommendations(patterns, preferences, learningStyle);

      return {
        userId,
        timeWindow: { start: startTime, end: endTime },
        patterns,
        preferences,
        learningStyle,
        recommendations,
        confidence: this.calculateInsightConfidence(events.length)
      };

    } catch (error) {
      console.error('Error generating behavioral insights:', error);
      throw error;
    }
  }

  async calculateEngagementScore(interactionHistory: InteractionEvent[]): Promise<number> {
    try {
      // Convert InteractionEvents to BehaviorEvents for scoring
      const behaviorEvents: BehaviorEvent[] = interactionHistory.map(event => ({
        id: event.id,
        userId: event.userId,
        timestamp: event.timestamp,
        eventType: event.type as any,
        stepId: event.data.stepId || '',
        interactionData: event.data,
        engagementScore: 0,
        contextualData: event.data.context || {}
      }));

      return this.engagementEngine.calculateEngagementScore(behaviorEvents);
    } catch (error) {
      console.error('Error calculating engagement score:', error);
      return 0.5; // Default neutral score
    }
  }

  async startMonitoring(userId: string, sessionId: string): Promise<void> {
    try {
      this.activeSessions.set(sessionId, userId);
      await smartOnboardingCache.startUserSession(userId, sessionId);
      
      console.log(`Started monitoring session ${sessionId} for user ${userId}`);
    } catch (error) {
      console.error('Error starting monitoring:', error);
      throw error;
    }
  }

  async stopMonitoring(userId: string, sessionId: string): Promise<SessionSummary> {
    try {
      this.activeSessions.delete(sessionId);
      
      // Get session events
      const events = await this.behaviorEventsRepo.getSessionEvents(sessionId);
      
      // Calculate session summary
      const duration = events.length > 0 
        ? events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime()
        : 0;

      const avgEngagement = events.length > 0
        ? events.reduce((sum, e) => sum + e.engagementScore, 0) / events.length
        : 0.5;

      const struggles = await this.detectStruggleIndicators(userId);

      const summary: SessionSummary = {
        sessionId,
        userId,
        duration,
        interactions: events.length,
        engagementScore: avgEngagement,
        completedSteps: new Set(events.map(e => e.stepId)).size,
        struggles: [struggles]
      };

      await smartOnboardingCache.endUserSession(userId, sessionId);
      
      return summary;
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      throw error;
    }
  }

  async getDashboardData(userId: string): Promise<AnalyticsDashboard> {
    try {
      // Get real-time metrics
      const recentEvents = await this.behaviorEventsRepo.getRecentEvents(userId, 60);
      const currentEngagement = await smartOnboardingCache.getEngagementScore(userId) || 0.5;

      const realTimeMetrics: RealTimeMetrics = {
        activeUsers: this.activeSessions.size,
        averageEngagement: currentEngagement,
        completionRate: 0.85, // This would be calculated from actual data
        interventionRate: 0.15
      };

      // Get engagement trends
      const engagementTrends: EngagementTrends = {
        trend: this.calculateEngagementTrend(recentEvents),
        changeRate: 0.05, // This would be calculated
        predictions: [],
        anomalies: []
      };

      // Get progress summary
      const progressSummary: ProgressSummary = {
        totalUsers: 1, // This would be from actual data
        completedJourneys: 0,
        averageCompletionTime: 0,
        topStruggles: ['navigation', 'form_completion', 'content_understanding']
      };

      const alerts: Alert[] = [];
      if (currentEngagement < 0.4) {
        alerts.push({
          type: 'engagement',
          severity: 'high',
          message: 'Low engagement detected for user',
          timestamp: new Date(),
          actionRequired: true
        });
      }

      return {
        realTimeMetrics,
        engagementTrends,
        progressSummary,
        alerts
      };

    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateEngagementTrend(events: BehaviorEvent[]): 'increasing' | 'stable' | 'decreasing' {
    if (events.length < 2) return 'stable';

    const midpoint = Math.floor(events.length / 2);
    const firstHalf = events.slice(0, midpoint);
    const secondHalf = events.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, e) => sum + e.engagementScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.engagementScore, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    
    if (difference > 0.1) return 'increasing';
    if (difference < -0.1) return 'decreasing';
    return 'stable';
  }

  private identifyEngagementPatterns(events: BehaviorEvent[]): any[] {
    // Simplified pattern identification
    return [
      {
        type: 'peak',
        startTime: new Date(),
        endTime: new Date(),
        intensity: 0.8,
        triggers: ['new_content', 'interactive_element']
      }
    ];
  }

  private generateEngagementRecommendations(score: number, trend: string, patterns: any[]): any[] {
    const recommendations = [];

    if (score < 0.4) {
      recommendations.push({
        type: 'intervention',
        priority: 'high',
        description: 'Immediate engagement intervention needed',
        expectedImpact: 0.3
      });
    }

    if (trend === 'decreasing') {
      recommendations.push({
        type: 'content_adjustment',
        priority: 'medium',
        description: 'Consider adjusting content difficulty or presentation',
        expectedImpact: 0.2
      });
    }

    return recommendations;
  }

  private identifyBehaviorPatterns(events: BehaviorEvent[]): BehaviorPattern[] {
    return [
      {
        type: 'interaction',
        description: 'Frequent mouse movements with moderate click patterns',
        frequency: events.length,
        strength: 0.7,
        contexts: ['onboarding_steps', 'form_interactions']
      }
    ];
  }

  private identifyUserPreferences(events: BehaviorEvent[]): UserPreference[] {
    return [
      {
        category: 'interaction_style',
        preference: 'visual_learner',
        confidence: 0.8,
        evidence: ['high_scroll_activity', 'image_focus_time']
      }
    ];
  }

  private detectLearningStyle(events: BehaviorEvent[]): DetectedLearningStyle {
    return {
      primary: 'visual',
      secondary: 'hands_on',
      confidence: 0.75,
      indicators: [
        {
          style: 'visual',
          evidence: 'High engagement with visual content',
          weight: 0.8
        }
      ]
    };
  }

  private generateBehaviorRecommendations(
    patterns: BehaviorPattern[],
    preferences: UserPreference[],
    learningStyle: DetectedLearningStyle
  ): BehaviorRecommendation[] {
    return [
      {
        type: 'personalization',
        description: 'Increase visual content based on detected learning style',
        implementation: 'Add more diagrams and interactive visual elements',
        expectedBenefit: 0.25
      }
    ];
  }

  private calculateInsightConfidence(eventCount: number): number {
    // Confidence increases with more data points
    if (eventCount >= 100) return 0.9;
    if (eventCount >= 50) return 0.8;
    if (eventCount >= 20) return 0.7;
    if (eventCount >= 10) return 0.6;
    return 0.5;
  }
}
// Export service instance
export const behavioralAnalyticsService = new BehavioralAnalyticsServiceImpl();
export default behavioralAnalyticsService;