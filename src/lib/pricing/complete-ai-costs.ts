// Complete AI Cost Analysis - ALL Branches
// OnlyFans + Marketing + Content + Analytics

export interface CompleteAICosts {
  plan: string;
  features: {
    // OnlyFans Branch
    ofMessaging: {
      volume: number;
      models: string[];
      cost: number;
    };
    
    // Marketing AI Branch
    socialMedia: {
      platforms: string[];
      postsPerMonth: number;
      captionsPerMonth: number;
      models: string[];
      cost: number;
    };
    
    // Content Strategy Branch
    contentAI: {
      ideas: number;
      scripts: number;
      hooks: number;
      models: string[];
      cost: number;
    };
    
    // Analytics Branch
    analytics: {
      reports: number;
      predictions: boolean;
      models: string[];
      cost: number;
    };
    
    // Image Generation Branch
    images: {
      count: number;
      model: string;
      cost: number;
    };
  };
  
  totalCosts: {
    ai: number;
    infrastructure: number;
    total: number;
  };
  
  profitAnalysis: {
    worstCase: number; // Min revenue
    averageCase: number; // Mid revenue
    bestCase: number; // At cap
  };
}

// REAL Complete Costs by Plan
export const COMPLETE_AI_COSTS: Record<string, CompleteAICosts> = {
  starter: {
    plan: 'STARTER',
    features: {
      ofMessaging: {
        volume: 1000,
        models: ['GPT-4', 'Claude Haiku'],
        cost: 4.54
      },
      socialMedia: {
        platforms: ['Instagram'],
        postsPerMonth: 30,
        captionsPerMonth: 100,
        models: ['GPT-3.5-turbo'],
        cost: 0.80 // 130 generations * $0.006
      },
      contentAI: {
        ideas: 10,
        scripts: 0,
        hooks: 30,
        models: ['GPT-3.5-turbo'],
        cost: 0.25
      },
      analytics: {
        reports: 4,
        predictions: false,
        models: ['GPT-3.5-turbo'],
        cost: 0.20
      },
      images: {
        count: 0, // No images in starter
        model: 'none',
        cost: 0
      }
    },
    totalCosts: {
      ai: 5.79,
      infrastructure: 5, // Servers, storage, etc
      total: 10.79
    },
    profitAnalysis: {
      worstCase: 19 + (500 * 0.07) - 10.79, // $43.21 at $500 revenue
      averageCase: 19 + (1500 * 0.07) - 10.79, // $113.21 at $1.5k
      bestCase: 19 + (2500 * 0.07) - 10.79 // $183.21 at cap
    }
  },

  pro: {
    plan: 'PRO',
    features: {
      ofMessaging: {
        volume: 5000,
        models: ['GPT-4-turbo', 'Claude Haiku'],
        cost: 7.69
      },
      socialMedia: {
        platforms: ['Instagram', 'Twitter', 'TikTok'],
        postsPerMonth: 100,
        captionsPerMonth: 500,
        models: ['GPT-4'],
        cost: 18.00 // 600 * 200 tokens * $0.03
      },
      contentAI: {
        ideas: 50,
        scripts: 20,
        hooks: 100,
        models: ['GPT-4'],
        cost: 5.10
      },
      analytics: {
        reports: 12,
        predictions: true,
        models: ['GPT-4', 'Claude Haiku'],
        cost: 3.75
      },
      images: {
        count: 10,
        model: 'DALL-E 3',
        cost: 0.40
      }
    },
    totalCosts: {
      ai: 34.94,
      infrastructure: 10,
      total: 44.94
    },
    profitAnalysis: {
      worstCase: 39 + (1000 * 0.05) - 44.94, // $44.06 at $1k revenue
      averageCase: 39 + (3000 * 0.05) - 44.94, // $144.06 at $3k
      bestCase: 39 + (5000 * 0.05) - 44.94 // $244.06 at cap
    }
  },

  scale: {
    plan: 'SCALE',
    features: {
      ofMessaging: {
        volume: 25000,
        models: ['GPT-4-turbo', 'Claude Sonnet'],
        cost: 48.75
      },
      socialMedia: {
        platforms: ['All 10 platforms'],
        postsPerMonth: 500,
        captionsPerMonth: 2000,
        models: ['GPT-4-turbo', 'Claude Haiku'],
        cost: 25.50
      },
      contentAI: {
        ideas: 200,
        scripts: 100,
        hooks: 500,
        models: ['GPT-4-turbo', 'Claude Sonnet'],
        cost: 24.00
      },
      analytics: {
        reports: 30,
        predictions: true,
        models: ['GPT-4-turbo', 'Claude Sonnet'],
        cost: 18.00
      },
      images: {
        count: 100,
        model: 'DALL-E 3 HD',
        cost: 4.00
      }
    },
    totalCosts: {
      ai: 120.25,
      infrastructure: 25,
      total: 145.25
    },
    profitAnalysis: {
      worstCase: 79 + (5000 * 0.03) - 145.25, // $83.75 at $5k revenue
      averageCase: 79 + (10000 * 0.03) - 145.25, // $233.75 at $10k
      bestCase: 79 + (15000 * 0.03) - 145.25 // $383.75 at cap
    }
  },

  enterprise: {
    plan: 'ENTERPRISE',
    features: {
      ofMessaging: {
        volume: 50000, // Realistic for big creators
        models: ['GPT-4o', 'Claude Opus'],
        cost: 150.00
      },
      socialMedia: {
        platforms: ['Unlimited'],
        postsPerMonth: 2000,
        captionsPerMonth: 10000,
        models: ['GPT-4o', 'Claude Opus'],
        cost: 180.00
      },
      contentAI: {
        ideas: 1000,
        scripts: 500,
        hooks: 2000,
        models: ['GPT-4o', 'Claude Opus'],
        cost: 105.00
      },
      analytics: {
        reports: 100,
        predictions: true,
        models: ['GPT-4o', 'Claude Opus'],
        cost: 75.00
      },
      images: {
        count: 1000,
        model: 'Midjourney V6',
        cost: 100.00
      }
    },
    totalCosts: {
      ai: 610.00,
      infrastructure: 50,
      total: 660.00
    },
    profitAnalysis: {
      worstCase: 199 + (20000 * 0.015) - 660, // -$161 at $20k (LOSS!)
      averageCase: 199 + (50000 * 0.015) - 660, // $289 at $50k
      bestCase: 199 + (100000 * 0.015) - 660 // $1,039 at $100k
    }
  }
};

