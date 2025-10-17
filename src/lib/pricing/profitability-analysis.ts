// Huntaze Profitability Analysis with Azure OpenAI Everywhere
// Real calculations with revenue caps and AI costs

export interface PlanProfitability {
  plan: string;
  monthlyFee: number;
  commissionRate: number;
  revenueCap: number | null;
  aiCosts: {
    azure: number;
    total: number;
  };
  profitAnalysis: {
    atCap: number;
    examples: Array<{
      creatorRevenue: number;
      totalIncome: number;
      aiCost: number;
      netProfit: number;
      profitMargin: number;
    }>;
  };
}

// Reference AI Pricing (per 1K tokens) — Azure OpenAI
const AI_PRICING = {
  'gpt-4': 0.03,
  'gpt-4-turbo': 0.01,
  'gpt-4o': 0.005, // Latest model (Azure), cost-optimized
};

// Average tokens per message conversation
const TOKENS_PER_MESSAGE = 150; // Input + output
const MESSAGES_PER_MONTH = {
  starter: 1000,
  pro: 5000,
  scale: 25000,
  enterprise: 50000 // Realistic for enterprise
};

// REAL Profitability with Azure OpenAI EVERYWHERE
export const PROFITABILITY_WITH_AZURE: Record<string, PlanProfitability> = {
  starter: {
    plan: 'STARTER',
    monthlyFee: 19,
    commissionRate: 0.07,
    revenueCap: 2500,
    aiCosts: { azure: 4.50, total: 4.50 },
    profitAnalysis: {
      atCap: 19 + (2500 * 0.07) - 4.54, // $189.46
      examples: [
        {
          creatorRevenue: 1000,
          totalIncome: 19 + 70,
          aiCost: 4.54,
          netProfit: 84.46,
          profitMargin: 94.9
        },
        {
          creatorRevenue: 2500,
          totalIncome: 19 + 175,
          aiCost: 4.54,
          netProfit: 189.46,
          profitMargin: 97.7
        }
      ]
    }
  },

  pro: {
    plan: 'PRO',
    monthlyFee: 39,
    commissionRate: 0.05,
    revenueCap: 5000,
    aiCosts: { azure: 7.50, total: 7.50 },
    profitAnalysis: {
      atCap: 39 + (5000 * 0.05) - 7.69, // $281.31
      examples: [
        {
          creatorRevenue: 3000,
          totalIncome: 39 + 150,
          aiCost: 7.69,
          netProfit: 181.31,
          profitMargin: 95.9
        },
        {
          creatorRevenue: 5000,
          totalIncome: 39 + 250,
          aiCost: 7.69,
          netProfit: 281.31,
          profitMargin: 97.3
        }
      ]
    }
  },

  scale: {
    plan: 'SCALE',
    monthlyFee: 79,
    commissionRate: 0.03,
    revenueCap: 15000,
    aiCosts: { azure: 37.50, total: 37.50 },
    profitAnalysis: {
      atCap: 79 + (15000 * 0.03) - 48.75, // $480.25
      examples: [
        {
          creatorRevenue: 10000,
          totalIncome: 79 + 300,
          aiCost: 48.75,
          netProfit: 330.25,
          profitMargin: 87.1
        },
        {
          creatorRevenue: 15000,
          totalIncome: 79 + 450,
          aiCost: 48.75,
          netProfit: 480.25,
          profitMargin: 90.8
        }
      ]
    }
  },

  enterprise: {
    plan: 'ENTERPRISE',
    monthlyFee: 199,
    commissionRate: 0.015,
    revenueCap: null, // No cap
    aiCosts: { azure: 37.50, total: 37.50 },
    profitAnalysis: {
      atCap: 0, // No cap
      examples: [
        {
          creatorRevenue: 30000,
          totalIncome: 199 + 450,
          aiCost: 150,
          netProfit: 499,
          profitMargin: 76.9
        },
        {
          creatorRevenue: 50000,
          totalIncome: 199 + 750,
          aiCost: 150,
          netProfit: 799,
          profitMargin: 84.2
        },
        {
          creatorRevenue: 100000,
          totalIncome: 199 + 1500,
          aiCost: 150,
          netProfit: 1549,
          profitMargin: 91.2
        }
      ]
    }
  }
};

// Smart AI Usage Strategy
export const AZURE_EVERYWHERE_STRATEGY = {
  starter: {
    messaging: "GPT-4 for quality responses",
    analysis: "Azure OpenAI for basic insights",
    cost: "$4.50/month total AI",
    value: "Premium AI even at starter level!"
  },
  
  pro: {
    messaging: "GPT-4-Turbo for faster responses",
    analysis: "Azure OpenAI for fan profiling",
    enhancement: "Quality checks on key messages",
    cost: "$7.50/month total AI",
    value: "Optimized for ROI"
  },
  
  scale: {
    messaging: "GPT-4-Turbo primary",
    analysis: "Azure OpenAI for predictive analytics",
    enhancement: "A/B testing pipeline",
    cost: "$37.50/month total AI",
    value: "Enterprise features at scale pricing!"
  },
  
  enterprise: {
    messaging: "GPT-4o (latest) for cutting edge",
    analysis: "Advanced profiling with Azure OpenAI",
    enhancement: "Full optimization pipeline",
    cost: "$37.50+/month total AI (usage-based)",
    value: "Top-tier Azure OpenAI stack"
  }
};

// Marketing Angle
export const MARKETING_MESSAGE = `
🧠 HUNTAZE: Built on Azure OpenAI (GPT-4 family)

While competitors give everyone the same basic chatbot, we:
- Use Azure OpenAI for high-quality, safe responses
- Adapt AI power by plan and use case
- Focus on conversions and creator personality

Result:
✅ 2-3x higher conversion rates
✅ Fans feel truly understood
✅ Messages that actually sound like you
`;

// Profit Summary
console.log('💰 PROFIT ANALYSIS WITH AZURE OPENAI:');
console.log('Starter: $84-189 profit/month (95-98% margin)');
console.log('Pro: $181-281 profit/month (96-97% margin)');
console.log('Scale: $330-480 profit/month (87-91% margin)');
console.log('Enterprise: $499-1549+ profit/month (77-91% margin)');
console.log('\n✅ CLAUDE IS PROFITABLE AT EVERY TIER!');
