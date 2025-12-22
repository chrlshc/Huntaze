/**
 * Cross-Platform Correlator
 * Identifies trend correlations across platforms and detects arbitrage opportunities
 */

import type {
  Trend,
  TrendPlatform,
  TrendCorrelation,
  TrendArbitrageOpportunity,
  CrossPlatformPresence,
  TrendSignal,
  TrendMetrics,
} from './types';

export interface PlatformTrendData {
  platform: TrendPlatform;
  identifier: string;
  name: string;
  metrics: TrendMetrics;
  firstSeenAt: Date;
}

export interface CorrelationConfig {
  minCorrelationScore: number;
  arbitrageLagThresholdHours: number;
  maxArbitrageWindowHours: number;
  similarityThreshold: number;
}

const DEFAULT_CONFIG: CorrelationConfig = {
  minCorrelationScore: 0.6,
  arbitrageLagThresholdHours: 168, // 1 week
  maxArbitrageWindowHours: 336, // 2 weeks
  similarityThreshold: 0.7,
};

export class CrossPlatformCorrelator {
  private config: CorrelationConfig;

  constructor(config: Partial<CorrelationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Find correlations between trends across platforms
   */
  findCorrelations(trends: Trend[]): TrendCorrelation[] {
    const correlations: TrendCorrelation[] = [];

    for (let i = 0; i < trends.length; i++) {
      for (let j = i + 1; j < trends.length; j++) {
        const correlation = this.calculateCorrelation(trends[i], trends[j]);
        if (correlation && correlation.correlationScore >= this.config.minCorrelationScore) {
          correlations.push(correlation);
        }
      }
    }

    return correlations.sort((a, b) => b.correlationScore - a.correlationScore);
  }

  /**
   * Calculate correlation between two trends
   */
  private calculateCorrelation(trendA: Trend, trendB: Trend): TrendCorrelation | null {
    // Skip if same trend
    if (trendA.id === trendB.id) return null;

    const nameSimilarity = this.calculateStringSimilarity(
      trendA.signal.name.toLowerCase(),
      trendB.signal.name.toLowerCase()
    );

    const temporalCorrelation = this.calculateTemporalCorrelation(trendA, trendB);
    const thematicCorrelation = this.calculateThematicCorrelation(trendA, trendB);
    const audienceCorrelation = this.calculateAudienceCorrelation(trendA, trendB);

    // Determine primary correlation type
    const scores = {
      temporal: temporalCorrelation,
      thematic: Math.max(nameSimilarity, thematicCorrelation),
      audience: audienceCorrelation,
    };

    const maxType = Object.entries(scores).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0] as 'temporal' | 'thematic' | 'audience';

    const correlationScore =
      (temporalCorrelation * 0.3 +
        Math.max(nameSimilarity, thematicCorrelation) * 0.4 +
        audienceCorrelation * 0.3);

    if (correlationScore < this.config.minCorrelationScore) {
      return null;
    }

    return {
      trendA: trendA.id,
      trendB: trendB.id,
      correlationScore,
      correlationType: maxType,
      confidence: this.calculateConfidence(trendA, trendB, correlationScore),
    };
  }

  /**
   * Calculate temporal correlation based on timing patterns
   */
  private calculateTemporalCorrelation(trendA: Trend, trendB: Trend): number {
    const timeA = trendA.signal.firstSeenAt.getTime();
    const timeB = trendB.signal.firstSeenAt.getTime();
    const hoursDiff = Math.abs(timeA - timeB) / (1000 * 60 * 60);

    // Trends appearing within 48 hours are highly correlated
    if (hoursDiff <= 48) return 0.9;
    if (hoursDiff <= 168) return 0.7; // 1 week
    if (hoursDiff <= 336) return 0.5; // 2 weeks
    if (hoursDiff <= 720) return 0.3; // 1 month

    return 0.1;
  }

