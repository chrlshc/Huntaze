/**
 * Content Generation Property Tests
 * Content & Trends AI Engine - Task 5.2*
 * 
 * Property-based tests for content generation consistency
 * **Validates: Requirements 8.1, 8.2, 8.4, 8.5**
 * 
 * Property 9: Content Generation Consistency
 * *For any* trend data and brand profile, the content generation system
 * should produce consistent, valid recommendations with proper scoring
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

import {
  VelocityCalculator,
  type VelocityDataPoint,
} from '../../../lib/ai/content-trends/trend-detection/velocity-calculator';

import {
  CrossPlatformCorrelator,
  type PlatformTrendData,
} from '../../../lib/ai/content-trends/trend-detection/cross-platform-correlator';

import {
  TrendDetector,
  type TrendDataInput,
} from '../../../lib/ai/content-trends/trend-detection/trend-detector';

import type {
  TrendPlatform,
  TrendCategory,
  TrendPhase,
  Trend,
  TrendMetrics,
  TrendVelocity,
} from '../../../lib/ai/content-trends/trend-detection/types';

import {
  BrandAlignmentScorer,
} from '../../../lib/ai/content-trends/recommendation/brand-alignment-scorer';

import {
  TimingOptimizer,
} from '../../../lib/ai/content-trends/recommendation/timing-optimizer';

import {
  RecommendationEngine,
} from '../../../lib/ai/content-trends/recommendation/recommendation-engine';

import type {
  BrandProfile,
  ContentType,
} from '../../../lib/ai/content-trends/recommendation/types';

import type { ViralMechanism } from '../../../lib/ai/content-trends/viral-prediction/types';

// ============================================================================
// Test Generators
// ============================================================================

// Generate valid platform types
const platformArb = fc.constantFrom<TrendPlatform>('tiktok', 'instagram', 'youtube', 'twitter');

// Generate valid category types
const categoryArb = fc.constantFrom<TrendCategory>('sound', 'hashtag', 'format', 'topic', 'challenge', 'meme');

// Generate valid phase types
const phaseArb = fc.constantFrom<TrendPhase>('emerging', 'growing', 'peak', 'declining', 'saturated');

// Generate valid content types
const contentTypeArb = fc.constantFrom<ContentType>('video', 'image', 'carousel', 'story', 'text');

// Generate valid timestamps
const timestampArb = fc.integer({
  min: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
  max: Date.now(),
}).map(ts => new Date(ts));

// Generate velocity data points
const velocityDataPointArb = fc.record({
  timestamp: timestampArb,
  views: fc.integer({ min: 0, max: 10000000 }),
  likes: fc.integer({ min: 0, max: 1000000 }),
  shares: fc.integer({ min: 0, max: 500000 }),
  comments: fc.integer({ min: 0, max: 200000 }),
  contentCount: fc.integer({ min: 1, max: 100000 }),
});

// Generate array of velocity data points (sorted by timestamp)
const velocityDataPointsArb = fc.array(velocityDataPointArb, { minLength: 2, maxLength: 20 })
  .map(points => points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));

// Generate trend velocity
const trendVelocityArb = fc.record({
  viewsPerHour: fc.float({ min: 0, max: 100000, noNaN: true }),
  likesPerHour: fc.float({ min: 0, max: 10000, noNaN: true }),
  sharesPerHour: fc.float({ min: 0, max: 5000, noNaN: true }),
  commentsPerHour: fc.float({ min: 0, max: 2000, noNaN: true }),
  newContentPerHour: fc.float({ min: 0, max: 1000, noNaN: true }),
  accelerationRate: fc.float({ min: -1, max: 2, noNaN: true }),
});

// Generate trend metrics
const trendMetricsArb = fc.record({
  totalViews: fc.integer({ min: 0, max: 100000000 }),
  totalLikes: fc.integer({ min: 0, max: 10000000 }),
  totalShares: fc.integer({ min: 0, max: 5000000 }),
  totalComments: fc.integer({ min: 0, max: 2000000 }),
  totalContent: fc.integer({ min: 1, max: 100000 }),
  averageEngagementRate: fc.float({ min: 0, max: 1, noNaN: true }),
  velocity: trendVelocityArb,
});

// Generate trend signal
const trendSignalArb = fc.record({
  id: fc.stringMatching(/^[a-z]+-[a-z]+-[a-z0-9]+$/),
  platform: platformArb,
  category: categoryArb,
  identifier: fc.stringMatching(/^[a-zA-Z0-9_-]{5,30}$/),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  firstSeenAt: timestampArb,
  lastUpdatedAt: timestampArb,
});

// Generate a complete trend
const trendArb: fc.Arbitrary<Trend> = fc.record({
  id: fc.stringMatching(/^[a-z]+-[a-z]+-[a-z0-9]+$/),
  signal: trendSignalArb,
  type: fc.constantFrom('micro', 'macro', 'meta'),
  phase: phaseArb,
  metrics: trendMetricsArb,
  crossPlatformPresence: fc.array(
    fc.record({
      platform: platformArb,
      identifier: fc.stringMatching(/^[a-zA-Z0-9_-]{5,30}$/),
      metrics: trendMetricsArb,
      firstSeenAt: timestampArb,
      migrationLag: fc.option(fc.integer({ min: 0, max: 168 }), { nil: undefined }),
    }),
    { minLength: 0, maxLength: 4 }
  ),
  arbitrageOpportunities: fc.constant([]),
  relatedTrends: fc.array(fc.stringMatching(/^[a-z]+-[a-z]+-[a-z0-9]+$/), { maxLength: 5 }),
  viralScore: fc.float({ min: 0, max: 1, noNaN: true }),
  replicabilityScore: fc.float({ min: 0, max: 1, noNaN: true }),
  confidenceScore: fc.float({ min: 0, max: 1, noNaN: true }),
  predictedPeakDate: fc.option(timestampArb, { nil: undefined }),
  predictedDeclineDate: fc.option(timestampArb, { nil: undefined }),
  createdAt: timestampArb,
  updatedAt: timestampArb,
}) as fc.Arbitrary<Trend>;

// Generate viral mechanism
const viralMechanismArb: fc.Arbitrary<ViralMechanism> = fc.record({
  type: fc.constantFrom('authenticity', 'controversy', 'humor', 'surprise', 'social_proof'),
  strength: fc.float({ min: 0, max: 1, noNaN: true }),
  description: fc.string({ minLength: 10, maxLength: 100 }),
  replicabilityFactor: fc.float({ min: 0, max: 1, noNaN: true }),
  examples: fc.array(fc.string({ maxLength: 50 }), { maxLength: 3 }),
});

// Generate audience profile
const audienceProfileArb = fc.record({
  ageRange: fc.record({
    min: fc.integer({ min: 13, max: 30 }),
    max: fc.integer({ min: 31, max: 65 }),
  }),
  genders: fc.array(fc.constantFrom('male', 'female', 'non-binary', 'all'), { minLength: 1, maxLength: 4 }),
  interests: fc.array(fc.constantFrom(
    'entertainment', 'music', 'fashion', 'food', 'fitness', 'tech', 'business', 'education', 'lifestyle', 'trends'
  ), { minLength: 1, maxLength: 5 }),
  locations: fc.array(fc.constantFrom('US', 'UK', 'CA', 'AU', 'EU', 'GLOBAL'), { minLength: 1, maxLength: 3 }),
  behaviors: fc.array(fc.string({ maxLength: 30 }), { maxLength: 3 }),
  painPoints: fc.array(fc.string({ maxLength: 50 }), { maxLength: 3 }),
});

// Generate content goal
const contentGoalArb = fc.record({
  type: fc.constantFrom('awareness', 'engagement', 'conversion', 'retention', 'education'),
  priority: fc.integer({ min: 1, max: 10 }),
  kpis: fc.array(fc.string({ maxLength: 30 }), { minLength: 1, maxLength: 3 }),
});

// Generate platform preference
const platformPreferenceArb = fc.record({
  platform: fc.constantFrom('tiktok', 'instagram', 'youtube', 'twitter'),
  priority: fc.integer({ min: 1, max: 10 }),
  contentTypes: fc.array(contentTypeArb, { minLength: 1, maxLength: 4 }),
  postingFrequency: fc.constantFrom('daily', 'weekly', 'bi-weekly', 'monthly'),
  bestTimes: fc.option(fc.array(fc.stringMatching(/^[0-9]{1,2}:00$/), { maxLength: 3 }), { nil: undefined }),
});

// Generate brand profile
const brandProfileArb: fc.Arbitrary<BrandProfile> = fc.record({
  id: fc.stringMatching(/^brand-[a-z0-9]{8}$/),
  name: fc.string({ minLength: 2, maxLength: 50 }),
  industry: fc.constantFrom('tech', 'fashion', 'food', 'fitness', 'entertainment', 'education', 'finance'),
  tone: fc.constantFrom('professional', 'casual', 'humorous', 'authoritative', 'inspirational'),
  targetAudience: audienceProfileArb,
  brandValues: fc.array(fc.constantFrom(
    'authenticity', 'innovation', 'trust', 'fun', 'quality', 'community', 'education', 'sustainability'
  ), { minLength: 1, maxLength: 4 }),
  contentGoals: fc.array(contentGoalArb, { minLength: 1, maxLength: 3 }),
  platforms: fc.array(platformPreferenceArb, { minLength: 1, maxLength: 4 }),
  contentHistory: fc.option(fc.constant([]), { nil: undefined }),
  competitors: fc.option(fc.array(fc.string({ maxLength: 30 }), { maxLength: 3 }), { nil: undefined }),
});

// Generate trend data input
const trendDataInputArb: fc.Arbitrary<TrendDataInput> = fc.record({
  platform: platformArb,
  category: categoryArb,
  identifier: fc.stringMatching(/^[a-zA-Z0-9_-]{5,30}$/),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  dataPoints: velocityDataPointsArb,
  metadata: fc.option(fc.constant({}), { nil: undefined }),
});

// Generate platform trend data for correlator
const platformTrendDataArb: fc.Arbitrary<PlatformTrendData> = fc.record({
  platform: platformArb,
  identifier: fc.stringMatching(/^[a-zA-Z0-9_-]{5,30}$/),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  metrics: trendMetricsArb,
  firstSeenAt: timestampArb,
});

// ============================================================================
// Velocity Calculator Property Tests
// ============================================================================

describe('Content Generation Property Tests', () => {
  describe('Property 9.1: Velocity Calculation Consistency', () => {
    let velocityCalculator: VelocityCalculator;

    beforeEach(() => {
      velocityCalculator = new VelocityCalculator();
    });

    it('velocity should be non-negative for all metrics', () => {
      fc.assert(
        fc.property(
          velocityDataPointsArb,
          (dataPoints) => {
            const velocity = velocityCalculator.calculateVelocity(dataPoints);
            
            expect(velocity.viewsPerHour).toBeGreaterThanOrEqual(0);
            expect(velocity.likesPerHour).toBeGreaterThanOrEqual(0);
            expect(velocity.sharesPerHour).toBeGreaterThanOrEqual(0);
            expect(velocity.commentsPerHour).toBeGreaterThanOrEqual(0);
            expect(velocity.newContentPerHour).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('velocity calculation should be deterministic', () => {
      fc.assert(
        fc.property(
          velocityDataPointsArb,
          (dataPoints) => {
            const velocity1 = velocityCalculator.calculateVelocity(dataPoints);
            const velocity2 = velocityCalculator.calculateVelocity(dataPoints);
            
            expect(velocity1.viewsPerHour).toBe(velocity2.viewsPerHour);
            expect(velocity1.likesPerHour).toBe(velocity2.likesPerHour);
            expect(velocity1.sharesPerHour).toBe(velocity2.sharesPerHour);
            expect(velocity1.accelerationRate).toBe(velocity2.accelerationRate);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('single data point should return zero velocity', () => {
      fc.assert(
        fc.property(
          velocityDataPointArb,
          (dataPoint) => {
            const velocity = velocityCalculator.calculateVelocity([dataPoint]);
            
            expect(velocity.viewsPerHour).toBe(0);
            expect(velocity.likesPerHour).toBe(0);
            expect(velocity.sharesPerHour).toBe(0);
            expect(velocity.commentsPerHour).toBe(0);
            expect(velocity.newContentPerHour).toBe(0);
            expect(velocity.accelerationRate).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty data points should return zero velocity', () => {
      const velocity = velocityCalculator.calculateVelocity([]);
      
      expect(velocity.viewsPerHour).toBe(0);
      expect(velocity.likesPerHour).toBe(0);
      expect(velocity.sharesPerHour).toBe(0);
      expect(velocity.commentsPerHour).toBe(0);
      expect(velocity.newContentPerHour).toBe(0);
      expect(velocity.accelerationRate).toBe(0);
    });

    it('increasing metrics should produce positive velocity', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 100000 }),
          fc.integer({ min: 1, max: 24 }),
          (viewIncrease, hoursDiff) => {
            const now = Date.now();
            const dataPoints: VelocityDataPoint[] = [
              {
                timestamp: new Date(now - hoursDiff * 60 * 60 * 1000),
                views: 1000,
                likes: 100,
                shares: 50,
                comments: 20,
                contentCount: 10,
              },
              {
                timestamp: new Date(now),
                views: 1000 + viewIncrease,
                likes: 100 + Math.floor(viewIncrease / 10),
                shares: 50 + Math.floor(viewIncrease / 20),
                comments: 20 + Math.floor(viewIncrease / 50),
                contentCount: 10 + Math.floor(viewIncrease / 1000),
              },
            ];
            
            const velocity = velocityCalculator.calculateVelocity(dataPoints);
            
            expect(velocity.viewsPerHour).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('analyze should return valid phase', () => {
      fc.assert(
        fc.property(
          velocityDataPointsArb,
          (dataPoints) => {
            const result = velocityCalculator.analyze(dataPoints);
            
            const validPhases: TrendPhase[] = ['emerging', 'growing', 'peak', 'declining', 'saturated'];
            expect(validPhases).toContain(result.phase);
            expect(result.peakProbability).toBeGreaterThanOrEqual(0);
            expect(result.peakProbability).toBeLessThanOrEqual(1);
            expect(['accelerating', 'stable', 'decelerating']).toContain(result.accelerationTrend);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================================
  // Cross-Platform Correlator Property Tests
  // ============================================================================

  describe('Property 9.2: Cross-Platform Correlation Detection', () => {
    let correlator: CrossPlatformCorrelator;

    beforeEach(() => {
      correlator = new CrossPlatformCorrelator();
    });

    it('correlation score should be between 0 and 1', () => {
      fc.assert(
        fc.property(
          fc.array(trendArb, { minLength: 2, maxLength: 10 }),
          (trends) => {
            const correlations = correlator.findCorrelations(trends);
            
            for (const correlation of correlations) {
              expect(correlation.correlationScore).toBeGreaterThanOrEqual(0);
              expect(correlation.correlationScore).toBeLessThanOrEqual(1);
              expect(correlation.confidence).toBeGreaterThanOrEqual(0);
              expect(correlation.confidence).toBeLessThanOrEqual(1);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('correlation type should be valid', () => {
      fc.assert(
        fc.property(
          fc.array(trendArb, { minLength: 2, maxLength: 10 }),
          (trends) => {
            const correlations = correlator.findCorrelations(trends);
            const validTypes = ['causal', 'temporal', 'thematic', 'audience'];
            
            for (const correlation of correlations) {
              expect(validTypes).toContain(correlation.correlationType);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('correlations should reference existing trends', () => {
      fc.assert(
        fc.property(
          fc.array(trendArb, { minLength: 2, maxLength: 10 }),
          (trends) => {
            const trendIds = new Set(trends.map(t => t.id));
            const correlations = correlator.findCorrelations(trends);
            
            for (const correlation of correlations) {
              expect(trendIds.has(correlation.trendA)).toBe(true);
              expect(trendIds.has(correlation.trendB)).toBe(true);
              expect(correlation.trendA).not.toBe(correlation.trendB);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('single trend should produce no correlations', () => {
      fc.assert(
        fc.property(
          trendArb,
          (trend) => {
            const correlations = correlator.findCorrelations([trend]);
            expect(correlations).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty trends should produce no correlations', () => {
      const correlations = correlator.findCorrelations([]);
      expect(correlations).toHaveLength(0);
    });

    it('arbitrage opportunities should have valid structure', () => {
      fc.assert(
        fc.property(
          fc.array(platformTrendDataArb, { minLength: 2, maxLength: 10 }),
          (platformData) => {
            const opportunities = correlator.detectArbitrageOpportunities(platformData);
            
            for (const opportunity of opportunities) {
              expect(opportunity.confidenceScore).toBeGreaterThanOrEqual(0);
              expect(opportunity.confidenceScore).toBeLessThanOrEqual(1);
              expect(opportunity.estimatedWindow).toBeGreaterThanOrEqual(0);
              expect(opportunity.migrationLagHours).toBeGreaterThanOrEqual(0);
              expect(opportunity.recommendedAction).toBeTruthy();
              expect(['tiktok', 'instagram', 'youtube', 'twitter']).toContain(opportunity.sourcePlatform);
              expect(['tiktok', 'instagram', 'youtube', 'twitter']).toContain(opportunity.targetPlatform);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('arbitrage source and target platforms should differ', () => {
      fc.assert(
        fc.property(
          fc.array(platformTrendDataArb, { minLength: 2, maxLength: 10 }),
          (platformData) => {
            const opportunities = correlator.detectArbitrageOpportunities(platformData);
            
            for (const opportunity of opportunities) {
              expect(opportunity.sourcePlatform).not.toBe(opportunity.targetPlatform);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // ============================================================================
  // Brand Alignment Scorer Property Tests
  // ============================================================================

  describe('Property 9.3: Brand Alignment Scoring Bounds', () => {
    let alignmentScorer: BrandAlignmentScorer;

    beforeEach(() => {
      alignmentScorer = new BrandAlignmentScorer();
    });

    it('alignment score should be between 0 and 1', () => {
      fc.assert(
        fc.property(
          brandProfileArb,
          trendArb,
          fc.array(viralMechanismArb, { minLength: 1, maxLength: 5 }),
          (brand, trend, mechanisms) => {
            const result = alignmentScorer.calculateAlignment(brand, trend, mechanisms);
            
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all alignment factors should be between 0 and 1', () => {
      fc.assert(
        fc.property(
          brandProfileArb,
          trendArb,
          fc.array(viralMechanismArb, { minLength: 1, maxLength: 5 }),
          (brand, trend, mechanisms) => {
            const result = alignmentScorer.calculateAlignment(brand, trend, mechanisms);
            
            expect(result.factors.toneMatch).toBeGreaterThanOrEqual(0);
            expect(result.factors.toneMatch).toBeLessThanOrEqual(1);
            expect(result.factors.audienceMatch).toBeGreaterThanOrEqual(0);
            expect(result.factors.audienceMatch).toBeLessThanOrEqual(1);
            expect(result.factors.valueMatch).toBeGreaterThanOrEqual(0);
            expect(result.factors.valueMatch).toBeLessThanOrEqual(1);
            expect(result.factors.goalMatch).toBeGreaterThanOrEqual(0);
            expect(result.factors.goalMatch).toBeLessThanOrEqual(1);
            expect(result.factors.platformMatch).toBeGreaterThanOrEqual(0);
            expect(result.factors.platformMatch).toBeLessThanOrEqual(1);
            expect(result.factors.historyMatch).toBeGreaterThanOrEqual(0);
            expect(result.factors.historyMatch).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('alignment calculation should be deterministic', () => {
      fc.assert(
        fc.property(
          brandProfileArb,
          trendArb,
          fc.array(viralMechanismArb, { minLength: 1, maxLength: 5 }),
          (brand, trend, mechanisms) => {
            const result1 = alignmentScorer.calculateAlignment(brand, trend, mechanisms);
            const result2 = alignmentScorer.calculateAlignment(brand, trend, mechanisms);
            
            expect(result1.score).toBe(result2.score);
            expect(result1.factors.toneMatch).toBe(result2.factors.toneMatch);
            expect(result1.factors.audienceMatch).toBe(result2.factors.audienceMatch);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('warnings and suggestions should be arrays', () => {
      fc.assert(
        fc.property(
          brandProfileArb,
          trendArb,
          fc.array(viralMechanismArb, { minLength: 1, maxLength: 5 }),
          (brand, trend, mechanisms) => {
            const result = alignmentScorer.calculateAlignment(brand, trend, mechanisms);
            
            expect(Array.isArray(result.warnings)).toBe(true);
            expect(Array.isArray(result.suggestions)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty mechanisms should still produce valid score', () => {
      fc.assert(
        fc.property(
          brandProfileArb,
          trendArb,
          (brand, trend) => {
            const result = alignmentScorer.calculateAlignment(brand, trend, []);
            
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(1);
            expect(typeof result.score).toBe('number');
            expect(Number.isNaN(result.score)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================================
  // Timing Optimizer Property Tests
  // ============================================================================

  describe('Property 9.4: Timing Optimization Validity', () => {
    let timingOptimizer: TimingOptimizer;

    beforeEach(() => {
      timingOptimizer = new TimingOptimizer();
    });

    it('timing strategy should be valid', () => {
      fc.assert(
        fc.property(
          brandProfileArb,
          trendArb,
          platformArb,
          (brand, trend, platform) => {
            const recommendation = timingOptimizer.generateRecommendation(brand, trend, platform);
            
            const validStrategies = ['immediate', 'scheduled', 'optimal', 'trend-aligned'];
            expect(validStrategies).toContain(recommendation.strategy);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('suggested date should be in the future or now', () => {
      fc.assert(
        fc.property(
          brandProfileArb,
          trendArb,
          platformArb,
          (brand, trend, platform) => {
            const recommendation = timingOptimizer.generateRecommendation(brand, trend, platform);
            
            if (recommendation.suggestedDate) {
              // Allow 1 second tolerance for test execution time
              const now = Date.now() - 1000;
              expect(recommendation.suggestedDate.getTime()).toBeGreaterThanOrEqual(now);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('trend window remaining should be non-negative', () => {
      fc.assert(
        fc.property(
          brandProfileArb,
          trendArb,
          platformArb,
          (brand, trend, platform) => {
            const recommendation = timingOptimizer.generateRecommendation(brand, trend, platform);
            
            if (recommendation.trendWindowRemaining !== undefined) {
              expect(recommendation.trendWindowRemaining).toBeGreaterThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('reasoning should be non-empty string', () => {
      fc.assert(
        fc.property(
          brandProfileArb,
          trendArb,
          platformArb,
          (brand, trend, platform) => {
            const recommendation = timingOptimizer.generateRecommendation(brand, trend, platform);
            
            expect(typeof recommendation.reasoning).toBe('string');
            expect(recommendation.reasoning.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('alternative times should be array', () => {
      fc.assert(
        fc.property(
          brandProfileArb,
          trendArb,
          platformArb,
          (brand, trend, platform) => {
            const recommendation = timingOptimizer.generateRecommendation(brand, trend, platform);
            
            if (recommendation.alternativeTimes) {
              expect(Array.isArray(recommendation.alternativeTimes)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('urgent trends should recommend immediate or trend-aligned strategy', () => {
      fc.assert(
        fc.property(
          brandProfileArb,
          platformArb,
          (brand, platform) => {
            // Create an emerging trend with high acceleration
            const urgentTrend: Trend = {
              id: 'test-urgent-trend',
              signal: {
                id: 'test-urgent-trend',
                platform,
                category: 'hashtag',
                identifier: 'urgent_trend',
                name: 'Urgent Trend',
                firstSeenAt: new Date(),
                lastUpdatedAt: new Date(),
              },
              type: 'macro',
              phase: 'emerging',
              metrics: {
                totalViews: 1000000,
                totalLikes: 100000,
                totalShares: 50000,
                totalComments: 20000,
                totalContent: 100,
                averageEngagementRate: 0.17,
                velocity: {
                  viewsPerHour: 50000,
                  likesPerHour: 5000,
                  sharesPerHour: 2500,
                  commentsPerHour: 1000,
                  newContentPerHour: 50,
                  accelerationRate: 0.8,
                },
              },
              crossPlatformPresence: [],
              arbitrageOpportunities: [],
              relatedTrends: [],
              viralScore: 0.9,
              replicabilityScore: 0.8,
              confidenceScore: 0.85,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            const recommendation = timingOptimizer.generateRecommendation(brand, urgentTrend, platform);
            
            // High urgency should result in immediate or trend-aligned
            expect(['immediate', 'trend-aligned', 'optimal']).toContain(recommendation.strategy);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // ============================================================================
  // Recommendation Engine Property Tests
  // ============================================================================

  describe('Property 9.5: Recommendation Generation Completeness', () => {
    let recommendationEngine: RecommendationEngine;

    beforeEach(() => {
      recommendationEngine = new RecommendationEngine();
    });

    it('recommendations should have valid scores between 0 and 1', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 5 }),
          async (brand, trends) => {
            const result = await recommendationEngine.generateRecommendations(brand, { trends });
            
            for (const rec of result.recommendations) {
              expect(rec.brandAlignmentScore).toBeGreaterThanOrEqual(0);
              expect(rec.brandAlignmentScore).toBeLessThanOrEqual(1);
              expect(rec.viralPotentialScore).toBeGreaterThanOrEqual(0);
              expect(rec.viralPotentialScore).toBeLessThanOrEqual(1);
              expect(rec.timingScore).toBeGreaterThanOrEqual(0);
              expect(rec.timingScore).toBeLessThanOrEqual(1);
              expect(rec.overallScore).toBeGreaterThanOrEqual(0);
              expect(rec.overallScore).toBeLessThanOrEqual(1);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('recommendations should have valid priority', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 5 }),
          async (brand, trends) => {
            const result = await recommendationEngine.generateRecommendations(brand, { trends });
            const validPriorities = ['low', 'medium', 'high', 'urgent'];
            
            for (const rec of result.recommendations) {
              expect(validPriorities).toContain(rec.priority);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('recommendations should have valid content type', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 5 }),
          async (brand, trends) => {
            const result = await recommendationEngine.generateRecommendations(brand, { trends });
            const validTypes: ContentType[] = ['video', 'image', 'carousel', 'story', 'text'];
            
            for (const rec of result.recommendations) {
              expect(validTypes).toContain(rec.contentType);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('recommendations should have complete content brief', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 5 }),
          async (brand, trends) => {
            const result = await recommendationEngine.generateRecommendations(brand, { trends });
            
            for (const rec of result.recommendations) {
              expect(rec.contentBrief).toBeDefined();
              expect(rec.contentBrief.hook).toBeDefined();
              expect(rec.contentBrief.hook.type).toBeTruthy();
              expect(rec.contentBrief.hook.text).toBeTruthy();
              expect(rec.contentBrief.narrative).toBeDefined();
              expect(rec.contentBrief.narrative.structure).toBeTruthy();
              expect(Array.isArray(rec.contentBrief.narrative.keyPoints)).toBe(true);
              expect(rec.contentBrief.callToAction).toBeDefined();
              expect(rec.contentBrief.callToAction.primary).toBeTruthy();
              expect(Array.isArray(rec.contentBrief.hashtags)).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('recommendations should have valid timing', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 5 }),
          async (brand, trends) => {
            const result = await recommendationEngine.generateRecommendations(brand, { trends });
            const validStrategies = ['immediate', 'scheduled', 'optimal', 'trend-aligned'];
            
            for (const rec of result.recommendations) {
              expect(rec.timing).toBeDefined();
              expect(validStrategies).toContain(rec.timing.strategy);
              expect(rec.timing.reasoning).toBeTruthy();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('recommendations should reference valid platforms', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 5 }),
          async (brand, trends) => {
            const result = await recommendationEngine.generateRecommendations(brand, { trends });
            const validPlatforms = ['tiktok', 'instagram', 'youtube', 'twitter'];
            
            for (const rec of result.recommendations) {
              expect(validPlatforms).toContain(rec.platform);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('result should include brand profile', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 5 }),
          async (brand, trends) => {
            const result = await recommendationEngine.generateRecommendations(brand, { trends });
            
            expect(result.brandProfile).toBeDefined();
            expect(result.brandProfile.id).toBe(brand.id);
            expect(result.brandProfile.name).toBe(brand.name);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('result should have valid timestamps', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 5 }),
          async (brand, trends) => {
            const before = Date.now();
            const result = await recommendationEngine.generateRecommendations(brand, { trends });
            const after = Date.now();
            
            expect(result.analysisTimestamp.getTime()).toBeGreaterThanOrEqual(before);
            expect(result.analysisTimestamp.getTime()).toBeLessThanOrEqual(after);
            expect(result.nextRefreshAt.getTime()).toBeGreaterThan(result.analysisTimestamp.getTime());
          }
        ),
        { numRuns: 50 }
      );
    });

    it('content gaps should be valid', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 5 }),
          async (brand, trends) => {
            const result = await recommendationEngine.generateRecommendations(brand, { trends });
            
            expect(Array.isArray(result.contentGaps)).toBe(true);
            for (const gap of result.contentGaps) {
              expect(gap.area).toBeTruthy();
              expect(gap.description).toBeTruthy();
              expect(gap.opportunity).toBeTruthy();
              expect(gap.suggestedAction).toBeTruthy();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('empty trends should produce empty recommendations', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          async (brand) => {
            const result = await recommendationEngine.generateRecommendations(brand, { trends: [] });
            
            expect(result.recommendations).toHaveLength(0);
            expect(result.trendsCovered).toHaveLength(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('recommendations should not exceed max limit', async () => {
      const engine = new RecommendationEngine({ maxRecommendations: 3 });
      
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 5, maxLength: 10 }),
          async (brand, trends) => {
            const result = await engine.generateRecommendations(brand, { trends });
            
            expect(result.recommendations.length).toBeLessThanOrEqual(3);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // ============================================================================
  // Trend Detector Property Tests
  // ============================================================================

  describe('Property 9.6: Trend Detection Completeness', () => {
    let trendDetector: TrendDetector;

    beforeEach(() => {
      trendDetector = new TrendDetector();
    });

    it('analyzed trends should have valid structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(trendDataInputArb, { minLength: 1, maxLength: 5 }),
          async (inputs) => {
            const result = await trendDetector.analyzeTrends(inputs);
            
            for (const trend of result.trends) {
              expect(trend.id).toBeTruthy();
              expect(trend.signal).toBeDefined();
              expect(trend.metrics).toBeDefined();
              expect(trend.viralScore).toBeGreaterThanOrEqual(0);
              expect(trend.viralScore).toBeLessThanOrEqual(1);
              expect(trend.replicabilityScore).toBeGreaterThanOrEqual(0);
              expect(trend.replicabilityScore).toBeLessThanOrEqual(1);
              expect(trend.confidenceScore).toBeGreaterThanOrEqual(0);
              expect(trend.confidenceScore).toBeLessThanOrEqual(1);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('analyzed trends should have valid phase', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(trendDataInputArb, { minLength: 1, maxLength: 5 }),
          async (inputs) => {
            const result = await trendDetector.analyzeTrends(inputs);
            const validPhases: TrendPhase[] = ['emerging', 'growing', 'peak', 'declining', 'saturated'];
            
            for (const trend of result.trends) {
              expect(validPhases).toContain(trend.phase);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('analyzed trends should have valid type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(trendDataInputArb, { minLength: 1, maxLength: 5 }),
          async (inputs) => {
            const result = await trendDetector.analyzeTrends(inputs);
            const validTypes = ['micro', 'macro', 'meta'];
            
            for (const trend of result.trends) {
              expect(validTypes).toContain(trend.type);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('result should have valid timestamps', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(trendDataInputArb, { minLength: 1, maxLength: 5 }),
          async (inputs) => {
            const before = Date.now();
            const result = await trendDetector.analyzeTrends(inputs);
            const after = Date.now();
            
            expect(result.analysisTimestamp.getTime()).toBeGreaterThanOrEqual(before);
            expect(result.analysisTimestamp.getTime()).toBeLessThanOrEqual(after);
            expect(result.nextUpdateAt.getTime()).toBeGreaterThan(result.analysisTimestamp.getTime());
          }
        ),
        { numRuns: 50 }
      );
    });

    it('alerts should have valid structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(trendDataInputArb, { minLength: 1, maxLength: 5 }),
          async (inputs) => {
            const result = await trendDetector.analyzeTrends(inputs);
            const validAlertTypes = ['new_trend', 'velocity_spike', 'cross_platform', 'arbitrage'];
            const validPriorities = ['low', 'medium', 'high', 'urgent'];
            
            for (const alert of result.emergingAlerts) {
              expect(validAlertTypes).toContain(alert.alertType);
              expect(validPriorities).toContain(alert.priority);
              expect(alert.message).toBeTruthy();
              expect(Array.isArray(alert.recommendedActions)).toBe(true);
              expect(alert.expiresAt).toBeInstanceOf(Date);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('correlations should have valid structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(trendDataInputArb, { minLength: 2, maxLength: 5 }),
          async (inputs) => {
            const result = await trendDetector.analyzeTrends(inputs);
            const validTypes = ['causal', 'temporal', 'thematic', 'audience'];
            
            for (const correlation of result.correlations) {
              expect(correlation.trendA).toBeTruthy();
              expect(correlation.trendB).toBeTruthy();
              expect(correlation.trendA).not.toBe(correlation.trendB);
              expect(correlation.correlationScore).toBeGreaterThanOrEqual(0);
              expect(correlation.correlationScore).toBeLessThanOrEqual(1);
              expect(validTypes).toContain(correlation.correlationType);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('meta trends should have valid structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(trendDataInputArb, { minLength: 3, maxLength: 8 }),
          async (inputs) => {
            const result = await trendDetector.analyzeTrends(inputs);
            
            for (const metaTrend of result.metaTrends) {
              expect(metaTrend.id).toBeTruthy();
              expect(metaTrend.name).toBeTruthy();
              expect(metaTrend.description).toBeTruthy();
              expect(Array.isArray(metaTrend.underlyingTrends)).toBe(true);
              expect(metaTrend.significance).toBeGreaterThanOrEqual(0);
              expect(metaTrend.significance).toBeLessThanOrEqual(1);
              expect(metaTrend.predictedDuration).toBeGreaterThan(0);
              expect(Array.isArray(metaTrend.strategicImplications)).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('empty inputs should produce empty results', async () => {
      const result = await trendDetector.analyzeTrends([]);
      
      expect(result.trends).toHaveLength(0);
      expect(result.emergingAlerts).toHaveLength(0);
      expect(result.correlations).toHaveLength(0);
      expect(result.metaTrends).toHaveLength(0);
    });
  });

  // ============================================================================
  // Combined Content Generation Property Tests
  // ============================================================================

  describe('Property 9.7: End-to-End Content Generation Flow', () => {
    it('complete flow should produce valid recommendations', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendDataInputArb, { minLength: 1, maxLength: 3 }),
          async (brand, inputs) => {
            // 1. Detect trends
            const trendDetector = new TrendDetector();
            const trendResult = await trendDetector.analyzeTrends(inputs);
            
            // 2. Generate recommendations
            const recommendationEngine = new RecommendationEngine();
            const recResult = await recommendationEngine.generateRecommendations(brand, {
              trends: trendResult.trends,
            });
            
            // Validate complete flow
            expect(recResult.brandProfile.id).toBe(brand.id);
            expect(Array.isArray(recResult.recommendations)).toBe(true);
            expect(Array.isArray(recResult.contentGaps)).toBe(true);
            
            // All recommendations should reference detected trends
            for (const rec of recResult.recommendations) {
              if (rec.trendReference) {
                const trendExists = trendResult.trends.some(
                  t => t.id === rec.trendReference?.trendId
                );
                expect(trendExists).toBe(true);
              }
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('recommendations should be sorted by overall score', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 3, maxLength: 8 }),
          async (brand, trends) => {
            const engine = new RecommendationEngine();
            const result = await engine.generateRecommendations(brand, { trends });
            
            // Check that recommendations are sorted by overall score (descending)
            for (let i = 1; i < result.recommendations.length; i++) {
              expect(result.recommendations[i - 1].overallScore)
                .toBeGreaterThanOrEqual(result.recommendations[i].overallScore);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('viral mechanisms should be preserved in recommendations', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 3 }),
          async (brand, trends) => {
            const engine = new RecommendationEngine();
            const result = await engine.generateRecommendations(brand, { trends });
            
            for (const rec of result.recommendations) {
              expect(Array.isArray(rec.viralMechanisms)).toBe(true);
              for (const mechanism of rec.viralMechanisms) {
                expect(mechanism.mechanism).toBeTruthy();
                expect(mechanism.description).toBeTruthy();
                expect(mechanism.applicationTip).toBeTruthy();
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('hook suggestions should have valid types', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 3 }),
          async (brand, trends) => {
            const engine = new RecommendationEngine();
            const result = await engine.generateRecommendations(brand, { trends });
            const validHookTypes = [
              'pointed_truth', 'micro_scenario', 'fast_reward',
              'constraint_negative', 'question', 'statistic'
            ];
            
            for (const rec of result.recommendations) {
              expect(validHookTypes).toContain(rec.contentBrief.hook.type);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('narrative structures should be valid', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 3 }),
          async (brand, trends) => {
            const engine = new RecommendationEngine();
            const result = await engine.generateRecommendations(brand, { trends });
            const validStructures = [
              'problem_solution', 'story_arc', 'listicle',
              'comparison', 'tutorial', 'behind_scenes'
            ];
            
            for (const rec of result.recommendations) {
              expect(validStructures).toContain(rec.contentBrief.narrative.structure);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('CTA placement should be valid', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 3 }),
          async (brand, trends) => {
            const engine = new RecommendationEngine();
            const result = await engine.generateRecommendations(brand, { trends });
            const validPlacements = ['end', 'middle', 'throughout'];
            const validUrgency = ['low', 'medium', 'high'];
            
            for (const rec of result.recommendations) {
              expect(validPlacements).toContain(rec.contentBrief.callToAction.placement);
              expect(validUrgency).toContain(rec.contentBrief.callToAction.urgencyLevel);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('hashtags should be non-empty for recommendations', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 3 }),
          async (brand, trends) => {
            const engine = new RecommendationEngine();
            const result = await engine.generateRecommendations(brand, { trends });
            
            for (const rec of result.recommendations) {
              expect(rec.contentBrief.hashtags.length).toBeGreaterThan(0);
              for (const hashtag of rec.contentBrief.hashtags) {
                expect(hashtag.startsWith('#')).toBe(true);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('duration should be positive for video content', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandProfileArb,
          fc.array(trendArb, { minLength: 1, maxLength: 3 }),
          async (brand, trends) => {
            const engine = new RecommendationEngine();
            const result = await engine.generateRecommendations(brand, { trends });
            
            for (const rec of result.recommendations) {
              if (rec.contentType === 'video' && rec.contentBrief.duration !== undefined) {
                expect(rec.contentBrief.duration).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
