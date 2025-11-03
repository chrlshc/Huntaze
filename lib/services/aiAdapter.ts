/**
 * AI Adapter Service
 * Adapts AI behavior based on user's creator level
 */

import { CreatorLevel, levelAssessor } from './levelAssessor';

export interface AIAdaptation {
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  verbosity: 'detailed' | 'balanced' | 'concise' | 'minimal';
  includeExamples: boolean;
  technicalLevel: 'simple' | 'moderate' | 'advanced' | 'expert';
}

export interface ContentSuggestion {
  type: 'caption' | 'hashtag' | 'idea' | 'improvement';
  content: string;
  explanation?: string;
  confidence: number;
}

export class AIAdapterService {
  /**
   * Get AI configuration for a creator level
   */
  getAIConfiguration(level: CreatorLevel): AIAdaptation {
    const baseConfig = levelAssessor.getAIConfig(level);
    
    const adaptations: Record<CreatorLevel, AIAdaptation> = {
      beginner: {
        systemPrompt: this.buildSystemPrompt(level),
        maxTokens: 500,
        temperature: 0.7,
        verbosity: 'detailed',
        includeExamples: true,
        technicalLevel: 'simple'
      },
      intermediate: {
        systemPrompt: this.buildSystemPrompt(level),
        maxTokens: 350,
        temperature: 0.7,
        verbosity: 'balanced',
        includeExamples: true,
        technicalLevel: 'moderate'
      },
      advanced: {
        systemPrompt: this.buildSystemPrompt(level),
        maxTokens: 250,
        temperature: 0.6,
        verbosity: 'concise',
        includeExamples: false,
        technicalLevel: 'advanced'
      },
      expert: {
        systemPrompt: this.buildSystemPrompt(level),
        maxTokens: 150,
        temperature: 0.5,
        verbosity: 'minimal',
        includeExamples: false,
        technicalLevel: 'expert'
      }
    };

    return adaptations[level];
  }

  /**
   * Build system prompt based on creator level
   */
  private buildSystemPrompt(level: CreatorLevel): string {
    const basePrompt = `You are an AI assistant helping content creators manage their social media presence.`;
    
    const levelPrompts: Record<CreatorLevel, string> = {
      beginner: `${basePrompt}

The user is new to content creation. Your responses should:
- Use simple, clear language without jargon
- Provide step-by-step instructions
- Include examples and explanations
- Be encouraging and supportive
- Explain technical terms when necessary
- Offer detailed guidance

Focus on building confidence and teaching fundamentals.`,

      intermediate: `${basePrompt}

The user has some content creation experience. Your responses should:
- Use clear language with some technical terms
- Provide balanced explanations
- Include examples when helpful
- Be supportive and informative
- Assume basic knowledge of social media

Focus on improving skills and introducing advanced concepts.`,

      advanced: `${basePrompt}

The user is an experienced content creator. Your responses should:
- Use technical language appropriately
- Be concise and to the point
- Focus on optimization and efficiency
- Assume familiarity with content creation concepts
- Provide advanced insights

Focus on optimization, automation, and advanced strategies.`,

      expert: `${basePrompt}

The user is a professional content creator. Your responses should:
- Be brief and technical
- Focus on advanced insights and optimizations
- Assume expert-level knowledge
- Provide data-driven recommendations
- Skip basic explanations

Focus on cutting-edge strategies and maximum efficiency.`
    };

    return levelPrompts[level];
  }

  /**
   * Adapt content for user's level
   */
  adaptContent(content: string, level: CreatorLevel): string {
    const config = this.getAIConfiguration(level);
    
    switch (config.verbosity) {
      case 'detailed':
        return this.expandContent(content);
      case 'balanced':
        return content;
      case 'concise':
        return this.condenseContent(content);
      case 'minimal':
        return this.minimizeContent(content);
      default:
        return content;
    }
  }

  /**
   * Expand content with more details (for beginners)
   */
  private expandContent(content: string): string {
    // Add explanatory context
    const sentences = content.split('. ');
    return sentences.map(sentence => {
      if (sentence.length < 50) {
        return sentence;
      }
      return sentence;
    }).join('. ');
  }

  /**
   * Condense content to key points (for advanced users)
   */
  private condenseContent(content: string): string {
    // Remove filler words and keep essentials
    return content
      .replace(/In other words,/gi, '')
      .replace(/For example,/gi, 'E.g.')
      .replace(/Additionally,/gi, 'Also')
      .replace(/Furthermore,/gi, 'Also');
  }

  /**
   * Minimize content to bare essentials (for experts)
   */
  private minimizeContent(content: string): string {
    // Keep only critical information
    const sentences = content.split('. ');
    return sentences
      .filter(s => s.length > 20)
      .slice(0, 3)
      .join('. ');
  }

  /**
   * Generate personalized suggestions based on level
   */
  async generateSuggestions(
    context: {
      contentType: 'caption' | 'post' | 'idea';
      platform: string;
      topic?: string;
    },
    level: CreatorLevel
  ): Promise<ContentSuggestion[]> {
    const config = this.getAIConfiguration(level);
    
    // This would integrate with actual AI service
    // For now, return level-appropriate mock suggestions
    const suggestions: ContentSuggestion[] = [];

    if (level === 'beginner') {
      suggestions.push({
        type: 'caption',
        content: 'Share your story! People connect with authentic content.',
        explanation: 'Personal stories create emotional connections with your audience',
        confidence: 0.85
      });
    } else if (level === 'expert') {
      suggestions.push({
        type: 'caption',
        content: 'Leverage trending audio + hook in first 3s',
        confidence: 0.92
      });
    }

    return suggestions;
  }

