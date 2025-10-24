import { getAIService } from './ai-service';
import { z } from 'zod';
import {
  APIError,
  AIServiceError,
  ValidationError,
  NetworkError,
  RateLimitError,
  isRetryableError,
  getRetryDelay,
  enhanceErrorWithContext,
  formatErrorForLogging,
  shouldLogError,
} from '@/lib/types/api-errors';
import { CircuitBreakerFactory, withCircuitBreaker } from './circuit-breaker';
import { getRequestCoalescer, withCoalescing } from './request-coalescer';
import { gracefulDegradation, DegradationConfigs } from './graceful-degradation';


// Pricing optimization schemas
export const PricingDataSchema = z.object({
  contentId: z.string(),
  currentPrice: z.number().min(0),
  contentType: z.enum(['photo', 'video', 'story', 'ppv', 'live']),
  historicalPerformance: z.object({
    views: z.number().min(0),
    purchases: z.number().min(0),
    revenue: z.number().min(0),
    conversionRate: z.number().min(0).max(100),
  }),
  competitorPricing: z.array(z.object({
    price: z.number().min(0),
    performance: z.number().min(0).max(100),
  })).optional(),
  audienceData: z.object({
    averageSpending: z.number().min(0),
    priceElasticity: z.number().min(-10).max(10),
    segmentSize: z.number().min(0),
  }),
});

export type PricingData = z.infer<typeof PricingDataSchema>;

// Timing analysis schemas
export const TimingDataSchema = z.object({
  contentId: z.string(),
  contentType: z.enum(['photo', 'video', 'story', 'ppv', 'live', 'message']),
  historicalEngagement: z.array(z.object({
    timestamp: z.date(),
    engagement: z.number().min(0),
    reach: z.number().min(0),
    revenue: z.number().min(0).optional(),
  })),
  audienceTimezone: z.string().default('UTC'),
  seasonalFactors: z.object({
    dayOfWeek: z.record(z.string(), z.number()),
    timeOfDay: z.record(z.string(), z.number()),
    monthlyTrends: z.record(z.string(), z.number()),
  }).optional(),
});

export type TimingData = z.infer<typeof TimingDataSchema>;

// Performance anomaly schemas
export const PerformanceMetricSchema = z.object({
  timestamp: z.date(),
  contentId: z.string(),
  contentType: z.string(),
  metrics: z.object({
    views: z.number().min(0),
    engagement: z.number().min(0),
    revenue: z.number().min(0),
    conversionRate: z.number().min(0).max(100),
    reach: z.number().min(0),
  }),
  context: z.object({
    price: z.number().min(0).optional(),
    publishTime: z.date().optional(),
    promotionActive: z.boolean().default(false),
    seasonalEvent: z.string().optional(),
  }).optional(),
});

export type PerformanceMetric = z.infer<typeof PerformanceMetricSchema>;

// Optimization recommendation types
export interface PricingRecommendation {
  contentId: string;
  currentPrice: number;
  recommendedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  expectedImpact: {
    revenueChange: number;
    conversionRateChange: number;
    demandChange: number;
  };
  confidence: number;
  reasoning: string[];
  testingStrategy: {
    duration: string;
    metrics: string[];
    successCriteria: string[];
  };
}

export interface TimingRecommendation {
  contentType: string;
  optimalTimes: Array<{
    dayOfWeek: string;
    timeRange: string;
    expectedEngagement: number;
    confidence: number;
  }>;
  avoidTimes: Array<{
    dayOfWeek: string;
    timeRange: string;
    reason: string;
  }>;
  seasonalInsights: {
    bestMonths: string[];
    worstMonths: string[];
    specialEvents: Array<{
      event: string;
      impact: 'positive' | 'negative';
      adjustment: string;
    }>;
  };
  personalizedSchedule: Array<{
    date: Date;
    timeSlot: string;
    contentType: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
  }>;
}

export interface PerformanceAnomaly {
  id: string;
  type: 'spike' | 'drop' | 'trend_change' | 'outlier';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  affectedMetrics: string[];
  description: string;
  possibleCauses: string[];
  recommendations: string[];
  expectedDuration: string;
  monitoringActions: string[];
}

// Retry configuration interface
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache entries
}

// API response types
interface AIServiceResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
}

// Main optimization engine
export class OptimizationEngine {
  private aiService = getAIService();
  private performanceHistory: Map<string, PerformanceMetric[]> = new Map();
  private anomalyThresholds = {
    engagement: { spike: 2.5, drop: -0.5 },
    revenue: { spike: 3.0, drop: -0.3 },
    reach: { spike: 2.0, drop: -0.4 },
    conversionRate: { spike: 2.0, drop: -0.6 },
  };

