import { AIRequest, AIResponse } from '@/lib/services/ai-service';

// Mock AI Requests
export const mockAIRequests = {
  basic: {
    prompt: 'Generate a creative caption for my photo',
    context: {
      userId: 'user-123',
      contentType: 'caption' as const,
    },
    options: {
      temperature: 0.7,
      maxTokens: 150,
    },
  } as AIRequest,

  message: {
    prompt: 'Create a personalized message for Sarah, a VIP subscriber who loves fitness content',
    context: {
      userId: 'user-456',
      contentType: 'message' as const,
      metadata: {
        fanName: 'Sarah',
        subscriptionTier: 'vip',
        preferences: ['fitness', 'behind-the-scenes'],
      },
    },
    options: {
      temperature: 0.8,
      maxTokens: 200,
    },
  } as AIRequest,

  contentIdea: {
    prompt: 'Generate creative content ideas for fitness and lifestyle themes',
    context: {
      userId: 'user-789',
      contentType: 'idea' as const,
      metadata: {
        themes: ['fitness', 'lifestyle'],
        contentTypes: ['photo', 'video'],
        creativityLevel: 'balanced',
      },
    },
    options: {
      temperature: 0.7,
      maxTokens: 500,
    },
  } as AIRequest,

  pricing: {
    prompt: 'Analyze pricing strategy for PPV content with current price $25',
    context: {
      userId: 'user-101',
      contentType: 'pricing' as const,
      metadata: {
        currentPrice: 25,
        contentType: 'ppv',
        goal: 'maximize_revenue',
      },
    },
    options: {
      temperature: 0.3,
      maxTokens: 800,
    },
  } as AIRequest,

  timing: {
    prompt: 'Recommend optimal posting times based on audience activity',
    context: {
      userId: 'user-202',
      contentType: 'timing' as const,
      metadata: {
        timezone: 'UTC',
        audienceRegions: ['US', 'EU'],
      },
    },
    options: {
      temperature: 0.4,
      maxTokens: 300,
    },
  } as AIRequest,

  longPrompt: {
    prompt: 'A'.repeat(5000), // 5KB prompt
    context: {
      userId: 'user-303',
      contentType: 'caption' as const,
    },
    options: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  } as AIRequest,

  highTemperature: {
    prompt: 'Generate very creative and unique content',
    context: {
      userId: 'user-404',
      contentType: 'idea' as const,
    },
    options: {
      temperature: 1.5,
      maxTokens: 200,
    },
  } as AIRequest,

  lowTemperature: {
    prompt: 'Generate factual and consistent content',
    context: {
      userId: 'user-505',
      contentType: 'pricing' as const,
    },
    options: {
      temperature: 0.1,
      maxTokens: 300,
    },
  } as AIRequest,
};