  /**
   * Adjust help frequency based on level
   */
  shouldShowHelp(level: CreatorLevel, actionCount: number): boolean {
    const frequencies: Record<CreatorLevel, number> = {
      beginner: 3,      // Show help every 3 actions
      intermediate: 7,  // Show help every 7 actions
      advanced: 15,     // Show help every 15 actions
      expert: 30        // Show help every 30 actions
    };

    return actionCount % frequencies[level] === 0;
  }

  /**
   * Get contextual help message based on level
   */
  getContextualHelp(
    context: string,
    level: CreatorLevel
  ): { message: string; detail?: string } {
    const helpMessages: Record<CreatorLevel, Record<string, any>> = {
      beginner: {
        scheduling: {
          message: 'Schedule your posts for when your audience is most active',
          detail: 'Check your analytics to find the best times. Most creators see better engagement in evenings and weekends.'
        },
        hashtags: {
          message: 'Use 5-10 relevant hashtags to reach more people',
          detail: 'Mix popular hashtags (100k+ posts) with niche ones (10k-50k posts) for best results.'
        }
      },
      intermediate: {
        scheduling: {
          message: 'Optimize posting times based on your analytics data'
        },
        hashtags: {
          message: 'Balance trending and niche hashtags for maximum reach'
        }
      },
      advanced: {
        scheduling: {
          message: 'Use A/B testing to refine your posting schedule'
        },
        hashtags: {
          message: 'Analyze hashtag performance and adjust strategy'
        }
      },
      expert: {
        scheduling: {
          message: 'Automate scheduling based on engagement patterns'
        },
        hashtags: {
          message: 'Implement dynamic hashtag strategy'
        }
      }
    };

    return helpMessages[level][context] || { message: 'Need help? Check our guides.' };
  }

  /**
   * Simplify technical terms based on level
   */
  simplifyTerm(term: string, level: CreatorLevel): string {
    if (level === 'advanced' || level === 'expert') {
      return term; // No simplification needed
    }

    const simplifications: Record<string, string> = {
      'engagement rate': level === 'beginner' 
        ? 'how many people interact with your posts' 
        : 'likes, comments, shares per post',
      'algorithm': level === 'beginner'
        ? 'how the platform decides what to show people'
        : 'content ranking system',
      'CTR': level === 'beginner'
        ? 'click-through rate (how many people click your links)'
        : 'click-through rate',
      'impressions': level === 'beginner'
        ? 'how many times your post was seen'
        : 'total views',
      'reach': level === 'beginner'
        ? 'how many different people saw your post'
        : 'unique viewers'
    };

    return simplifications[term.toLowerCase()] || term;
  }

  /**
   * Format response based on level preferences
   */
  formatResponse(
    data: any,
    level: CreatorLevel,
    includeMetadata = true
  ): any {
    const config = this.getAIConfiguration(level);

    if (level === 'beginner' || level === 'intermediate') {
      // Include helpful metadata and explanations
      return {
        ...data,
        help: includeMetadata ? this.getContextualHelp('general', level) : undefined,
        tips: config.includeExamples ? this.getTipsForLevel(level) : undefined
      };
    }

    // Advanced/Expert: minimal response
    return data;
  }

  /**
   * Get tips appropriate for level
   */
  private getTipsForLevel(level: CreatorLevel): string[] {
    const tips: Record<CreatorLevel, string[]> = {
      beginner: [
        'Post consistently - aim for 3-5 times per week',
        'Engage with your audience by responding to comments',
        'Use high-quality images and videos'
      ],
      intermediate: [
        'Analyze your best-performing content and create more like it',
        'Experiment with different content formats',
        'Build a content calendar for consistency'
      ],
      advanced: [
        'Implement A/B testing for captions and posting times',
        'Leverage user-generated content',
        'Optimize for platform-specific algorithms'
      ],
      expert: [
        'Automate repetitive tasks to scale efficiently',
        'Use advanced analytics for predictive insights',
        'Implement cross-platform content strategies'
      ]
    };

    return tips[level];
  }

  /**
   * Determine if user should see advanced features
   */
  shouldShowAdvancedFeatures(level: CreatorLevel): boolean {
    return level === 'advanced' || level === 'expert';
  }

  /**
   * Get UI complexity level
   */
  getUIComplexity(level: CreatorLevel): 'simple' | 'standard' | 'advanced' | 'expert' {
    const config = levelAssessor.getLevelConfig(level);
    return config.uiComplexity;
  }

  /**
   * Adapt error messages based on level
   */
  adaptErrorMessage(error: string, level: CreatorLevel): string {
    if (level === 'beginner') {
      // More helpful, less technical
      const friendlyErrors: Record<string, string> = {
        '401': 'You need to log in again. Your session expired.',
        '403': 'You don\'t have permission to do this. Try connecting your account again.',
        '404': 'We couldn\'t find what you\'re looking for. It might have been deleted.',
        '500': 'Something went wrong on our end. Please try again in a moment.'
      };

      const errorCode = error.match(/\d{3}/)?.[0];
      return errorCode && friendlyErrors[errorCode] 
        ? friendlyErrors[errorCode]
        : 'Something went wrong. Please try again or contact support.';
    }

    // Advanced/Expert: technical details
    return error;
  }
}

// Export singleton instance
export const aiAdapter = new AIAdapterService();
