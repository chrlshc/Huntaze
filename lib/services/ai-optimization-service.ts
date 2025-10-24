import { getOptimizationEngine, PricingData, TimingData, PerformanceMetric, PricingRecommendation, TimingRecommendation, PerformanceAnomaly } from './optimization-engine';
import { getContentGenerationService, ContentGenerationRequest } from './content-generation-service';
import { getAIService } from './ai-service';

// Unified optimization interface
export interface OptimizationRequest {
  type: 'pricing' | 'timing' | 'anomaly' | 'comprehensive';
  contentId: string;
  data: {
    pricingData?: PricingData;
    timingData?: TimingData;
    performanceData?: PerformanceMetric[];
  };
  options?: {
    strategy?: 'revenue_max' | 'conversion_max' | 'balanced';
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
    sensitivity?: 'low' | 'medium' | 'high';
    lookAheadDays?: number;
    priorityMetric?: 'engagement' | 'revenue' | 'reach';
  };
}

export interface OptimizationResult {
  type: OptimizationRequest['type'];
  contentId: string;
  success: boolean;
  data: {
    pricingRecommendations?: PricingRecommendation[];
    timingRecommendations?: TimingRecommendation;
    anomalies?: PerformanceAnomaly[];
    comprehensive?: {
      pricing: PricingRecommendation[];
      timing: TimingRecommendation;
      anomalies: PerformanceAnomaly[];
      overallScore: number;
      priorityActions: string[];
      riskAssessment: {
        level: 'low' | 'medium' | 'high';
        factors: string[];
        mitigation: string[];
      };
    };
  };
  metadata: {
    processingTime: number;
    confidence: number;
    recommendations: string[];
    nextReviewDate: Date;
  };
  error?: string;
}

// AI-powered optimization service that orchestrates all optimization engines
export class AIOptimizationService {
  private optimizationEngine = getOptimizationEngine();
  private contentGenerationService = getContentGenerationService();
  private aiService = getAIService();

