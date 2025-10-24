import { getMessagePersonalizationService, FanProfile, MessageTemplate } from './message-personalization';
import { getContentIdeaGeneratorService, ContentIdea, CreatorProfile, TrendData } from './content-idea-generator';
import { getCaptionHashtagGeneratorService, Caption, HashtagSet, ContentContext, ContentStrategy } from './caption-hashtag-generator';
import { getAIService } from './ai-service';

// Unified content generation interface
export interface ContentGenerationRequest {
  type: 'message' | 'idea' | 'caption' | 'hashtags' | 'comprehensive';
  context: {
    creatorProfile?: CreatorProfile;
    fanProfile?: FanProfile;
    contentContext?: ContentContext;
    strategy?: ContentStrategy;
  };
  options?: {
    // Message options
    messageType?: MessageTemplate['category'];
    tone?: string;
    
    // Idea options
    ideaCount?: number;
    focusArea?: 'trending' | 'evergreen' | 'seasonal' | 'monetization';
    
    // Caption options
    captionLength?: 'short' | 'medium' | 'long';
    includeEmojis?: boolean;
    includeCallToAction?: boolean;
    
    // Hashtag options
    hashtagCount?: number;
    hashtagMix?: 'trending' | 'niche' | 'balanced';
    
    // General options
    variations?: number;
    customPrompt?: string;
  };
}

export interface ContentGenerationResult {
  type: ContentGenerationRequest['type'];
  success: boolean;
  data: {
    messages?: Array<{
      message: string;
      template?: MessageTemplate;
      personalizationScore: number;
      suggestions: string[];
    }>;
    ideas?: {
      ideas: ContentIdea[];
      trendAnalysis?: TrendData[];
      recommendations: string[];
      nextSteps: string[];
    };
    captions?: {
      captions: Caption[];
      recommendations: string[];
      hashtagSuggestions: string[];
    };
    hashtags?: string[];
    comprehensive?: {
      contentIdeas: ContentIdea[];
      captions: Caption[];
      hashtags: string[];
      messages: string[];
      strategy: {
        recommendations: string[];
        nextSteps: string[];
        performance: {
          expectedEngagement: number;
          monetizationPotential: number;
          trendAlignment: number;
        };
      };
    };
  };
  metadata: {
    processingTime: number;
    tokensUsed?: number;
    confidence: number;
    suggestions: string[];
  };
  error?: string;
}

// Main content generation service that orchestrates all sub-services
export class ContentGenerationService {
  private messageService = getMessagePersonalizationService();
  private ideaService = getContentIdeaGeneratorService();
  private captionService = getCaptionHashtagGeneratorService();
  private aiService = getAIService();

  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    const startTime = Date.now();
    
