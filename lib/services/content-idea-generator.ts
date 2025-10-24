import { getAIService } from './ai-service';
import { z } from 'zod';
import {
  APIError,
  AIServiceError,
  ValidationError,
  isRetryableError,
  getRetryDelay,
  enhanceErrorWithContext,
  formatErrorForLogging,
  shouldLogError,
} from '@/lib/types/api-errors';

// API Response types
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

// Retry configuration
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

// Content idea schemas
export const ContentIdeaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(['photo', 'video', 'story', 'ppv', 'live']),
  tags: z.array(z.string()),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  estimatedEngagement: z.number().min(0).max(100),
  trendScore: z.number().min(0).max(100),
  seasonality: z.object({
    bestMonths: z.array(z.number().min(1).max(12)).optional(),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
    dayOfWeek: z.array(z.string()).optional(),
  }).optional(),
  targetAudience: z.object({
    demographics: z.array(z.string()).default([]),
    interests: z.array(z.string()).default([]),
    spendingLevel: z.enum(['low', 'medium', 'high']).optional(),
  }).default(() => ({
    demographics: [],
    interests: [],
  })),
  monetizationPotential: z.object({
    ppvSuitability: z.number().min(0).max(100),
    subscriptionValue: z.number().min(0).max(100),
    tipPotential: z.number().min(0).max(100),
  }),
  createdAt: z.date(),
});

export type ContentIdea = z.infer<typeof ContentIdeaSchema>;

// Trend data schema
export const TrendDataSchema = z.object({
  keyword: z.string(),
  popularity: z.number().min(0).max(100),
  growth: z.number(), // Can be negative for declining trends
  category: z.string(),
  relatedKeywords: z.array(z.string()).default([]),
  seasonality: z.object({
    peak: z.string().optional(),
    decline: z.string().optional(),
  }).optional(),
});

export type TrendData = z.infer<typeof TrendDataSchema>;

// Creator profile for personalized ideas
export interface CreatorProfile {
  id: string;
  niche: string[];
  contentTypes: string[];
  audiencePreferences: string[];
  performanceHistory: {
    topPerformingContent: string[];
    engagementPatterns: Record<string, number>;
    revenueByCategory: Record<string, number>;
  };
  currentGoals: {
    type: 'growth' | 'revenue' | 'engagement' | 'retention';
    target: number;
    timeframe: string;
  }[];
  constraints: {
    equipment: string[];
    location: string[];
    timeAvailability: string;
  };
}

// Content idea generation service
export class ContentIdeaGeneratorService {
  private aiService = getAIService();
  private trendCache: Map<string, { data: TrendData[]; timestamp: Date }> = new Map();
  private ideaHistory: Map<string, ContentIdea[]> = new Map();
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;
  
  // Cache TTL in milliseconds (1 hour)
  private readonly CACHE_TTL = 3600000;
  
  constructor(retryConfig?: Partial<RetryConfig>) {
    if (retryConfig) {
      this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    }
  }

