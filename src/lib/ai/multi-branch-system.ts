// Huntaze Multi-Branch AI System
// Each plan gets different AI models across ALL features

export interface AIModelConfig {
  planTier: 'starter' | 'pro' | 'scale' | 'enterprise';
  
  // Different AI models for different branches/features
  branches: {
    // OnlyFans AI Assistant
    ofMessaging: {
      model: string;
      temperature: number;
      capabilities: string[];
    };
    
    // Social Media Content
    contentGeneration: {
      model: string;
      quality: 'draft' | 'standard' | 'premium' | 'ultra';
      features: string[];
    };
    
    // Analytics & Insights
    analyticsAI: {
      model: string;
      depth: 'basic' | 'detailed' | 'predictive' | 'prescriptive';
    };
    
    // Image Generation
    visualAI: {
      model: string;
      resolution: 'standard' | 'high' | 'ultra' | '4k';
      styles: string[];
    };
    
    // Strategy & Planning
    strategyAI: {
      model: string;
      capabilities: string[];
    };
  };
}

// REAL Multi-Branch Configuration (like in your screenshot)
export const AI_BRANCH_CONFIG: Record<string, AIModelConfig> = {
  starter: {
    planTier: 'starter',
    branches: {
      ofMessaging: {
        model: 'gpt-4', // Good but not latest
        temperature: 0.7,
        capabilities: [
          'basic_responses',
          'simple_upsells',
          'standard_personality'
        ]
      },
      contentGeneration: {
        model: 'gpt-3.5-turbo',
        quality: 'standard',
        features: ['captions', 'hashtags']
      },
      analyticsAI: {
        model: 'gpt-3.5-turbo',
        depth: 'basic'
      },
      visualAI: {
        model: 'dall-e-2',
        resolution: 'standard',
        styles: ['basic', 'simple']
      },
      strategyAI: {
        model: 'gpt-3.5-turbo',
        capabilities: ['basic_tips']
      }
    }
  },
  
  pro: {
    planTier: 'pro',
    branches: {
      ofMessaging: {
        model: 'gpt-4-turbo', // Faster, smarter
        temperature: 0.8,
        capabilities: [
          'contextual_responses',
          'smart_upsells',
          'dynamic_personality',
          'emotion_detection',
          'conversation_flow'
        ]
      },
      contentGeneration: {
        model: 'gpt-4',
        quality: 'premium',
        features: ['captions', 'hashtags', 'scripts', 'hooks', 'cta']
      },
      analyticsAI: {
        model: 'gpt-4',
        depth: 'detailed'
      },
      visualAI: {
        model: 'dall-e-3',
        resolution: 'high',
        styles: ['professional', 'trending', 'custom']
      },
      strategyAI: {
        model: 'gpt-4',
        capabilities: ['growth_strategies', 'content_planning']
      }
    }
  },
  
  scale: {
    planTier: 'scale',
    branches: {
      ofMessaging: {
        model: 'gpt-4-turbo', // Same model but...
        temperature: 0.85,
        capabilities: [
          'advanced_psychology',
          'micro_targeting',
          'conversion_optimization',
          'sentiment_analysis',
          'predictive_responses',
          'a_b_testing'
        ]
      },
      contentGeneration: {
        model: 'gpt-4-turbo',
        quality: 'premium',
        features: ['everything', 'viral_optimization', 'trend_prediction']
      },
      analyticsAI: {
        model: 'gpt-4-turbo',
        depth: 'predictive'
      },
      visualAI: {
        model: 'dall-e-3',
        resolution: 'ultra',
        styles: ['all', 'ai_enhanced', 'brand_consistent']
      },
      strategyAI: {
        model: 'gpt-4-turbo',
        capabilities: ['advanced_strategy', 'competitor_analysis', 'market_insights']
      }
    }
  },
  
  enterprise: {
    planTier: 'enterprise',
    branches: {
      ofMessaging: {
        model: 'gpt-4o', // Latest OpenAI model (omni)
        temperature: 0.9,
        capabilities: [
          'all_capabilities',
          'custom_fine_tuning',
          'voice_understanding',
          'multimodal_analysis',
          'real_time_learning',
          'predictive_ai',
          'conversion_mastery'
        ]
      },
      contentGeneration: {
        model: 'claude-3-opus', // Mix best models
        quality: 'ultra',
        features: ['everything', 'ai_director', 'content_ecosystem']
      },
      analyticsAI: {
        model: 'gpt-4o',
        depth: 'prescriptive' // Tells you exactly what to do
      },
      visualAI: {
        model: 'midjourney-v6', // Best for creatives
        resolution: '4k',
        styles: ['unlimited', 'photorealistic', 'artistic', 'brand_perfect']
      },
      strategyAI: {
        model: 'claude-3-opus',
        capabilities: [
          'ceo_level_insights',
          'market_domination',
          'predictive_trends',
          'competitor_crushing'
        ]
      }
    }
  }
};

// What this REALLY means for users:
export const REAL_AI_DIFFERENCES = {
  starter: {
    ofMessages: "AI responds well but sometimes generic",
    contentIdeas: "Good captions, basic strategy",
    analytics: "See what happened yesterday",
    example: "Fan: 'Hey beautiful!' → AI: 'Hey babe! Thanks for subscribing! 😘'"
  },
  
  pro: {
    ofMessages: "AI adapts to each fan's personality and spending",
    contentIdeas: "Viral hooks, trending content ideas",
    analytics: "Understand why things work",
    example: "Fan: 'Hey beautiful!' → AI: 'Omg hi John! I was just thinking about you! Remember that thing you mentioned last week? 😏'"
  },
  
  scale: {
    ofMessages: "AI predicts what fans want before they ask",
    contentIdeas: "AI creates content strategies that dominate",
    analytics: "AI tells you what will happen next week",
    example: "Fan: 'Hey beautiful!' → AI: 'John! Perfect timing! I just finished that custom video idea we discussed. You're gonna love this... want a preview? 🔥'"
  },
  
  enterprise: {
    ofMessages: "AI becomes indistinguishable from you",
    contentIdeas: "AI runs your entire content empire",
    analytics: "AI makes CEO-level decisions",
    example: "Fan: 'Hey beautiful!' → AI: [Analyzes John's mood, time zone, past purchases, current market trends, then crafts perfect response that converts 94% of the time]"
  }
};

// The ACTUAL cost difference this creates
export const MODEL_COSTS = {
  'gpt-3.5-turbo': 0.002,     // $0.002 per 1K tokens
  'gpt-4': 0.03,               // $0.03 per 1K tokens  
  'gpt-4-turbo': 0.01,         // $0.01 per 1K tokens
  'gpt-4o': 0.05,              // $0.05 per 1K tokens (newest)
  'claude-3-opus': 0.06,       // $0.06 per 1K tokens (most expensive)
  'dall-e-2': 0.02,            // $0.02 per image
  'dall-e-3': 0.04,            // $0.04 per image
  'midjourney-v6': 0.10        // $0.10 per image (estimated)
};

// This is why Enterprise costs more - they get the BEST AI everywhere!