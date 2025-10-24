import { getAIService } from './ai-service';
import { z } from 'zod';

// Caption and hashtag schemas
export const CaptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  tone: z.enum(['friendly', 'flirty', 'professional', 'playful', 'intimate', 'mysterious', 'confident']),
  length: z.enum(['short', 'medium', 'long']),
  includesEmojis: z.boolean(),
  includesHashtags: z.boolean(),
  callToAction: z.string().optional(),
  engagementScore: z.number().min(0).max(100),
  createdAt: z.date(),
});

export type Caption = z.infer<typeof CaptionSchema>;

export const HashtagSetSchema = z.object({
  id: z.string(),
  hashtags: z.array(z.string()),
  category: z.enum(['trending', 'niche', 'branded', 'engagement', 'discovery']),
  totalReach: z.number().min(0).optional(),
  competitionLevel: z.enum(['low', 'medium', 'high']),
  effectiveness: z.number().min(0).max(100),
  createdAt: z.date(),
});

export type HashtagSet = z.infer<typeof HashtagSetSchema>;

// Content context for caption generation
export interface ContentContext {
  type: 'photo' | 'video' | 'story' | 'ppv' | 'live';
  description: string;
  mood: string;
  setting: string;
  style: string;
  targetAudience: {
    demographics: string[];
    interests: string[];
    engagementPreferences: string[];
  };
  monetizationGoal?: 'subscription' | 'tips' | 'ppv' | 'engagement';
  brandVoice?: {
    personality: string[];
    avoidWords: string[];
    preferredStyle: string;
  };
}

// Creator's content strategy
export interface ContentStrategy {
  primaryNiche: string;
  secondaryNiches: string[];
  brandKeywords: string[];
  competitorAnalysis: {
    successfulHashtags: string[];
    engagementPatterns: Record<string, number>;
  };
  audienceInsights: {
    peakEngagementTimes: string[];
    preferredContentLength: 'short' | 'medium' | 'long';
    responseToEmojis: 'positive' | 'neutral' | 'negative';
    hashtagPreferences: string[];
  };
}

// Caption and hashtag generation service
export class CaptionHashtagGeneratorService {
  private aiService = getAIService();
  private hashtagDatabase: Map<string, HashtagSet[]> = new Map();
  private captionHistory: Map<string, Caption[]> = new Map();
  private performanceData: Map<string, { caption: string; engagement: number; reach: number }[]> = new Map();

  constructor() {
    this.initializeHashtagDatabase();
  }

  private initializeHashtagDatabase() {
    // Initialize with common hashtag sets by category
    const hashtagSets: HashtagSet[] = [
      {
        id: 'trending-general',
        hashtags: ['#trending', '#viral', '#fyp', '#explore', '#instagood', '#photooftheday'],
        category: 'trending',
        competitionLevel: 'high',
        effectiveness: 75,
        createdAt: new Date(),
      },
      {
        id: 'engagement-boosters',
        hashtags: ['#like4like', '#follow4follow', '#comment4comment', '#engagement', '#community'],
        category: 'engagement',
        competitionLevel: 'medium',
        effectiveness: 60,
        createdAt: new Date(),
      },
      {
        id: 'content-creator',
        hashtags: ['#contentcreator', '#creator', '#influencer', '#content', '#creative'],
        category: 'niche',
        competitionLevel: 'medium',
        effectiveness: 70,
        createdAt: new Date(),
      },
    ];

    hashtagSets.forEach(set => {
      const existing = this.hashtagDatabase.get(set.category) || [];
      this.hashtagDatabase.set(set.category, [...existing, set]);
    });
  }

