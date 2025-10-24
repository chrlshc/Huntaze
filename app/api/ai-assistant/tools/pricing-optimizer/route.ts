import { NextRequest } from 'next/server';
import { withErrorHandling, jsonError } from '@/src/lib/http/errors';
import { z } from 'zod';
import { getServerAuth } from '@/lib/server-auth';
import { getAIService } from '@/lib/services/ai-service';

const PricingOptimizerSchema = z.object({
  contentType: z.enum(['subscription', 'ppv', 'tip', 'custom_content', 'live_show']),
  currentPricing: z.object({
    basePrice: z.number().min(0),
    currency: z.string().default('USD'),
    billingCycle: z.enum(['one_time', 'monthly', 'weekly']).optional(),
  }),
  audienceData: z.object({
    totalSubscribers: z.number().min(0),
    activeSubscribers: z.number().min(0),
    averageSpending: z.number().min(0),
    spendingDistribution: z.object({
      low: z.number().min(0).max(100), // percentage
      medium: z.number().min(0).max(100),
      high: z.number().min(0).max(100),
    }),
    demographics: z.object({
      primaryAgeRange: z.string().optional(),
      primaryLocation: z.string().optional(),
      disposableIncomeLevel: z.enum(['low', 'medium', 'high']).optional(),
    }).default({}),
  }),
  performanceMetrics: z.object({
    conversionRate: z.number().min(0).max(100), // percentage
    averageOrderValue: z.number().min(0),
    customerLifetimeValue: z.number().min(0),
    churnRate: z.number().min(0).max(100), // percentage
    recentSales: z.array(z.object({
      price: z.number(),
      date: z.string().datetime(),
      contentType: z.string(),
      success: z.boolean(),
    })).default([]),
  }),
  competitorData: z.object({
    averageMarketPrice: z.number().min(0).optional(),
    priceRange: z.object({
      min: z.number().min(0),
      max: z.number().min(0),
    }).optional(),
    topPerformers: z.array(z.object({
      price: z.number(),
      engagement: z.number(),
      contentQuality: z.enum(['low', 'medium', 'high']),
    })).default([]),
  }).default({}),
  goals: z.object({
    primaryGoal: z.enum(['maximize_revenue', 'increase_subscribers', 'improve_retention', 'market_penetration']),
    targetIncrease: z.number().min(0).max(500).optional(), // percentage increase target
    timeframe: z.enum(['immediate', 'short_term', 'long_term']).default('short_term'),
  }),
  constraints: z.object({
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    priceChangeFrequency: z.enum(['weekly', 'monthly', 'quarterly']).default('monthly'),
  }).default({}),
});

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = await getServerAuth();
    if (!auth.user) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = PricingOptimizerSchema.safeParse(body);

    if (!validatedData.success) {
      return jsonError('VALIDATION_ERROR', 'Invalid pricing optimizer data', 400, {
        errors: validatedData.error.errors,
      });
    }

    const data = validatedData.data;

    try {
      const aiService = getAIService();

      // Perform pricing analysis
      const analysis = performPricingAnalysis(data);
      
      // Generate AI-powered recommendations
      const prompt = buildPricingPrompt(data, analysis);

      const response = await aiService.generateText({
        prompt,
        context: {
          userId: auth.user.id,
          contentType: 'pricing',
          metadata: {
            contentType: data.contentType,
            currentPrice: data.currentPricing.basePrice,
            goal: data.goals.primaryGoal,
          },
        },
        options: {
          temperature: 0.3, // Lower temperature for more analytical responses
          maxTokens: 1500,
        },
      });

      // Parse AI recommendations and combine with analysis
      const recommendations = parseAIRecommendations(response.content);
      
      // Generate pricing scenarios
      const scenarios = generatePricingScenarios(data, analysis);

      return Response.json({
        success: true,
        data: {
          currentAnalysis: analysis,
          recommendations: recommendations,
          pricingScenarios: scenarios,
          aiInsights: response.content,
          metadata: {
            contentType: data.contentType,
            currentPrice: data.currentPricing.basePrice,
            currency: data.currentPricing.currency,
            goal: data.goals.primaryGoal,
            analysisDate: new Date().toISOString(),
            provider: response.provider,
            model: response.model,
          },
          usage: response.usage,
        },
        timestamp: new Date(),
        requestId: crypto.randomUUID(),
      });

    } catch (error: any) {
      console.error('Pricing optimization error:', error);
      return jsonError('PRICING_OPTIMIZATION_FAILED', 'Failed to generate pricing recommendations', 500, {
        error: error.message,
      });
    }
  });
}

