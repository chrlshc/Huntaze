/**
 * ContentAgent - Handles caption and hashtag generation
 * 
 * Generates platform-optimized captions and hashtags
 * Requirements: 1.1, 1.2, 1.5
 */

import { AITeamMember, AIResponse } from './types';
import { AIKnowledgeNetwork, Insight } from '../knowledge-network';
import { generateTextWithBilling } from '../gemini-billing.service';

export class ContentAgent implements AITeamMember {
  id = 'content-agent';
  name = 'Content Agent';
  role = 'content_generation';
  model = 'gemini-2.5-flash'; // Use faster model for content generation
  
  private network: AIKnowledgeNetwork | null = null;

  /**
   * Initialize agent with Knowledge Network access
   */
  async initialize(network: AIKnowledgeNetwork): Promise<void> {
    this.network = network;
  }

  /**
   * Process a content generation request
   */
  async processRequest(request: {
    creatorId: number;
    platform: string;
    contentInfo: {
      type?: string;
      description?: string;
      mood?: string;
      targetAudience?: string;
    };
  }): Promise<AIResponse> {
    try {
      const result = await this.generateCaption(
        request.creatorId,
        request.platform,
        request.contentInfo
      );
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate caption and hashtags for content
   * 
   * Requirements:
   * - 1.1: Generate platform-specific optimized captions
   * - 1.2: Use insights from analytics about what performs well
   * - 1.5: Store content performance insights
   */
  async generateCaption(
    creatorId: number,
    platform: string,
    contentInfo: {
      type?: string;
      description?: string;
      mood?: string;
      targetAudience?: string;
    }
  ): Promise<{
    caption: string;
    hashtags: string[];
    confidence: number;
    usage: {
      model: string;
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
    };
  }> {
    // Get relevant insights from Knowledge Network
    const insights = await this.getRelevantInsights(creatorId, platform);
    
    // Build prompt with platform-specific optimization
    const prompt = this.buildPrompt(platform, contentInfo, insights);
    
    // Generate caption via Gemini
    const result = await generateTextWithBilling({
      prompt,
      metadata: {
        creatorId,
        feature: 'content_generation',
        agentId: this.id,
      },
      model: this.model,
      temperature: 0.9, // Higher temperature for creative content
      maxOutputTokens: 300,
    });

    // Parse response
    const captionData = this.parseResponse(result.text);
    
    // Store content strategy insight
    if (captionData.confidence > 0.7 && this.network) {
      await this.storeContentInsight(creatorId, platform, contentInfo, captionData);
    }

    return {
      ...captionData,
      usage: result.usage,
    };
  }

  /**
   * Get relevant insights from Knowledge Network
   */
  private async getRelevantInsights(creatorId: number, platform: string): Promise<{
    contentStrategies: Insight[];
    performancePatterns: Insight[];
    trendingTopics: Insight[];
  }> {
    if (!this.network) {
      return { contentStrategies: [], performancePatterns: [], trendingTopics: [] };
    }

    const [contentStrategies, performancePatterns, trendingTopics] = await Promise.all([
      this.network.getRelevantInsights(creatorId, 'content_strategy', 3),
      this.network.getRelevantInsights(creatorId, 'performance_pattern', 3),
      this.network.getRelevantInsights(creatorId, 'trending_topic', 5),
    ]);

    return {
      contentStrategies,
      performancePatterns,
      trendingTopics,
    };
  }

  /**
   * Build prompt with platform-specific optimization
   */
  private buildPrompt(
    platform: string,
    contentInfo: {
      type?: string;
      description?: string;
      mood?: string;
      targetAudience?: string;
    },
    insights?: {
      contentStrategies: Insight[];
      performancePatterns: Insight[];
      trendingTopics: Insight[];
    }
  ): string {
    let prompt = `You are an AI assistant helping an OnlyFans creator generate engaging captions for ${platform}.

Content details:
- Type: ${contentInfo.type || 'general'}
- Description: ${contentInfo.description || 'not provided'}
- Mood: ${contentInfo.mood || 'engaging'}
- Target audience: ${contentInfo.targetAudience || 'general fans'}

`;

    // Add platform-specific guidelines
    prompt += this.getPlatformGuidelines(platform);

    // Add insights from Knowledge Network
    if (insights) {
      if (insights.performancePatterns.length > 0) {
        prompt += `\nContent that has performed well:\n`;
        insights.performancePatterns.forEach(insight => {
          prompt += `- ${JSON.stringify(insight.data)}\n`;
        });
      }

      if (insights.trendingTopics.length > 0) {
        prompt += `\nTrending topics to consider:\n`;
        insights.trendingTopics.forEach(insight => {
          prompt += `- ${JSON.stringify(insight.data)}\n`;
        });
      }
    }

    prompt += `\nGenerate a caption that:
1. Is optimized for ${platform}'s algorithm
2. Matches the specified mood and content type
3. Includes a call-to-action when appropriate
4. Maintains brand voice consistency
5. Encourages engagement (likes, comments, shares)

Also suggest relevant hashtags that:
1. Are trending and relevant
2. Mix popular and niche tags
3. Are appropriate for the platform
4. Help reach the target audience

Return your response in this JSON format:
{
  "caption": "the caption text",
  "hashtags": ["tag1", "tag2", "tag3"],
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

    return prompt;
  }

  /**
   * Get platform-specific guidelines
   */
  private getPlatformGuidelines(platform: string): string {
    const guidelines: Record<string, string> = {
      instagram: `
Instagram guidelines:
- Keep captions concise but engaging (150-200 characters ideal)
- Use 5-10 relevant hashtags
- Include emojis strategically
- Ask questions to drive comments
- Use line breaks for readability
`,
      twitter: `
Twitter guidelines:
- Keep under 280 characters
- Use 1-3 hashtags maximum
- Make it shareable and quotable
- Include a hook in the first line
- Consider thread potential
`,
      tiktok: `
TikTok guidelines:
- Keep captions short and punchy
- Use trending sounds/hashtags
- Include a hook or question
- Use 3-5 hashtags
- Encourage duets/stitches
`,
      onlyfans: `
OnlyFans guidelines:
- Be enticing but not explicit in preview
- Create curiosity and FOMO
- Mention exclusive content
- Use emojis to add personality
- Include call-to-action for engagement
`,
      default: `
General guidelines:
- Be authentic and engaging
- Match the creator's brand voice
- Include relevant hashtags
- Encourage interaction
`,
    };

    return guidelines[platform.toLowerCase()] || guidelines.default;
  }

  /**
   * Parse the AI response
   */
  private parseResponse(text: string): {
    caption: string;
    hashtags: string[];
    confidence: number;
  } {
    try {
      const parsed = JSON.parse(text);
      return {
        caption: parsed.caption || text,
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
        confidence: parsed.confidence || 0.5,
      };
    } catch {
      // If not JSON, extract hashtags from text
      const hashtagRegex = /#[\w]+/g;
      const hashtags = text.match(hashtagRegex) || [];
      const caption = text.replace(hashtagRegex, '').trim();
      
      return {
        caption,
        hashtags: hashtags.map(tag => tag.substring(1)), // Remove # prefix
        confidence: 0.5,
      };
    }
  }

  /**
   * Store content strategy insight
   */
  private async storeContentInsight(
    creatorId: number,
    platform: string,
    contentInfo: any,
    captionData: {
      caption: string;
      hashtags: string[];
      confidence: number;
    }
  ): Promise<void> {
    if (!this.network) return;

    const insight: Insight = {
      source: this.id,
      type: 'content_strategy',
      confidence: captionData.confidence,
      data: {
        platform,
        contentType: contentInfo.type,
        mood: contentInfo.mood,
        hashtagCount: captionData.hashtags.length,
        captionLength: captionData.caption.length,
        hasCallToAction: this.hasCallToAction(captionData.caption),
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    };

    await this.network.broadcastInsight(creatorId, insight);
  }

  /**
   * Check if caption has a call-to-action
   */
  private hasCallToAction(caption: string): boolean {
    const ctaKeywords = [
      'click', 'link', 'bio', 'subscribe', 'follow', 'comment',
      'share', 'tag', 'dm', 'message', 'check out', 'visit'
    ];
    
    const lower = caption.toLowerCase();
    return ctaKeywords.some(keyword => lower.includes(keyword));
  }
}