  async generateCaption(
    contentContext: ContentContext,
    strategy: ContentStrategy,
    options: {
      tone?: Caption['tone'];
      length?: Caption['length'];
      includeEmojis?: boolean;
      includeHashtags?: boolean;
      includeCallToAction?: boolean;
      customPrompt?: string;
      variations?: number;
    } = {}
  ): Promise<{
    captions: Caption[];
    recommendations: string[];
    hashtagSuggestions: string[];
  }> {
    const {
      tone = 'friendly',
      length = 'medium',
      includeEmojis = true,
      includeHashtags = false,
      includeCallToAction = true,
      variations = 3,
      customPrompt,
    } = options;

    // Generate multiple caption variations
    const captions: Caption[] = [];
    
    for (let i = 0; i < variations; i++) {
      const caption = await this.generateSingleCaption(
        contentContext,
        strategy,
        { tone, length, includeEmojis, includeCallToAction, customPrompt }
      );
      captions.push(caption);
    }

    // Generate hashtag suggestions
    const hashtagSuggestions = await this.generateHashtagSuggestions(contentContext, strategy);

    // Generate recommendations
    const recommendations = this.generateCaptionRecommendations(captions, contentContext, strategy);

    return {
      captions,
      recommendations,
      hashtagSuggestions,
    };
  }