function performPricingAnalysis(data: any) {
  const analysis: any = {
    currentPerformance: {},
    marketPosition: {},
    audienceInsights: {},
    riskAssessment: {},
  };

  // Current performance analysis
  analysis.currentPerformance = {
    conversionRate: data.performanceMetrics.conversionRate,
    revenuePerSubscriber: data.performanceMetrics.averageOrderValue,
    customerValue: data.performanceMetrics.customerLifetimeValue,
    churnRisk: data.performanceMetrics.churnRate > 15 ? 'high' : 
               data.performanceMetrics.churnRate > 8 ? 'medium' : 'low',
  };

  // Market position analysis
  if (data.competitorData.averageMarketPrice) {
    const currentPrice = data.currentPricing.basePrice;
    const marketPrice = data.competitorData.averageMarketPrice;
    const priceRatio = currentPrice / marketPrice;

    analysis.marketPosition = {
      relativePrice: priceRatio > 1.2 ? 'premium' : 
                    priceRatio < 0.8 ? 'budget' : 'competitive',
      priceGap: ((currentPrice - marketPrice) / marketPrice * 100).toFixed(1),
      marketPriceRange: data.competitorData.priceRange,
    };
  }

  // Audience insights
  const spendingDist = data.audienceData.spendingDistribution;
  analysis.audienceInsights = {
    spendingCapacity: spendingDist.high > 30 ? 'high' : 
                     spendingDist.medium > 50 ? 'medium' : 'low',
    priceElasticity: estimatePriceElasticity(data),
    segmentOpportunity: identifySegmentOpportunities(data),
  };

  // Risk assessment
  analysis.riskAssessment = {
    priceIncreaseRisk: assessPriceIncreaseRisk(data),
    competitiveRisk: assessCompetitiveRisk(data),
    demandRisk: assessDemandRisk(data),
  };

  return analysis;
}

function estimatePriceElasticity(data: any): 'low' | 'medium' | 'high' {
  // Estimate based on conversion rate, churn rate, and spending distribution
  const conversionRate = data.performanceMetrics.conversionRate;
  const churnRate = data.performanceMetrics.churnRate;
  const highSpenders = data.audienceData.spendingDistribution.high;

  if (conversionRate > 15 && churnRate < 10 && highSpenders > 25) {
    return 'low'; // Less sensitive to price changes
  } else if (conversionRate > 8 && churnRate < 20 && highSpenders > 15) {
    return 'medium';
  } else {
    return 'high'; // Very sensitive to price changes
  }
}

function identifySegmentOpportunities(data: any): string[] {
  const opportunities: string[] = [];
  const spendingDist = data.audienceData.spendingDistribution;

  if (spendingDist.high > 20) {
    opportunities.push('Premium tier opportunity for high spenders');
  }

  if (spendingDist.low > 40) {
    opportunities.push('Entry-level pricing tier for budget-conscious audience');
  }

  if (data.audienceData.activeSubscribers / data.audienceData.totalSubscribers < 0.7) {
    opportunities.push('Reactivation pricing for inactive subscribers');
  }

  return opportunities;
}

function assessPriceIncreaseRisk(data: any): 'low' | 'medium' | 'high' {
  const churnRate = data.performanceMetrics.churnRate;
  const conversionRate = data.performanceMetrics.conversionRate;
  
  if (churnRate > 20 || conversionRate < 5) {
    return 'high';
  } else if (churnRate > 10 || conversionRate < 10) {
    return 'medium';
  } else {
    return 'low';
  }
}

function assessCompetitiveRisk(data: any): 'low' | 'medium' | 'high' {
  if (!data.competitorData.averageMarketPrice) return 'medium';

  const currentPrice = data.currentPricing.basePrice;
  const marketPrice = data.competitorData.averageMarketPrice;
  const priceRatio = currentPrice / marketPrice;

  if (priceRatio > 1.5) {
    return 'high'; // Significantly above market
  } else if (priceRatio > 1.2) {
    return 'medium';
  } else {
    return 'low';
  }
}

function assessDemandRisk(data: any): 'low' | 'medium' | 'high' {
  const recentSales = data.performanceMetrics.recentSales;
  if (recentSales.length === 0) return 'medium';

  const successRate = recentSales.filter((sale: any) => sale.success).length / recentSales.length;
  
  if (successRate < 0.5) {
    return 'high';
  } else if (successRate < 0.7) {
    return 'medium';
  } else {
    return 'low';
  }
}

