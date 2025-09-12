// Huntaze Restructured Plans - Based on Real Creator Needs
// Focus on what actually drives ROI: Messaging & Smart Marketing

export interface RestructuredPlan {
  name: string;
  price: number;
  targetRevenue: string;
  commission: number;
  revenueCap: number | null;
  // Optional guardrails / terms
  eligibilityCeilingGMV?: number; // Hard ceiling for plan eligibility (GMV/month)
  minimumMonthly?: number; // Minimum monthly charge (e.g., enterprise 0% with floor)
  annualCommitment?: boolean; // Requires annual commitment
  
  // Core Features (ALL PLANS)
  core: {
    messaging: {
      messagesPerMonth: number;
      aiModels: string[];
      features: string[];
    };
    analytics: {
      level: 'basic' | 'standard' | 'advanced' | 'enterprise';
      features: string[];
    };
  };
  
  // Progressive Features
  advanced?: {
    marketing?: {
      platforms: string[];
      features: string[];
    };
    multiAccount?: {
      accounts: number;
      features: string[];
    };
    automation?: {
      features: string[];
    };
  };
  
  aiCosts: {
    messaging: number;
    analytics: number;
    marketing?: number;
    total: number;
  };
  
  profitability: {
    breakEven: number;
    targetProfit: number;
  };
}

// GAME-CHANGING Features to Implement
export const MUST_HAVE_FEATURES = {
  messaging: {
    segmentation: [
      'VIP/Whale identification ($500+ lifetime)',
      'Big spenders ($100-499)',
      'Regular fans ($20-99)',
      'Window shoppers (no purchases)',
      'Re-engagement targets (inactive 7+ days)'
    ],
    
    smartRelances: [
      'Behavioral triggers (viewed but didn\'t buy)',
      'Time-based (best buying times per fan)',
      'Purchase pattern recognition',
      'Abandoned cart recovery',
      'Special occasion reminders'
    ],
    
    multilingual: [
      'Auto-detect fan language',
      'Real-time translation (100+ languages)',
      'Cultural adaptation (emojis, tone)',
      'Preserve flirty/playful tone in translation'
    ],
    
    multiAccount: [
      'Single dashboard for multiple OF accounts',
      'Unified inbox with account tags',
      'Cross-account fan detection',
      'Team collaboration features'
    ]
  },
  
  marketing: {
    crossPlatform: [
      'TikTok trend-based captions',
      'Instagram Reels hooks',
      'Twitter teaser posts',
      'Reddit-safe promotions'
    ],
    
    scheduling: [
      'Optimal posting times by platform',
      'Batch content creation',
      'A/B testing captions',
      'Performance tracking'
    ],
    
    funnels: [
      'Trackable links (Beacons/Linktree)',
      'Conversion attribution',
      'Free trial → paid conversion tracking',
      'Upsell funnel optimization'
    ]
  },
  
  analytics: {
    essential: [
      'Top spenders dashboard',
      'Best buying times heatmap',
      'Fan lifetime value (LTV)',
      'Churn prediction alerts',
      'Revenue forecasting'
    ],
    
    actionable: [
      'Daily action list ("Message these 5 VIPs")',
      'Opportunity alerts ("John hasn\'t bought in 30 days")',
      'Campaign performance (PPV open rates)',
      'Automatic insights ("Fridays are your best days")'
    ]
  }
};

