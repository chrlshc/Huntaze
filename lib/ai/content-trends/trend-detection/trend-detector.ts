/**
 * Trend Detector
 * Main service for identifying and tracking emerging trends
 * Task 5.2: Build trend identification and tracking
 */

import type {
  Trend,
  TrendSignal,
  TrendMetrics,
  TrendPlatform,
  TrendCategory,
  TrendPhase,
  TrendType,
  TrendDetectionConfig,
  TrendSnapshot,
  TrendGap,
  EmergingTrendAlert,
  MetaTrend,
  TrendAnalysisResult,
  CrossPlatformPresence,
} from './types';
import { VelocityCalculator, type VelocityDataPoint } from './velocity-calculator';
import { CrossPlatformCorrelator, type PlatformTrendData } from './cross-platform-correlator';

export interface TrendDataInput {
  platform: TrendPlatform;
  category: TrendCategory;
  identifier: string;
  name: string;
  description?: string;
  dataPoints: VelocityDataPoint[];
  metadata?: Record<string, unknown>;
}

const DEFAULT_CONFIG: TrendDetectionConfig = {
  platforms: ['tiktok', 'instagram', 'youtube', 'twitter'],
  categories: ['sound', 'hashtag', 'format', 'topic', 'challenge', 'meme'],
  minVelocityThreshold: 100,
  minEngagementRate: 0.02,
  lookbackHours: 168, // 1 week
  updateIntervalMinutes: 60,
  arbitrageLagThresholdHours: 168,
};

export class TrendDetector {
  private config: TrendDetectionConfig;
  private velocityCalculator: VelocityCalculator;
  private correlator: CrossPlatformCorrelator;
  private trendCache: Map<string, Trend> = new Map();
  private snapshotHistory: Map<string, TrendSnapshot[]> = new Map();

  constructor(config: Partial<TrendDetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.velocityCalculator = new VelocityCalculator();
    this.correlator = new CrossPlatformCorrelator({
      arbitrageLagThresholdHours: this.config.arbitrageLagThresholdHours,
    });
  }

  /**
   * Analyze trends from input data
   */
  async analyzeTrends(inputs: TrendDataInput[]): Promise<TrendAnalysisResult> {
    const trends: Trend[] = [];

    // Process each input into a trend
    for (const input of inputs) {
      const trend = this.processTrendInput(input);
      if (this.meetsThreshold(trend)) {
        trends.push(trend);
        this.trendCache.set(trend.id, trend);
        this.updateSnapshotHistory(trend);
      }
    }

    // Find correlations
    const correlations = this.correlator.findCorrelations(trends);

    // Update related trends based on correlations
    for (const correlation of correlations) {
      const trendA = trends.find((t) => t.id === correlation.trendA);
      const trendB = trends.find((t) => t.id === correlation.trendB);
      if (trendA && trendB) {
        if (!trendA.relatedTrends.includes(trendB.id)) {
          trendA.relatedTrends.push(trendB.id);
        }
        if (!trendB.relatedTrends.includes(trendA.id)) {
          trendB.relatedTrends.push(trendA.id);
        }
      }
    }

    // Detect arbitrage opportunities
    const platformData = this.convertToPlatformData(trends);
    const arbitrageOpportunities = this.correlator.detectArbitrageOpportunities(platformData);

    // Update trends with arbitrage opportunities
    for (const opportunity of arbitrageOpportunities) {
      const trend = trends.find((t) => t.id === opportunity.trendId);
      if (trend) {
        trend.arbitrageOpportunities.push(opportunity);
      }
    }

    // Detect trend gaps
    const gaps = this.detectTrendGaps(trends);

    // Generate alerts
    const emergingAlerts = this.generateAlerts(trends, gaps);

    // Identify meta-trends
    const metaTrends = this.identifyMetaTrends(trends, correlations);

    return {
      trends,
      emergingAlerts,
      arbitrageOpportunities,
      correlations,
      metaTrends,
      analysisTimestamp: new Date(),
      nextUpdateAt: new Date(Date.now() + this.config.updateIntervalMinutes * 60 * 1000),
    };
  }

