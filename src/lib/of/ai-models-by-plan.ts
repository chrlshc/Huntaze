// AI Models by Plan - Exactly what each tier gets
// Clear differentiation in AI power & capabilities

export interface AIModelConfig {
  plan: 'starter' | 'pro' | 'scale' | 'enterprise';
  models: {
    primary: {
      name: string;
      model: string;
      capabilities: string[];
      responseTime: string;
      contextWindow: number;
    };
    fallback?: {
      name: string;
      model: string;
      when: string;
    };
  };
  features: {
    messageQuality: 'basic' | 'good' | 'excellent' | 'perfect';
    personalization: number; // 1-10 scale
    salesConversion: string; // Expected improvement
    learningSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  };
  limits: {
    messagesPerMonth: number;
    ppvPerDay: number;
    customPersonalities: number;
    voiceStyles: number;
  };
  examples: {
    basicMessage: string;
    salesMessage: string;
    differenceFromLower?: string;
  };
}

export const AI_MODELS_BY_PLAN: Record<string, AIModelConfig> = {
  starter: {
    plan: 'starter',
    models: {
      primary: {
        name: 'GPT-4',
        model: 'gpt-4-0613',
        capabilities: [
          'Basic conversation',
          'Simple personalization',
          'Standard responses',
          'Basic memory (last purchase)'
        ],
        responseTime: '2-3 seconds',
        contextWindow: 8000
      }
    },
    features: {
      messageQuality: 'basic',
      personalization: 4,
      salesConversion: '+15-20% vs manual',
      learningSpeed: 'slow'
    },
    limits: {
      messagesPerMonth: 1000,
      ppvPerDay: 10,
      customPersonalities: 1,
      voiceStyles: 3
    },
    examples: {
      basicMessage: "Hey babe! Thanks for the message 😘 How are you doing today?",
      salesMessage: "I have something special for you! Want to see? It's only $25 💕"
    }
  },

  pro: {
    plan: 'pro',
    models: {
      primary: {
        name: 'GPT-4-Turbo',
        model: 'gpt-4-turbo-preview',
        capabilities: [
          'Natural conversations',
          'Fan history tracking',
          'Behavioral triggers',
          'Upsell detection',
          'A/B message testing'
        ],
        responseTime: '1-2 seconds',
        contextWindow: 128000
      },
      fallback: {
        name: 'Claude Haiku',
        model: 'claude-3-haiku',
        when: 'High volume periods'
      }
    },
    features: {
      messageQuality: 'good',
      personalization: 7,
      salesConversion: '+35-40% vs manual',
      learningSpeed: 'normal'
    },
    limits: {
      messagesPerMonth: 5000,
      ppvPerDay: 50,
      customPersonalities: 3,
      voiceStyles: 10
    },
    examples: {
      basicMessage: "Heyyyy babe! 😍 I was just thinking about you... how's your day going? Miss chatting with you 💕",
      salesMessage: "Remember that thing you said you wanted to see? 😏 Well... I finally did it. And OMG it's so hot! Want a preview? Special price just for you - $25 (usually $40)",
      differenceFromLower: "Notices fan mentioned 'that thing' before, offers personalized discount"
    }
  },

  scale: {
    plan: 'scale',
    models: {
      primary: {
        name: 'GPT-4-Turbo + Claude Sonnet',
        model: 'gpt-4-turbo + claude-3-sonnet',
        capabilities: [
          'Predictive responses',
          'Perfect timing',
          'Multi-personality',
          'VIP detection',
          'Churn prevention',
          'Complex upsells',
          'Mood detection'
        ],
        responseTime: '0.5-1 second',
        contextWindow: 200000
      }
    },
    features: {
      messageQuality: 'excellent',
      personalization: 9,
      salesConversion: '+60-80% vs manual',
      learningSpeed: 'fast'
    },
    limits: {
      messagesPerMonth: 25000,
      ppvPerDay: 200,
      customPersonalities: 10,
      voiceStyles: 25
    },
    examples: {
      basicMessage: "OMG babeee! 🥰 Perfect timing - I was literally JUST thinking about you! That message yesterday had me up all night... 🙈 How are you feeling today? Still thinking about our chat? 😏",
      salesMessage: "So... remember when you said you love [specific thing]? I couldn't stop thinking about it... so I made something JUST for you. Nobody else has seen this. It's exactly what you asked for, down to the [specific detail]. Want me to send it? Since you're my VIP, I'll do $35 instead of $60. But only if you want it now... I'm so turned on I might delete it later 🔥",
      differenceFromLower: "References specific past conversations, creates FOMO, personalized pricing based on fan value"
    }
  },

  enterprise: {
    plan: 'enterprise',
    models: {
      primary: {
        name: 'GPT-4o + Claude Opus',
        model: 'gpt-4o + claude-3-opus',
        capabilities: [
          'Perfect personality match',
          'Voice cloning ready',
          'Predictive purchasing',
          'Emotion mirroring',
          'Cultural adaptation',
          'Multi-thread conversations',
          'Revenue optimization AI',
          'Custom training on YOUR content'
        ],
        responseTime: '0.3-0.5 seconds',
        contextWindow: 1000000
      }
    },
    features: {
      messageQuality: 'perfect',
      personalization: 10,
      salesConversion: '+100-150% vs manual',
      learningSpeed: 'instant'
    },
    limits: {
      messagesPerMonth: -1, // Unlimited
      ppvPerDay: -1, // Unlimited
      customPersonalities: -1, // Unlimited
      voiceStyles: -1 // Unlimited
    },
    examples: {
      basicMessage: "[Perfectly matches creator's style, indistinguishable from human]",
      salesMessage: "[AI analyzes fan's entire history, mood, purchase patterns, time zone, and creates perfect message with 80%+ conversion rate]",
      differenceFromLower: "Two AIs collaborate: GPT-4o handles conversation, Claude Opus handles sales optimization"
    }
  }
};

