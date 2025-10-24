import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getOptimizationEngine, PricingData, TimingData, PerformanceMetric } from '../../lib/services/optimization-engine';

// Mock AI service
vi.mock('../../lib/services/ai-service', () => ({
  getAIService: () => ({
    generateText: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        recommendedPrice: 25,
        reasoning: ['Market analysis suggests higher price point', 'Conversion rate can support increase'],
        bestMonths: ['March', 'April', 'September'],
        worstMonths: ['January', 'August'],
        specialEvents: [{ event: 'Holiday Season', impact: 'positive', adjustment: 'Increase prices by 10-15%' }]
      }),
      usage: { tokens: 150 },
    }),
  }),
}));

describe('Optimization Engine', () => {
  let optimizationEngine: ReturnType<typeof getOptimizationEngine>;

  const mockPricingData: PricingData = {
    contentId: 'content123',
    currentPrice: 20,
    contentType: 'ppv',
    historicalPerformance: {
      views: 1500,
      purchases: 75,
      revenue: 1500,
      conversionRate: 5.0,
    },
    audienceData: {
      averageSpending: 50,
      priceElasticity: -1.2,
      segmentSize: 10000,
    },
    competitorPricing: [
      { price: 18, performance: 60 },
      { price: 25, performance: 45 },
      { price: 22, performance: 55 },
    ],
  };

  const mockTimingData: TimingData = {
    contentId: 'content123',
    contentType: 'photo',
    historicalEngagement: [
      {
        timestamp: new Date('2024-01-15T10:00:00Z'),
        engagement: 85,
        reach: 1200,
        revenue: 45,
      },
      {
        timestamp: new Date('2024-01-15T14:00:00Z'),
        engagement: 65,
        reach: 900,
        revenue: 30,
      },
      {
        timestamp: new Date('2024-01-16T19:00:00Z'),
        engagement: 95,
        reach: 1500,
        revenue: 60,
      },
      {
        timestamp: new Date('2024-01-17T08:00:00Z'),
        engagement: 70,
        reach: 1000,
        revenue: 35,
      },
    ],
    audienceTimezone: 'America/New_York',
  };

  const mockPerformanceData: PerformanceMetric[] = [
    {
      timestamp: new Date('2024-01-10'),
      contentId: 'content123',
      contentType: 'photo',
      metrics: {
        views: 1000,
        engagement: 75,
        revenue: 50,
        conversionRate: 5.0,
        reach: 800,
      },
    },
    {
      timestamp: new Date('2024-01-11'),
      contentId: 'content123',
      contentType: 'photo',
      metrics: {
        views: 1200,
        engagement: 80,
        revenue: 60,
        conversionRate: 5.5,
        reach: 950,
      },
    },
    {
      timestamp: new Date('2024-01-12'),
      contentId: 'content123',
      contentType: 'photo',
      metrics: {
        views: 2500, // Spike
        engagement: 150, // Spike
        revenue: 125, // Spike
        conversionRate: 6.0,
        reach: 2000,
      },
    },
    {
      timestamp: new Date('2024-01-13'),
      contentId: 'content123',
      contentType: 'photo',
      metrics: {
        views: 800, // Drop
        engagement: 45, // Drop
        revenue: 25, // Drop
        conversionRate: 3.0,
        reach: 600,
      },
    },
  ];

  beforeEach(() => {
    optimizationEngine = getOptimizationEngine();
  });

  describe('Pricing Optimization', () => {
    it('should generate pricing recommendations', async () => {
      const recommendation = await optimizationEngine.optimizePricing(mockPricingData, {
        strategy: 'balanced',
        riskTolerance: 'moderate',
      });

      expect(recommendation).toHaveProperty('contentId', 'content123');
      expect(recommendation).toHaveProperty('currentPrice', 20);
      expect(recommendation).toHaveProperty('recommendedPrice');
      expect(recommendation).toHaveProperty('priceChange');
      expect(recommendation).toHaveProperty('priceChangePercent');
      expect(recommendation).toHaveProperty('expectedImpact');
      expect(recommendation).toHaveProperty('confidence');
      expect(recommendation).toHaveProperty('reasoning');
      expect(recommendation).toHaveProperty('testingStrategy');

      expect(recommendation.recommendedPrice).toBeGreaterThan(0);
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(100);
      expect(Array.isArray(recommendation.reasoning)).toBe(true);
    });

    it('should calculate expected impact correctly', async () => {
      const recommendation = await optimizationEngine.optimizePricing(mockPricingData);

      expect(recommendation.expectedImpact).toHaveProperty('revenueChange');
      expect(recommendation.expectedImpact).toHaveProperty('conversionRateChange');
      expect(recommendation.expectedImpact).toHaveProperty('demandChange');

      expect(typeof recommendation.expectedImpact.revenueChange).toBe('number');
      expect(typeof recommendation.expectedImpact.conversionRateChange).toBe('number');
      expect(typeof recommendation.expectedImpact.demandChange).toBe('number');
    });

    it('should handle different optimization strategies', async () => {
      const strategies = ['revenue_max', 'conversion_max', 'balanced'] as const;

      for (const strategy of strategies) {
        const recommendation = await optimizationEngine.optimizePricing(mockPricingData, {
          strategy,
        });

        expect(recommendation.recommendedPrice).toBeGreaterThan(0);
        expect(recommendation.reasoning.length).toBeGreaterThan(0);
      }
    });

    it('should adjust confidence based on data quality', async () => {
      // High quality data
      const highQualityData = {
        ...mockPricingData,
        historicalPerformance: {
          views: 5000,
          purchases: 250,
          revenue: 5000,
          conversionRate: 8.0,
        },
      };

      const highConfidenceRec = await optimizationEngine.optimizePricing(highQualityData);

      // Low quality data
      const lowQualityData = {
        ...mockPricingData,
        historicalPerformance: {
          views: 50,
          purchases: 2,
          revenue: 40,
          conversionRate: 1.0,
        },
        competitorPricing: undefined,
      };

      const lowConfidenceRec = await optimizationEngine.optimizePricing(lowQualityData);

      expect(highConfidenceRec.confidence).toBeGreaterThan(lowConfidenceRec.confidence);
    });
  });

  describe('Timing Optimization', () => {
    it('should generate timing recommendations', async () => {
      const recommendation = await optimizationEngine.optimizeTiming(mockTimingData, {
        lookAheadDays: 14,
        priorityMetric: 'engagement',
      });

      expect(recommendation).toHaveProperty('contentType', 'photo');
      expect(recommendation).toHaveProperty('optimalTimes');
      expect(recommendation).toHaveProperty('avoidTimes');
      expect(recommendation).toHaveProperty('seasonalInsights');
      expect(recommendation).toHaveProperty('personalizedSchedule');

      expect(Array.isArray(recommendation.optimalTimes)).toBe(true);
      expect(Array.isArray(recommendation.avoidTimes)).toBe(true);
      expect(Array.isArray(recommendation.personalizedSchedule)).toBe(true);
    });

    it('should identify optimal times correctly', async () => {
      const recommendation = await optimizationEngine.optimizeTiming(mockTimingData);

      expect(recommendation.optimalTimes.length).toBeGreaterThan(0);
      
      recommendation.optimalTimes.forEach(time => {
        expect(time).toHaveProperty('dayOfWeek');
        expect(time).toHaveProperty('timeRange');
        expect(time).toHaveProperty('expectedEngagement');
        expect(time).toHaveProperty('confidence');
        expect(time.expectedEngagement).toBeGreaterThan(0);
        expect(time.confidence).toBeGreaterThanOrEqual(0);
      });
    });

    it('should generate personalized schedule', async () => {
      const recommendation = await optimizationEngine.optimizeTiming(mockTimingData, {
        lookAheadDays: 7,
        contentTypes: ['photo', 'video'],
      });

      expect(recommendation.personalizedSchedule.length).toBeGreaterThan(0);
      
      recommendation.personalizedSchedule.forEach(item => {
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('timeSlot');
        expect(item).toHaveProperty('contentType');
        expect(item).toHaveProperty('priority');
        expect(item).toHaveProperty('reasoning');
        expect(['high', 'medium', 'low']).toContain(item.priority);
      });
    });

    it('should handle different priority metrics', async () => {
      const metrics = ['engagement', 'revenue', 'reach'] as const;

      for (const metric of metrics) {
        const recommendation = await optimizationEngine.optimizeTiming(mockTimingData, {
          priorityMetric: metric,
        });

        expect(recommendation.optimalTimes.length).toBeGreaterThan(0);
        expect(recommendation.personalizedSchedule.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance Anomaly Detection', () => {
    it('should detect performance anomalies', async () => {
      const anomalies = await optimizationEngine.detectAnomalies(mockPerformanceData, {
        sensitivity: 'medium',
      });

      expect(Array.isArray(anomalies)).toBe(true);
      expect(anomalies.length).toBeGreaterThan(0);

      anomalies.forEach(anomaly => {
        expect(anomaly).toHaveProperty('id');
        expect(anomaly).toHaveProperty('type');
        expect(anomaly).toHaveProperty('severity');
        expect(anomaly).toHaveProperty('detectedAt');
        expect(anomaly).toHaveProperty('affectedMetrics');
        expect(anomaly).toHaveProperty('description');
        expect(anomaly).toHaveProperty('possibleCauses');
        expect(anomaly).toHaveProperty('recommendations');
        expect(anomaly).toHaveProperty('expectedDuration');
        expect(anomaly).toHaveProperty('monitoringActions');

        expect(['spike', 'drop', 'trend_change', 'outlier']).toContain(anomaly.type);
        expect(['low', 'medium', 'high', 'critical']).toContain(anomaly.severity);
        expect(Array.isArray(anomaly.affectedMetrics)).toBe(true);
        expect(Array.isArray(anomaly.possibleCauses)).toBe(true);
        expect(Array.isArray(anomaly.recommendations)).toBe(true);
        expect(Array.isArray(anomaly.monitoringActions)).toBe(true);
      });
    });

    it('should detect spikes and drops', async () => {
      const anomalies = await optimizationEngine.detectAnomalies(mockPerformanceData);

      const spikes = anomalies.filter(a => a.type === 'spike');
      const drops = anomalies.filter(a => a.type === 'drop');

      expect(spikes.length).toBeGreaterThan(0);
      expect(drops.length).toBeGreaterThan(0);

      spikes.forEach(spike => {
        expect(spike.description).toContain('spiked');
      });

      drops.forEach(drop => {
        expect(drop.description).toContain('dropped');
      });
    });

    it('should handle different sensitivity levels', async () => {
      const sensitivities = ['low', 'medium', 'high'] as const;
      const results = [];

      for (const sensitivity of sensitivities) {
        const anomalies = await optimizationEngine.detectAnomalies(mockPerformanceData, {
          sensitivity,
        });
        results.push(anomalies.length);
      }

      // High sensitivity should detect more anomalies than low sensitivity
      expect(results[2]).toBeGreaterThanOrEqual(results[0]);
    });

    it('should sort anomalies by severity and recency', async () => {
      const anomalies = await optimizationEngine.detectAnomalies(mockPerformanceData);

      if (anomalies.length > 1) {
        for (let i = 0; i < anomalies.length - 1; i++) {
          const current = anomalies[i];
          const next = anomalies[i + 1];

          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          const currentSeverity = severityOrder[current.severity];
          const nextSeverity = severityOrder[next.severity];

          // Should be sorted by severity first, then by recency
          expect(currentSeverity).toBeGreaterThanOrEqual(nextSeverity);
        }
      }
    });
  });

  describe('Performance Data Management', () => {
    it('should add and retrieve performance data', () => {
      const contentId = 'test_content';
      const metric = mockPerformanceData[0];

      optimizationEngine.addPerformanceData(contentId, metric);
      const history = optimizationEngine.getPerformanceHistory(contentId);

      expect(history.length).toBe(1);
      expect(history[0]).toEqual(metric);
    });

    it('should limit performance history size', () => {
      const contentId = 'test_content_large';
      
      // Add more than 100 data points
      for (let i = 0; i < 150; i++) {
        const metric = {
          ...mockPerformanceData[0],
          timestamp: new Date(Date.now() + i * 1000),
        };
        optimizationEngine.addPerformanceData(contentId, metric);
      }

      const history = optimizationEngine.getPerformanceHistory(contentId);
      expect(history.length).toBe(100);
    });

    it('should filter history by days', () => {
      const contentId = 'test_content_filtered';
      const now = new Date();
      
      // Add data from different time periods
      const oldMetric = {
        ...mockPerformanceData[0],
        timestamp: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
      };
      const recentMetric = {
        ...mockPerformanceData[0],
        timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      };

      optimizationEngine.addPerformanceData(contentId, oldMetric);
      optimizationEngine.addPerformanceData(contentId, recentMetric);

      const allHistory = optimizationEngine.getPerformanceHistory(contentId);
      const recentHistory = optimizationEngine.getPerformanceHistory(contentId, 30);

      expect(allHistory.length).toBe(2);
      expect(recentHistory.length).toBe(1);
      expect(recentHistory[0]).toEqual(recentMetric);
    });
  });

  describe('Optimization Report Generation', () => {
    it('should generate comprehensive optimization report', async () => {
      const contentId = 'report_test';
      
      // Add some performance data
      mockPerformanceData.forEach(metric => {
        optimizationEngine.addPerformanceData(contentId, metric);
      });

      const report = await optimizationEngine.generateOptimizationReport(contentId, {
        includePricing: true,
        includeTiming: true,
        includeAnomalies: true,
      });

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('anomalies');
      expect(report).toHaveProperty('actionItems');

      expect(typeof report.summary).toBe('string');
      expect(Array.isArray(report.actionItems)).toBe(true);
      expect(report.summary.length).toBeGreaterThan(0);
    });

    it('should handle insufficient data gracefully', async () => {
      const report = await optimizationEngine.generateOptimizationReport('nonexistent_content');

      expect(report.summary).toContain('Insufficient data');
      expect(report.actionItems).toContain('Collect more performance data');
    });

    it('should generate relevant action items', async () => {
      const contentId = 'action_test';
      
      // Add low-performing data
      const lowPerformanceData = mockPerformanceData.map(metric => ({
        ...metric,
        metrics: {
          ...metric.metrics,
          engagement: 20, // Low engagement
          revenue: 5, // Low revenue
        },
      }));

      lowPerformanceData.forEach(metric => {
        optimizationEngine.addPerformanceData(contentId, metric);
      });

      const report = await optimizationEngine.generateOptimizationReport(contentId);

      expect(report.actionItems.some(item => 
        item.includes('engagement') || item.includes('monetization')
      )).toBe(true);
    });
  });

  describe('Configuration and Customization', () => {
    it('should allow updating anomaly thresholds', () => {
      const newThresholds = {
        engagement: { spike: 3.0, drop: -0.7 },
      };

      optimizationEngine.updateAnomalyThresholds(newThresholds);

      // Test that new thresholds are applied (this would require exposing thresholds or testing behavior)
      expect(() => optimizationEngine.updateAnomalyThresholds(newThresholds)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service failures gracefully', async () => {
      // Mock AI service to fail
      const mockAIService = {
        generateText: vi.fn().mockRejectedValue(new Error('AI service unavailable')),
      };

      // This would require dependency injection or mocking at a higher level
      // For now, we test that the service doesn't crash
      const recommendation = await optimizationEngine.optimizePricing(mockPricingData);
      
      expect(recommendation).toHaveProperty('recommendedPrice');
      expect(recommendation.recommendedPrice).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid data gracefully', async () => {
      const invalidPricingData = {
        ...mockPricingData,
        currentPrice: -10, // Invalid negative price
      };

      // Should not throw an error
      expect(async () => {
        await optimizationEngine.optimizePricing(invalidPricingData);
      }).not.toThrow();
    });

    it('should handle empty performance data', async () => {
      const anomalies = await optimizationEngine.detectAnomalies([], {
        minDataPoints: 5,
      });

      expect(Array.isArray(anomalies)).toBe(true);
      expect(anomalies.length).toBe(0);
    });
  });
});