  /**
   * Generate personalized content ideas for a creator
   * @param creatorProfile - Creator's profile and preferences
   * @param options - Generation options and filters
   * @returns Promise with ideas, analysis, and recommendations
   * @throws {AIServiceError} When AI service fails after retries
   */
  async generateContentIdeas(
    creatorProfile: CreatorProfile,
    options: {
      count?: number;
      category?: ContentIdea['category'];
      difficulty?: ContentIdea['difficulty'];
      focusArea?: 'trending' | 'evergreen' | 'seasonal' | 'monetization';
      timeframe?: 'week' | 'month' | 'quarter';
      includeAnalysis?: boolean;
    } = {}
  ): Promise<{
    ideas: ContentIdea[];
    trendAnalysis?: TrendData[];
    recommendations: string[];
    nextSteps: string[];
    metadata: {
      generatedAt: Date;
      tokensUsed?: number;
      cacheHit: boolean;
    };
  }> {
    const startTime = Date.now();
    let tokensUsed = 0;
    let cacheHit = false;

    try {
      const {
        count = 10,
        category,
        difficulty,
        focusArea = 'trending',
        timeframe = 'month',
        includeAnalysis = true,
      } = options;

      this.logDebug('Starting content idea generation', {
        creatorId: creatorProfile.id,
        count,
        focusArea,
        includeAnalysis,
      });

      // Validate input parameters
      this.validateGenerationOptions(options);

      // Get trend data if needed
      let trendAnalysis: TrendData[] = [];
      if (includeAnalysis || focusArea === 'trending') {
        const trendResult = await this.getTrendingTopics(creatorProfile.niche);
        trendAnalysis = trendResult.data;
        tokensUsed += trendResult.tokensUsed || 0;
        cacheHit = trendResult.cacheHit;
      }

      // Generate ideas based on focus area
      const ideaResult = await this.generateIdeasByFocus(
        creatorProfile,
        focusArea,
        count,
        { category, difficulty, timeframe, trendAnalysis }
      );
      
      tokensUsed += ideaResult.tokensUsed || 0;

      // Store in history
      const existingHistory = this.ideaHistory.get(creatorProfile.id) || [];
      this.ideaHistory.set(creatorProfile.id, [...existingHistory, ...ideaResult.ideas]);

      // Generate recommendations and next steps
      const recommendations = this.generateRecommendations(ideaResult.ideas, creatorProfile, trendAnalysis);
      const nextSteps = this.generateNextSteps(ideaResult.ideas, creatorProfile);

      const duration = Date.now() - startTime;
      this.logDebug('Content idea generation completed', {
        creatorId: creatorProfile.id,
        ideasGenerated: ideaResult.ideas.length,
        tokensUsed,
        duration,
        cacheHit,
      });

      return {
        ideas: ideaResult.ideas,
        trendAnalysis: includeAnalysis ? trendAnalysis : undefined,
        recommendations,
        nextSteps,
        metadata: {
          generatedAt: new Date(),
          tokensUsed,
          cacheHit,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logError('Content idea generation failed', error as Error, {
        creatorId: creatorProfile.id,
        duration,
        tokensUsed,
      });
      
      // Re-throw with additional context
      if (error instanceof Error) {
        const enhancedError = new Error(`Content idea generation failed: ${error.message}`);
        (enhancedError as any).originalError = error;
        (enhancedError as any).creatorId = creatorProfile.id;
        throw enhancedError;
      }
      throw error;
    }
  }

  private async generateIdeasByFocus(
    creatorProfile: CreatorProfile,
    focusArea: string,
    count: number,
    context: any
  ): Promise<{ ideas: ContentIdea[]; tokensUsed?: number }> {
    const prompt = this.buildIdeaGenerationPrompt(creatorProfile, focusArea, count, context);

    const response = await this.executeWithRetry(async () => {
      return await this.aiService.generateText({
        prompt,
        context: {
          userId: creatorProfile.id,
          contentType: 'idea',
          metadata: {
            focusArea,
            niche: creatorProfile.niche,
            count,
          },
        },
        options: {
          temperature: 0.8,
          maxTokens: 2000,
        },
      });
    }, `generateIdeasByFocus for ${creatorProfile.id}`);

    // Parse AI response into structured ideas
    const ideas = await this.parseAIResponseToIdeas(response.content, creatorProfile, context);
    
    return {
      ideas,
      tokensUsed: response.usage?.totalTokens,
    };
  }

  private buildIdeaGenerationPrompt(
    creatorProfile: CreatorProfile,
    focusArea: string,
    count: number,
    context: any
  ): string {
    let prompt = `Generate ${count} creative content ideas for a content creator.`;

    // Creator context
    prompt += `\n\nCreator Profile:
- Niche: ${creatorProfile.niche.join(', ')}
- Content Types: ${creatorProfile.contentTypes.join(', ')}
- Audience Preferences: ${creatorProfile.audiencePreferences.join(', ')}`;

    // Performance history
    if (creatorProfile.performanceHistory.topPerformingContent.length > 0) {
      prompt += `\n- Top Performing Content: ${creatorProfile.performanceHistory.topPerformingContent.join(', ')}`;
    }

    // Current goals
    if (creatorProfile.currentGoals.length > 0) {
      const goals = creatorProfile.currentGoals.map(g => `${g.type} (${g.target} in ${g.timeframe})`).join(', ');
      prompt += `\n- Current Goals: ${goals}`;
    }

    // Constraints
    prompt += `\n- Equipment: ${creatorProfile.constraints.equipment.join(', ')}
- Location: ${creatorProfile.constraints.location.join(', ')}
- Time Availability: ${creatorProfile.constraints.timeAvailability}`;

    // Focus area guidance
    const focusGuidance = {
      trending: 'Focus on current trends and viral content opportunities. Use trending hashtags and popular themes.',
      evergreen: 'Focus on timeless content that will remain relevant. Think classic themes and universal appeal.',
      seasonal: 'Focus on seasonal and holiday content. Consider upcoming events and seasonal trends.',
      monetization: 'Focus on content with high monetization potential. Think PPV-worthy and premium content.',
    };

    prompt += `\n\nFocus Area: ${focusGuidance[focusArea as keyof typeof focusGuidance]}`;

    // Trending data context
    if (context.trendAnalysis && context.trendAnalysis.length > 0) {
      const trends = context.trendAnalysis.slice(0, 5).map((t: TrendData) => `${t.keyword} (${t.popularity}% popular)`).join(', ');
      prompt += `\n\nCurrent Trends: ${trends}`;
    }

    // Category filter
    if (context.category) {
      prompt += `\n\nContent Category: Focus only on ${context.category} content`;
    }

    // Difficulty filter
    if (context.difficulty) {
      const difficultyGuidance = {
        easy: 'Simple content that can be created quickly with minimal setup',
        medium: 'Moderate complexity requiring some planning and setup',
        hard: 'Complex content requiring significant planning, equipment, or skills',
      };
      prompt += `\n\nDifficulty Level: ${difficultyGuidance[context.difficulty as keyof typeof difficultyGuidance]}`;
    }

    // Output format
    prompt += `\n\nFor each idea, provide:
1. Title (catchy and descriptive)
2. Description (detailed explanation of the content)
3. Category (photo/video/story/ppv/live)
4. Tags (relevant hashtags and keywords)
5. Difficulty (easy/medium/hard)
6. Estimated engagement potential (0-100)
7. Trend score (0-100)
8. PPV suitability (0-100)
9. Target audience details
10. Best timing suggestions

Format as JSON array with these fields:
- title
- description  
- category
- tags (array)
- difficulty
- estimatedEngagement
- trendScore
- ppvSuitability
- targetAudience
- timing

Generate creative, unique ideas that align with the creator's niche and goals.`;

    return prompt;
  }

  private async parseAIResponseToIdeas(
    aiResponse: string,
    creatorProfile: CreatorProfile,
    context: any
  ): Promise<ContentIdea[]> {
    try {
      // Try to extract JSON from AI response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }

      const rawIdeas = JSON.parse(jsonMatch[0]);
      const ideas: ContentIdea[] = [];

      for (const rawIdea of rawIdeas) {
        const idea: ContentIdea = {
          id: `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: rawIdea.title || 'Untitled Idea',
          description: rawIdea.description || 'No description provided',
          category: rawIdea.category || 'photo',
          tags: Array.isArray(rawIdea.tags) ? rawIdea.tags : [],
          difficulty: rawIdea.difficulty || 'medium',
          estimatedEngagement: Math.min(100, Math.max(0, rawIdea.estimatedEngagement || 50)),
          trendScore: Math.min(100, Math.max(0, rawIdea.trendScore || 50)),
          seasonality: rawIdea.timing ? {
            timeOfDay: rawIdea.timing.timeOfDay,
            dayOfWeek: rawIdea.timing.dayOfWeek,
          } : undefined,
          targetAudience: {
            demographics: rawIdea.targetAudience?.demographics || [],
            interests: rawIdea.targetAudience?.interests || [],
            spendingLevel: rawIdea.targetAudience?.spendingLevel,
          },
          monetizationPotential: {
            ppvSuitability: Math.min(100, Math.max(0, rawIdea.ppvSuitability || 30)),
            subscriptionValue: this.calculateSubscriptionValue(rawIdea, creatorProfile),
            tipPotential: this.calculateTipPotential(rawIdea, creatorProfile),
          },
          createdAt: new Date(),
        };

        ideas.push(idea);
      }

      return ideas;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Fallback: generate basic ideas
      return this.generateFallbackIdeas(creatorProfile, context);
    }
  }

  private calculateSubscriptionValue(rawIdea: any, creatorProfile: CreatorProfile): number {
    let value = 50; // Base value

    // Boost for evergreen content
    if (rawIdea.category === 'story' || rawIdea.category === 'photo') {
      value += 20;
    }

    // Boost for creator's successful niches
    const creatorNiches = creatorProfile.niche.map(n => n.toLowerCase());
    const ideaTags = (rawIdea.tags || []).map((t: string) => t.toLowerCase());
    const nicheMatch = ideaTags.some((tag: string) => creatorNiches.some(niche => tag.includes(niche)));
    if (nicheMatch) {
      value += 15;
    }

    return Math.min(100, Math.max(0, value));
  }

  private calculateTipPotential(rawIdea: any, creatorProfile: CreatorProfile): number {
    let potential = 40; // Base potential

    // Interactive content gets higher tip potential
    if (rawIdea.category === 'live' || rawIdea.category === 'story') {
      potential += 30;
    }

    // Personal/intimate content gets higher tip potential
    const personalKeywords = ['personal', 'intimate', 'exclusive', 'behind', 'private'];
    const hasPersonalContent = personalKeywords.some(keyword => 
      rawIdea.description?.toLowerCase().includes(keyword) ||
      rawIdea.title?.toLowerCase().includes(keyword)
    );
    if (hasPersonalContent) {
      potential += 20;
    }

    return Math.min(100, Math.max(0, potential));
  }

  private generateFallbackIdeas(creatorProfile: CreatorProfile, context: any): ContentIdea[] {
    const fallbackIdeas = [
      {
        title: 'Behind the Scenes Content',
        description: 'Show your creative process and daily routine',
        category: 'story' as const,
        tags: ['bts', 'authentic', 'personal'],
        difficulty: 'easy' as const,
      },
      {
        title: 'Q&A Session',
        description: 'Answer fan questions in an interactive format',
        category: 'live' as const,
        tags: ['interactive', 'qa', 'engagement'],
        difficulty: 'medium' as const,
      },
      {
        title: 'Exclusive Photo Set',
        description: 'Premium photo collection for VIP subscribers',
        category: 'ppv' as const,
        tags: ['exclusive', 'premium', 'photos'],
        difficulty: 'medium' as const,
      },
    ];

    return fallbackIdeas.map((idea, index) => ({
      id: `fallback_${Date.now()}_${index}`,
      ...idea,
      estimatedEngagement: 60,
      trendScore: 40,
      seasonality: undefined,
      targetAudience: {
        demographics: [],
        interests: creatorProfile.audiencePreferences,
      },
      monetizationPotential: {
        ppvSuitability: idea.category === 'ppv' ? 90 : 30,
        subscriptionValue: 60,
        tipPotential: 50,
      },
      createdAt: new Date(),
    }));
  }

  private async getTrendingTopics(niches: string[]): Promise<{
    data: TrendData[];
    tokensUsed?: number;
    cacheHit: boolean;
  }> {
    const cacheKey = niches.join(',');
    const cached = this.trendCache.get(cacheKey);
    
    // Use cache if less than 1 hour old
    if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_TTL) {
      this.logDebug('Trend cache hit', { cacheKey, age: Date.now() - cached.timestamp.getTime() });
      return { data: cached.data, cacheHit: true };
    }

    const prompt = `Analyze current trending topics and hashtags for content creators in these niches: ${niches.join(', ')}.

Provide trending keywords, hashtags, and themes that are currently popular. Include:
1. Keyword/hashtag
2. Popularity score (0-100)
3. Growth trend (positive/negative percentage)
4. Related keywords
5. Seasonality information

Focus on trends that content creators can leverage for engagement and monetization.

Format as JSON array with fields: keyword, popularity, growth, category, relatedKeywords, seasonality`;

    try {
      const response = await this.executeWithRetry(async () => {
        return await this.aiService.generateText({
          prompt,
          context: {
            userId: 'system',
            contentType: 'idea',
            metadata: { niches },
          },
          options: {
            temperature: 0.3,
            maxTokens: 1000,
          },
        });
      }, `getTrendingTopics for ${cacheKey}`);

      const trends = this.parseTrendResponse(response.content);
      
      // Cache the results
      this.trendCache.set(cacheKey, {
        data: trends,
        timestamp: new Date(),
      });

      this.logDebug('Trends generated and cached', { 
        cacheKey, 
        trendsCount: trends.length,
        tokensUsed: response.usage?.totalTokens,
      });

      return {
        data: trends,
        tokensUsed: response.usage?.totalTokens,
        cacheHit: false,
      };
    } catch (error) {
      this.logError('Failed to get trending topics', error as Error, { niches });
      const fallbackTrends = this.getFallbackTrends(niches);
      return {
        data: fallbackTrends,
        cacheHit: false,
      };
    }
  }

  private parseTrendResponse(response: string): TrendData[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      const rawTrends = JSON.parse(jsonMatch[0]);
      return rawTrends.map((trend: any) => ({
        keyword: trend.keyword || 'Unknown',
        popularity: Math.min(100, Math.max(0, trend.popularity || 50)),
        growth: trend.growth || 0,
        category: trend.category || 'general',
        relatedKeywords: Array.isArray(trend.relatedKeywords) ? trend.relatedKeywords : [],
        seasonality: trend.seasonality,
      }));
    } catch (error) {
      console.error('Failed to parse trend response:', error);
      return [];
    }
  }

  private getFallbackTrends(niches: string[]): TrendData[] {
    // Fallback trends based on common patterns
    return [
      {
        keyword: 'authentic',
        popularity: 85,
        growth: 15,
        category: 'lifestyle',
        relatedKeywords: ['real', 'genuine', 'unfiltered'],
      },
      {
        keyword: 'exclusive',
        popularity: 78,
        growth: 8,
        category: 'premium',
        relatedKeywords: ['vip', 'premium', 'limited'],
      },
      {
        keyword: 'interactive',
        popularity: 72,
        growth: 22,
        category: 'engagement',
        relatedKeywords: ['live', 'chat', 'qa'],
      },
    ];
  }

  private generateRecommendations(
    ideas: ContentIdea[],
    creatorProfile: CreatorProfile,
    trendAnalysis: TrendData[]
  ): string[] {
    const recommendations: string[] = [];

    // Analyze idea distribution
    const categoryDistribution = ideas.reduce((acc, idea) => {
      acc[idea.category] = (acc[idea.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recommend balance
    if (categoryDistribution.ppv && categoryDistribution.ppv > ideas.length * 0.6) {
      recommendations.push('Consider balancing PPV content with free content to maintain audience engagement');
    }

    if (!categoryDistribution.story || categoryDistribution.story < 2) {
      recommendations.push('Add more story content for daily engagement and audience connection');
    }

    // Trend-based recommendations
    if (trendAnalysis.length > 0) {
      const highGrowthTrends = trendAnalysis.filter(t => t.growth > 20);
      if (highGrowthTrends.length > 0) {
        recommendations.push(`Capitalize on fast-growing trends: ${highGrowthTrends.map(t => t.keyword).join(', ')}`);
      }
    }

    // Monetization recommendations
    const highPPVIdeas = ideas.filter(i => i.monetizationPotential.ppvSuitability > 70);
    if (highPPVIdeas.length > 0) {
      recommendations.push(`${highPPVIdeas.length} ideas have high PPV potential - prioritize these for revenue`);
    }

    // Difficulty recommendations
    const easyIdeas = ideas.filter(i => i.difficulty === 'easy');
    if (easyIdeas.length < ideas.length * 0.3) {
      recommendations.push('Add more easy-to-create content for consistent posting schedule');
    }

    return recommendations;
  }

  private generateNextSteps(ideas: ContentIdea[], creatorProfile: CreatorProfile): string[] {
    const nextSteps: string[] = [];

    // Prioritization steps
    nextSteps.push('Prioritize ideas based on your current goals and available time');
    
    // Planning steps
    const hardIdeas = ideas.filter(i => i.difficulty === 'hard');
    if (hardIdeas.length > 0) {
      nextSteps.push(`Plan complex content in advance: ${hardIdeas.length} ideas need extra preparation`);
    }

    // Content calendar steps
    nextSteps.push('Add selected ideas to your editorial calendar');
    nextSteps.push('Set up content creation schedule based on difficulty levels');

    // Equipment/resource steps
    const videoIdeas = ideas.filter(i => i.category === 'video' || i.category === 'live');
    if (videoIdeas.length > 0 && !creatorProfile.constraints.equipment.includes('camera')) {
      nextSteps.push('Consider upgrading equipment for video content creation');
    }

    // Engagement steps
    nextSteps.push('Prepare engagement strategies for each content type');
    nextSteps.push('Set up tracking to measure idea performance');

    return nextSteps;
  }

  // Error handling and retry utilities
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: APIError;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        this.logDebug(`Executing ${operationName}`, { attempt, maxAttempts: this.retryConfig.maxAttempts });
        return await operation();
      } catch (error) {
        // Enhance error with context
        lastError = enhanceErrorWithContext(error as Error, {
          operation: operationName,
          attempt,
          maxAttempts: this.retryConfig.maxAttempts,
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
        
        // Calculate delay using enhanced error utilities
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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private validateGenerationOptions(options: any): void {
    if (options.count && (options.count < 1 || options.count > 50)) {
      throw new ValidationError('Count must be between 1 and 50', { 
        provided: options.count,
        min: 1,
        max: 50,
      });
    }
    
    const validCategories = ['photo', 'video', 'story', 'ppv', 'live'];
    if (options.category && !validCategories.includes(options.category)) {
      throw new ValidationError('Invalid category specified', {
        provided: options.category,
        valid: validCategories,
      });
    }
    
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (options.difficulty && !validDifficulties.includes(options.difficulty)) {
      throw new ValidationError('Invalid difficulty specified', {
        provided: options.difficulty,
        valid: validDifficulties,
      });
    }
  }

  private logDebug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ContentIdeaGenerator] ${message}`, data || '');
    }
  }

  private logError(message: string, error: APIError, data?: any): void {
    if (shouldLogError(error)) {
      console.error(`[ContentIdeaGenerator] ${message}`, {
        ...formatErrorForLogging(error),
        ...data,
      });
    }
  }

  // Utility methods
  async brainstormWithAI(
    topic: string,
    creatorProfile: CreatorProfile,
    options: {
      style?: 'creative' | 'analytical' | 'practical';
      depth?: 'surface' | 'detailed' | 'comprehensive';
    } = {}
  ): Promise<{
    mainIdeas: string[];
    variations: string[];
    implementation: string[];
    considerations: string[];
  }> {
    const { style = 'creative', depth = 'detailed' } = options;

    const prompt = `Brainstorm content ideas around the topic: "${topic}"

Creator context:
- Niche: ${creatorProfile.niche.join(', ')}
- Content types: ${creatorProfile.contentTypes.join(', ')}
- Audience: ${creatorProfile.audiencePreferences.join(', ')}

Style: ${style}
Depth: ${depth}

Provide:
1. Main Ideas (3-5 core concepts)
2. Variations (different angles on each main idea)
3. Implementation (practical steps to create)
4. Considerations (potential challenges or opportunities)

Format as JSON with these arrays: mainIdeas, variations, implementation, considerations`;

    const response = await this.executeWithRetry(async () => {
      return await this.aiService.generateText({
        prompt,
        context: {
          userId: creatorProfile.id,
          contentType: 'idea',
          metadata: { topic, style, depth },
        },
        options: {
          temperature: style === 'creative' ? 0.9 : 0.6,
          maxTokens: 800,
        },
      });
    }, `brainstormWithAI for ${creatorProfile.id}`);

    try {
      const result = JSON.parse(response.content);
      return {
        mainIdeas: result.mainIdeas || [],
        variations: result.variations || [],
        implementation: result.implementation || [],
        considerations: result.considerations || [],
      };
    } catch (error) {
      // Fallback parsing
      return {
        mainIdeas: [topic],
        variations: ['Create different formats of this content'],
        implementation: ['Plan content creation', 'Set up equipment', 'Create and publish'],
        considerations: ['Audience engagement', 'Monetization potential', 'Time investment'],
      };
    }
  }

  getIdeaHistory(creatorId: string, limit?: number): ContentIdea[] {
    const history = this.ideaHistory.get(creatorId) || [];
    return limit ? history.slice(-limit) : history;
  }

  clearIdeaHistory(creatorId: string): void {
    this.ideaHistory.delete(creatorId);
  }

  analyzeIdeaPerformance(ideas: ContentIdea[]): {
    averageEngagement: number;
    topCategories: string[];
    trendAlignment: number;
    monetizationScore: number;
  } {
    if (ideas.length === 0) {
      return {
        averageEngagement: 0,
        topCategories: [],
        trendAlignment: 0,
        monetizationScore: 0,
      };
    }

    const averageEngagement = ideas.reduce((sum, idea) => sum + idea.estimatedEngagement, 0) / ideas.length;
    const trendAlignment = ideas.reduce((sum, idea) => sum + idea.trendScore, 0) / ideas.length;
    
    const categoryScores = ideas.reduce((acc, idea) => {
      acc[idea.category] = (acc[idea.category] || 0) + idea.estimatedEngagement;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    const monetizationScore = ideas.reduce((sum, idea) => {
      return sum + (
        idea.monetizationPotential.ppvSuitability * 0.4 +
        idea.monetizationPotential.subscriptionValue * 0.3 +
        idea.monetizationPotential.tipPotential * 0.3
      );
    }, 0) / ideas.length;

    return {
      averageEngagement: Math.round(averageEngagement),
      topCategories,
      trendAlignment: Math.round(trendAlignment),
      monetizationScore: Math.round(monetizationScore),
    };
  }
}

// Singleton instance
let contentIdeaGeneratorService: ContentIdeaGeneratorService | null = null;

export function getContentIdeaGeneratorService(): ContentIdeaGeneratorService {
  if (!contentIdeaGeneratorService) {
    contentIdeaGeneratorService = new ContentIdeaGeneratorService();
  }
  return contentIdeaGeneratorService;
}