  private async generateSingleCaption(
    contentContext: ContentContext,
    strategy: ContentStrategy,
    options: any
  ): Promise<Caption> {
    const prompt = this.buildCaptionPrompt(contentContext, strategy, options);

    const response = await this.aiService.generateText({
      prompt,
      context: {
        userId: 'caption_generation',
        contentType: 'caption',
        metadata: {
          tone: options.tone,
          length: options.length,
          contentType: contentContext.type,
        },
      },
      options: {
        temperature: 0.8,
        maxTokens: this.getMaxTokensForLength(options.length),
      },
    });

    const captionText = this.cleanCaptionText(response.content);
    const engagementScore = this.calculateEngagementScore(captionText, contentContext, strategy);

    return {
      id: `caption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: captionText,
      tone: options.tone,
      length: options.length,
      includesEmojis: this.hasEmojis(captionText),
      includesHashtags: this.hasHashtags(captionText),
      callToAction: this.extractCallToAction(captionText),
      engagementScore,
      createdAt: new Date(),
    };
  }

  private buildCaptionPrompt(
    contentContext: ContentContext,
    strategy: ContentStrategy,
    options: any
  ): string {
    let prompt = `Write a ${options.tone} caption for ${contentContext.type} content.`;

    // Content context
    prompt += `\n\nContent Details:
- Type: ${contentContext.type}
- Description: ${contentContext.description}
- Mood: ${contentContext.mood}
- Setting: ${contentContext.setting}
- Style: ${contentContext.style}`;

    // Target audience
    prompt += `\n\nTarget Audience:
- Demographics: ${contentContext.targetAudience.demographics.join(', ')}
- Interests: ${contentContext.targetAudience.interests.join(', ')}
- Engagement Preferences: ${contentContext.targetAudience.engagementPreferences.join(', ')}`;

    // Brand voice
    if (contentContext.brandVoice) {
      prompt += `\n\nBrand Voice:
- Personality: ${contentContext.brandVoice.personality.join(', ')}
- Style: ${contentContext.brandVoice.preferredStyle}`;
      
      if (contentContext.brandVoice.avoidWords.length > 0) {
        prompt += `\n- Avoid: ${contentContext.brandVoice.avoidWords.join(', ')}`;
      }
    }

    // Strategy context
    prompt += `\n\nContent Strategy:
- Primary Niche: ${strategy.primaryNiche}
- Brand Keywords: ${strategy.brandKeywords.join(', ')}`;

    // Monetization goal
    if (contentContext.monetizationGoal) {
      const goalGuidance = {
        subscription: 'Encourage subscription or following',
        tips: 'Encourage tips and appreciation',
        ppv: 'Tease premium content without revealing too much',
        engagement: 'Focus on likes, comments, and shares',
      };
      prompt += `\n\nMonetization Goal: ${goalGuidance[contentContext.monetizationGoal]}`;
    }

    // Length guidance
    const lengthGuidance = {
      short: 'Keep it concise - 1-2 sentences, under 100 characters',
      medium: 'Moderate length - 2-4 sentences, 100-200 characters',
      long: 'Detailed caption - multiple sentences, 200+ characters with storytelling',
    };
    prompt += `\n\nLength: ${lengthGuidance[options.length]}`;

    // Tone guidance
    const toneGuidance = {
      friendly: 'Warm, approachable, and welcoming',
      flirty: 'Playful, teasing, and charming',
      professional: 'Polished, informative, and authoritative',
      playful: 'Fun, energetic, and lighthearted',
      intimate: 'Personal, close, and exclusive feeling',
      mysterious: 'Intriguing, enigmatic, and curiosity-inducing',
      confident: 'Bold, self-assured, and empowering',
    };
    prompt += `\n\nTone: ${toneGuidance[options.tone]}`;

    // Emoji guidance
    if (options.includeEmojis) {
      prompt += `\n\nEmojis: Include relevant emojis naturally throughout the caption`;
    } else {
      prompt += `\n\nEmojis: Do not include any emojis`;
    }

    // Call to action guidance
    if (options.includeCallToAction) {
      prompt += `\n\nCall to Action: Include a natural call to action that encourages engagement`;
    }

    // Custom prompt addition
    if (options.customPrompt) {
      prompt += `\n\nAdditional Instructions: ${options.customPrompt}`;
    }

    // Audience insights
    if (strategy.audienceInsights.preferredContentLength) {
      prompt += `\n\nAudience Preference: They prefer ${strategy.audienceInsights.preferredContentLength} content`;
    }

    prompt += `\n\nGenerate only the caption text, no additional formatting or explanations.`;

    return prompt;
  }

  async generateHashtagSuggestions(
    contentContext: ContentContext,
    strategy: ContentStrategy,
    options: {
      count?: number;
      mix?: 'trending' | 'niche' | 'balanced';
      competitionLevel?: 'low' | 'medium' | 'high' | 'mixed';
      includeCustom?: boolean;
    } = {}
  ): Promise<string[]> {
    const {
      count = 20,
      mix = 'balanced',
      competitionLevel = 'mixed',
      includeCustom = true,
    } = options;

    let hashtags: string[] = [];

    // Get hashtags from database
    hashtags = [...hashtags, ...this.getHashtagsFromDatabase(mix, competitionLevel)];

    // Generate custom hashtags with AI if requested
    if (includeCustom) {
      const customHashtags = await this.generateCustomHashtags(contentContext, strategy);
      hashtags = [...hashtags, ...customHashtags];
    }

    // Add strategy-specific hashtags
    hashtags = [...hashtags, ...strategy.brandKeywords.map(k => `#${k.replace(/\s+/g, '').toLowerCase()}`)];

    // Remove duplicates and filter
    hashtags = [...new Set(hashtags)]
      .filter(tag => tag.startsWith('#'))
      .filter(tag => tag.length > 2 && tag.length < 30)
      .slice(0, count);

    return hashtags;
  }

  private getHashtagsFromDatabase(mix: string, competitionLevel: string): string[] {
    let hashtags: string[] = [];

    const categories = mix === 'balanced' 
      ? ['trending', 'niche', 'engagement'] 
      : [mix];

    categories.forEach(category => {
      const sets = this.hashtagDatabase.get(category) || [];
      sets.forEach(set => {
        if (competitionLevel === 'mixed' || set.competitionLevel === competitionLevel) {
          hashtags = [...hashtags, ...set.hashtags];
        }
      });
    });

    return hashtags;
  }

  private async generateCustomHashtags(
    contentContext: ContentContext,
    strategy: ContentStrategy
  ): Promise<string[]> {
    const prompt = `Generate relevant hashtags for ${contentContext.type} content.

Content Context:
- Description: ${contentContext.description}
- Mood: ${contentContext.mood}
- Setting: ${contentContext.setting}
- Niche: ${strategy.primaryNiche}

Generate 10-15 specific, relevant hashtags that would help this content get discovered by the right audience. Include:
- Content-specific hashtags
- Niche-related hashtags  
- Mood/aesthetic hashtags
- Location-based hashtags (if relevant)

Format as a simple list of hashtags with # symbol.`;

    try {
      const response = await this.aiService.generateText({
        prompt,
        context: {
          userId: 'hashtag_generation',
          contentType: 'hashtags',
          metadata: {
            niche: strategy.primaryNiche,
            contentType: contentContext.type,
          },
        },
        options: {
          temperature: 0.7,
          maxTokens: 300,
        },
      });

      return this.parseHashtagsFromResponse(response.content);
    } catch (error) {
      console.error('Failed to generate custom hashtags:', error);
      return [];
    }
  }

  private parseHashtagsFromResponse(response: string): string[] {
    const hashtags = response
      .split(/\s+/)
      .filter(word => word.startsWith('#'))
      .map(tag => tag.replace(/[^\w#]/g, ''))
      .filter(tag => tag.length > 2);

    return [...new Set(hashtags)];
  }

  async optimizeHashtagMix(
    baseHashtags: string[],
    performanceData: { hashtag: string; engagement: number; reach: number }[]
  ): Promise<{
    optimizedHashtags: string[];
    recommendations: string[];
    expectedImprovement: number;
  }> {
    // Analyze performance data
    const hashtagPerformance = new Map<string, { engagement: number; reach: number; count: number }>();
    
    performanceData.forEach(data => {
      const existing = hashtagPerformance.get(data.hashtag) || { engagement: 0, reach: 0, count: 0 };
      hashtagPerformance.set(data.hashtag, {
        engagement: existing.engagement + data.engagement,
        reach: existing.reach + data.reach,
        count: existing.count + 1,
      });
    });

    // Calculate average performance for each hashtag
    const avgPerformance = Array.from(hashtagPerformance.entries()).map(([hashtag, data]) => ({
      hashtag,
      avgEngagement: data.engagement / data.count,
      avgReach: data.reach / data.count,
      score: (data.engagement / data.count) * 0.7 + (data.reach / data.count) * 0.3,
    }));

    // Sort by performance score
    avgPerformance.sort((a, b) => b.score - a.score);

    // Select top performing hashtags
    const topPerformers = avgPerformance.slice(0, Math.ceil(baseHashtags.length * 0.6));
    const optimizedHashtags = [
      ...topPerformers.map(p => p.hashtag),
      ...baseHashtags.filter(tag => !topPerformers.some(p => p.hashtag === tag)).slice(0, Math.floor(baseHashtags.length * 0.4))
    ];

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (topPerformers.length > 0) {
      recommendations.push(`Top performing hashtags: ${topPerformers.slice(0, 3).map(p => p.hashtag).join(', ')}`);
    }

    const lowPerformers = avgPerformance.slice(-3);
    if (lowPerformers.length > 0) {
      recommendations.push(`Consider replacing: ${lowPerformers.map(p => p.hashtag).join(', ')}`);
    }

    // Calculate expected improvement
    const currentAvgScore = avgPerformance.reduce((sum, p) => sum + p.score, 0) / avgPerformance.length;
    const optimizedAvgScore = topPerformers.reduce((sum, p) => sum + p.score, 0) / topPerformers.length;
    const expectedImprovement = ((optimizedAvgScore - currentAvgScore) / currentAvgScore) * 100;

    return {
      optimizedHashtags,
      recommendations,
      expectedImprovement: Math.max(0, expectedImprovement),
    };
  }

  // Utility methods
  private getMaxTokensForLength(length: Caption['length']): number {
    switch (length) {
      case 'short': return 100;
      case 'medium': return 200;
      case 'long': return 400;
      default: return 200;
    }
  }

  private cleanCaptionText(text: string): string {
    return text
      .trim()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
      .trim();
  }

  private hasEmojis(text: string): boolean {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    return emojiRegex.test(text);
  }

  private hasHashtags(text: string): boolean {
    return text.includes('#');
  }

  private extractCallToAction(text: string): string | undefined {
    // Look for common CTA patterns
    const ctaPatterns = [
      /what do you think\?/i,
      /let me know/i,
      /comment below/i,
      /tell me/i,
      /share your/i,
      /follow for/i,
      /like if/i,
      /tag someone/i,
      /check out/i,
      /swipe for/i,
    ];

    for (const pattern of ctaPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Extract the sentence containing the CTA
        const sentences = text.split(/[.!?]+/);
        const ctaSentence = sentences.find(sentence => pattern.test(sentence));
        return ctaSentence?.trim();
      }
    }

    return undefined;
  }

  private calculateEngagementScore(
    caption: string,
    contentContext: ContentContext,
    strategy: ContentStrategy
  ): number {
    let score = 50; // Base score

    // Length optimization
    const charCount = caption.length;
    if (strategy.audienceInsights.preferredContentLength === 'short' && charCount < 100) {
      score += 15;
    } else if (strategy.audienceInsights.preferredContentLength === 'medium' && charCount >= 100 && charCount <= 200) {
      score += 15;
    } else if (strategy.audienceInsights.preferredContentLength === 'long' && charCount > 200) {
      score += 15;
    }

    // Emoji usage
    if (this.hasEmojis(caption) && strategy.audienceInsights.responseToEmojis === 'positive') {
      score += 10;
    } else if (!this.hasEmojis(caption) && strategy.audienceInsights.responseToEmojis === 'negative') {
      score += 5;
    }

    // Call to action presence
    if (this.extractCallToAction(caption)) {
      score += 15;
    }

    // Brand keyword usage
    const lowerCaption = caption.toLowerCase();
    const brandKeywordCount = strategy.brandKeywords.filter(keyword => 
      lowerCaption.includes(keyword.toLowerCase())
    ).length;
    score += Math.min(10, brandKeywordCount * 3);

    // Niche relevance
    if (lowerCaption.includes(strategy.primaryNiche.toLowerCase())) {
      score += 10;
    }

    // Question engagement
    if (caption.includes('?')) {
      score += 8;
    }

    return Math.min(100, Math.max(0, score));
  }

  private generateCaptionRecommendations(
    captions: Caption[],
    contentContext: ContentContext,
    strategy: ContentStrategy
  ): string[] {
    const recommendations: string[] = [];

    // Analyze caption variations
    const avgEngagement = captions.reduce((sum, c) => sum + c.engagementScore, 0) / captions.length;
    const bestCaption = captions.reduce((best, current) => 
      current.engagementScore > best.engagementScore ? current : best
    );

    recommendations.push(`Best performing variation has ${bestCaption.tone} tone with ${bestCaption.engagementScore}% engagement score`);

    // Length recommendations
    const lengthPerformance = captions.reduce((acc, caption) => {
      acc[caption.length] = (acc[caption.length] || 0) + caption.engagementScore;
      return acc;
    }, {} as Record<string, number>);

    const bestLength = Object.entries(lengthPerformance).reduce((best, [length, score]) => 
      score > best.score ? { length, score } : best
    , { length: 'medium', score: 0 });

    recommendations.push(`${bestLength.length} captions perform best for your audience`);

    // Emoji recommendations
    const emojiCaptions = captions.filter(c => c.includesEmojis);
    const noEmojiCaptions = captions.filter(c => !c.includesEmojis);

    if (emojiCaptions.length > 0 && noEmojiCaptions.length > 0) {
      const emojiAvg = emojiCaptions.reduce((sum, c) => sum + c.engagementScore, 0) / emojiCaptions.length;
      const noEmojiAvg = noEmojiCaptions.reduce((sum, c) => sum + c.engagementScore, 0) / noEmojiCaptions.length;

      if (emojiAvg > noEmojiAvg) {
        recommendations.push('Emojis improve engagement for your content');
      } else {
        recommendations.push('Consider reducing emoji usage for better engagement');
      }
    }

    // CTA recommendations
    const ctaCaptions = captions.filter(c => c.callToAction);
    if (ctaCaptions.length > 0) {
      const ctaAvg = ctaCaptions.reduce((sum, c) => sum + c.engagementScore, 0) / ctaCaptions.length;
      if (ctaAvg > avgEngagement) {
        recommendations.push('Call-to-action increases engagement - include in final caption');
      }
    }

    return recommendations;
  }

  // Performance tracking methods
  trackCaptionPerformance(
    captionId: string,
    metrics: {
      likes: number;
      comments: number;
      shares: number;
      reach: number;
      impressions: number;
    }
  ): void {
    // Calculate engagement rate
    const engagement = (metrics.likes + metrics.comments + metrics.shares) / metrics.impressions * 100;
    
    // Store performance data (in a real app, this would go to a database)
    const userId = 'current_user'; // This would come from context
    const existing = this.performanceData.get(userId) || [];
    existing.push({
      caption: captionId,
      engagement,
      reach: metrics.reach,
    });
    this.performanceData.set(userId, existing);
  }

  getCaptionHistory(userId: string, limit?: number): Caption[] {
    const history = this.captionHistory.get(userId) || [];
    return limit ? history.slice(-limit) : history;
  }

  analyzeCaptionTrends(userId: string): {
    bestPerformingTones: string[];
    optimalLength: Caption['length'];
    emojiEffectiveness: number;
    ctaEffectiveness: number;
  } {
    const history = this.getCaptionHistory(userId);
    
    if (history.length === 0) {
      return {
        bestPerformingTones: ['friendly'],
        optimalLength: 'medium',
        emojiEffectiveness: 50,
        ctaEffectiveness: 50,
      };
    }

    // Analyze tone performance
    const tonePerformance = history.reduce((acc, caption) => {
      acc[caption.tone] = (acc[caption.tone] || 0) + caption.engagementScore;
      return acc;
    }, {} as Record<string, number>);

    const bestPerformingTones = Object.entries(tonePerformance)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([tone]) => tone);

    // Analyze length performance
    const lengthPerformance = history.reduce((acc, caption) => {
      acc[caption.length] = (acc[caption.length] || 0) + caption.engagementScore;
      return acc;
    }, {} as Record<Caption['length'], number>);

    const optimalLength = Object.entries(lengthPerformance).reduce((best, [length, score]) => 
      score > best.score ? { length: length as Caption['length'], score } : best
    , { length: 'medium' as Caption['length'], score: 0 }).length;

    // Analyze emoji effectiveness
    const emojiCaptions = history.filter(c => c.includesEmojis);
    const noEmojiCaptions = history.filter(c => !c.includesEmojis);
    
    const emojiAvg = emojiCaptions.length > 0 
      ? emojiCaptions.reduce((sum, c) => sum + c.engagementScore, 0) / emojiCaptions.length 
      : 50;
    const noEmojiAvg = noEmojiCaptions.length > 0 
      ? noEmojiCaptions.reduce((sum, c) => sum + c.engagementScore, 0) / noEmojiCaptions.length 
      : 50;

    const emojiEffectiveness = emojiCaptions.length > 0 && noEmojiCaptions.length > 0
      ? (emojiAvg / noEmojiAvg) * 50
      : 50;

    // Analyze CTA effectiveness
    const ctaCaptions = history.filter(c => c.callToAction);
    const noctaCaptions = history.filter(c => !c.callToAction);
    
    const ctaAvg = ctaCaptions.length > 0 
      ? ctaCaptions.reduce((sum, c) => sum + c.engagementScore, 0) / ctaCaptions.length 
      : 50;
    const noctaAvg = noctaCaptions.length > 0 
      ? noctaCaptions.reduce((sum, c) => sum + c.engagementScore, 0) / noctaCaptions.length 
      : 50;

    const ctaEffectiveness = ctaCaptions.length > 0 && noctaCaptions.length > 0
      ? (ctaAvg / noctaAvg) * 50
      : 50;

    return {
      bestPerformingTones,
      optimalLength,
      emojiEffectiveness: Math.min(100, Math.max(0, emojiEffectiveness)),
      ctaEffectiveness: Math.min(100, Math.max(0, ctaEffectiveness)),
    };
  }
}

// Singleton instance
let captionHashtagGeneratorService: CaptionHashtagGeneratorService | null = null;

export function getCaptionHashtagGeneratorService(): CaptionHashtagGeneratorService {
  if (!captionHashtagGeneratorService) {
    captionHashtagGeneratorService = new CaptionHashtagGeneratorService();
  }
  return captionHashtagGeneratorService;
}