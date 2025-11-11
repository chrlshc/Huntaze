import { InterventionOutcome } from '../types';
import { logger } from '../../utils/logger';
import { redisClient } from '../config/redis';

// Local analytics and metrics interfaces for effectiveness tracking
interface InterventionMetrics {
  interventionId: string;
  userId: string;
  outcome: InterventionOutcome;
  timestamp: Date;
  effectiveness: number; // 0..100
  userSatisfaction: number; // 0..10
  timeToResolution: number; // ms
  completionRate: number; // 0 or 1 per outcome
  escalationRequired: boolean;
}

interface EffectivenessReport {
  id: string;
  timeRange: { start: Date; end: Date };
  filters?: any;
  generatedAt: Date;
  summary: any;
  interventionTypes: any;
  userSegments: any;
  trends: any;
  recommendations: string[];
}

interface PerformanceIndicator {
  name: string;
  value: number;
  target: number;
  status: 'good' | 'needs_improvement';
}

interface InterventionAnalytics {
  id: string;
  timeRange: { start: Date; end: Date };
  userId?: string;
  totalInterventions: number;
  successRate: number;
  averageEffectiveness: number;
  averageResolutionTime: number;
  userSatisfactionScore: number;
  escalationRate: number;
  patterns: any[];
  performanceIndicators: PerformanceIndicator[];
  generatedAt: Date;
}

interface OptimizationSuggestion {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendation: string;
  expectedImpact: 'low' | 'medium' | 'high';
  implementationEffort: 'low' | 'medium' | 'high';
  createdAt: Date;
}

interface MetricsAggregation {
  timestamp: Date;
  totalInterventions: number;
  successRate: number;
  averageEffectiveness: number;
  averageResolutionTime: number;
  averageUserSatisfaction: number;
  escalationRate: number;
}

export class InterventionEffectivenessTrackerImpl {
  private metricsCache: Map<string, InterventionMetrics> = new Map();
  private aggregationInterval: number = 300000; // 5 minutes

  constructor() {
    // Start periodic aggregation
    this.startPeriodicAggregation();
  }

  async trackInterventionOutcome(
    interventionId: string,
    userId: string,
    outcome: InterventionOutcome
  ): Promise<void> {
    try {
      const successful = this.isSuccessful(outcome);
      const userSatisfaction = outcome.userFeedback?.rating ?? 0;
      const escalated = Boolean(outcome.metadata?.escalated);

      const metrics: InterventionMetrics = {
        interventionId,
        userId,
        outcome,
        timestamp: new Date(),
        effectiveness: this.calculateEffectivenessScore(outcome),
        userSatisfaction,
        timeToResolution: outcome.timeToResolution || 0,
        completionRate: successful ? 1 : 0,
        escalationRequired: escalated
      };

      // Store individual metrics
      await this.storeInterventionMetrics(metrics);

      // Update real-time aggregations
      await this.updateRealTimeAggregations(metrics);

      // Cache metrics for quick access
      this.metricsCache.set(interventionId, metrics);

      logger.info(`Tracked intervention outcome:`, {
        interventionId,
        userId,
        effectiveness: metrics.effectiveness,
        successful
      });
    } catch (error) {
      logger.error(`Failed to track intervention outcome:`, undefined, error as Error);
      throw error;
    }
  }

  async generateEffectivenessReport(
    timeRange: { start: Date; end: Date },
    filters?: any
  ): Promise<EffectivenessReport> {
    try {
      const metrics = await this.getMetricsInRange(timeRange, filters);
      
      const report: EffectivenessReport = {
        id: `report_${Date.now()}`,
        timeRange,
        filters,
        generatedAt: new Date(),
        summary: await this.generateReportSummary(metrics),
        interventionTypes: await this.analyzeByInterventionType(metrics),
        userSegments: await this.analyzeByUserSegment(metrics),
        trends: await this.analyzeTrends(metrics, timeRange),
        recommendations: await this.generateRecommendations(metrics)
      };

      // Cache report
      await redisClient.setex(
        `effectiveness_report:${report.id}`,
        3600, // 1 hour
        JSON.stringify(report)
      );

      logger.info(`Generated effectiveness report:`, {
        reportId: report.id,
        timeRange,
        totalInterventions: metrics.length
      });

      return report;
    } catch (error) {
      logger.error(`Failed to generate effectiveness report:`, undefined, error as Error);
      throw error;
    }
  }