  async optimize(request: OptimizationRequest): Promise<OptimizationResult> {
    const startTime = Date.now();

    try {
      let result: OptimizationResult;

      switch (request.type) {
        case 'pricing':
          result = await this.optimizePricing(request);
          break;
        case 'timing':
          result = await this.optimizeTiming(request);
          break;
        case 'anomaly':
          result = await this.detectAnomalies(request);
          break;
        case 'comprehensive':
          result = await this.comprehensiveOptimization(request);
          break;
        default:
          throw new Error(`Unsupported optimization type: ${request.type}`);
      }

      // Add processing metadata
      result.metadata.processingTime = Date.now() - startTime;
      result.metadata.nextReviewDate = this.calculateNextReviewDate(request.type, result);

      return result;
    } catch (error) {
      return {
        type: request.type,
        contentId: request.contentId,
        success: false,
        data: {},
        metadata: {
          processingTime: Date.now() - startTime,
          confidence: 0,
          recommendations: ['Please check your request parameters and try again'],
          nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async optimizePricing(request: OptimizationRequest): Promise<OptimizationResult> {
    if (!request.data.pricingData) {
      throw new Error('Pricing data is required for pricing optimization');
    }

    const recommendation = await this.optimizationEngine.optimizePricing(
      request.data.pricingData,
      {
        strategy: request.options?.strategy,
        riskTolerance: request.options?.riskTolerance,
      }
    );

    // Generate additional AI insights
    const aiInsights = await this.generatePricingInsights(request.data.pricingData, recommendation);

    return {
      type: 'pricing',
      contentId: request.contentId,
      success: true,
      data: {
        pricingRecommendations: [recommendation],
      },
      metadata: {
        processingTime: 0, // Will be set by caller
        confidence: recommendation.confidence,
        recommendations: [
          ...recommendation.reasoning,
          ...aiInsights.additionalRecommendations,
        ],
        nextReviewDate: new Date(), // Will be set by caller
      },
    };
  }

  private async optimizeTiming(request: OptimizationRequest): Promise<OptimizationResult> {
    if (!request.data.timingData) {
      throw new Error('Timing data is required for timing optimization');
    }

    const recommendation = await this.optimizationEngine.optimizeTiming(
      request.data.timingData,
      {
        lookAheadDays: request.options?.lookAheadDays,
        priorityMetric: request.options?.priorityMetric,
      }
    );

    // Calculate confidence based on data quality
    const confidence = this.calculateTimingConfidence(request.data.timingData, recommendation);

    return {
      type: 'timing',
      contentId: request.contentId,
      success: true,
      data: {
        timingRecommendations: recommendation,
      },
      metadata: {
        processingTime: 0,
        confidence,
        recommendations: [
          `Post during optimal times: ${recommendation.optimalTimes.slice(0, 3).map(t => `${t.dayOfWeek} ${t.timeRange}`).join(', ')}`,
          `Avoid posting during: ${recommendation.avoidTimes.slice(0, 2).map(t => `${t.dayOfWeek} ${t.timeRange}`).join(', ')}`,
          `Best months: ${recommendation.seasonalInsights.bestMonths.join(', ')}`,
        ],
        nextReviewDate: new Date(),
      },
    };
  }

  private async detectAnomalies(request: OptimizationRequest): Promise<OptimizationResult> {
    if (!request.data.performanceData) {
      throw new Error('Performance data is required for anomaly detection');
    }

    const anomalies = await this.optimizationEngine.detectAnomalies(
      request.data.performanceData,
      {
        sensitivity: request.options?.sensitivity,
      }
    );

    // Calculate overall confidence based on anomaly detection quality
    const confidence = this.calculateAnomalyConfidence(request.data.performanceData, anomalies);

    // Generate summary recommendations
    const recommendations = this.generateAnomalyRecommendations(anomalies);

    return {
      type: 'anomaly',
      contentId: request.contentId,
      success: true,
      data: {
        anomalies,
      },
      metadata: {
        processingTime: 0,
        confidence,
        recommendations,
        nextReviewDate: new Date(),
      },
    };
  }

  private async comprehensiveOptimization(request: OptimizationRequest): Promise<OptimizationResult> {
    const results: any = {};
    let overallConfidence = 0;
    let confidenceCount = 0;

    // Run pricing optimization if data available
    if (request.data.pricingData) {
      const pricingResult = await this.optimizePricing({
        ...request,
        type: 'pricing',
      });
      results.pricing = pricingResult.data.pricingRecommendations;
      overallConfidence += pricingResult.metadata.confidence;
      confidenceCount++;
    }

    // Run timing optimization if data available
    if (request.data.timingData) {
      const timingResult = await this.optimizeTiming({
        ...request,
        type: 'timing',
      });
      results.timing = timingResult.data.timingRecommendations;
      overallConfidence += timingResult.metadata.confidence;
      confidenceCount++;
    }

    // Run anomaly detection if data available
    if (request.data.performanceData) {
      const anomalyResult = await this.detectAnomalies({
        ...request,
        type: 'anomaly',
      });
      results.anomalies = anomalyResult.data.anomalies;
      overallConfidence += anomalyResult.metadata.confidence;
      confidenceCount++;
    }

    // Calculate overall score and generate comprehensive insights
    const overallScore = confidenceCount > 0 ? overallConfidence / confidenceCount : 0;
    const comprehensiveInsights = await this.generateComprehensiveInsights(request, results);

    return {
      type: 'comprehensive',
      contentId: request.contentId,
      success: true,
      data: {
        comprehensive: {
          pricing: results.pricing || [],
          timing: results.timing || { optimalTimes: [], avoidTimes: [], seasonalInsights: { bestMonths: [], worstMonths: [], specialEvents: [] }, personalizedSchedule: [] },
          anomalies: results.anomalies || [],
          overallScore,
          priorityActions: comprehensiveInsights.priorityActions,
          riskAssessment: comprehensiveInsights.riskAssessment,
        },
      },
      metadata: {
        processingTime: 0,
        confidence: overallScore,
        recommendations: comprehensiveInsights.recommendations,
        nextReviewDate: new Date(),
      },
    };
  }

  private async generatePricingInsights(
    pricingData: PricingData,
    recommendation: PricingRecommendation
  ): Promise<{ additionalRecommendations: string[] }> {
    const prompt = `Analyze pricing optimization recommendation and provide additional strategic insights.

Current Situation:
- Content Type: ${pricingData.contentType}
- Current Price: $${pricingData.currentPrice}
- Recommended Price: $${recommendation.recommendedPrice}
- Expected Revenue Change: ${recommendation.expectedImpact.revenueChange}%
- Confidence: ${recommendation.confidence}%

Market Context:
- Conversion Rate: ${pricingData.historicalPerformance.conversionRate}%
- Audience Average Spending: $${pricingData.audienceData.averageSpending}
- Price Elasticity: ${pricingData.audienceData.priceElasticity}

Provide 3-5 additional strategic recommendations for pricing optimization beyond the basic recommendation.

Format as JSON: {"additionalRecommendations": ["rec1", "rec2", ...]}`;

    try {
      const response = await this.aiService.generateText({
        prompt,
        context: {
          userId: 'pricing_insights',
          contentType: 'pricing',
          metadata: { contentType: pricingData.contentType },
        },
        options: {
          temperature: 0.4,
          maxTokens: 300,
        },
      });

      const result = JSON.parse(response.content);
      return {
        additionalRecommendations: Array.isArray(result.additionalRecommendations) 
          ? result.additionalRecommendations 
          : [],
      };
    } catch (error) {
      return {
        additionalRecommendations: [
          'Monitor competitor pricing regularly',
          'Consider seasonal pricing adjustments',
          'Test price changes gradually',
        ],
      };
    }
  }

  private calculateTimingConfidence(timingData: TimingData, recommendation: TimingRecommendation): number {
    let confidence = 50; // Base confidence

    // Data quality factors
    if (timingData.historicalEngagement.length > 50) confidence += 20;
    if (timingData.historicalEngagement.length > 100) confidence += 10;

    // Recommendation quality factors
    if (recommendation.optimalTimes.length > 0) {
      const avgConfidence = recommendation.optimalTimes.reduce((sum, t) => sum + t.confidence, 0) / recommendation.optimalTimes.length;
      confidence += (avgConfidence / 100) * 20;
    }

    // Seasonal insights availability
    if (recommendation.seasonalInsights.bestMonths.length > 0) confidence += 10;

    return Math.min(95, Math.max(20, confidence));
  }

  private calculateAnomalyConfidence(performanceData: PerformanceMetric[], anomalies: PerformanceAnomaly[]): number {
    let confidence = 60; // Base confidence for anomaly detection

    // Data quality factors
    if (performanceData.length > 30) confidence += 15;
    if (performanceData.length > 100) confidence += 10;

    // Anomaly quality factors
    const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high' || a.severity === 'critical');
    if (highSeverityAnomalies.length > 0) confidence += 15;

    // Consistency check - if too many anomalies, confidence should decrease
    const anomalyRate = anomalies.length / performanceData.length;
    if (anomalyRate > 0.3) confidence -= 20; // Too many anomalies might indicate poor detection

    return Math.min(95, Math.max(30, confidence));
  }

  private generateAnomalyRecommendations(anomalies: PerformanceAnomaly[]): string[] {
    const recommendations: string[] = [];

    if (anomalies.length === 0) {
      return ['No significant anomalies detected - performance is stable'];
    }

    // Group by severity
    const critical = anomalies.filter(a => a.severity === 'critical');
    const high = anomalies.filter(a => a.severity === 'high');
    const medium = anomalies.filter(a => a.severity === 'medium');

    if (critical.length > 0) {
      recommendations.push(`URGENT: ${critical.length} critical anomalies require immediate attention`);
    }

    if (high.length > 0) {
      recommendations.push(`${high.length} high-priority anomalies need investigation within 24 hours`);
    }

    if (medium.length > 0) {
      recommendations.push(`${medium.length} medium-priority anomalies should be reviewed this week`);
    }

    // Add specific recommendations from anomalies
    const topAnomalies = anomalies.slice(0, 3);
    topAnomalies.forEach(anomaly => {
      if (anomaly.recommendations.length > 0) {
        recommendations.push(anomaly.recommendations[0]);
      }
    });

    return recommendations;
  }

  private async generateComprehensiveInsights(
    request: OptimizationRequest,
    results: any
  ): Promise<{
    priorityActions: string[];
    riskAssessment: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
      mitigation: string[];
    };
    recommendations: string[];
  }> {
    const priorityActions: string[] = [];
    const riskFactors: string[] = [];
    const mitigation: string[] = [];
    const recommendations: string[] = [];

    // Analyze pricing results
    if (results.pricing && results.pricing.length > 0) {
      const pricingRec = results.pricing[0];
      if (Math.abs(pricingRec.priceChangePercent) > 20) {
        priorityActions.push(`Consider ${pricingRec.priceChangePercent > 0 ? 'increasing' : 'decreasing'} price by ${Math.abs(pricingRec.priceChangePercent).toFixed(1)}%`);
        riskFactors.push('Significant price change proposed');
        mitigation.push('Implement gradual price testing');
      }
      recommendations.push(`Pricing optimization could improve revenue by ${pricingRec.expectedImpact.revenueChange.toFixed(1)}%`);
    }

    // Analyze timing results
    if (results.timing) {
      const timingRec = results.timing;
      if (timingRec.optimalTimes.length > 0) {
        priorityActions.push(`Optimize posting schedule for ${timingRec.optimalTimes[0].dayOfWeek} ${timingRec.optimalTimes[0].timeRange}`);
      }
      recommendations.push('Timing optimization can improve engagement by 15-30%');
    }

    // Analyze anomalies
    if (results.anomalies && results.anomalies.length > 0) {
      const criticalAnomalies = results.anomalies.filter((a: PerformanceAnomaly) => a.severity === 'critical');
      if (criticalAnomalies.length > 0) {
        priorityActions.push('Address critical performance anomalies immediately');
        riskFactors.push('Critical performance issues detected');
        mitigation.push('Implement immediate monitoring and corrective actions');
      }
    }

    // Determine overall risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskFactors.length > 2) riskLevel = 'high';
    else if (riskFactors.length > 0) riskLevel = 'medium';

    // Add default actions if none identified
    if (priorityActions.length === 0) {
      priorityActions.push('Continue monitoring performance metrics');
      priorityActions.push('Review optimization recommendations monthly');
    }

    return {
      priorityActions,
      riskAssessment: {
        level: riskLevel,
        factors: riskFactors,
        mitigation,
      },
      recommendations,
    };
  }

  private calculateNextReviewDate(type: OptimizationRequest['type'], result: OptimizationResult): Date {
    const now = new Date();
    let daysToAdd = 7; // Default weekly review

    switch (type) {
      case 'pricing':
        // Pricing changes need more frequent monitoring
        daysToAdd = result.metadata.confidence > 80 ? 14 : 7;
        break;
      case 'timing':
        // Timing can be reviewed less frequently
        daysToAdd = 14;
        break;
      case 'anomaly':
        // Anomalies need quick follow-up
        const hasHighSeverity = result.data.anomalies?.some(a => a.severity === 'high' || a.severity === 'critical');
        daysToAdd = hasHighSeverity ? 1 : 7;
        break;
      case 'comprehensive':
        // Comprehensive reviews can be monthly
        daysToAdd = 30;
        break;
    }

    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + daysToAdd);
    return nextReview;
  }

  // Batch optimization for multiple content items
  async optimizeBatch(requests: OptimizationRequest[]): Promise<OptimizationResult[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.optimize(request))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          type: requests[index].type,
          contentId: requests[index].contentId,
          success: false,
          data: {},
          metadata: {
            processingTime: 0,
            confidence: 0,
            recommendations: ['Batch processing failed for this request'],
            nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          error: result.reason?.message || 'Unknown error in batch processing',
        };
      }
    });
  }

  // Performance tracking and learning
  trackOptimizationPerformance(
    optimizationId: string,
    actualResults: {
      revenueChange?: number;
      engagementChange?: number;
      conversionRateChange?: number;
    }
  ): void {
    // In a real implementation, this would store performance data
    // for improving future optimizations
    console.log(`Tracking optimization performance for ${optimizationId}:`, actualResults);
  }

  // Health check for optimization services
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      optimizationEngine: boolean;
      contentGenerationService: boolean;
      aiService: boolean;
    };
    details: string[];
  }> {
    const checks = {
      optimizationEngine: true, // These would be actual health checks
      contentGenerationService: true,
      aiService: true,
    };

    const healthyCount = Object.values(checks).filter(Boolean).length;
    const totalCount = Object.keys(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalCount) {
      status = 'healthy';
    } else if (healthyCount >= totalCount * 0.5) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    const details: string[] = [];
    Object.entries(checks).forEach(([service, healthy]) => {
      if (!healthy) {
        details.push(`${service} is not responding`);
      }
    });

    return {
      status,
      services: checks,
      details,
    };
  }
}

// Singleton instance
let aiOptimizationService: AIOptimizationService | null = null;

export function getAIOptimizationService(): AIOptimizationService {
  if (!aiOptimizationService) {
    aiOptimizationService = new AIOptimizationService();
  }
  return aiOptimizationService;
}

// Export types for external use
export type {
  PricingData,
  TimingData,
  PerformanceMetric,
  PricingRecommendation,
  TimingRecommendation,
  PerformanceAnomaly,
};