    try {
      let result: ContentGenerationResult;

      switch (request.type) {
        case 'message':
          result = await this.generateMessages(request);
          break;
        case 'idea':
          result = await this.generateIdeas(request);
          break;
        case 'caption':
          result = await this.generateCaptions(request);
          break;
        case 'hashtags':
          result = await this.generateHashtags(request);
          break;
        case 'comprehensive':
          result = await this.generateComprehensive(request);
          break;
        default:
          throw new Error(`Unsupported generation type: ${request.type}`);
      }

      // Add processing metadata
      result.metadata.processingTime = Date.now() - startTime;
      
      return result;
    } catch (error) {
      return {
        type: request.type,
        success: false,
        data: {},
        metadata: {
          processingTime: Date.now() - startTime,
          confidence: 0,
          suggestions: ['Please check your request parameters and try again'],
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async generateMessages(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    if (!request.context.fanProfile) {
      throw new Error('Fan profile is required for message generation');
    }

    const { fanProfile } = request.context;
    const { messageType = 'greeting', tone, variations = 3 } = request.options || {};

    const messages = [];
    
    for (let i = 0; i < variations; i++) {
      const result = await this.messageService.generatePersonalizedMessage(
        fanProfile,
        messageType,
        { tone: tone as any, customContext: request.options?.customPrompt }
      );
      messages.push(result);
    }

    const avgPersonalizationScore = messages.reduce((sum, m) => sum + m.personalizationScore, 0) / messages.length;
    const allSuggestions = [...new Set(messages.flatMap(m => m.suggestions))];

    return {
      type: 'message',
      success: true,
      data: { messages },
      metadata: {
        processingTime: 0, // Will be set by caller
        confidence: avgPersonalizationScore,
        suggestions: allSuggestions,
      },
    };
  }

  private async generateIdeas(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    if (!request.context.creatorProfile) {
      throw new Error('Creator profile is required for idea generation');
    }

    const { creatorProfile } = request.context;
    const { ideaCount = 10, focusArea = 'trending' } = request.options || {};

    const result = await this.ideaService.generateContentIdeas(creatorProfile, {
      count: ideaCount,
      focusArea,
      includeAnalysis: true,
    });

    const performance = this.ideaService.analyzeIdeaPerformance(result.ideas);

    return {
      type: 'idea',
      success: true,
      data: { ideas: result },
      metadata: {
        processingTime: 0,
        confidence: performance.averageEngagement,
        suggestions: result.recommendations,
      },
    };
  }

  private async generateCaptions(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    if (!request.context.contentContext || !request.context.strategy) {
      throw new Error('Content context and strategy are required for caption generation');
    }

    const { contentContext, strategy } = request.context;
    const { 
      captionLength = 'medium', 
      includeEmojis = true, 
      includeCallToAction = true,
      variations = 3 
    } = request.options || {};

    const result = await this.captionService.generateCaption(
      contentContext,
      strategy,
      {
        length: captionLength,
        includeEmojis,
        includeCallToAction,
        variations,
        customPrompt: request.options?.customPrompt,
      }
    );

    const avgEngagement = result.captions.reduce((sum, c) => sum + c.engagementScore, 0) / result.captions.length;

    return {
      type: 'caption',
      success: true,
      data: { captions: result },
      metadata: {
        processingTime: 0,
        confidence: avgEngagement,
        suggestions: result.recommendations,
      },
    };
  }

  private async generateHashtags(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    if (!request.context.contentContext || !request.context.strategy) {
      throw new Error('Content context and strategy are required for hashtag generation');
    }

    const { contentContext, strategy } = request.context;
    const { hashtagCount = 20, hashtagMix = 'balanced' } = request.options || {};

    const hashtags = await this.captionService.generateHashtagSuggestions(
      contentContext,
      strategy,
      {
        count: hashtagCount,
        mix: hashtagMix,
      }
    );

    return {
      type: 'hashtags',
      success: true,
      data: { hashtags },
      metadata: {
        processingTime: 0,
        confidence: 75, // Default confidence for hashtags
        suggestions: [
          'Mix trending and niche hashtags for best reach',
          'Monitor hashtag performance and adjust accordingly',
          'Use location-based hashtags when relevant',
        ],
      },
    };
  }

  private async generateComprehensive(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    if (!request.context.creatorProfile || !request.context.contentContext || !request.context.strategy) {
      throw new Error('Creator profile, content context, and strategy are required for comprehensive generation');
    }

    const { creatorProfile, contentContext, strategy } = request.context;

    // Generate content ideas
    const ideasResult = await this.ideaService.generateContentIdeas(creatorProfile, {
      count: 5,
      focusArea: 'trending',
      includeAnalysis: true,
    });

    // Generate captions
    const captionsResult = await this.captionService.generateCaption(
      contentContext,
      strategy,
      {
        variations: 3,
        includeEmojis: true,
        includeCallToAction: true,
      }
    );

    // Generate hashtags
    const hashtags = await this.captionService.generateHashtagSuggestions(
      contentContext,
      strategy,
      { count: 15, mix: 'balanced' }
    );

    // Generate sample messages (if fan profile available)
    let messages: string[] = [];
    if (request.context.fanProfile) {
      const messageResults = await Promise.all([
        this.messageService.generatePersonalizedMessage(request.context.fanProfile, 'greeting'),
        this.messageService.generatePersonalizedMessage(request.context.fanProfile, 'upsell'),
      ]);
      messages = messageResults.map(r => r.message);
    }

    // Analyze overall performance
    const ideaPerformance = this.ideaService.analyzeIdeaPerformance(ideasResult.ideas);
    const captionPerformance = captionsResult.captions.reduce((sum, c) => sum + c.engagementScore, 0) / captionsResult.captions.length;

    // Generate comprehensive strategy
    const strategy_recommendations = [
      ...ideasResult.recommendations,
      ...captionsResult.recommendations,
      'Maintain consistent posting schedule',
      'Engage with audience comments promptly',
      'Monitor performance metrics regularly',
    ];

    const nextSteps = [
      ...ideasResult.nextSteps,
      'Set up content calendar with generated ideas',
      'A/B test different caption styles',
      'Track hashtag performance',
      'Adjust strategy based on engagement data',
    ];

    return {
      type: 'comprehensive',
      success: true,
      data: {
        comprehensive: {
          contentIdeas: ideasResult.ideas,
          captions: captionsResult.captions,
          hashtags,
          messages,
          strategy: {
            recommendations: strategy_recommendations,
            nextSteps,
            performance: {
              expectedEngagement: Math.round((ideaPerformance.averageEngagement + captionPerformance) / 2),
              monetizationPotential: ideaPerformance.monetizationScore,
              trendAlignment: ideaPerformance.trendAlignment,
            },
          },
        },
      },
      metadata: {
        processingTime: 0,
        confidence: Math.round((ideaPerformance.averageEngagement + captionPerformance) / 2),
        suggestions: [
          'Review all generated content before publishing',
          'Customize suggestions to match your brand voice',
          'Test different approaches to find what works best',
        ],
      },
    };
  }

  // Utility methods for batch processing
  async generateBatch(requests: ContentGenerationRequest[]): Promise<ContentGenerationResult[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.generateContent(request))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          type: requests[index].type,
          success: false,
          data: {},
          metadata: {
            processingTime: 0,
            confidence: 0,
            suggestions: ['Batch processing failed for this request'],
          },
          error: result.reason?.message || 'Unknown error in batch processing',
        };
      }
    });
  }

  // Analytics and optimization methods
  async optimizeContentStrategy(
    creatorProfile: CreatorProfile,
    performanceHistory: {
      contentId: string;
      type: string;
      engagement: number;
      reach: number;
      revenue: number;
    }[]
  ): Promise<{
    recommendations: string[];
    optimizedStrategy: Partial<ContentStrategy>;
    expectedImprovement: number;
  }> {
    // Analyze performance patterns
    const typePerformance = performanceHistory.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = { engagement: 0, reach: 0, revenue: 0, count: 0 };
      }
      acc[item.type].engagement += item.engagement;
      acc[item.type].reach += item.reach;
      acc[item.type].revenue += item.revenue;
      acc[item.type].count += 1;
      return acc;
    }, {} as Record<string, { engagement: number; reach: number; revenue: number; count: number }>);

    // Calculate averages
    const avgPerformance = Object.entries(typePerformance).map(([type, data]) => ({
      type,
      avgEngagement: data.engagement / data.count,
      avgReach: data.reach / data.count,
      avgRevenue: data.revenue / data.count,
      score: (data.engagement / data.count) * 0.4 + (data.reach / data.count) * 0.3 + (data.revenue / data.count) * 0.3,
    }));

    // Sort by performance
    avgPerformance.sort((a, b) => b.score - a.score);

    const recommendations: string[] = [];
    
    // Top performing content types
    const topTypes = avgPerformance.slice(0, 3);
    recommendations.push(`Focus on high-performing content types: ${topTypes.map(t => t.type).join(', ')}`);

    // Revenue optimization
    const revenueLeaders = avgPerformance.filter(p => p.avgRevenue > 0).slice(0, 2);
    if (revenueLeaders.length > 0) {
      recommendations.push(`Increase ${revenueLeaders.map(r => r.type).join(' and ')} content for better monetization`);
    }

    // Engagement optimization
    const engagementLeaders = avgPerformance.slice(0, 2);
    recommendations.push(`${engagementLeaders.map(e => e.type).join(' and ')} content drives highest engagement`);

    // Generate optimized strategy
    const optimizedStrategy: Partial<ContentStrategy> = {
      primaryNiche: creatorProfile.niche[0], // Keep existing primary niche
      secondaryNiches: topTypes.map(t => t.type).slice(0, 2),
      audienceInsights: {
        peakEngagementTimes: [], // Would be calculated from timestamp data
        preferredContentLength: 'medium', // Default, would be analyzed from data
        responseToEmojis: 'positive', // Default, would be analyzed from data
        hashtagPreferences: [], // Would be analyzed from hashtag performance
      },
    };

    // Calculate expected improvement
    const currentAvgScore = avgPerformance.reduce((sum, p) => sum + p.score, 0) / avgPerformance.length;
    const topAvgScore = topTypes.reduce((sum, p) => sum + p.score, 0) / topTypes.length;
    const expectedImprovement = ((topAvgScore - currentAvgScore) / currentAvgScore) * 100;

    return {
      recommendations,
      optimizedStrategy,
      expectedImprovement: Math.max(0, expectedImprovement),
    };
  }

  // Performance tracking
  trackGenerationPerformance(
    generationId: string,
    actualPerformance: {
      engagement: number;
      reach: number;
      revenue?: number;
    }
  ): void {
    // In a real implementation, this would store performance data
    // for improving future generations
    console.log(`Tracking performance for generation ${generationId}:`, actualPerformance);
  }

  // Health check for all services
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      messageService: boolean;
      ideaService: boolean;
      captionService: boolean;
      aiService: boolean;
    };
    details: string[];
  }> {
    const checks = {
      messageService: true, // These would be actual health checks
      ideaService: true,
      captionService: true,
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
let contentGenerationService: ContentGenerationService | null = null;

export function getContentGenerationService(): ContentGenerationService {
  if (!contentGenerationService) {
    contentGenerationService = new ContentGenerationService();
  }
  return contentGenerationService;
}

// Export all types for external use
export type {
  FanProfile,
  MessageTemplate,
  ContentIdea,
  CreatorProfile,
  TrendData,
  Caption,
  HashtagSet,
  ContentContext,
  ContentStrategy,
};