// NEW RESTRUCTURED PLANS
export const RESTRUCTURED_PLANS: Record<string, RestructuredPlan> = {
  starter: {
    name: 'STARTER',
    price: 19,
    targetRevenue: '$500-2,500/mo',
    commission: 9,
    revenueCap: 2000, // Cap GMV used for fee calculation → max fee $180
    eligibilityCeilingGMV: 2000, // Hard ceiling to avoid arbitrage vs Pro
    
    core: {
      messaging: {
        messagesPerMonth: 1000,
        aiModels: ['GPT-4', 'Claude Haiku'],
        features: [
          'Basic AI responses 24/7',
          'Simple fan segmentation',
          'Welcome messages',
          'PPV campaigns'
        ]
      },
      analytics: {
        level: 'basic',
        features: [
          'Revenue overview',
          'Top fans list',
          'Simple metrics',
          '30-day history'
        ]
      }
    },
    
    aiCosts: {
      messaging: 5,
      analytics: 1,
      total: 6
    },
    
    profitability: {
      breakEven: 500, // $19 + $35 commission
      targetProfit: 150 // at revenue cap
    }
  },
  
  pro: {
    name: 'PRO',
    price: 49, // Slightly increased
    targetRevenue: '$2,500-7,500/mo',
    commission: 7,
    revenueCap: 7500,
    
    core: {
      messaging: {
        messagesPerMonth: 5000,
        aiModels: ['GPT-4-Turbo', 'Claude Haiku'],
        features: [
          'Smart AI responses with personality',
          'Advanced fan segmentation',
          'Behavioral relances',
          'Multi-language support (top 10)',
          'Upsell optimization'
        ]
      },
      analytics: {
        level: 'standard',
        features: [
          'Detailed dashboards',
          'Fan behavior insights',
          'Best times to message',
          'Weekly recommendations',
          '90-day history'
        ]
      }
    },
    
    advanced: {
      marketing: {
        platforms: ['Instagram', 'Twitter', 'TikTok'],
        features: [
          'AI captions & hashtags',
          'Trending content ideas',
          'Basic scheduling',
          'Link tracking'
        ]
      }
    },
    
    aiCosts: {
      messaging: 8,
      analytics: 3,
      marketing: 15,
      total: 26
    },
    
    profitability: {
      breakEven: 1500,
      targetProfit: 300
    }
  },
  
  scale: {
    name: 'SCALE',
    price: 79,
    targetRevenue: '$7,500-25,000/mo',
    commission: 5,
    revenueCap: 25000,
    
    core: {
      messaging: {
        messagesPerMonth: 25000,
        aiModels: ['GPT-4-Turbo', 'Claude Sonnet'],
        features: [
          'Predictive AI responses',
          'Hyper-segmentation',
          'Smart relance sequences',
          'Full multi-language (100+)',
          'A/B testing messages',
          'VIP management system'
        ]
      },
      analytics: {
        level: 'advanced',
        features: [
          'Predictive analytics',
          'Churn prevention alerts',
          'Revenue optimization AI',
          'Custom reports',
          'Full history + API'
        ]
      }
    },
    
    advanced: {
      marketing: {
        platforms: ['All major platforms'],
        features: [
          'Viral content AI',
          'Cross-platform campaigns',
          'Advanced scheduling',
          'Full funnel tracking',
          'Competitor analysis'
        ]
      },
      multiAccount: {
        accounts: 3,
        features: [
          'Unified dashboard',
          'Team seats (3)',
          'Cross-account insights'
        ]
      }
    },
    
    aiCosts: {
      messaging: 50,
      analytics: 20,
      marketing: 40,
      total: 110
    },
    
    profitability: {
      breakEven: 7000,
      targetProfit: 600
    }
  },
  
  enterprise: {
    name: 'ENTERPRISE',
    price: 399,
    targetRevenue: '$25,000+/mo',
    commission: 2, // 2% platform fee (annual)
    revenueCap: null,
    minimumMonthly: 399,
    annualCommitment: true,
    
    core: {
      messaging: {
        messagesPerMonth: -1, // Unlimited
        aiModels: ['GPT-4o', 'Claude Opus'],
        features: [
          'Perfect AI mimicry',
          'Quantum segmentation',
          'Conversion mastery',
          'All languages + dialects',
          'Custom AI training',
          'White glove setup'
        ]
      },
      analytics: {
        level: 'enterprise',
        features: [
          'CEO dashboard',
          'AI business advisor',
          'Market domination insights',
          'Competitor crushing',
          'Custom integrations'
        ]
      }
    },
    
    advanced: {
      marketing: {
        platforms: ['Unlimited + custom'],
        features: [
          'Full marketing AI team',
          'Viral engineering',
          'Brand building AI',
          'PR management'
        ]
      },
      multiAccount: {
        accounts: -1, // Unlimited
        features: [
          'Agency dashboard',
          'Unlimited seats',
          'White label option',
          'Custom workflows'
        ]
      },
      automation: {
        features: [
          'Custom automations',
          'Zapier/API unlimited',
          'Business logic engine',
          'Scale to millions'
        ]
      }
    },
    
    aiCosts: {
      messaging: 150,
      analytics: 50,
      marketing: 100,
      total: 300
    },
    
    profitability: {
      breakEven: 30000, // Need high revenue creators
      targetProfit: 1000
    }
  }
};

// Value Props for Each Plan
export const PLAN_VALUE_PROPS = {
  starter: {
    headline: "Get Started with AI",
    subhead: "Perfect for new creators",
    whyChoose: [
      "Respond to every fan 24/7",
      "Never miss a sale opportunity",
      "Basic but effective AI"
    ]
  },
  
  pro: {
    headline: "Grow Faster with Smart AI",
    subhead: "For creators ready to scale",
    whyChoose: [
      "AI that adapts to each fan",
      "Multi-language = global reach",
      "Marketing AI included",
      "Double your engagement"
    ]
  },
  
  scale: {
    headline: "Dominate with Predictive AI",
    subhead: "For serious business builders",
    whyChoose: [
      "AI predicts what fans want",
      "Manage multiple accounts",
      "Viral marketing AI",
      "10x your efficiency"
    ]
  },
  
  enterprise: {
    headline: "The Ultimate AI Arsenal",
    subhead: "For industry leaders",
    whyChoose: [
      "Two AIs working together",
      "Unlimited everything",
      "White glove service",
      "Crush the competition"
    ]
  }
};