  // Configuration
  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  };

  private cacheConfig: CacheConfig = {
    ttl: 3600000, // 1 hour
    maxSize: 100,
  };

  // Caching
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  // Rate limiting
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly RATE_LIMIT_WINDOW = 3600000; // 1 hour
  private readonly RATE_LIMIT_MAX_REQUESTS = 100;

  // Advanced services
  private circuitBreaker = CircuitBreakerFactory.getCircuitBreaker('optimization-engine', 'ai_service');
  private requestCoalescer = getRequestCoalescer();

  // Pricing optimization
  async optimizePricing(
    pricingData: PricingData,
    options: {
      strategy?: 'revenue_max' | 'conversion_max' | 'balanced';
      riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
      testDuration?: number; // days
    } = {}
  ): Promise<PricingRecommendation> {
    const {
      strategy = 'balanced',
      riskTolerance = 'moderate',
      testDuration = 7,
    } = options;

    // Analyze current performance
    const currentPerformance = this.analyzePricingPerformance(pricingData);
    
    // Generate price recommendations using AI
    const aiRecommendation = await this.generatePricingRecommendation(
      pricingData,
      currentPerformance,
      strategy
    );

    // Calculate expected impact
    const expectedImpact = this.calculatePricingImpact(
      pricingData,
      aiRecommendation.recommendedPrice,
      strategy
    );

    // Determine confidence based on data quality and market conditions
    const confidence = this.calculatePricingConfidence(pricingData, currentPerformance);

    // Generate testing strategy
    const testingStrategy = this.createPricingTestStrategy(
      pricingData,
      aiRecommendation.recommendedPrice,
      testDuration,
      riskTolerance
    );

    return {
      contentId: pricingData.contentId,
      currentPrice: pricingData.currentPrice,
      recommendedPrice: aiRecommendation.recommendedPrice,
      priceChange: aiRecommendation.recommendedPrice - pricingData.currentPrice,
      priceChangePercent: ((aiRecommendation.recommendedPrice - pricingData.currentPrice) / pricingData.currentPrice) * 100,
      expectedImpact,
      confidence,
      reasoning: aiRecommendation.reasoning,
      testingStrategy,
    };
  }

  private async generatePricingRecommendation(
    pricingData: PricingData,
    currentPerformance: any,
    strategy: string
  ): Promise<{ recommendedPrice: number; reasoning: string[] }> {
    const prompt = `Analyze pricing optimization for content.

Current Data:
- Content Type: ${pricingData.contentType}
- Current Price: $${pricingData.currentPrice}
- Conversion Rate: ${pricingData.historicalPerformance.conversionRate}%
- Revenue: $${pricingData.historicalPerformance.revenue}
- Views: ${pricingData.historicalPerformance.views}
- Purchases: ${pricingData.historicalPerformance.purchases}

Audience Data:
- Average Spending: $${pricingData.audienceData.averageSpending}
- Price Elasticity: ${pricingData.audienceData.priceElasticity}
- Segment Size: ${pricingData.audienceData.segmentSize}

Strategy: ${strategy}
- revenue_max: Maximize total revenue
- conversion_max: Maximize conversion rate
- balanced: Balance revenue and conversion

Competitor Pricing: ${pricingData.competitorPricing?.map(c => `$${c.price} (${c.performance}% performance)`).join(', ') || 'Not available'}

Provide:
1. Recommended price (number only)
2. Key reasoning points (3-5 bullet points)

Format as JSON: {"recommendedPrice": number, "reasoning": ["point1", "point2", ...]}`;

    try {
      const response = await this.aiService.generateText({
        prompt,
        context: {
          userId: 'pricing_optimization',
          contentType: 'pricing',
          metadata: { strategy, contentType: pricingData.contentType },
        },
        options: {
          temperature: 0.3,
          maxTokens: 500,
        },
      });

      const result = JSON.parse(response.content);
      return {
        recommendedPrice: Math.max(0, result.recommendedPrice || pricingData.currentPrice),
        reasoning: Array.isArray(result.reasoning) ? result.reasoning : ['AI analysis completed'],
      };
    } catch (error) {
      console.error('Failed to generate pricing recommendation:', error);
      return {
        recommendedPrice: pricingData.currentPrice,
        reasoning: ['Unable to generate AI recommendation - maintaining current price'],
      };
    }
  }

  private analyzePricingPerformance(pricingData: PricingData) {
    const { historicalPerformance, audienceData } = pricingData;
    
    return {
      revenuePerView: historicalPerformance.views > 0 ? historicalPerformance.revenue / historicalPerformance.views : 0,
      priceToSpendingRatio: pricingData.currentPrice / audienceData.averageSpending,
      conversionEfficiency: historicalPerformance.conversionRate / 100,
      marketPosition: this.calculateMarketPosition(pricingData),
    };
  }

  private calculateMarketPosition(pricingData: PricingData): 'low' | 'medium' | 'high' {
    if (!pricingData.competitorPricing || pricingData.competitorPricing.length === 0) {
      return 'medium';
    }

    const avgCompetitorPrice = pricingData.competitorPricing.reduce((sum, c) => sum + c.price, 0) / pricingData.competitorPricing.length;
    const ratio = pricingData.currentPrice / avgCompetitorPrice;

    if (ratio < 0.8) return 'low';
    if (ratio > 1.2) return 'high';
    return 'medium';
  }

  private calculatePricingImpact(pricingData: PricingData, newPrice: number, strategy: string) {
    const priceChange = (newPrice - pricingData.currentPrice) / pricingData.currentPrice;
    const elasticity = pricingData.audienceData.priceElasticity;

    // Simplified elasticity model
    const demandChange = -elasticity * priceChange * 100;
    const conversionRateChange = Math.max(-50, Math.min(50, demandChange * 0.8));
    const revenueChange = ((1 + priceChange) * (1 + demandChange / 100) - 1) * 100;

    return {
      revenueChange: Math.round(revenueChange * 10) / 10,
      conversionRateChange: Math.round(conversionRateChange * 10) / 10,
      demandChange: Math.round(demandChange * 10) / 10,
    };
  }

  private calculatePricingConfidence(pricingData: PricingData, performance: any): number {
    let confidence = 50; // Base confidence

    // Data quality factors
    if (pricingData.historicalPerformance.views > 1000) confidence += 15;
    if (pricingData.historicalPerformance.purchases > 50) confidence += 15;
    if (pricingData.competitorPricing && pricingData.competitorPricing.length > 0) confidence += 10;
    
    // Performance stability
    if (pricingData.historicalPerformance.conversionRate > 5) confidence += 10;
    if (Math.abs(pricingData.audienceData.priceElasticity) < 2) confidence += 10;

    return Math.min(95, Math.max(20, confidence));
  }

  private createPricingTestStrategy(
    pricingData: PricingData,
    newPrice: number,
    duration: number,
    riskTolerance: string
  ) {
    const priceChange = Math.abs((newPrice - pricingData.currentPrice) / pricingData.currentPrice);
    
    let testDuration = duration;
    if (riskTolerance === 'conservative' && priceChange > 0.2) {
      testDuration = Math.max(duration, 14);
    }

    return {
      duration: `${testDuration} days`,
      metrics: [
        'Conversion rate',
        'Total revenue',
        'Customer acquisition',
        'Churn rate',
        'Customer feedback',
      ],
      successCriteria: [
        `Maintain conversion rate above ${Math.max(1, pricingData.historicalPerformance.conversionRate * 0.8)}%`,
        `Achieve revenue increase of at least ${Math.max(5, priceChange * 50)}%`,
        'No significant increase in customer complaints',
        'Stable or improved customer lifetime value',
      ],
    };
  }

  // Timing optimization
  async optimizeTiming(
    timingData: TimingData,
    options: {
      lookAheadDays?: number;
      contentTypes?: string[];
      priorityMetric?: 'engagement' | 'revenue' | 'reach';
    } = {}
  ): Promise<TimingRecommendation> {
    const {
      lookAheadDays = 30,
      contentTypes = [timingData.contentType],
      priorityMetric = 'engagement',
    } = options;

    // Analyze historical patterns
    const patterns = this.analyzeTimingPatterns(timingData, priorityMetric);
    
    // Generate AI-powered timing insights
    const aiInsights = await this.generateTimingInsights(timingData, patterns);
    
    // Create personalized schedule
    const personalizedSchedule = this.generatePersonalizedSchedule(
      timingData,
      patterns,
      lookAheadDays,
      contentTypes
    );

    return {
      contentType: timingData.contentType,
      optimalTimes: patterns.optimalTimes,
      avoidTimes: patterns.avoidTimes,
      seasonalInsights: aiInsights.seasonalInsights,
      personalizedSchedule,
    };
  }

  private analyzeTimingPatterns(timingData: TimingData, priorityMetric: string) {
    const { historicalEngagement } = timingData;
    
    // Group by day of week and hour
    const dayHourPerformance = new Map<string, { total: number; count: number }>();
    
    historicalEngagement.forEach(entry => {
      const date = new Date(entry.timestamp);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      const key = `${dayOfWeek}-${hour}`;
      
      const metric = priorityMetric === 'engagement' ? entry.engagement :
                    priorityMetric === 'revenue' ? (entry.revenue || 0) :
                    entry.reach;
      
      const existing = dayHourPerformance.get(key) || { total: 0, count: 0 };
      dayHourPerformance.set(key, {
        total: existing.total + metric,
        count: existing.count + 1,
      });
    });

    // Calculate averages and find optimal times
    const averages = Array.from(dayHourPerformance.entries()).map(([key, data]) => ({
      key,
      average: data.total / data.count,
      confidence: Math.min(100, data.count * 10), // More data = higher confidence
    }));

    averages.sort((a, b) => b.average - a.average);

    const optimalTimes = averages.slice(0, 10).map(item => {
      const [dayOfWeek, hour] = item.key.split('-');
      const hourNum = parseInt(hour);
      return {
        dayOfWeek,
        timeRange: `${hourNum}:00-${hourNum + 1}:00`,
        expectedEngagement: Math.round(item.average),
        confidence: Math.round(item.confidence),
      };
    });

    const avoidTimes = averages.slice(-5).map(item => {
      const [dayOfWeek, hour] = item.key.split('-');
      const hourNum = parseInt(hour);
      return {
        dayOfWeek,
        timeRange: `${hourNum}:00-${hourNum + 1}:00`,
        reason: `Low ${priorityMetric} performance (${Math.round(item.average)})`,
      };
    });

    return { optimalTimes, avoidTimes };
  }

  private async generateTimingInsights(timingData: TimingData, patterns: any) {
    const prompt = `Analyze content timing patterns and provide seasonal insights.

Content Type: ${timingData.contentType}
Audience Timezone: ${timingData.audienceTimezone}

Historical Performance Patterns:
Top performing times: ${patterns.optimalTimes.slice(0, 3).map((t: any) => `${t.dayOfWeek} ${t.timeRange}`).join(', ')}
Worst performing times: ${patterns.avoidTimes.slice(0, 2).map((t: any) => `${t.dayOfWeek} ${t.timeRange}`).join(', ')}

Provide seasonal insights including:
1. Best months for this content type
2. Worst months to avoid
3. Special events that impact performance
4. General timing recommendations

Format as JSON: {
  "bestMonths": ["month1", "month2", ...],
  "worstMonths": ["month1", "month2", ...],
  "specialEvents": [{"event": "name", "impact": "positive/negative", "adjustment": "recommendation"}]
}`;

    try {
      const response = await this.aiService.generateText({
        prompt,
        context: {
          userId: 'timing_optimization',
          contentType: 'timing',
          metadata: { contentType: timingData.contentType },
        },
        options: {
          temperature: 0.4,
          maxTokens: 400,
        },
      });

      const result = JSON.parse(response.content);
      return {
        seasonalInsights: {
          bestMonths: result.bestMonths || [],
          worstMonths: result.worstMonths || [],
          specialEvents: result.specialEvents || [],
        },
      };
    } catch (error) {
      console.error('Failed to generate timing insights:', error);
      return {
        seasonalInsights: {
          bestMonths: ['March', 'April', 'September', 'October'],
          worstMonths: ['January', 'August'],
          specialEvents: [],
        },
      };
    }
  }

  private generatePersonalizedSchedule(
    timingData: TimingData,
    patterns: any,
    lookAheadDays: number,
    contentTypes: string[]
  ) {
    const schedule: Array<{
      date: Date;
      timeSlot: string;
      contentType: string;
      priority: 'high' | 'medium' | 'low';
      reasoning: string;
    }> = [];
    const startDate = new Date();
    
    for (let i = 0; i < lookAheadDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Find optimal time for this day
      const dayOptimalTimes = patterns.optimalTimes.filter((t: any) => t.dayOfWeek === dayOfWeek);
      
      if (dayOptimalTimes.length > 0) {
        const bestTime = dayOptimalTimes[0];
        
        contentTypes.forEach(contentType => {
          schedule.push({
            date,
            timeSlot: bestTime.timeRange,
            contentType,
            priority: bestTime.confidence > 70 ? 'high' : bestTime.confidence > 40 ? 'medium' : 'low',
            reasoning: `Optimal time based on ${bestTime.confidence}% confidence from historical data`,
          });
        });
      }
    }

    return schedule.slice(0, 20); // Limit to top 20 recommendations
  }

  // Performance anomaly detection
  async detectAnomalies(
    performanceData: PerformanceMetric[],
    options: {
      sensitivity?: 'low' | 'medium' | 'high';
      lookbackDays?: number;
      minDataPoints?: number;
    } = {}
  ): Promise<PerformanceAnomaly[]> {
    const {
      sensitivity = 'medium',
      lookbackDays = 30,
      minDataPoints = 10,
    } = options;

    if (performanceData.length < minDataPoints) {
      return [];
    }

    // Store performance data
    const contentId = performanceData[0]?.contentId || 'unknown';
    this.performanceHistory.set(contentId, performanceData);

    // Detect different types of anomalies
    const anomalies: PerformanceAnomaly[] = [];

    // 1. Statistical outliers
    anomalies.push(...this.detectStatisticalOutliers(performanceData, sensitivity));

    // 2. Trend changes
    anomalies.push(...this.detectTrendChanges(performanceData, sensitivity));

    // 3. Performance spikes/drops
    anomalies.push(...this.detectPerformanceSpikes(performanceData, sensitivity));

    // 4. AI-powered anomaly detection
    const aiAnomalies = await this.detectAIAnomalies(performanceData, sensitivity);
    anomalies.push(...aiAnomalies);

    // Sort by severity and recency
    return anomalies
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.detectedAt.getTime() - a.detectedAt.getTime();
      })
      .slice(0, 10); // Limit to top 10 anomalies
  }

  private detectStatisticalOutliers(data: PerformanceMetric[], sensitivity: string): PerformanceAnomaly[] {
    const anomalies: PerformanceAnomaly[] = [];
    const metrics = ['views', 'engagement', 'revenue', 'conversionRate', 'reach'];
    
    const sensitivityMultiplier = sensitivity === 'high' ? 1.5 : sensitivity === 'low' ? 3.0 : 2.0;

    metrics.forEach(metric => {
      const values = data.map(d => d.metrics[metric as keyof typeof d.metrics]);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
      
      data.forEach((point, index) => {
        const value = point.metrics[metric as keyof typeof point.metrics];
        const zScore = Math.abs((value - mean) / stdDev);
        
        if (zScore > sensitivityMultiplier) {
          anomalies.push({
            id: `outlier_${metric}_${point.timestamp.getTime()}`,
            type: 'outlier',
            severity: zScore > sensitivityMultiplier * 1.5 ? 'high' : 'medium',
            detectedAt: new Date(),
            affectedMetrics: [metric],
            description: `${metric} value (${value}) is ${zScore.toFixed(1)} standard deviations from normal`,
            possibleCauses: [
              'Data collection error',
              'Unusual external event',
              'Algorithm change',
              'Promotional activity',
            ],
            recommendations: [
              'Verify data accuracy',
              'Check for external factors',
              'Monitor for pattern continuation',
            ],
            expectedDuration: 'Unknown - requires investigation',
            monitoringActions: [
              `Track ${metric} closely for next 24-48 hours`,
              'Compare with other similar content',
              'Check system logs for anomalies',
            ],
          });
        }
      });
    });

    return anomalies;
  }

  private detectTrendChanges(data: PerformanceMetric[], sensitivity: string): PerformanceAnomaly[] {
    const anomalies: PerformanceAnomaly[] = [];
    
    if (data.length < 10) return anomalies;

    const metrics = ['views', 'engagement', 'revenue'];
    const windowSize = Math.min(7, Math.floor(data.length / 3));
    
    metrics.forEach(metric => {
      const values = data.map(d => d.metrics[metric as keyof typeof d.metrics]);
      
      // Calculate moving averages
      const recentAvg = values.slice(-windowSize).reduce((sum, val) => sum + val, 0) / windowSize;
      const previousAvg = values.slice(-windowSize * 2, -windowSize).reduce((sum, val) => sum + val, 0) / windowSize;
      
      if (previousAvg > 0) {
        const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
        const threshold = sensitivity === 'high' ? 15 : sensitivity === 'low' ? 40 : 25;
        
        if (Math.abs(changePercent) > threshold) {
          anomalies.push({
            id: `trend_${metric}_${Date.now()}`,
            type: 'trend_change',
            severity: Math.abs(changePercent) > threshold * 1.5 ? 'high' : 'medium',
            detectedAt: new Date(),
            affectedMetrics: [metric],
            description: `${metric} trend changed by ${changePercent.toFixed(1)}% over recent period`,
            possibleCauses: [
              'Market conditions change',
              'Seasonal effects',
              'Content strategy shift',
              'Algorithm updates',
            ],
            recommendations: [
              'Analyze recent content changes',
              'Review market conditions',
              'Adjust content strategy if needed',
            ],
            expectedDuration: '1-2 weeks to stabilize',
            monitoringActions: [
              'Daily trend monitoring',
              'Compare with industry benchmarks',
              'A/B test content variations',
            ],
          });
        }
      }
    });

    return anomalies;
  }

  private detectPerformanceSpikes(data: PerformanceMetric[], sensitivity: string): PerformanceAnomaly[] {
    const anomalies: PerformanceAnomaly[] = [];
    
    if (data.length < 5) return anomalies;

    const recent = data.slice(-3);
    const baseline = data.slice(0, -3);
    
    if (baseline.length === 0) return anomalies;

    const metrics = ['views', 'engagement', 'revenue'];
    
    metrics.forEach(metric => {
      const recentAvg = recent.reduce((sum, d) => sum + d.metrics[metric as keyof typeof d.metrics], 0) / recent.length;
      const baselineAvg = baseline.reduce((sum, d) => sum + d.metrics[metric as keyof typeof d.metrics], 0) / baseline.length;
      
      if (baselineAvg > 0) {
        const changeRatio = recentAvg / baselineAvg;
        const thresholds = this.anomalyThresholds[metric as keyof typeof this.anomalyThresholds];
        
        if (changeRatio > (1 + thresholds.spike)) {
          anomalies.push({
            id: `spike_${metric}_${Date.now()}`,
            type: 'spike',
            severity: changeRatio > (1 + thresholds.spike * 1.5) ? 'high' : 'medium',
            detectedAt: new Date(),
            affectedMetrics: [metric],
            description: `${metric} spiked ${((changeRatio - 1) * 100).toFixed(1)}% above baseline`,
            possibleCauses: [
              'Viral content',
              'Promotional boost',
              'External mention',
              'Algorithm favor',
            ],
            recommendations: [
              'Capitalize on momentum',
              'Create similar content',
              'Engage with new audience',
            ],
            expectedDuration: '2-7 days typical for spikes',
            monitoringActions: [
              'Track engagement quality',
              'Monitor conversion rates',
              'Prepare follow-up content',
            ],
          });
        } else if (changeRatio < (1 + thresholds.drop)) {
          anomalies.push({
            id: `drop_${metric}_${Date.now()}`,
            type: 'drop',
            severity: changeRatio < (1 + thresholds.drop * 1.5) ? 'high' : 'medium',
            detectedAt: new Date(),
            affectedMetrics: [metric],
            description: `${metric} dropped ${(Math.abs(changeRatio - 1) * 100).toFixed(1)}% below baseline`,
            possibleCauses: [
              'Algorithm change',
              'Increased competition',
              'Content fatigue',
              'Seasonal decline',
            ],
            recommendations: [
              'Review content strategy',
              'Analyze competitor activity',
              'Test new content formats',
            ],
            expectedDuration: '1-2 weeks to recover',
            monitoringActions: [
              'Daily performance tracking',
              'Content strategy adjustment',
              'Audience feedback collection',
            ],
          });
        }
      }
    });

    return anomalies;
  }

  private async detectAIAnomalies(data: PerformanceMetric[], sensitivity: string): Promise<PerformanceAnomaly[]> {
    const prompt = `Analyze performance data for anomalies and unusual patterns.

Data Summary:
- Total data points: ${data.length}
- Date range: ${data[0]?.timestamp.toDateString()} to ${data[data.length - 1]?.timestamp.toDateString()}
- Content types: ${[...new Set(data.map(d => d.contentType))].join(', ')}

Recent Performance:
${data.slice(-5).map(d => 
  `${d.timestamp.toDateString()}: Views: ${d.metrics.views}, Engagement: ${d.metrics.engagement}, Revenue: $${d.metrics.revenue}`
).join('\n')}

Sensitivity: ${sensitivity}

Identify any unusual patterns, correlations, or anomalies that statistical methods might miss. Look for:
1. Unusual timing patterns
2. Content type performance shifts
3. Revenue vs engagement disconnects
4. Seasonal anomalies

Format as JSON array: [{"type": "anomaly_type", "description": "description", "severity": "low/medium/high", "recommendations": ["rec1", "rec2"]}]`;

    try {
      const response = await this.aiService.generateText({
        prompt,
        context: {
          userId: 'anomaly_detection',
          contentType: 'idea',
          metadata: { sensitivity, dataPoints: data.length },
        },
        options: {
          temperature: 0.2,
          maxTokens: 600,
        },
      });

      const aiResults = JSON.parse(response.content);
      
      return aiResults.map((result: any, index: number) => ({
        id: `ai_anomaly_${Date.now()}_${index}`,
        type: 'outlier' as const,
        severity: result.severity || 'medium',
        detectedAt: new Date(),
        affectedMetrics: ['multiple'],
        description: result.description || 'AI detected anomaly',
        possibleCauses: ['AI pattern recognition'],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
        expectedDuration: 'Varies by pattern type',
        monitoringActions: [
          'Validate AI findings with data',
          'Monitor suggested metrics',
          'Implement recommended actions',
        ],
      }));
    } catch (error) {
      console.error('Failed to detect AI anomalies:', error);
      return [];
    }
  }

  // Utility methods
  addPerformanceData(contentId: string, metric: PerformanceMetric): void {
    const existing = this.performanceHistory.get(contentId) || [];
    existing.push(metric);
    
    // Keep only last 100 data points per content
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }
    
    this.performanceHistory.set(contentId, existing);
  }

  getPerformanceHistory(contentId: string, days?: number): PerformanceMetric[] {
    const history = this.performanceHistory.get(contentId) || [];
    
    if (!days) return history;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return history.filter(metric => metric.timestamp >= cutoffDate);
  }

  updateAnomalyThresholds(thresholds: Partial<typeof this.anomalyThresholds>): void {
    this.anomalyThresholds = { ...this.anomalyThresholds, ...thresholds };
  }

  // API Integration Utilities

  /**
   * Execute operation with retry logic and error handling
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: APIError;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        this.logDebug(`Executing ${operationName}`, { 
          attempt, 
          maxAttempts: this.retryConfig.maxAttempts 
        });
        
        return await operation();
      } catch (error) {
        // Enhance error with context
        lastError = enhanceErrorWithContext(error as Error, {
          operation: operationName,
          attempt,
          maxAttempts: this.retryConfig.maxAttempts,
          timestamp: new Date().toISOString(),
        });
        
        // Check if error is retryable
        if (!isRetryableError(lastError)) {
          this.logError(`Non-retryable error in ${operationName}`, lastError, { attempt });
          throw lastError;
        }
        
        if (attempt === this.retryConfig.maxAttempts) {
          this.logError(`Max retry attempts reached for ${operationName}`, lastError, { 
            attempt, 
            maxAttempts: this.retryConfig.maxAttempts 
          });
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = getRetryDelay(lastError, attempt);
        
        this.logDebug(`Retrying ${operationName} after delay`, { 
          attempt, 
          delay, 
          error: lastError.message,
          errorCode: lastError.code,
        });
        
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse AI response with error handling and fallback
   */
  private parseAIResponse(content: string, options: {
    expectedFields?: string[];
    fallback?: any;
  } = {}): any {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate expected fields if provided
      if (options.expectedFields) {
        const missingFields = options.expectedFields.filter(field => !(field in parsed));
        if (missingFields.length > 0) {
          this.logDebug('Missing expected fields in AI response', { 
            missingFields, 
            availableFields: Object.keys(parsed) 
          });
        }
      }

      return parsed;
    } catch (error) {
      this.logError('Failed to parse AI response', error as Error, { 
        content: content.substring(0, 200) + '...',
        fallbackUsed: !!options.fallback,
      });
      
      return options.fallback || {};
    }
  }

  /**
   * Cache management
   */
  private generateCacheKey(operation: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${operation}:${sortedParams}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number = this.cacheConfig.ttl): void {
    // Clean up expired entries if cache is full
    if (this.cache.size >= this.cacheConfig.maxSize) {
      this.cleanupCache();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.timestamp + cached.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    // If still full, remove oldest entries
    if (this.cache.size >= this.cacheConfig.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.cacheConfig.maxSize * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Rate limiting
   */
  private async checkRateLimit(operation: string): Promise<void> {
    const now = Date.now();
    const tracker = this.rateLimitTracker.get(operation);

    if (!tracker || now > tracker.resetTime) {
      // Reset or initialize tracker
      this.rateLimitTracker.set(operation, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW,
      });
      return;
    }

    if (tracker.count >= this.RATE_LIMIT_MAX_REQUESTS) {
      const resetIn = tracker.resetTime - now;
      throw new RateLimitError(
        `Rate limit exceeded for ${operation}. Reset in ${Math.ceil(resetIn / 1000)}s`,
        Math.ceil(resetIn / 1000),
        {
          operation,
          limit: this.RATE_LIMIT_MAX_REQUESTS,
          resetTime: tracker.resetTime,
          resetIn,
        }
      );
    }

    tracker.count++;
  }

  /**
   * Logging utilities
   */
  private logDebug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OptimizationEngine] ${message}`, data || '');
    }
  }

  private logError(message: string, error: APIError, data?: any): void {
    if (shouldLogError(error)) {
      console.error(`[OptimizationEngine] ${message}`, {
        ...formatErrorForLogging(error),
        ...data,
      });
    }
  }

  /**
   * Health check for the optimization engine
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      aiService: boolean;
      cache: boolean;
      rateLimit: boolean;
    };
    metrics: {
      cacheSize: number;
      cacheHitRate: number;
      activeRateLimits: number;
    };
    details: string[];
  }> {
    const details: string[] = [];
    let healthyServices = 0;
    const totalServices = 3;

    // Check AI service
    let aiServiceHealthy = true;
    try {
      // Simple test call to AI service
      await this.aiService.generateText({
        prompt: 'Health check',
        context: { userId: 'health_check', contentType: 'idea' },
        options: { temperature: 0, maxTokens: 10 },
      });
    } catch (error) {
      aiServiceHealthy = false;
      details.push('AI service is not responding');
    }
    if (aiServiceHealthy) healthyServices++;

    // Check cache
    const cacheHealthy = this.cache.size < this.cacheConfig.maxSize;
    if (cacheHealthy) healthyServices++;
    else details.push('Cache is at maximum capacity');

    // Check rate limiting
    const rateLimitHealthy = this.rateLimitTracker.size < 50; // Arbitrary threshold
    if (rateLimitHealthy) healthyServices++;
    else details.push('High number of active rate limits');

    // Calculate cache hit rate (simplified)
    const cacheHitRate = this.cache.size > 0 ? 75 : 0; // Placeholder calculation

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices >= totalServices * 0.5) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services: {
        aiService: aiServiceHealthy,
        cache: cacheHealthy,
        rateLimit: rateLimitHealthy,
      },
      metrics: {
        cacheSize: this.cache.size,
        cacheHitRate,
        activeRateLimits: this.rateLimitTracker.size,
      },
      details,
    };
  }

  /**
   * Get API usage statistics
   */
  getAPIUsageStats(): {
    totalRequests: number;
    rateLimitedRequests: number;
    cacheHits: number;
    averageResponseTime: number;
  } {
    // This would be implemented with proper metrics collection
    return {
      totalRequests: 0,
      rateLimitedRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0,
    };
  }

  async generateOptimizationReport(
    contentId: string,
    options: {
      includePricing?: boolean;
      includeTiming?: boolean;
      includeAnomalies?: boolean;
    } = {}
  ): Promise<{
    summary: string;
    pricingRecommendations?: PricingRecommendation[];
    timingRecommendations?: TimingRecommendation;
    anomalies?: PerformanceAnomaly[];
    actionItems: string[];
  }> {
    const { includePricing = true, includeTiming = true, includeAnomalies = true } = options;
    
    const report: any = {
      summary: '',
      actionItems: [],
    };

    // Get performance history
    const history = this.getPerformanceHistory(contentId, 30);
    
    if (history.length === 0) {
      return {
        summary: 'Insufficient data for optimization analysis',
        actionItems: ['Collect more performance data'],
      };
    }

    // Generate summary
    const avgEngagement = history.reduce((sum, h) => sum + h.metrics.engagement, 0) / history.length;
    const avgRevenue = history.reduce((sum, h) => sum + h.metrics.revenue, 0) / history.length;
    
    report.summary = `Performance analysis for ${contentId}: Average engagement: ${avgEngagement.toFixed(1)}, Average revenue: $${avgRevenue.toFixed(2)}`;

    // Add anomaly detection
    if (includeAnomalies) {
      report.anomalies = await this.detectAnomalies(history);
      if (report.anomalies.length > 0) {
        report.actionItems.push(`Address ${report.anomalies.length} detected anomalies`);
      }
    }

    // Add action items based on analysis
    if (avgEngagement < 50) {
      report.actionItems.push('Improve content engagement strategies');
    }
    if (avgRevenue < 10) {
      report.actionItems.push('Optimize monetization approach');
    }

    return report;
  }
}

// Singleton instance
let optimizationEngine: OptimizationEngine | null = null;

export function getOptimizationEngine(): OptimizationEngine {
  if (!optimizationEngine) {
    optimizationEngine = new OptimizationEngine();
  }
  return optimizationEngine;
}