// SMART Optimization Strategy
export const OPTIMIZED_AI_STRATEGY = {
  starter: {
    strategy: "Minimal AI, focus on OF messaging only",
    marketing: "Basic templates, no AI generation",
    profitable: "YES - Even at $500 revenue"
  },
  
  pro: {
    strategy: "Balance AI across features",
    marketing: "AI helps but doesn't dominate costs",
    profitable: "YES - Break even at $1k, great at cap"
  },
  
  scale: {
    strategy: "Full AI power but smart model selection",
    marketing: "Mix expensive and cheap models",
    profitable: "YES - Need $5k minimum but most Scale users do $10k+"
  },
  
  enterprise: {
    strategy: "Premium everything BUT...",
    marketing: "MUST target $50k+ creators only",
    profitable: "CAREFUL - Loses money below $40k revenue",
    solution: "Add screening: 'Enterprise requires $30k+ monthly revenue'"
  }
};

// REVISED Strategy with ALL AI Costs
export const REVISED_PRICING_STRATEGY = `
PROBLEM IDENTIFIED: Enterprise loses money on small creators!

SOLUTIONS:
1. Add minimum revenue requirement for Enterprise ($30k+)
2. OR increase Enterprise to $299/month
3. OR reduce AI features for lower-revenue Enterprise users

SMART MOVES:
- Starter/Pro: Keep lean, very profitable ✅
- Scale: Sweet spot - lots of AI but still profitable ✅
- Enterprise: Screen for high earners OR dynamic AI based on revenue

NEW MARKETING:
"Enterprise plan requires minimum $30k monthly revenue - 
because we invest $600+ in AI to make you successful!"
`;