  /**
   * Calculate thematic correlation based on category and type
   */
  private calculateThematicCorrelation(trendA: Trend, trendB: Trend): number {
    let score = 0;

    // Same category
    if (trendA.signal.category === trendB.signal.category) {
      score += 0.4;
    }

    // Same type
    if (trendA.type === trendB.type) {
      score += 0.3;
    }

    // Similar phase
    if (trendA.phase === trendB.phase) {
      score += 0.2;
    }

    // Related trends overlap
    const relatedOverlap = trendA.relatedTrends.filter((t) =>
      trendB.relatedTrends.includes(t)
    ).length;
    if (relatedOverlap > 0) {
      score += Math.min(0.3, relatedOverlap * 0.1);
    }

    return Math.min(1, score);
  }

  /**
   * Calculate audience correlation based on engagement patterns
   */
  private calculateAudienceCorrelation(trendA: Trend, trendB: Trend): number {
    const engagementA = trendA.metrics.averageEngagementRate;
    const engagementB = trendB.metrics.averageEngagementRate;

    // Similar engagement rates suggest similar audiences
    const engagementDiff = Math.abs(engagementA - engagementB);
    const maxEngagement = Math.max(engagementA, engagementB, 0.01);
    const engagementSimilarity = 1 - engagementDiff / maxEngagement;

    // Similar velocity patterns
    const velocityA = trendA.metrics.velocity;
    const velocityB = trendB.metrics.velocity;
    const velocitySimilarity = this.calculateVelocitySimilarity(velocityA, velocityB);

    return (engagementSimilarity * 0.5 + velocitySimilarity * 0.5);
  }

  /**
   * Calculate velocity similarity between two trends
   */
  private calculateVelocitySimilarity(
    velocityA: TrendMetrics['velocity'],
    velocityB: TrendMetrics['velocity']
  ): number {
    const metrics = ['viewsPerHour', 'likesPerHour', 'sharesPerHour'] as const;
    let totalSimilarity = 0;

    for (const metric of metrics) {
      const a = velocityA[metric];
      const b = velocityB[metric];
      const max = Math.max(a, b, 1);
      totalSimilarity += 1 - Math.abs(a - b) / max;
    }

    return totalSimilarity / metrics.length;
  }

