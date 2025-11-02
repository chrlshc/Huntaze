export interface AIContentRequest {
  type: 'ideas' | 'caption' | 'hashtags' | 'improvement';
  context?: {
    existingContent?: string;
    targetPlatforms?: string[];
    tone?: 'professional' | 'casual' | 'humorous' | 'inspirational';
    topic?: string;
  };
  userHistory?: {
    topPerformingContent?: string[];
    engagementPatterns?: Record<string, number>;
  };
}

export interface AISuggestion {
  id: string;
  type: string;
  content: string;
  confidence: number;
  reasoning?: string;
}

export class AIContentService {
  async generateCaption(params: {
    prompt: string;
    platform: string;
    tone: string;
    includeHashtags: boolean;
  }): Promise<string> {
    const { prompt, platform, tone, includeHashtags } = params;
    
    // Generate caption based on parameters
    let caption = '';
    
    if (tone === 'professional') {
      caption = `Excited to share insights on ${prompt}. Your feedback is always appreciated.`;
    } else if (tone === 'casual') {
      caption = `Hey everyone! Check out this ${prompt} 🌟 What do you think?`;
    } else if (tone === 'humorous') {
      caption = `When ${prompt} hits different 😂 Tag someone who needs to see this!`;
    } else {
      caption = `Sharing some thoughts on ${prompt}. Let me know your perspective!`;
    }
    
    // Add hashtags if requested
    if (includeHashtags) {
      const hashtags = await this.suggestHashtags(prompt, platform);
      caption += `\n\n${hashtags.slice(0, 5).map(h => `#${h}`).join(' ')}`;
    }
    
    return caption;
  }

  async suggestHashtags(topic: string, platform: string): Promise<string[]> {
    // Generate relevant hashtags based on topic and platform
    const baseHashtags = [
      'contentcreator',
      'socialmedia',
      'digitalmarketing',
      'creativity',
      'inspiration'
    ];
    
    // Platform-specific hashtags
    const platformHashtags: Record<string, string[]> = {
      instagram: ['instagood', 'photooftheday', 'instadaily', 'explore'],
      tiktok: ['fyp', 'foryou', 'viral', 'trending'],
      twitter: ['thread', 'discussion', 'community'],
      linkedin: ['professional', 'business', 'networking', 'career']
    };
    
    const platformSpecific = platformHashtags[platform.toLowerCase()] || [];
    
    return [...baseHashtags, ...platformSpecific].slice(0, 10);
  }

  async generateSuggestions(request: AIContentRequest): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];
    
    switch (request.type) {
      case 'ideas':
        suggestions.push(
          { id: '1', type: 'idea', content: 'Share a behind-the-scenes look at your creative process', confidence: 0.85, reasoning: 'Behind-the-scenes content typically gets 40% higher engagement' },
          { id: '2', type: 'idea', content: 'Create a tutorial or how-to guide related to your expertise', confidence: 0.78, reasoning: 'Educational content drives strong audience retention' },
          { id: '3', type: 'idea', content: 'Ask your audience a question to boost engagement', confidence: 0.72, reasoning: 'Question posts increase comments by 60% on average' }
        );
        break;
        
      case 'caption':
        const tone = request.context?.tone || 'casual';
        if (tone === 'professional') {
          suggestions.push({ id: '1', type: 'caption', content: 'Excited to share this milestone with our community. Your support has been instrumental in our journey.', confidence: 0.88, reasoning: 'Professional tone with gratitude performs well in B2B contexts' });
        } else {
          suggestions.push({ id: '1', type: 'caption', content: "Can't believe how far we've come! Thanks for being part of this amazing journey 🙌", confidence: 0.82, reasoning: 'Casual tone with emojis increases relatability' });
        }
        break;
        
      case 'hashtags':
        suggestions.push({ id: '1', type: 'hashtags', content: '#contentcreator #socialmedia #digitalmarketing #creativity #inspiration #entrepreneur #smallbusiness #growth #community #engagement', confidence: 0.75, reasoning: 'Mix of broad and niche hashtags for optimal reach' });
        break;
        
      case 'improvement':
        if (request.context?.existingContent) {
          suggestions.push({ id: '1', type: 'improvement', content: 'Consider adding a call-to-action to increase engagement. Try asking viewers to share their thoughts in the comments.', confidence: 0.80, reasoning: 'Posts with clear CTAs see 25% more engagement' });
        }
        break;
    }
    
    return suggestions;
  },

  async analyzeUserContent(userId: string): Promise<{ topPerformingContent: string[]; engagementPatterns: Record<string, number>; recommendedTopics: string[] }> {
    return {
      topPerformingContent: ['Behind-the-scenes content', 'Tutorial posts', 'User-generated content features'],
      engagementPatterns: { 'morning_posts': 1.2, 'video_content': 1.8, 'question_posts': 1.5, 'carousel_posts': 1.3 },
      recommendedTopics: ['Industry insights', 'Personal stories', 'Tips and tricks', 'Community highlights']
    };
  },

  async optimizeForPlatform(content: string, platform: string): Promise<{ optimizedContent: string; suggestions: string[] }> {
    const suggestions: string[] = [];
    let optimizedContent = content;
    
    switch (platform.toLowerCase()) {
      case 'instagram':
        suggestions.push('Consider adding 3-5 relevant hashtags', 'Instagram favors content with high visual appeal');
        if (content.length > 2200) suggestions.push('Content is too long for Instagram, consider shortening');
        break;
      case 'twitter':
        if (content.length > 280) {
          optimizedContent = content.substring(0, 277) + '...';
          suggestions.push('Content was truncated to fit Twitter\'s character limit');
        }
        suggestions.push('Consider adding a relevant hashtag or mention');
        break;
      case 'linkedin':
        suggestions.push('LinkedIn favors professional, value-driven content', 'Consider adding industry-specific insights');
        break;
      case 'tiktok':
        suggestions.push('TikTok favors trending sounds and hashtags', 'Keep captions concise and engaging');
        break;
    }
    
    return { optimizedContent, suggestions };
  }
}

// Export singleton instance for backward compatibility
export const aiContentService = new AIContentService();
