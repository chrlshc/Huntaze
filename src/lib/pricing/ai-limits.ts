// AI Performance Limits by Plan
// Ensures profitability while delivering value

export interface AILimits {
  // Message Processing
  messagesPerMonth: number;
  messagesPerDay: number;
  responseSpeed: 'instant' | 'fast' | 'standard' | 'economy';
  
  // AI Model Quality
  aiModel: 'basic' | 'standard' | 'advanced' | 'premium';
  contextMemory: number; // Messages remembered in conversation
  personalityDepth: 'simple' | 'moderate' | 'deep' | 'ultra';
  
  // Features
  platforms: {
    onlyfans: boolean;
    instagram: boolean;
    twitter: boolean;
    tiktok: boolean;
    fansly: boolean;
    maxActive: number;
  };
  
  // Content Generation
  contentGeneration: {
    postsPerMonth: number;
    captionsPerMonth: number;
    hashtagSuggestions: boolean;
    trendAnalysis: boolean;
    aiImageGeneration: number; // images per month
  };
  
  // Analytics
  analytics: {
    realtime: boolean;
    historyDays: number;
    customReports: boolean;
    apiAccess: boolean;
  };
}

export const PLAN_LIMITS: Record<string, AILimits> = {
  starter: {
    messagesPerMonth: 1000,
    messagesPerDay: 50,
    responseSpeed: 'economy', // 2-5 sec delay
    
    aiModel: 'basic', // GPT-3.5 equivalent
    contextMemory: 5, // Remember last 5 messages
    personalityDepth: 'simple',
    
    platforms: {
      onlyfans: true,
      instagram: true,
      twitter: false,
      tiktok: false,
      fansly: false,
      maxActive: 1
    },
    
    contentGeneration: {
      postsPerMonth: 30,
      captionsPerMonth: 100,
      hashtagSuggestions: true,
      trendAnalysis: false,
      aiImageGeneration: 0
    },
    
    analytics: {
      realtime: false,
      historyDays: 30,
      customReports: false,
      apiAccess: false
    }
  },
  
  pro: {
    messagesPerMonth: 5000,
    messagesPerDay: 200,
    responseSpeed: 'standard', // 1-2 sec delay
    
    aiModel: 'standard', // GPT-4 equivalent
    contextMemory: 10, // Remember last 10 messages
    personalityDepth: 'moderate',
    
    platforms: {
      onlyfans: true,
      instagram: true,
      twitter: true,
      tiktok: true,
      fansly: true,
      maxActive: 3
    },
    
    contentGeneration: {
      postsPerMonth: 100,
      captionsPerMonth: 500,
      hashtagSuggestions: true,
      trendAnalysis: true,
      aiImageGeneration: 10
    },
    
    analytics: {
      realtime: true,
      historyDays: 90,
      customReports: false,
      apiAccess: false
    }
  },
  
  scale: {
    messagesPerMonth: 25000,
    messagesPerDay: 1000,
    responseSpeed: 'fast', // < 1 sec
    
    aiModel: 'advanced', // GPT-4 Turbo
    contextMemory: 25, // Remember last 25 messages
    personalityDepth: 'deep',
    
    platforms: {
      onlyfans: true,
      instagram: true,
      twitter: true,
      tiktok: true,
      fansly: true,
      maxActive: 10
    },
    
    contentGeneration: {
      postsPerMonth: 500,
      captionsPerMonth: 2000,
      hashtagSuggestions: true,
      trendAnalysis: true,
      aiImageGeneration: 100
    },
    
    analytics: {
      realtime: true,
      historyDays: 365,
      customReports: true,
      apiAccess: true
    }
  },
  
  enterprise: {
    messagesPerMonth: Infinity,
    messagesPerDay: Infinity,
    responseSpeed: 'instant', // < 0.5 sec
    
    aiModel: 'premium', // Claude 3 Opus / GPT-4 Latest
    contextMemory: 100, // Remember entire conversation
    personalityDepth: 'ultra',
    
    platforms: {
      onlyfans: true,
      instagram: true,
      twitter: true,
      tiktok: true,
      fansly: true,
      maxActive: Infinity
    },
    
    contentGeneration: {
      postsPerMonth: Infinity,
      captionsPerMonth: Infinity,
      hashtagSuggestions: true,
      trendAnalysis: true,
      aiImageGeneration: 1000
    },
    
    analytics: {
      realtime: true,
      historyDays: Infinity,
      customReports: true,
      apiAccess: true
    }
  }
};

// Cost calculation helpers
export const AI_COSTS = {
  // Per message costs (approximate)
  basic: 0.002,     // $0.002 per message
  standard: 0.01,   // $0.01 per message
  advanced: 0.02,   // $0.02 per message
  premium: 0.03,    // $0.03 per message
  
  // Image generation
  imageGeneration: 0.05, // $0.05 per image
  
  // Platform fees (monthly per platform)
  platformMaintenance: 5, // $5 per platform
};

// Calculate profitability
export function calculatePlanProfitability(plan: string, monthlyPrice: number): {
  maxAICost: number;
  platformCost: number;
  profit: number;
  profitMargin: number;
} {
  const limits = PLAN_LIMITS[plan];
  if (!limits) return { maxAICost: 0, platformCost: 0, profit: 0, profitMargin: 0 };
  
  // Calculate max AI cost if user uses all limits
  const messageCost = limits.messagesPerMonth * AI_COSTS[limits.aiModel];
  const imageCost = limits.contentGeneration.aiImageGeneration * AI_COSTS.imageGeneration;
  const platformCost = limits.platforms.maxActive * AI_COSTS.platformMaintenance;
  
  const totalCost = messageCost + imageCost + platformCost;
  const profit = monthlyPrice - totalCost;
  const profitMargin = (profit / monthlyPrice) * 100;
  
  return {
    maxAICost: messageCost + imageCost,
    platformCost,
    profit,
    profitMargin
  };
}

// Example profitability check
console.log('Plan Profitability Analysis:');
console.log('Starter:', calculatePlanProfitability('starter', 19));
console.log('Pro:', calculatePlanProfitability('pro', 39));
console.log('Scale:', calculatePlanProfitability('scale', 79));
console.log('Enterprise:', calculatePlanProfitability('enterprise', 199));