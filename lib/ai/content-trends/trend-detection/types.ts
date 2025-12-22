/**
 * Trend Detection System Types
 * Task 5.2: Build trend identification and tracking
 * Requirements: 8.1, 8.2, 8.3
 */

export type TrendPlatform = 'tiktok' | 'instagram' | 'youtube' | 'twitter';
export type TrendCategory = 'sound' | 'hashtag' | 'format' | 'topic' | 'challenge' | 'meme';
export type TrendPhase = 'emerging' | 'growing' | 'peak' | 'declining' | 'saturated';
export type TrendType = 'micro' | 'macro' | 'meta';

export interface TrendSignal {
  id: string;
  platform: TrendPlatform;
  category: TrendCategory;
  identifier: string; // hashtag, sound_id, etc.
  name: string;
  description?: string;
  firstSeenAt: Date;
  lastUpdatedAt: Date;
}

export interface TrendVelocity {
  viewsPerHour: number;
  likesPerHour: number;
  sharesPerHour: number;
  commentsPerHour: number;
  newContentPerHour: number;
  accelerationRate: number; // Rate of change in velocity
}

export interface TrendMetrics {
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  totalContent: number;
  averageEngagementRate: number;
  velocity: TrendVelocity;
  peakVelocity?: TrendVelocity;
  peakTimestamp?: Date;
}

export interface CrossPlatformPresence {
  platform: TrendPlatform;
  identifier: string;
  metrics: TrendMetrics;
  firstSeenAt: Date;
  migrationLag?: number; // Hours since first platform
}

export interface TrendArbitrageOpportunity {
  trendId: string;
  sourcePlatform: TrendPlatform;
  targetPlatform: TrendPlatform;
  migrationLagHours: number;
  estimatedWindow: number; // Hours remaining
  confidenceScore: number;
  recommendedAction: string;
}

export interface Trend {
  id: string;
  signal: TrendSignal;
  type: TrendType;
  phase: TrendPhase;
  metrics: TrendMetrics;
  crossPlatformPresence: CrossPlatformPresence[];
  arbitrageOpportunities: TrendArbitrageOpportunity[];
  relatedTrends: string[];
  viralScore: number;
  replicabilityScore: number;
  confidenceScore: number;
  predictedPeakDate?: Date;
  predictedDeclineDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrendDetectionConfig {
  platforms: TrendPlatform[];
  categories: TrendCategory[];
  minVelocityThreshold: number;
  minEngagementRate: number;
  lookbackHours: number;
  updateIntervalMinutes: number;
  arbitrageLagThresholdHours: number;
}

export interface TrendSnapshot {
  trendId: string;
  timestamp: Date;
  metrics: TrendMetrics;
  phase: TrendPhase;
}

export interface TrendCorrelation {
  trendA: string;
  trendB: string;
  correlationScore: number;
  correlationType: 'causal' | 'temporal' | 'thematic' | 'audience';
  confidence: number;
}

export interface EmergingTrendAlert {
  trend: Trend;
  alertType: 'new_trend' | 'velocity_spike' | 'cross_platform' | 'arbitrage';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  recommendedActions: string[];
  expiresAt: Date;
}

export interface TrendAnalysisResult {
  trends: Trend[];
  emergingAlerts: EmergingTrendAlert[];
  arbitrageOpportunities: TrendArbitrageOpportunity[];
  correlations: TrendCorrelation[];
  metaTrends: MetaTrend[];
  analysisTimestamp: Date;
  nextUpdateAt: Date;
}

export interface MetaTrend {
  id: string;
  name: string;
  description: string;
  underlyingTrends: string[];
  category: string;
  significance: number;
  predictedDuration: number; // Days
  strategicImplications: string[];
}

export interface TrendGap {
  trendId: string;
  platform: TrendPlatform;
  velocity: number;
  totalContent: number;
  gapScore: number; // High velocity + low content = high gap
  opportunity: string;
}