  /**
   * Detect arbitrage opportunities between platforms
   */
  detectArbitrageOpportunities(
    platformData: PlatformTrendData[]
  ): TrendArbitrageOpportunity[] {
    const opportunities: TrendArbitrageOpportunity[] = [];

    // Group by similar names/identifiers
    const grouped = this.groupSimilarTrends(platformData);

    for (const group of grouped) {
      if (group.length < 2) continue;

      // Sort by first seen date
      const sorted = [...group].sort(
        (a, b) => a.firstSeenAt.getTime() - b.firstSeenAt.getTime()
      );

      const source = sorted[0];

      for (let i = 1; i < sorted.length; i++) {
        const target = sorted[i];
        const lagHours = this.getHoursDifference(source.firstSeenAt, target.firstSeenAt);

        // Check if within arbitrage window
        if (lagHours <= this.config.arbitrageLagThresholdHours) {
          const opportunity = this.createArbitrageOpportunity(
            source,
            target,
            lagHours
          );
          if (opportunity) {
            opportunities.push(opportunity);
          }
        }
      }

      // Also check for platforms where trend hasn't appeared yet
      const presentPlatforms = new Set(group.map((t) => t.platform));
      const allPlatforms: TrendPlatform[] = ['tiktok', 'instagram', 'youtube', 'twitter'];
      const missingPlatforms = allPlatforms.filter((p) => !presentPlatforms.has(p));

      for (const targetPlatform of missingPlatforms) {
        const opportunity = this.createMissingPlatformOpportunity(
          source,
          targetPlatform
        );
        if (opportunity) {
          opportunities.push(opportunity);
        }
      }
    }

    return opportunities.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  /**
   * Group similar trends across platforms
   */
  private groupSimilarTrends(data: PlatformTrendData[]): PlatformTrendData[][] {
    const groups: PlatformTrendData[][] = [];
    const used = new Set<number>();

    for (let i = 0; i < data.length; i++) {
      if (used.has(i)) continue;

      const group = [data[i]];
      used.add(i);

      for (let j = i + 1; j < data.length; j++) {
        if (used.has(j)) continue;

        const similarity = this.calculateStringSimilarity(
          data[i].name.toLowerCase(),
          data[j].name.toLowerCase()
        );

        if (similarity >= this.config.similarityThreshold) {
          group.push(data[j]);
          used.add(j);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Create arbitrage opportunity between two platforms
   */
  private createArbitrageOpportunity(
    source: PlatformTrendData,
    target: PlatformTrendData,
    lagHours: number
  ): TrendArbitrageOpportunity | null {
    // Calculate estimated remaining window
    const estimatedWindow = Math.max(
      0,
      this.config.maxArbitrageWindowHours - lagHours
    );

    if (estimatedWindow <= 0) return null;

    // Calculate confidence based on velocity and lag
    const velocityScore = this.normalizeVelocity(source.metrics.velocity);
    const lagScore = 1 - lagHours / this.config.maxArbitrageWindowHours;
    const confidenceScore = (velocityScore * 0.6 + lagScore * 0.4);

    return {
      trendId: `${source.platform}-${source.identifier}`,
      sourcePlatform: source.platform,
      targetPlatform: target.platform,
      migrationLagHours: lagHours,
      estimatedWindow,
      confidenceScore,
      recommendedAction: this.generateArbitrageRecommendation(
        source,
        target,
        estimatedWindow
      ),
    };
  }

  /**
   * Create opportunity for platform where trend hasn't appeared
   */
  private createMissingPlatformOpportunity(
    source: PlatformTrendData,
    targetPlatform: TrendPlatform
  ): TrendArbitrageOpportunity | null {
    const hoursSinceFirst = this.getHoursDifference(
      source.firstSeenAt,
      new Date()
    );

    // Only if trend is recent enough
    if (hoursSinceFirst > this.config.arbitrageLagThresholdHours) {
      return null;
    }

    const estimatedWindow = this.config.maxArbitrageWindowHours - hoursSinceFirst;
    const velocityScore = this.normalizeVelocity(source.metrics.velocity);
    const freshnessScore = 1 - hoursSinceFirst / this.config.arbitrageLagThresholdHours;
    const confidenceScore = (velocityScore * 0.5 + freshnessScore * 0.5);

    return {
      trendId: `${source.platform}-${source.identifier}`,
      sourcePlatform: source.platform,
      targetPlatform,
      migrationLagHours: hoursSinceFirst,
      estimatedWindow,
      confidenceScore,
      recommendedAction: `Trend "${source.name}" is trending on ${source.platform} but not yet on ${targetPlatform}. Early adoption opportunity with ~${Math.round(estimatedWindow)}h window.`,
    };
  }

  /**
   * Generate recommendation for arbitrage opportunity
   */
  private generateArbitrageRecommendation(
    source: PlatformTrendData,
    target: PlatformTrendData,
    windowHours: number
  ): string {
    const urgency = windowHours < 48 ? 'urgent' : windowHours < 168 ? 'moderate' : 'low';

    return `[${urgency.toUpperCase()}] Trend "${source.name}" migrated from ${source.platform} to ${target.platform} with ${Math.round(windowHours)}h remaining window. Adapt content format for ${target.platform} audience.`;
  }

  /**
   * Normalize velocity to 0-1 score
   */
  private normalizeVelocity(velocity: TrendMetrics['velocity']): number {
    const composite =
      velocity.viewsPerHour / 10000 +
      velocity.likesPerHour / 1000 +
      velocity.sharesPerHour / 500;

    return Math.min(1, composite / 3);
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLength = Math.max(a.length, b.length);
    return 1 - matrix[b.length][a.length] / maxLength;
  }

  /**
   * Calculate confidence score for correlation
   */
  private calculateConfidence(
    trendA: Trend,
    trendB: Trend,
    correlationScore: number
  ): number {
    // Higher confidence with more data points
    const dataQuality =
      (Math.min(trendA.metrics.totalContent, 100) / 100 +
        Math.min(trendB.metrics.totalContent, 100) / 100) /
      2;

    // Higher confidence with higher individual confidence scores
    const trendConfidence =
      (trendA.confidenceScore + trendB.confidenceScore) / 2;

    return correlationScore * 0.4 + dataQuality * 0.3 + trendConfidence * 0.3;
  }

  /**
   * Get hours difference between two dates
   */
  private getHoursDifference(start: Date, end: Date): number {
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }
}