// Mock AI Responses
export const mockAIResponses = {
  openai: {
    basic: {
      content: 'Embracing the golden hour vibes ✨ Nothing beats that natural glow! #GoldenHour #NaturalBeauty',
      usage: {
        promptTokens: 25,
        completionTokens: 18,
        totalTokens: 43,
      },
      model: 'gpt-4o-mini',
      provider: 'openai' as const,
      finishReason: 'stop' as const,
    } as AIResponse,

    message: {
      content: 'Hey Sarah! 😊 Your dedication to fitness always inspires me! I noticed you loved my behind-the-scenes content, so I have something special coming up just for you. Stay tuned for exclusive VIP content! 💪✨',
      usage: {
        promptTokens: 45,
        completionTokens: 35,
        totalTokens: 80,
      },
      model: 'gpt-4o-mini',
      provider: 'openai' as const,
      finishReason: 'stop' as const,
    } as AIResponse,

    contentIdea: {
      content: `1. Morning Workout Motivation
Type: Photo
Description: Capture your pre-workout energy with natural lighting and motivational setup
Key Elements: Workout gear, natural light, energetic pose
Monetization: Offer exclusive workout plans as PPV content

2. Healthy Meal Prep Journey
Type: Video
Description: Time-lapse of preparing nutritious meals for the week
Key Elements: Fresh ingredients, meal containers, kitchen setup
Monetization: Create premium nutrition guide subscription`,
      usage: {
        promptTokens: 80,
        completionTokens: 120,
        totalTokens: 200,
      },
      model: 'gpt-4o-mini',
      provider: 'openai' as const,
      finishReason: 'stop' as const,
    } as AIResponse,

    pricing: {
      content: `Based on your current $25 PPV pricing and market analysis:

Optimal Price: $32.00 (28% increase)
Strategy: Tiered pricing with premium positioning
Expected Impact: 18-22% revenue increase
Risk Level: Medium

Implementation Plan:
1. A/B test $30 price point (Week 1-2)
2. Analyze conversion data
3. Full rollout to $32 if metrics support

Key Considerations:
- Your audience shows medium price elasticity
- Market average is $30, positioning you competitively
- Gradual increase minimizes churn risk`,
      usage: {
        promptTokens: 150,
        completionTokens: 180,
        totalTokens: 330,
      },
      model: 'gpt-4o-mini',
      provider: 'openai' as const,
      finishReason: 'stop' as const,
    } as AIResponse,

    timing: {
      content: `Optimal Posting Schedule Analysis:

Peak Engagement Times:
- US Audience: 7-9 PM EST (12-2 AM UTC)
- EU Audience: 8-10 PM CET (7-9 PM UTC)

Recommended Schedule:
- Monday-Friday: 8 PM UTC (covers both regions)
- Weekends: 7 PM UTC (earlier for weekend activity)

Content-Specific Timing:
- PPV Messages: Tuesday/Thursday 8-9 PM UTC
- Regular Posts: Daily 8 PM UTC
- Stories: Multiple times, peak at 8 PM UTC`,
      usage: {
        promptTokens: 60,
        completionTokens: 95,
        totalTokens: 155,
      },
      model: 'gpt-4o-mini',
      provider: 'openai' as const,
      finishReason: 'stop' as const,
    } as AIResponse,

    rateLimited: {
      content: 'Rate limit response',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      model: 'gpt-4o-mini',
      provider: 'openai' as const,
      finishReason: 'stop' as const,
    } as AIResponse,
  },

  claude: {
    basic: {
      content: 'Catching the perfect light for this moment ✨ There\'s something magical about natural photography that just hits different. #AuthenticVibes #NaturalLight',
      usage: {
        promptTokens: 28,
        completionTokens: 22,
        totalTokens: 50,
      },
      model: 'claude-3-haiku-20240307',
      provider: 'claude' as const,
      finishReason: 'stop' as const,
    } as AIResponse,

    message: {
      content: 'Hi Sarah! 🌟 I absolutely love seeing your enthusiasm for the fitness content I share. Your support as a VIP member means everything to me! I\'ve been working on some exclusive behind-the-scenes content that I think you\'ll absolutely love. Keep being amazing! 💪',
      usage: {
        promptTokens: 42,
        completionTokens: 38,
        totalTokens: 80,
      },
      model: 'claude-3-haiku-20240307',
      provider: 'claude' as const,
      finishReason: 'stop' as const,
    } as AIResponse,

    fallback: {
      content: 'Claude fallback response when OpenAI fails',
      usage: {
        promptTokens: 20,
        completionTokens: 15,
        totalTokens: 35,
      },
      model: 'claude-3-haiku-20240307',
      provider: 'claude' as const,
      finishReason: 'stop' as const,
    } as AIResponse,
  },
};