// What makes each AI tier different
export const AI_DIFFERENTIATORS = {
  starter: {
    strengths: [
      "Responds 24/7 without breaks",
      "Never misses a message",
      "Basic but consistent"
    ],
    weaknesses: [
      "Sometimes generic responses",
      "Limited memory",
      "Basic sales tactics only"
    ],
    bestFor: "New creators who need help managing messages"
  },

  pro: {
    strengths: [
      "Remembers fan preferences",
      "Tracks what works",
      "Smart upselling",
      "Natural conversations"
    ],
    weaknesses: [
      "Can't predict fan behavior",
      "Limited personality options"
    ],
    bestFor: "Growing creators ready to scale"
  },

  scale: {
    strengths: [
      "Predicts what fans want",
      "Perfect timing for messages",
      "VIP treatment automation",
      "Prevents churn before it happens"
    ],
    weaknesses: [
      "Requires more setup",
      "Need volume to maximize"
    ],
    bestFor: "Established creators doing $7.5k+"
  },

  enterprise: {
    strengths: [
      "Indistinguishable from creator",
      "Two AIs working together",
      "Learns instantly",
      "Maximizes every opportunity"
    ],
    weaknesses: [
      "Expensive (but profitable)",
      "Requires $30k+ revenue"
    ],
    bestFor: "Top 1% creators who want unfair advantage"
  }
};

// Real examples of AI improvements
export const AI_CONVERSION_EXAMPLES = {
  scenario: "Fan viewed PPV but didn't buy",
  
  starter: {
    message: "Hey! Did you see my new video? Want to unlock it? 😘",
    conversion: "15%"
  },
  
  pro: {
    message: "Still thinking about that video babe? 😏 I know you peeked... want me to give you a special deal? Just for the next hour - $20 instead of $30",
    conversion: "32%"
  },
  
  scale: {
    message: "I saw you checking out my shower video at 2:47am 😈 Couldn't sleep thinking about it? Since you're one of my favorites and you loved my last bathroom content... $25 just for you. But I'm taking it down at midnight if nobody appreciates it...",
    conversion: "58%"
  },
  
  enterprise: {
    message: "[Crafted based on fan's 73 previous purchases, 4.3 second average view time on previews, preference for shower content, typically buys between 2-4am, responds to scarcity tactics, VIP status] Perfect message with 76% conversion",
    conversion: "76%"
  }
};

// Feature availability matrix
export const AI_FEATURES_MATRIX = {
  // Feature: [Starter, Pro, Scale, Enterprise]
  "24/7 Responses": [true, true, true, true],
  "Basic Personalization": [true, true, true, true],
  "Fan History": [false, true, true, true],
  "Behavioral Triggers": [false, true, true, true],
  "Predictive AI": [false, false, true, true],
  "VIP Detection": [false, false, true, true],
  "Multi-Personality": [false, false, true, true],
  "Two AI Collaboration": [false, false, false, true],
  "Custom Voice Training": [false, false, false, true],
  "Revenue Optimization": [false, false, false, true]
};