  async analyzeInterventionPatterns(
    userId?: string,
    timeWindow?: number
  ): Promise<InterventionAnalytics> {
    try {
      const timeRange = {
        start: new Date(Date.now() - (timeWindow || 86400000)), // Default 24 hours
        end: new Date()
      };

      const filters = userId ? { userId } : undefined;
      const metrics = await this.getMetricsInRange(timeRange, filters);

      const analytics: InterventionAnalytics = {
        id: `analytics_${Date.now()}`,
        timeRange,
        userId,
        totalInterventions: metrics.length,
        successRate: this.calculateSuccessRate(metrics),
        averageEffectiveness: this.calculateAverageEffectiveness(metrics),
        averageResolutionTime: this.calculateAverageResolutionTime(metrics),
        userSatisfactionScore: this.calculateAverageUserSatisfaction(metrics),
        escalationRate: this.calculateEscalationRate(metrics),
        patterns: await this.identifyPatterns(metrics),
        performanceIndicators: await this.calculatePerformanceIndicators(metrics),
        generatedAt: new Date()
      };

      logger.info(`Analyzed intervention patterns:`, {
        analyticsId: analytics.id,
        userId,
        totalInterventions: analytics.totalInterventions,
        successRate: analytics.successRate
      });

      return analytics;
    } catch (error) {
      logger.error(`Failed to analyze intervention patterns:`, undefined, error as Error);
      throw error;
    }
  }

  async getOptimizationSuggestions(
    interventionType?: string,
    userSegment?: string
  ): Promise<OptimizationSuggestion[]> {
    try {
      const suggestions: OptimizationSuggestion[] = [];
      
      // Get recent metrics for analysis
      const timeRange = {
        start: new Date(Date.now() - 604800000), // Last 7 days
        end: new Date()
      };

      const filters = {
        ...(interventionType && { interventionType }),
        ...(userSegment && { userSegment })
      };

      const metrics = await this.getMetricsInRange(timeRange, filters);
      
      if (metrics.length === 0) {
        return suggestions;
      }

      // Analyze effectiveness patterns
      const effectivenessAnalysis = await this.analyzeEffectivenessPatterns(metrics);
      
      // Generate suggestions based on analysis
      suggestions.push(...await this.generateEffectivenessSuggestions(effectivenessAnalysis));
      suggestions.push(...await this.generateTimingSuggestions(metrics));
      suggestions.push(...await this.generateContentSuggestions(metrics));
      suggestions.push(...await this.generatePersonalizationSuggestions(metrics));

      // Sort by priority and impact
      suggestions.sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const impactWeight = { high: 3, medium: 2, low: 1 };
        
        const scoreA = priorityWeight[a.priority] + impactWeight[a.expectedImpact];
        const scoreB = priorityWeight[b.priority] + impactWeight[b.expectedImpact];
        
        return scoreB - scoreA;
      });

      logger.info(`Generated optimization suggestions:`, {
        interventionType,
        userSegment,
        suggestionsCount: suggestions.length
      });