// Mock API Responses (raw from providers)
export const mockProviderResponses = {
  openai: {
    success: {
      choices: [{
        message: { content: mockAIResponses.openai.basic.content },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: mockAIResponses.openai.basic.usage.promptTokens,
        completion_tokens: mockAIResponses.openai.basic.usage.completionTokens,
        total_tokens: mockAIResponses.openai.basic.usage.totalTokens,
      },
      model: 'gpt-4o-mini',
    },

    rateLimitError: {
      error: {
        message: 'Rate limit exceeded',
        type: 'rate_limit_error',
        code: 'rate_limit_exceeded',
      },
    },

    authError: {
      error: {
        message: 'Invalid API key',
        type: 'authentication_error',
        code: 'invalid_api_key',
      },
    },

    quotaError: {
      error: {
        message: 'You exceeded your current quota',
        type: 'insufficient_quota',
        code: 'insufficient_quota',
      },
    },

    malformed: {
      invalid: 'response',
      missing: 'required_fields',
    },
  },

  claude: {
    success: {
      content: [{ text: mockAIResponses.claude.basic.content }],
      usage: {
        input_tokens: mockAIResponses.claude.basic.usage.promptTokens,
        output_tokens: mockAIResponses.claude.basic.usage.completionTokens,
      },
      model: 'claude-3-haiku-20240307',
      stop_reason: 'end_turn',
    },

    rateLimitError: {
      error: {
        message: 'Rate limit exceeded',
        type: 'rate_limit_error',
      },
    },

    authError: {
      error: {
        message: 'Invalid API key',
        type: 'authentication_error',
      },
    },

    malformed: {
      invalid: 'claude_response',
      missing: 'content_field',
    },
  },
};

// Rate Limit Configurations
export const mockRateLimits = {
  openai: {
    requestsPerMinute: 60,
    requestsPerHour: 3000,
    requestsPerDay: 10000,
  },

  claude: {
    requestsPerMinute: 50,
    requestsPerHour: 1000,
    requestsPerDay: 5000,
  },

  restrictive: {
    requestsPerMinute: 2,
    requestsPerHour: 10,
    requestsPerDay: 50,
  },

  generous: {
    requestsPerMinute: 1000,
    requestsPerHour: 50000,
    requestsPerDay: 1000000,
  },
};

// Cache Configurations
export const mockCacheConfigs = {
  enabled: {
    enabled: true,
    ttlSeconds: 300,
    maxSize: 1000,
  },

  disabled: {
    enabled: false,
    ttlSeconds: 300,
    maxSize: 1000,
  },

  shortTTL: {
    enabled: true,
    ttlSeconds: 1,
    maxSize: 100,
  },

  smallSize: {
    enabled: true,
    ttlSeconds: 300,
    maxSize: 2,
  },

  large: {
    enabled: true,
    ttlSeconds: 3600,
    maxSize: 10000,
  },
};

// Test Users
export const mockUsers = {
  basic: {
    id: 'user-123',
    email: 'test@huntaze.com',
    name: 'Test User',
  },

  premium: {
    id: 'user-456',
    email: 'premium@huntaze.com',
    name: 'Premium User',
  },

  rateLimited: {
    id: 'user-rate-limited',
    email: 'limited@huntaze.com',
    name: 'Rate Limited User',
  },
};

// Content Creation Scenarios
export const mockContentScenarios = {
  fitnessCreator: {
    themes: ['fitness', 'wellness', 'motivation'],
    contentTypes: ['photo', 'video', 'story'],
    audience: {
      demographics: {
        ageRange: '25-35',
        interests: ['fitness', 'health', 'lifestyle'],
        spendingBehavior: 'medium' as const,
      },
      preferences: ['workout videos', 'nutrition tips', 'motivation'],
    },
    performanceData: {
      topPerformingContent: [
        {
          type: 'video',
          title: 'Morning Workout Routine',
          engagement: 85,
          revenue: 150,
          tags: ['fitness', 'morning', 'routine'],
        },
        {
          type: 'photo',
          title: 'Healthy Meal Prep',
          engagement: 78,
          revenue: 120,
          tags: ['nutrition', 'meal-prep', 'healthy'],
        },
      ],
      trends: [
        { keyword: 'wellness', growth: 15, relevance: 90 },
        { keyword: 'mindfulness', growth: 8, relevance: 75 },
      ],
    },
  },

  lifestyleCreator: {
    themes: ['lifestyle', 'fashion', 'travel'],
    contentTypes: ['photo', 'story'],
    audience: {
      demographics: {
        ageRange: '22-30',
        interests: ['fashion', 'travel', 'lifestyle'],
        spendingBehavior: 'high' as const,
      },
      preferences: ['outfit posts', 'travel content', 'daily life'],
    },
    performanceData: {
      topPerformingContent: [
        {
          type: 'photo',
          title: 'Summer Fashion Haul',
          engagement: 92,
          revenue: 280,
          tags: ['fashion', 'summer', 'haul'],
        },
      ],
      trends: [
        { keyword: 'sustainable fashion', growth: 25, relevance: 85 },
      ],
    },
  },
};

// Fan Profiles for Message Generation
export const mockFanProfiles = {
  vipFan: {
    fanName: 'Sarah',
    fanProfile: {
      subscriptionTier: 'vip' as const,
      totalSpent: 250,
      lastActive: '2024-01-15T10:00:00Z',
      preferences: ['fitness content', 'behind-the-scenes'],
      previousInteractions: [
        'Loved your workout video!',
        'Thanks for the motivation',
        'Can\'t wait for more content',
      ],
    },
  },

  basicFan: {
    fanName: 'Alex',
    fanProfile: {
      subscriptionTier: 'basic' as const,
      totalSpent: 45,
      lastActive: '2024-01-10T15:00:00Z',
      preferences: ['lifestyle content'],
      previousInteractions: [
        'Great content as always!',
      ],
    },
  },

  inactiveFan: {
    fanName: 'Jordan',
    fanProfile: {
      subscriptionTier: 'premium' as const,
      totalSpent: 180,
      lastActive: '2023-12-01T08:00:00Z',
      preferences: ['exclusive content', 'personal messages'],
      previousInteractions: [
        'Love the exclusive content',
        'Thanks for the personal touch',
      ],
    },
  },
};

// Pricing Scenarios
export const mockPricingScenarios = {
  ppvContent: {
    contentType: 'ppv' as const,
    currentPricing: {
      basePrice: 25.00,
      currency: 'USD',
      billingCycle: 'one_time' as const,
    },
    audienceData: {
      totalSubscribers: 1500,
      activeSubscribers: 1200,
      averageSpending: 75,
      spendingDistribution: {
        low: 40,
        medium: 35,
        high: 25,
      },
    },
    performanceMetrics: {
      conversionRate: 12,
      averageOrderValue: 28,
      customerLifetimeValue: 180,
      churnRate: 8,
      recentSales: [
        { price: 25, date: '2024-01-10T10:00:00Z', contentType: 'ppv', success: true },
        { price: 30, date: '2024-01-12T14:00:00Z', contentType: 'ppv', success: false },
      ],
    },
    goals: {
      primaryGoal: 'maximize_revenue' as const,
      targetIncrease: 20,
      timeframe: 'short_term' as const,
    },
  },

  subscription: {
    contentType: 'subscription' as const,
    currentPricing: {
      basePrice: 15.00,
      currency: 'USD',
      billingCycle: 'monthly' as const,
    },
    audienceData: {
      totalSubscribers: 800,
      activeSubscribers: 650,
      averageSpending: 45,
      spendingDistribution: {
        low: 60,
        medium: 25,
        high: 15,
      },
    },
    performanceMetrics: {
      conversionRate: 8,
      averageOrderValue: 15,
      customerLifetimeValue: 120,
      churnRate: 15,
      recentSales: [],
    },
    goals: {
      primaryGoal: 'increase_subscribers' as const,
      timeframe: 'long_term' as const,
    },
  },
};

// Error Scenarios
export const mockErrorScenarios = {
  networkError: new Error('Network timeout'),
  
  rateLimitError: new Error('Rate limit exceeded. Try again in 30 seconds.'),
  
  authError: new Error('OpenAI API error: Invalid API key'),
  
  quotaError: new Error('OpenAI API error: You exceeded your current quota'),
  
  validationError: new Error('Invalid request data'),
  
  serviceUnavailable: new Error('AI service temporarily unavailable'),
};

// Helper Functions
export const createMockRequest = (overrides: Partial<AIRequest> = {}): AIRequest => ({
  ...mockAIRequests.basic,
  ...overrides,
});

export const createMockResponse = (overrides: Partial<AIResponse> = {}): AIResponse => ({
  ...mockAIResponses.openai.basic,
  ...overrides,
});

export const createMockProviderResponse = (provider: 'openai' | 'claude', type: 'success' | 'error' = 'success') => {
  if (type === 'error') {
    return provider === 'openai' 
      ? mockProviderResponses.openai.rateLimitError
      : mockProviderResponses.claude.rateLimitError;
  }
  
  return provider === 'openai'
    ? mockProviderResponses.openai.success
    : mockProviderResponses.claude.success;
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));