  /**
   * Process single trend input into Trend object
   */
  private processTrendInput(input: TrendDataInput): Trend {
    const id = this.generateTrendId(input);
    const existingTrend = this.trendCache.get(id);
    const historicalSnapshots = this.snapshotHistory.get(id) || [];

    // Calculate velocity and phase
    const velocityResult = this.velocityCalculator.analyze(
      input.dataPoints,
      historicalSnapshots
    );

    // Calculate metrics
    const metrics = this.calculateMetrics(input.dataPoints, velocityResult.velocity);

    // Determine trend type
    const type = this.determineTrendType(metrics, velocityResult.phase);

    // Calculate scores
    const viralScore = this.calculateViralScore(metrics, velocityResult);
    const replicabilityScore = this.calculateReplicabilityScore(metrics, type);
    const confidenceScore = this.calculateConfidenceScore(input.dataPoints, metrics);

    const signal: TrendSignal = {
      id,
      platform: input.platform,
      category: input.category,
      identifier: input.identifier,
      name: input.name,
      description: input.description,
      firstSeenAt: existingTrend?.signal.firstSeenAt || this.getFirstSeenDate(input.dataPoints),
      lastUpdatedAt: new Date(),
    };

    return {
      id,
      signal,
      type,
      phase: velocityResult.phase,
      metrics,
      crossPlatformPresence: existingTrend?.crossPlatformPresence || [
        this.createCrossPlatformPresence(input, metrics),
      ],
      arbitrageOpportunities: [],
      relatedTrends: existingTrend?.relatedTrends || [],
      viralScore,
      replicabilityScore,
      confidenceScore,
      predictedPeakDate: this.predictPeakDate(velocityResult, metrics),
      predictedDeclineDate: this.predictDeclineDate(velocityResult, metrics),
      createdAt: existingTrend?.createdAt || new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Calculate comprehensive metrics from data points
   */
  private calculateMetrics(
    dataPoints: VelocityDataPoint[],
    velocity: TrendMetrics['velocity']
  ): TrendMetrics {
    if (dataPoints.length === 0) {
      return this.createEmptyMetrics(velocity);
    }

    const latest = dataPoints[dataPoints.length - 1];
    const totalEngagement = latest.likes + latest.shares + latest.comments;
    const engagementRate = latest.views > 0 ? totalEngagement / latest.views : 0;

    return {
      totalViews: latest.views,
      totalLikes: latest.likes,
      totalShares: latest.shares,
      totalComments: latest.comments,
      totalContent: latest.contentCount,
      averageEngagementRate: engagementRate,
      velocity,
    };
  }

  /**
   * Determine trend type based on metrics and phase
   */
  private determineTrendType(metrics: TrendMetrics, phase: TrendPhase): TrendType {
    const { totalContent, totalViews } = metrics;
    const viewsPerContent = totalContent > 0 ? totalViews / totalContent : 0;

    // Micro: Small scale, niche audience
    if (totalContent < 100 && totalViews < 100000) {
      return 'micro';
    }

    // Meta: Large scale, cross-category impact
    if (totalContent > 10000 && totalViews > 10000000) {
      return 'meta';
    }

    // Macro: Standard viral trend
    return 'macro';
  }

  /**
   * Calculate viral score
   */
  private calculateViralScore(
    metrics: TrendMetrics,
    velocityResult: ReturnType<VelocityCalculator['analyze']>
  ): number {
    const { velocity, phase, accelerationTrend } = velocityResult;

    // Base score from velocity
    let score = 0;
    score += Math.min(0.3, velocity.viewsPerHour / 100000);
    score += Math.min(0.2, velocity.sharesPerHour / 1000);
    score += Math.min(0.2, metrics.averageEngagementRate * 5);

    // Phase modifier
    const phaseModifiers: Record<TrendPhase, number> = {
      emerging: 0.8,
      growing: 1.0,
      peak: 0.9,
      declining: 0.5,
      saturated: 0.2,
    };
    score *= phaseModifiers[phase];

    // Acceleration bonus
    if (accelerationTrend === 'accelerating') {
      score *= 1.2;
    } else if (accelerationTrend === 'decelerating') {
      score *= 0.8;
    }

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calculate replicability score
   */
  private calculateReplicabilityScore(metrics: TrendMetrics, type: TrendType): number {
    let score = 0.5; // Base score

    // More content = more proven replicability
    score += Math.min(0.2, metrics.totalContent / 5000);

    // Higher engagement = more engaging format
    score += Math.min(0.2, metrics.averageEngagementRate * 3);

    // Type modifier
    const typeModifiers: Record<TrendType, number> = {
      micro: 0.9, // Easier to replicate niche trends
      macro: 0.7,
      meta: 0.5, // Harder to replicate meta trends
    };
    score *= typeModifiers[type];

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calculate confidence score based on data quality
   */
  private calculateConfidenceScore(
    dataPoints: VelocityDataPoint[],
    metrics: TrendMetrics
  ): number {
    let score = 0;

    // More data points = higher confidence
    score += Math.min(0.4, dataPoints.length / 50);

    // More content = higher confidence
    score += Math.min(0.3, metrics.totalContent / 1000);

    // Consistent velocity = higher confidence
    if (dataPoints.length >= 3) {
      const velocities = this.calculateRollingVelocities(dataPoints);
      const variance = this.calculateVariance(velocities);
      const normalizedVariance = Math.min(1, variance / 10000);
      score += 0.3 * (1 - normalizedVariance);
    }

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Detect trend gaps (high velocity, low content)
   */
  private detectTrendGaps(trends: Trend[]): TrendGap[] {
    const gaps: TrendGap[] = [];

    for (const trend of trends) {
      const { velocity, totalContent } = trend.metrics;
      const velocityScore =
        velocity.viewsPerHour / 1000 +
        velocity.sharesPerHour / 100 +
        velocity.newContentPerHour * 10;

      // High velocity but low content = gap opportunity
      if (velocityScore > 10 && totalContent < 500) {
        const gapScore = velocityScore / Math.max(1, totalContent / 100);
        gaps.push({
          trendId: trend.id,
          platform: trend.signal.platform,
          velocity: velocityScore,
          totalContent,
          gapScore,
          opportunity: `High velocity (${velocityScore.toFixed(1)}) with only ${totalContent} pieces of content. Early mover advantage available.`,
        });
      }
    }

    return gaps.sort((a, b) => b.gapScore - a.gapScore);
  }

  /**
   * Generate alerts for emerging trends and opportunities
   */
  private generateAlerts(trends: Trend[], gaps: TrendGap[]): EmergingTrendAlert[] {
    const alerts: EmergingTrendAlert[] = [];
    const now = new Date();

    // New emerging trends
    for (const trend of trends) {
      if (trend.phase === 'emerging' && trend.viralScore > 0.5) {
        alerts.push({
          trend,
          alertType: 'new_trend',
          priority: trend.viralScore > 0.7 ? 'high' : 'medium',
          message: `New emerging trend: "${trend.signal.name}" on ${trend.signal.platform}`,
          recommendedActions: [
            'Monitor velocity over next 24 hours',
            'Prepare content adaptation strategy',
            'Identify brand alignment opportunities',
          ],
          expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        });
      }

      // Velocity spike
      if (trend.metrics.velocity.accelerationRate > 0.5) {
        alerts.push({
          trend,
          alertType: 'velocity_spike',
          priority: 'urgent',
          message: `Velocity spike detected: "${trend.signal.name}" accelerating at ${(trend.metrics.velocity.accelerationRate * 100).toFixed(0)}%`,
          recommendedActions: [
            'Immediate content creation recommended',
            'Leverage trend before saturation',
            'Cross-platform adaptation priority',
          ],
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        });
      }

      // Cross-platform opportunities
      if (trend.arbitrageOpportunities.length > 0) {
        const bestOpportunity = trend.arbitrageOpportunities[0];
        alerts.push({
          trend,
          alertType: 'arbitrage',
          priority: bestOpportunity.estimatedWindow < 48 ? 'urgent' : 'high',
          message: `Arbitrage opportunity: "${trend.signal.name}" from ${bestOpportunity.sourcePlatform} to ${bestOpportunity.targetPlatform}`,
          recommendedActions: [
            bestOpportunity.recommendedAction,
            'Adapt content format for target platform',
            'Monitor competitor adoption',
          ],
          expiresAt: new Date(now.getTime() + bestOpportunity.estimatedWindow * 60 * 60 * 1000),
        });
      }
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Identify meta-trends from correlated trends
   */
  private identifyMetaTrends(
    trends: Trend[],
    correlations: ReturnType<CrossPlatformCorrelator['findCorrelations']>
  ): MetaTrend[] {
    const metaTrends: MetaTrend[] = [];

    // Group highly correlated trends
    const groups = this.groupCorrelatedTrends(trends, correlations);

    for (const group of groups) {
      if (group.length < 3) continue;

      const commonCategory = this.findCommonCategory(group);
      const significance = this.calculateGroupSignificance(group);

      if (significance > 0.6) {
        metaTrends.push({
          id: `meta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: this.generateMetaTrendName(group, commonCategory),
          description: this.generateMetaTrendDescription(group),
          underlyingTrends: group.map((t) => t.id),
          category: commonCategory || 'mixed',
          significance,
          predictedDuration: this.predictMetaTrendDuration(group),
          strategicImplications: this.generateStrategicImplications(group),
        });
      }
    }

    return metaTrends;
  }

  /**
   * Group correlated trends
   */
  private groupCorrelatedTrends(
    trends: Trend[],
    correlations: ReturnType<CrossPlatformCorrelator['findCorrelations']>
  ): Trend[][] {
    const groups: Trend[][] = [];
    const used = new Set<string>();

    for (const trend of trends) {
      if (used.has(trend.id)) continue;

      const group = [trend];
      used.add(trend.id);

      // Find all correlated trends
      for (const correlation of correlations) {
        if (correlation.correlationScore < 0.7) continue;

        let relatedId: string | null = null;
        if (correlation.trendA === trend.id) {
          relatedId = correlation.trendB;
        } else if (correlation.trendB === trend.id) {
          relatedId = correlation.trendA;
        }

        if (relatedId && !used.has(relatedId)) {
          const relatedTrend = trends.find((t) => t.id === relatedId);
          if (relatedTrend) {
            group.push(relatedTrend);
            used.add(relatedId);
          }
        }
      }

      groups.push(group);
    }

    return groups.filter((g) => g.length > 1);
  }

  // Helper methods

  private generateTrendId(input: TrendDataInput): string {
    return `${input.platform}-${input.category}-${input.identifier}`;
  }

  private meetsThreshold(trend: Trend): boolean {
    const velocityScore =
      trend.metrics.velocity.viewsPerHour +
      trend.metrics.velocity.likesPerHour * 2;
    return (
      velocityScore >= this.config.minVelocityThreshold ||
      trend.metrics.averageEngagementRate >= this.config.minEngagementRate
    );
  }

  private getFirstSeenDate(dataPoints: VelocityDataPoint[]): Date {
    if (dataPoints.length === 0) return new Date();
    return dataPoints.reduce(
      (min, dp) => (dp.timestamp < min ? dp.timestamp : min),
      dataPoints[0].timestamp
    );
  }

  private createCrossPlatformPresence(
    input: TrendDataInput,
    metrics: TrendMetrics
  ): CrossPlatformPresence {
    return {
      platform: input.platform,
      identifier: input.identifier,
      metrics,
      firstSeenAt: this.getFirstSeenDate(input.dataPoints),
    };
  }

  private createEmptyMetrics(velocity: TrendMetrics['velocity']): TrendMetrics {
    return {
      totalViews: 0,
      totalLikes: 0,
      totalShares: 0,
      totalComments: 0,
      totalContent: 0,
      averageEngagementRate: 0,
      velocity,
    };
  }

  private updateSnapshotHistory(trend: Trend): void {
    const snapshots = this.snapshotHistory.get(trend.id) || [];
    snapshots.push({
      trendId: trend.id,
      timestamp: new Date(),
      metrics: trend.metrics,
      phase: trend.phase,
    });

    // Keep last 100 snapshots
    if (snapshots.length > 100) {
      snapshots.shift();
    }

    this.snapshotHistory.set(trend.id, snapshots);
  }

  private convertToPlatformData(trends: Trend[]): PlatformTrendData[] {
    return trends.map((t) => ({
      platform: t.signal.platform,
      identifier: t.signal.identifier,
      name: t.signal.name,
      metrics: t.metrics,
      firstSeenAt: t.signal.firstSeenAt,
    }));
  }

  private predictPeakDate(
    velocityResult: ReturnType<VelocityCalculator['analyze']>,
    metrics: TrendMetrics
  ): Date | undefined {
    if (velocityResult.phase === 'peak' || velocityResult.phase === 'declining') {
      return undefined;
    }

    // Estimate based on acceleration
    const daysToGo = velocityResult.accelerationTrend === 'accelerating' ? 3 : 7;
    return new Date(Date.now() + daysToGo * 24 * 60 * 60 * 1000);
  }

  private predictDeclineDate(
    velocityResult: ReturnType<VelocityCalculator['analyze']>,
    metrics: TrendMetrics
  ): Date | undefined {
    if (velocityResult.phase === 'saturated') {
      return undefined;
    }

    const peakDate = this.predictPeakDate(velocityResult, metrics);
    if (!peakDate) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    return new Date(peakDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  }

  private calculateRollingVelocities(dataPoints: VelocityDataPoint[]): number[] {
    const velocities: number[] = [];
    for (let i = 1; i < dataPoints.length; i++) {
      const hoursDiff =
        (dataPoints[i].timestamp.getTime() - dataPoints[i - 1].timestamp.getTime()) /
        (1000 * 60 * 60);
      if (hoursDiff > 0) {
        velocities.push((dataPoints[i].views - dataPoints[i - 1].views) / hoursDiff);
      }
    }
    return velocities;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private findCommonCategory(trends: Trend[]): string | null {
    const categories = trends.map((t) => t.signal.category);
    const counts = categories.reduce(
      (acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const maxCount = Math.max(...Object.values(counts));
    if (maxCount >= trends.length * 0.5) {
      return Object.entries(counts).find(([, count]) => count === maxCount)?.[0] || null;
    }
    return null;
  }

  private calculateGroupSignificance(trends: Trend[]): number {
    const avgViralScore = trends.reduce((sum, t) => sum + t.viralScore, 0) / trends.length;
    const avgConfidence = trends.reduce((sum, t) => sum + t.confidenceScore, 0) / trends.length;
    const sizeBonus = Math.min(0.2, trends.length / 20);

    return avgViralScore * 0.4 + avgConfidence * 0.4 + sizeBonus;
  }

  private generateMetaTrendName(trends: Trend[], category: string | null): string {
    const topTrend = trends.sort((a, b) => b.viralScore - a.viralScore)[0];
    return `${category || 'Cross-category'} Meta-Trend: ${topTrend.signal.name} cluster`;
  }

  private generateMetaTrendDescription(trends: Trend[]): string {
    const platforms = [...new Set(trends.map((t) => t.signal.platform))];
    return `A meta-trend spanning ${trends.length} related trends across ${platforms.join(', ')}`;
  }

  private predictMetaTrendDuration(trends: Trend[]): number {
    const avgPhase = trends.reduce((sum, t) => {
      const phaseValues: Record<TrendPhase, number> = {
        emerging: 1,
        growing: 2,
        peak: 3,
        declining: 4,
        saturated: 5,
      };
      return sum + phaseValues[t.phase];
    }, 0) / trends.length;

    // Earlier phases = longer duration
    if (avgPhase < 2) return 30;
    if (avgPhase < 3) return 21;
    if (avgPhase < 4) return 14;
    return 7;
  }

  private generateStrategicImplications(trends: Trend[]): string[] {
    const implications: string[] = [];

    const platforms = [...new Set(trends.map((t) => t.signal.platform))];
    if (platforms.length > 1) {
      implications.push(`Cross-platform opportunity across ${platforms.join(', ')}`);
    }

    const avgReplicability =
      trends.reduce((sum, t) => sum + t.replicabilityScore, 0) / trends.length;
    if (avgReplicability > 0.7) {
      implications.push('High replicability - suitable for brand adaptation');
    }

    const emergingCount = trends.filter((t) => t.phase === 'emerging').length;
    if (emergingCount > trends.length * 0.5) {
      implications.push('Early stage - first mover advantage available');
    }

    return implications;
  }
}
