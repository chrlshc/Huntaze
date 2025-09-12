// Real Value Features for OF Creators
// Based on ACTUAL creator needs, not theoretical features

export const REAL_CREATOR_PROBLEMS = {
  messaging: {
    actualProblems: [
      "Can't respond to 100+ messages daily",
      "Missing sales at 2am when fans are horny",
      "Generic responses kill conversions",
      "Don't remember what each fan likes",
      "PPV gets ignored without follow-up"
    ],
    whatTheyNeed: [
      "24/7 responses that sound like them",
      "AI that remembers each fan's kinks/interests",
      "Smart upselling without being pushy",
      "Automatic PPV follow-ups",
      "Personality consistency"
    ],
    whatTheyDontNeed: [
      "Multi-language (95% fans speak English)",
      "Complex automation flows",
      "Content idea generation",
      "Image generation"
    ]
  },
  
  analytics: {
    actualQuestions: [
      "Who are my biggest spenders?",
      "When do my fans buy most?",
      "Who hasn't bought in a while?",
      "What PPV prices work best?",
      "Am I growing or declining?"
    ],
    whatTheyNeed: [
      "Simple dashboard with key numbers",
      "List of fans to message today",
      "Best times to send PPV",
      "Spending patterns per fan",
      "Revenue trends"
    ],
    whatTheyDontNeed: [
      "Complex predictive models",
      "100 different metrics",
      "Academic analytics",
      "API access (most don't code)"
    ]
  },
  
  marketing: {
    actualProblems: [
      "Need new subs from TikTok/IG",
      "Don't know what to post",
      "Accounts keep getting banned",
      "No time to post everywhere"
    ],
    whatTheyNeed: [
      "Safe-for-platform captions",
      "Trending audio suggestions",
      "Ban-proof posting strategies",
      "Simple scheduling"
    ],
    whatTheyDontNeed: [
      "AI-generated images",
      "Complex funnels",
      "10+ platform support",
      "A/B testing (too complex)"
    ]
  }
};

// REVISED Feature Set - What ACTUALLY Drives Value
export const VALUE_DRIVING_FEATURES = {
  starter: {
    messaging: [
      "AI responds 24/7 in your style",
      "Basic fan memory (last purchase, preferences)",
      "Simple PPV campaigns",
      "Welcome messages for new subs"
    ],
    analytics: [
      "Daily revenue tracker",
      "Top 10 spenders list",
      "Simple metrics (subs, revenue, messages)"
    ],
    limitations: [
      "Slower responses (2-3 sec)",
      "Basic AI (sometimes generic)",
      "No advanced selling"
    ]
  },
  
  pro: {
    messaging: [
      "Smarter AI that converts better",
      "Full fan history & preferences",
      "Behavioral triggers ('viewed but didn't buy')",
      "Upsell at perfect moments",
      "Test different message styles"
    ],
    analytics: [
      "Fan spending patterns",
      "'Message these fans today' list",
      "Best times to post PPV",
      "Conversion tracking"
    ],
    marketing: [
      "TikTok/IG caption templates",
      "Trending hashtags",
      "Post scheduling"
    ]
  },
  
  scale: {
    messaging: [
      "AI predicts what each fan wants",
      "VIP detection & special treatment",
      "Abandoned cart recovery",
      "Multi-step sales sequences",
      "Perfect timing for each fan"
    ],
    analytics: [
      "Predictive churn alerts",
      "Revenue forecasting",
      "Full fan lifecycle tracking",
      "Custom segments"
    ],
    marketing: [
      "Viral content formulas",
      "Cross-platform campaigns",
      "Growth hacking strategies"
    ],
    operations: [
      "Manage 3 OF accounts",
      "Team access (3 seats)",
      "Bulk operations"
    ]
  },
  
  enterprise: {
    everything: "All Scale features PLUS:",
    premium: [
      "Two AIs working together (GPT-4o + Claude)",
      "Custom AI personality training",
      "White glove onboarding",
      "Dedicated success manager",
      "Custom integrations",
      "Unlimited everything"
    ]
  }
};

// What to REMOVE from current offering
export const FEATURES_TO_KILL = [
  {
    feature: "Multi-language support",
    why: "95% of OF traffic is English-speaking",
    exception: "Maybe keep Spanish for Latin American market"
  },
  {
    feature: "Content idea generation",
    why: "Creators know what content to make",
    exception: "None - completely remove"
  },
  {
    feature: "AI image generation", 
    why: "Can't generate adult content, promo graphics aren't worth it",
    exception: "None - completely remove"
  },
  {
    feature: "Complex analytics",
    why: "Creators want simple, actionable insights",
    exception: "Keep for Enterprise only"
  },
  {
    feature: "10+ platform integrations",
    why: "Most creators focus on 2-3 platforms max",
    exception: "OF + TikTok + IG is enough"
  }
];

// The REAL differentiators that matter
export const ACTUAL_DIFFERENTIATORS = {
  huntaze: {
    messaging: "AI that actually converts (2-3x industry average)",
    technology: "GPT-4 + Claude (competitors use GPT-3.5)",
    pricing: "Pay commission on success, not flat fees",
    focus: "Built specifically for adult creators"
  },
  
  competitors: {
    infloww: "Generic chatbot, same AI for everyone",
    supercreator: "Good UI but basic AI",
    fandafia: "Expensive and complex",
    agencies: "50% commission + human errors"
  }
};

// Simplified pricing strategy
export const SIMPLIFIED_PRICING = {
  starter: {
    price: 19,
    target: "New creators (eligible up to $2k/mo)",
    value: "Better than doing it yourself"
  },
  
  pro: {
    price: 39, // Lower it back
    target: "Growing creators ($2k–7.5k/mo)",
    value: "2x your engagement & sales"
  },
  
  scale: {
    price: 79, // Lower it back
    target: "Established creators ($7.5-25k/mo)",
    value: "Scale without hiring"
  },
  
  enterprise: {
    price: 399, // 2% platform fee (annual commitment)
    target: "Top creators ($25k+/mo)",
    value: "Unfair advantage over competition"
  }
};