      return suggestions;
    } catch (error) {
      logger.error(`Failed to get optimization suggestions:`, undefined, error as Error);
      throw error;
    }
  }

  async updateMetricsAggregation(): Promise<void> {
    try {
      const now = new Date();
      const hourlyKey = `metrics_hourly:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
      const dailyKey = `metrics_daily:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

      // Get recent metrics
      const recentMetrics = await this.getRecentMetrics(3600000); // Last hour

      if (recentMetrics.length === 0) {
        return;
      }

      // Calculate hourly aggregation
      const hourlyAggregation = await this.calculateAggregation(recentMetrics);
      await redisClient.setex(hourlyKey, 86400, JSON.stringify(hourlyAggregation)); // 24 hours

      // Update daily aggregation
      await this.updateDailyAggregation(dailyKey, hourlyAggregation);

      logger.debug(`Updated metrics aggregation:`, {
        hourlyKey,
        dailyKey,
        metricsCount: recentMetrics.length
      });
    } catch (error) {
      logger.error(`Failed to update metrics aggregation:`, undefined, error as Error);
    }
  }

  private calculateEffectivenessScore(outcome: InterventionOutcome): number {
    let score = 0;

    // Base score for success
    if (this.isSuccessful(outcome)) {
      score += 50;
    }

    // User satisfaction component (0-30 points)
    if (outcome.userFeedback?.rating !== undefined) {
      score += (outcome.userFeedback.rating / 10) * 30;
    }

    // Time to resolution component (0-20 points)
    if (outcome.timeToResolution) {
      const maxTime = 300000; // 5 minutes
      const timeScore = Math.max(0, (maxTime - outcome.timeToResolution) / maxTime) * 20;
      score += timeScore;
    }

    // Penalty for escalation
    if (outcome.metadata?.escalated) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  private async storeInterventionMetrics(metrics: InterventionMetrics): Promise<void> {
    const key = `intervention_metrics:${metrics.interventionId}`;
    await redisClient.setex(
      key,
      86400, // 24 hours
      JSON.stringify(metrics)
    );

    // Also store in time-series format for aggregation
    const timeSeriesKey = `metrics_timeseries:${Date.now()}`;
    await redisClient.setex(
      timeSeriesKey,
      604800, // 7 days
      JSON.stringify(metrics)
    );
  }

  private async updateRealTimeAggregations(metrics: InterventionMetrics): Promise<void> {
    const aggregationKey = 'realtime_intervention_metrics';
    
    // Get current aggregation
    const current = await redisClient.get(aggregationKey);
    const aggregation = current ? JSON.parse(current) : {
      totalInterventions: 0,
      successfulInterventions: 0,
      totalEffectiveness: 0,
      totalResolutionTime: 0,
      totalSatisfaction: 0,
      escalations: 0,
      lastUpdated: new Date()
    };

    // Update aggregation
    aggregation.totalInterventions += 1;
    if (this.isSuccessful(metrics.outcome)) {
      aggregation.successfulInterventions += 1;
    }
    aggregation.totalEffectiveness += metrics.effectiveness;
    aggregation.totalResolutionTime += metrics.timeToResolution;
    aggregation.totalSatisfaction += metrics.userSatisfaction;
    if (metrics.escalationRequired) {
      aggregation.escalations += 1;
    }
    aggregation.lastUpdated = new Date();

    // Store updated aggregation
    await redisClient.setex(
      aggregationKey,
      3600, // 1 hour
      JSON.stringify(aggregation)
    );
  }

  private async getMetricsInRange(
    timeRange: { start: Date; end: Date },
    filters?: any
  ): Promise<InterventionMetrics[]> {
    // This would typically query a database
    // For now, we'll simulate with cached data
    const keys = await redisClient.keys('intervention_metrics:*');
    const metrics: InterventionMetrics[] = [];

    for (const key of keys) {
      const data = await redisClient.get(key);
      if (data) {
        const metric = JSON.parse(data);
        const timestamp = new Date(metric.timestamp);
        
        if (timestamp >= timeRange.start && timestamp <= timeRange.end) {
          // Apply filters if provided
          if (!filters || this.matchesFilters(metric, filters)) {
            metrics.push(metric);
          }
        }
      }
    }

    return metrics;
  }

  private matchesFilters(metric: InterventionMetrics, filters: any): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (metric[key as keyof InterventionMetrics] !== value) {
        return false;
      }
    }
    return true;
  }

  private async generateReportSummary(metrics: InterventionMetrics[]): Promise<any> {
    return {
      totalInterventions: metrics.length,
      successRate: this.calculateSuccessRate(metrics),
      averageEffectiveness: this.calculateAverageEffectiveness(metrics),
      averageResolutionTime: this.calculateAverageResolutionTime(metrics),
      userSatisfactionScore: this.calculateAverageUserSatisfaction(metrics),
      escalationRate: this.calculateEscalationRate(metrics)
    };
  }

  private async analyzeByInterventionType(metrics: InterventionMetrics[]): Promise<any> {
    const typeAnalysis: Record<string, any> = {};

    for (const metric of metrics) {
      const type = (metric.outcome.metadata && metric.outcome.metadata.interventionType) || 'unknown';
      
      if (!typeAnalysis[type]) {
        typeAnalysis[type] = {
          count: 0,
          successCount: 0,
          totalEffectiveness: 0,
          totalResolutionTime: 0,
          totalSatisfaction: 0
        };
      }

      typeAnalysis[type].count += 1;
      if (this.isSuccessful(metric.outcome)) {
        typeAnalysis[type].successCount += 1;
      }
      typeAnalysis[type].totalEffectiveness += metric.effectiveness;
      typeAnalysis[type].totalResolutionTime += metric.timeToResolution;
      typeAnalysis[type].totalSatisfaction += metric.userSatisfaction;
    }

    // Calculate averages
    for (const type in typeAnalysis) {
      const data = typeAnalysis[type];
      data.successRate = data.successCount / data.count;
      data.averageEffectiveness = data.totalEffectiveness / data.count;
      data.averageResolutionTime = data.totalResolutionTime / data.count;
      data.averageSatisfaction = data.totalSatisfaction / data.count;
    }

    return typeAnalysis;
  }

  private async analyzeByUserSegment(metrics: InterventionMetrics[]): Promise<any> {
    // Similar to analyzeByInterventionType but grouped by user segments
    // This would require user segmentation data
    return {};
  }

  private async analyzeTrends(
    metrics: InterventionMetrics[],
    timeRange: { start: Date; end: Date }
  ): Promise<any> {
    // Group metrics by time periods and analyze trends
    const trends = {
      effectiveness: [],
      successRate: [],
      resolutionTime: [],
      userSatisfaction: []
    };

    // This would implement trend analysis logic
    return trends;
  }

  private async generateRecommendations(metrics: InterventionMetrics[]): Promise<string[]> {
    const recommendations = [];
    
    const successRate = this.calculateSuccessRate(metrics);
    const avgEffectiveness = this.calculateAverageEffectiveness(metrics);
    const escalationRate = this.calculateEscalationRate(metrics);

    if (successRate < 0.7) {
      recommendations.push('Consider improving intervention timing and content relevance');
    }

    if (avgEffectiveness < 60) {
      recommendations.push('Review and optimize intervention strategies for better user engagement');
    }

    if (escalationRate > 0.2) {
      recommendations.push('Implement more proactive assistance to reduce escalations');
    }

    return recommendations;
  }

  private calculateSuccessRate(metrics: InterventionMetrics[]): number {
    if (metrics.length === 0) return 0;
    const successful = metrics.filter(m => this.isSuccessful(m.outcome)).length;
    return successful / metrics.length;
  }

  private calculateAverageEffectiveness(metrics: InterventionMetrics[]): number {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + m.effectiveness, 0);
    return total / metrics.length;
  }

  private calculateAverageResolutionTime(metrics: InterventionMetrics[]): number {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + m.timeToResolution, 0);
    return total / metrics.length;
  }

  private calculateAverageUserSatisfaction(metrics: InterventionMetrics[]): number {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + m.userSatisfaction, 0);
    return total / metrics.length;
  }

  private calculateEscalationRate(metrics: InterventionMetrics[]): number {
    if (metrics.length === 0) return 0;
    const escalated = metrics.filter(m => m.escalationRequired).length;
    return escalated / metrics.length;
  }

  private async identifyPatterns(metrics: InterventionMetrics[]): Promise<any[]> {
    // Implement pattern identification logic
    return [];
  }

  private async calculatePerformanceIndicators(metrics: InterventionMetrics[]): Promise<PerformanceIndicator[]> {
    return [
      {
        name: 'Success Rate',
        value: this.calculateSuccessRate(metrics),
        target: 0.8,
        status: this.calculateSuccessRate(metrics) >= 0.8 ? 'good' : 'needs_improvement'
      },
      {
        name: 'Average Effectiveness',
        value: this.calculateAverageEffectiveness(metrics),
        target: 75,
        status: this.calculateAverageEffectiveness(metrics) >= 75 ? 'good' : 'needs_improvement'
      },
      {
        name: 'Escalation Rate',
        value: this.calculateEscalationRate(metrics),
        target: 0.1,
        status: this.calculateEscalationRate(metrics) <= 0.1 ? 'good' : 'needs_improvement'
      }
    ];
  }

  private async analyzeEffectivenessPatterns(metrics: InterventionMetrics[]): Promise<any> {
    // Analyze patterns in effectiveness data
    return {
      lowEffectivenessThreshold: 50,
      lowEffectivenessCount: metrics.filter(m => m.effectiveness < 50).length,
      commonFailureReasons: [],
      improvementOpportunities: []
    };
  }

  private async generateEffectivenessSuggestions(analysis: any): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    if (analysis.lowEffectivenessCount > 0) {
      suggestions.push({
        id: `suggestion_${Date.now()}_effectiveness`,
        type: 'effectiveness_improvement',
        priority: 'high',
        title: 'Improve Low-Performing Interventions',
        description: 'Several interventions are showing low effectiveness scores',
        recommendation: 'Review and optimize intervention content and timing',
        expectedImpact: 'high',
        implementationEffort: 'medium',
        createdAt: new Date()
      });
    }

    return suggestions;
  }

  private async generateTimingSuggestions(metrics: InterventionMetrics[]): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];
    const avgResolutionTime = this.calculateAverageResolutionTime(metrics);

    if (avgResolutionTime > 180000) { // 3 minutes
      suggestions.push({
        id: `suggestion_${Date.now()}_timing`,
        type: 'timing_optimization',
        priority: 'medium',
        title: 'Optimize Intervention Timing',
        description: 'Average resolution time is higher than optimal',
        recommendation: 'Implement earlier intervention triggers',
        expectedImpact: 'medium',
        implementationEffort: 'low',
        createdAt: new Date()
      });
    }

    return suggestions;
  }

  private async generateContentSuggestions(metrics: InterventionMetrics[]): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];
    const avgSatisfaction = this.calculateAverageUserSatisfaction(metrics);

    if (avgSatisfaction < 7) {
      suggestions.push({
        id: `suggestion_${Date.now()}_content`,
        type: 'content_improvement',
        priority: 'high',
        title: 'Improve Intervention Content',
        description: 'User satisfaction with intervention content is below target',
        recommendation: 'Review and enhance help content quality and relevance',
        expectedImpact: 'high',
        implementationEffort: 'high',
        createdAt: new Date()
      });
    }

    return suggestions;
  }

  private async generatePersonalizationSuggestions(metrics: InterventionMetrics[]): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze if personalization could improve effectiveness
    suggestions.push({
      id: `suggestion_${Date.now()}_personalization`,
      type: 'personalization_enhancement',
      priority: 'medium',
      title: 'Enhance Personalization',
      description: 'Implement more sophisticated user profiling for better intervention targeting',
      recommendation: 'Develop user persona-based intervention strategies',
      expectedImpact: 'medium',
      implementationEffort: 'high',
      createdAt: new Date()
    });

    return suggestions;
  }

  private async getRecentMetrics(timeWindow: number): Promise<InterventionMetrics[]> {
    const cutoff = new Date(Date.now() - timeWindow);
    return this.getMetricsInRange({ start: cutoff, end: new Date() });
  }

  private async calculateAggregation(metrics: InterventionMetrics[]): Promise<MetricsAggregation> {
    return {
      timestamp: new Date(),
      totalInterventions: metrics.length,
      successRate: this.calculateSuccessRate(metrics),
      averageEffectiveness: this.calculateAverageEffectiveness(metrics),
      averageResolutionTime: this.calculateAverageResolutionTime(metrics),
      averageUserSatisfaction: this.calculateAverageUserSatisfaction(metrics),
      escalationRate: this.calculateEscalationRate(metrics)
    };
  }

  private async updateDailyAggregation(dailyKey: string, hourlyAggregation: MetricsAggregation): Promise<void> {
    const existing = await redisClient.get(dailyKey);
    const dailyAggregation = existing ? JSON.parse(existing) : {
      totalInterventions: 0,
      successfulInterventions: 0,
      totalEffectiveness: 0,
      totalResolutionTime: 0,
      totalSatisfaction: 0,
      escalations: 0,
      hours: 0
    };

    // Update daily aggregation with hourly data
    dailyAggregation.totalInterventions += hourlyAggregation.totalInterventions;
    dailyAggregation.successfulInterventions += Math.round(hourlyAggregation.successRate * hourlyAggregation.totalInterventions);
    dailyAggregation.totalEffectiveness += hourlyAggregation.averageEffectiveness * hourlyAggregation.totalInterventions;
    dailyAggregation.totalResolutionTime += hourlyAggregation.averageResolutionTime * hourlyAggregation.totalInterventions;
    dailyAggregation.totalSatisfaction += hourlyAggregation.averageUserSatisfaction * hourlyAggregation.totalInterventions;
    dailyAggregation.escalations += Math.round(hourlyAggregation.escalationRate * hourlyAggregation.totalInterventions);
    dailyAggregation.hours += 1;

    await redisClient.setex(dailyKey, 2592000, JSON.stringify(dailyAggregation)); // 30 days
  }

  private startPeriodicAggregation(): void {
    setInterval(async () => {
      try {
        await this.updateMetricsAggregation();
      } catch (error) {
        logger.error('Periodic aggregation failed:', undefined, error as Error);
      }
    }, this.aggregationInterval);
  }

  private isSuccessful(outcome: InterventionOutcome): boolean {
    return outcome.userResponse === 'completed' || (outcome.completionImpact ?? 0) > 0;
  }
}

// Export service instance
export const interventionEffectivenessTracker = new InterventionEffectivenessTrackerImpl();
export default interventionEffectivenessTracker;