function buildPricingPrompt(data: any, analysis: any): string {
  let prompt = `Analyze the pricing strategy for ${data.contentType} content and provide optimization recommendations.`;

  prompt += `\n\nCurrent Situation:
- Current price: $${data.currentPricing.basePrice} ${data.currentPricing.currency}
- Content type: ${data.contentType}
- Conversion rate: ${data.performanceMetrics.conversionRate}%
- Churn rate: ${data.performanceMetrics.churnRate}%
- Average order value: $${data.performanceMetrics.averageOrderValue}`;

  prompt += `\n\nAudience Analysis:
- Total subscribers: ${data.audienceData.totalSubscribers}
- Active subscribers: ${data.audienceData.activeSubscribers}
- Average spending: $${data.audienceData.averageSpending}
- Spending distribution: ${data.audienceData.spendingDistribution.high}% high, ${data.audienceData.spendingDistribution.medium}% medium, ${data.audienceData.spendingDistribution.low}% low spenders`;

  if (data.competitorData.averageMarketPrice) {
    prompt += `\n\nMarket Context:
- Average market price: $${data.competitorData.averageMarketPrice}
- Market position: ${analysis.marketPosition.relativePrice}
- Price gap: ${analysis.marketPosition.priceGap}%`;
  }

  prompt += `\n\nGoals:
- Primary goal: ${data.goals.primaryGoal}
- Timeframe: ${data.goals.timeframe}`;

  if (data.goals.targetIncrease) {
    prompt += `\n- Target increase: ${data.goals.targetIncrease}%`;
  }

  prompt += `\n\nProvide specific recommendations including:
1. Optimal price point with justification
2. Pricing strategy (single price, tiered, dynamic)
3. Implementation timeline and approach
4. Expected impact on key metrics
5. Risk mitigation strategies
6. A/B testing recommendations

Focus on data-driven insights and practical implementation advice.`;

  return prompt;
}

function parseAIRecommendations(content: string): any {
  const recommendations: any = {
    optimalPrice: null,
    strategy: '',
    implementation: '',
    expectedImpact: '',
    risks: [],
    testingPlan: '',
  };

  // Simple parsing - in production, you might want more sophisticated NLP
  const lines = content.split('\n');
  let currentSection = '';

  lines.forEach(line => {
    const trimmed = line.trim().toLowerCase();
    
    if (trimmed.includes('optimal price') || trimmed.includes('recommended price')) {
      currentSection = 'optimalPrice';
      const priceMatch = line.match(/\$?(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        recommendations.optimalPrice = parseFloat(priceMatch[1]);
      }
    } else if (trimmed.includes('strategy') || trimmed.includes('approach')) {
      currentSection = 'strategy';
    } else if (trimmed.includes('implementation') || trimmed.includes('timeline')) {
      currentSection = 'implementation';
    } else if (trimmed.includes('impact') || trimmed.includes('expected')) {
      currentSection = 'expectedImpact';
    } else if (trimmed.includes('risk') || trimmed.includes('mitigation')) {
      currentSection = 'risks';
    } else if (trimmed.includes('test') || trimmed.includes('a/b')) {
      currentSection = 'testingPlan';
    } else if (currentSection && line.trim()) {
      if (currentSection === 'risks') {
        recommendations.risks.push(line.trim());
      } else {
        recommendations[currentSection] += (recommendations[currentSection] ? ' ' : '') + line.trim();
      }
    }
  });

  return recommendations;
}

function generatePricingScenarios(data: any, analysis: any): any[] {
  const currentPrice = data.currentPricing.basePrice;
  const scenarios: any[] = [];

  // Conservative scenario (5-10% increase)
  scenarios.push({
    name: 'Conservative Growth',
    price: Math.round(currentPrice * 1.075 * 100) / 100,
    priceChange: 7.5,
    expectedImpact: {
      revenueChange: 5,
      conversionChange: -2,
      churnChange: 1,
    },
    riskLevel: 'low',
    description: 'Small price increase to test market response with minimal risk',
  });

  // Moderate scenario (15-25% increase)
  scenarios.push({
    name: 'Market Alignment',
    price: Math.round(currentPrice * 1.2 * 100) / 100,
    priceChange: 20,
    expectedImpact: {
      revenueChange: 15,
      conversionChange: -5,
      churnChange: 3,
    },
    riskLevel: 'medium',
    description: 'Align with market pricing for better positioning',
  });

  // Aggressive scenario (30%+ increase)
  if (analysis.riskAssessment.priceIncreaseRisk === 'low') {
    scenarios.push({
      name: 'Premium Positioning',
      price: Math.round(currentPrice * 1.4 * 100) / 100,
      priceChange: 40,
      expectedImpact: {
        revenueChange: 25,
        conversionChange: -12,
        churnChange: 8,
      },
      riskLevel: 'high',
      description: 'Position as premium offering for high-value audience',
    });
  }

  // Value scenario (decrease for volume)
  if (data.goals.primaryGoal === 'increase_subscribers') {
    scenarios.push({
      name: 'Volume Growth',
      price: Math.round(currentPrice * 0.85 * 100) / 100,
      priceChange: -15,
      expectedImpact: {
        revenueChange: -5,
        conversionChange: 25,
        churnChange: -5,
      },
      riskLevel: 'low',
      description: 'Lower price to attract more subscribers and increase market share',
    });
  }

  return scenarios;
}