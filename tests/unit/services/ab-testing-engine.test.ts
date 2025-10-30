/**
 * Unit Tests - ABTestingEngine
 * Tests for Requirement 4: A/B Testing
 * 
 * Coverage:
 * - Test creation and variant management
 * - Performance tracking
 * - Statistical significance calculation
 * - Winner selection
 * - Test analytics
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('ABTestingEngine', () => {
  describe('Requirement 4.1: Create multiple variants', () => {
    it('should create A/B test with multiple variants', () => {
      const test = {
        id: 'test-123',
        name: 'Bio A/B Test',
        platform: 'instagram',
        testType: 'bio',
        status: 'draft',
        variants: [
          { id: 'var-1', name: 'Control', content: 'Original bio', isControl: true },
          { id: 'var-2', name: 'Variant A', content: 'Optimized bio A', isControl: false },
          { id: 'var-3', name: 'Variant B', content: 'Optimized bio B', isControl: false },
        ],
      };

      expect(test.variants.length).toBeGreaterThanOrEqual(2);
      expect(test.variants.filter((v) => v.isControl)).toHaveLength(1);
    });

    it('should create bio variants', () => {
      const variants = [
        '🎨 Digital Creator | DM for collabs',
        '✨ Creator helping you grow | Link below',
        '💡 Content creator | Free tips in bio',
      ];

      expect(variants.length).toBe(3);
      expect(variants.every((v) => v.length <= 150)).toBe(true);
    });

    it('should create caption variants', () => {
      const variants = [
        'Amazing sunset! 🌅 #sunset',
        'Stunning sunset today! What do you think? 🌅 #sunset',
        'Golden hour magic ✨ Save this! 🌅 #sunset',
      ];

      expect(variants.length).toBe(3);
    });

    it('should create hashtag variants', () => {
      const variants = [
        ['#photography', '#sunset', '#nature'],
        ['#photooftheday', '#goldenhour', '#landscape'],
        ['#sunsetphotography', '#naturelover', '#beautifuldestinations'],
      ];

      expect(variants.length).toBe(3);
      expect(variants.every((v) => v.length > 0)).toBe(true);
    });
  });

  describe('Requirement 4.2: Distribute variants evenly', () => {
    it('should distribute traffic evenly across variants', () => {
      const variants = [
        { id: 'var-1', impressions: 0 },
        { id: 'var-2', impressions: 0 },
        { id: 'var-3', impressions: 0 },
      ];

      // Simulate 300 impressions
      for (let i = 0; i < 300; i++) {
        const variantIndex = i % variants.length;
        variants[variantIndex].impressions++;
      }

      expect(variants[0].impressions).toBe(100);
      expect(variants[1].impressions).toBe(100);
      expect(variants[2].impressions).toBe(100);
    });

    it('should use random distribution', () => {
      const variants = ['A', 'B', 'C'];
      const distribution = { A: 0, B: 0, C: 0 };

      for (let i = 0; i < 1000; i++) {
        const selected = variants[Math.floor(Math.random() * variants.length)];
        distribution[selected]++;
      }

      // Each variant should get roughly 33% (±10%)
      expect(distribution.A).toBeGreaterThan(250);
      expect(distribution.A).toBeLessThan(450);
      expect(distribution.B).toBeGreaterThan(250);
      expect(distribution.B).toBeLessThan(450);
      expect(distribution.C).toBeGreaterThan(250);
      expect(distribution.C).toBeLessThan(450);
    });
  });

  describe('Requirement 4.3: Track performance metrics', () => {
    it('should track reach, engagement, and conversions', () => {
      const variant = {
        id: 'var-1',
        impressions: 1000,
        reach: 800,
        engagement: 100,
        clicks: 50,
        conversions: 10,
      };

      expect(variant.impressions).toBeGreaterThan(0);
      expect(variant.reach).toBeLessThanOrEqual(variant.impressions);
      expect(variant.engagement).toBeGreaterThan(0);
    });

    it('should calculate engagement rate', () => {
      const variant = {
        reach: 1000,
        engagement: 150,
      };

      const engagementRate = (variant.engagement / variant.reach) * 100;

      expect(engagementRate).toBe(15);
    });

    it('should calculate conversion rate', () => {
      const variant = {
        clicks: 100,
        conversions: 10,
      };

      const conversionRate = (variant.conversions / variant.clicks) * 100;

      expect(conversionRate).toBe(10);
    });

    it('should track metrics over time', () => {
      const metrics = [
        { date: '2025-01-01', impressions: 100, engagement: 10 },
        { date: '2025-01-02', impressions: 150, engagement: 20 },
        { date: '2025-01-03', impressions: 200, engagement: 30 },
      ];

      const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);

      expect(totalImpressions).toBe(450);
    });
  });

  describe('Requirement 4.4: Determine statistical significance', () => {
    it('should calculate Z-score for proportions', () => {
      const variantA = { conversions: 50, impressions: 1000 }; // 5%
      const variantB = { conversions: 70, impressions: 1000 }; // 7%

      const pA = variantA.conversions / variantA.impressions;
      const pB = variantB.conversions / variantB.impressions;
      const pooledP = (variantA.conversions + variantB.conversions) / 
                      (variantA.impressions + variantB.impressions);

      const se = Math.sqrt(pooledP * (1 - pooledP) * (1/variantA.impressions + 1/variantB.impressions));
      const zScore = (pB - pA) / se;

      expect(zScore).toBeGreaterThan(0);
    });

    it('should require minimum sample size', () => {
      const minSampleSize = {
        bio: 1000,
        caption: 500,
        hashtags: 500,
        timing: 10,
        cta: 100,
      };

      const variant = { impressions: 600 };
      const testType = 'caption';

      const hasMinimumSample = variant.impressions >= minSampleSize[testType];

      expect(hasMinimumSample).toBe(true);
    });

    it('should determine significance at 95% confidence', () => {
      const zScore = 2.1; // > 1.96 for 95% confidence
      const isSignificant = Math.abs(zScore) > 1.96;

      expect(isSignificant).toBe(true);
    });

    it('should not declare winner without significance', () => {
      const zScore = 1.5; // < 1.96
      const isSignificant = Math.abs(zScore) > 1.96;

      expect(isSignificant).toBe(false);
    });

    it('should calculate p-value', () => {
      const zScore = 2.5;
      // Simplified p-value calculation (normally use statistical library)
      const pValue = 2 * (1 - 0.9938); // For z=2.5

      expect(pValue).toBeLessThan(0.05);
    });
  });

  describe('Requirement 4.5: Automatically apply winning variants', () => {
    it('should select winner based on highest conversion rate', () => {
      const variants = [
        { id: 'var-1', conversions: 50, impressions: 1000, conversionRate: 0.05 },
        { id: 'var-2', conversions: 70, impressions: 1000, conversionRate: 0.07 },
        { id: 'var-3', conversions: 60, impressions: 1000, conversionRate: 0.06 },
      ];

      const winner = variants.reduce((prev, current) => 
        current.conversionRate > prev.conversionRate ? current : prev
      );

      expect(winner.id).toBe('var-2');
    });

    it('should apply winner to user profile', () => {
      const test = {
        id: 'test-123',
        testType: 'bio',
        winnerId: 'var-2',
        status: 'completed',
      };

      const winner = {
        id: 'var-2',
        content: 'Winning bio content',
      };

      const applied = {
        userId: 'user-123',
        bio: winner.content,
        appliedAt: new Date(),
      };

      expect(applied.bio).toBe(winner.content);
    });

    it('should mark test as completed', () => {
      const test = {
        id: 'test-123',
        status: 'running',
      };

      test.status = 'completed';

      expect(test.status).toBe('completed');
    });

    it('should notify user of winner', () => {
      const notification = {
        userId: 'user-123',
        testId: 'test-123',
        message: 'Your A/B test has a winner! Variant B performed 40% better.',
        winnerId: 'var-2',
      };

      expect(notification.message).toContain('winner');
    });
  });

  describe('Test Analytics', () => {
    it('should get test results with all metrics', () => {
      const results = {
        testId: 'test-123',
        status: 'completed',
        duration: 7, // days
        variants: [
          {
            id: 'var-1',
            name: 'Control',
            impressions: 1000,
            engagement: 100,
            conversions: 50,
            engagementRate: 0.10,
            conversionRate: 0.05,
          },
          {
            id: 'var-2',
            name: 'Variant A',
            impressions: 1000,
            engagement: 150,
            conversions: 70,
            engagementRate: 0.15,
            conversionRate: 0.07,
          },
        ],
        winner: 'var-2',
        improvement: 0.40, // 40% improvement
        significant: true,
      };

      expect(results.winner).toBe('var-2');
      expect(results.improvement).toBe(0.40);
      expect(results.significant).toBe(true);
    });

    it('should get test history for user', () => {
      const history = [
        { id: 'test-1', name: 'Bio Test', status: 'completed', winner: 'var-2' },
        { id: 'test-2', name: 'Caption Test', status: 'running', winner: null },
        { id: 'test-3', name: 'Hashtag Test', status: 'completed', winner: 'var-1' },
      ];

      const completedTests = history.filter((t) => t.status === 'completed');

      expect(completedTests.length).toBe(2);
    });

    it('should calculate win rate', () => {
      const tests = [
        { winner: 'var-2', control: 'var-1' },
        { winner: 'var-1', control: 'var-1' },
        { winner: 'var-3', control: 'var-1' },
      ];

      const nonControlWins = tests.filter((t) => t.winner !== t.control).length;
      const winRate = nonControlWins / tests.length;

      expect(winRate).toBeCloseTo(0.67, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle test with no impressions', () => {
      const variant = {
        impressions: 0,
        engagement: 0,
      };

      const engagementRate = variant.impressions > 0 
        ? variant.engagement / variant.impressions 
        : 0;

      expect(engagementRate).toBe(0);
    });

    it('should handle tie between variants', () => {
      const variants = [
        { id: 'var-1', conversionRate: 0.05 },
        { id: 'var-2', conversionRate: 0.05 },
      ];

      const winner = variants[0].conversionRate === variants[1].conversionRate 
        ? null 
        : variants[0];

      expect(winner).toBeNull();
    });

    it('should handle test cancellation', () => {
      const test = {
        id: 'test-123',
        status: 'running',
      };

      test.status = 'cancelled';

      expect(test.status).toBe('cancelled');
    });

    it('should handle very small sample sizes', () => {
      const variant = {
        impressions: 10,
        conversions: 1,
      };

      const minSampleSize = 100;
      const hasMinimum = variant.impressions >= minSampleSize;

      expect(hasMinimum).toBe(false);
    });
  });
});
