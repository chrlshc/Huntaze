/**
 * Test Fixtures - Revenue Optimization
 * 
 * Reusable test data for integration tests
 */

import type {
  PricingRecommendation,
  ChurnRiskResponse,
  UpsellOpportunitiesResponse,
  RevenueForecastResponse,
  PayoutScheduleResponse,
} from '@/lib/services/revenue/types';

// Test creator IDs
export const TEST_CREATORS = {
  VALID: 'test_creator_123',
  OTHER: 'other_creator_456',
  INVALID: 'invalid_creator',
};

// Test fan IDs
export const TEST_FANS = {
  HIGH_RISK: 'fan_high_risk_1',
  MEDIUM_RISK: 'fan_medium_risk_1',
  LOW_RISK: 'fan_low_risk_1',
  INVALID: 'invalid_fan',
};

// Pricing fixtures
export const PRICING_FIXTURES = {
  VALID_SUBSCRIPTION: {
    creatorId: TEST_CREATORS.VALID,
    priceType: 'subscription' as const,
    newPrice: 12.99,
  },
  VALID_PPV: {
    creatorId: TEST_CREATORS.VALID,
    priceType: 'ppv' as const,
    contentId: 'content_123',
    newPrice: 25.00,
  },
  INVALID_NEGATIVE_PRICE: {
    creatorId: TEST_CREATORS.VALID,
    priceType: 'subscription' as const,
    newPrice: -5.99,
  },
  INVALID_ZERO_PRICE: {
    creatorId: TEST_CREATORS.VALID,
    priceType: 'subscription' as const,
    newPrice: 0,
  },
  INVALID_PRICE_TYPE: {
    creatorId: TEST_CREATORS.VALID,
    priceType: 'invalid' as any,
    newPrice: 12.99,
  },
};

// Mock pricing recommendation response
export const MOCK_PRICING_RECOMMENDATION: PricingRecommendation = {
  subscription: {
    current: 9.99,
    recommended: 12.99,
    revenueImpact: 30,
    reasoning: 'Based on your engagement rate and subscriber retention, you can increase your price by 30% without significant churn.',
    confidence: 0.85,
  },
  ppv: [
    {
      contentId: 'content_123',
      contentType: 'video',
      recommendedRange: { min: 25, max: 35 },
      expectedRevenue: { min: 2500, max: 3500 },
    },
    {
      contentId: 'content_456',
      contentType: 'photo',
      recommendedRange: { min: 15, max: 20 },
      expectedRevenue: { min: 1500, max: 2000 },
    },
  ],
  metadata: {
    lastUpdated: new Date().toISOString(),
    dataPoints: 1234,
  },
};

// Churn fixtures
export const CHURN_FIXTURES = {
  VALID_REENGAGE: {
    creatorId: TEST_CREATORS.VALID,
    fanId: TEST_FANS.HIGH_RISK,
  },
  VALID_REENGAGE_WITH_TEMPLATE: {
    creatorId: TEST_CREATORS.VALID,
    fanId: TEST_FANS.HIGH_RISK,
    messageTemplate: 'Hey! Missing you...',
  },
  VALID_BULK_REENGAGE: {
    creatorId: TEST_CREATORS.VALID,
    fanIds: [TEST_FANS.HIGH_RISK, TEST_FANS.MEDIUM_RISK, TEST_FANS.LOW_RISK],
  },
};

// Mock churn risk response
export const MOCK_CHURN_RISK_RESPONSE: ChurnRiskResponse = {
  summary: {
    totalAtRisk: 23,
    highRisk: 7,
    mediumRisk: 10,
    lowRisk: 6,
  },
  fans: [
    {
      id: TEST_FANS.HIGH_RISK,
      name: 'Sarah M.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      churnProbability: 0.95,
      daysSinceLastActivity: 25,
      riskLevel: 'high',
      lifetimeValue: 15000,
      lastMessage: 'Thanks for the content!',
    },
    {
      id: TEST_FANS.MEDIUM_RISK,
      name: 'Mike R.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      churnProbability: 0.72,
      daysSinceLastActivity: 15,
      riskLevel: 'medium',
      lifetimeValue: 8500,
      lastMessage: 'Love your work',
    },
    {
      id: TEST_FANS.LOW_RISK,
      name: 'Emma L.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      churnProbability: 0.35,
      daysSinceLastActivity: 5,
      riskLevel: 'low',
      lifetimeValue: 3200,
    },
  ],
  metadata: {
    lastCalculated: new Date().toISOString(),
    modelVersion: 'v2.1',
  },
};

// Upsell fixtures
export const UPSELL_FIXTURES = {
  VALID_SEND: {
    creatorId: TEST_CREATORS.VALID,
    opportunityId: 'opp_123',
  },
  VALID_SEND_WITH_MESSAGE: {
    creatorId: TEST_CREATORS.VALID,
    opportunityId: 'opp_123',
    customMessage: 'Check out this exclusive content!',
  },
  VALID_DISMISS: {
    creatorId: TEST_CREATORS.VALID,
    opportunityId: 'opp_123',
  },
  VALID_AUTOMATION_SETTINGS: {
    enabled: true,
    autoSendThreshold: 0.8,
    maxDailyUpsells: 10,
    excludedFans: [],
    customRules: [],
  },
};

// Mock upsell opportunities response
export const MOCK_UPSELL_OPPORTUNITIES: UpsellOpportunitiesResponse = {
  opportunities: [
    {
      id: 'opp_123',
      fanId: 'fan_1',
      fanName: 'Sarah M.',
      triggerPurchase: {
        item: 'Beach Photos Set',
        amount: 15,
        date: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      suggestedProduct: {
        name: 'Beach Video Collection',
        price: 25,
        description: 'Exclusive behind-the-scenes footage',
      },
      buyRate: 0.78,
      expectedRevenue: 19.5,
      confidence: 0.85,
      messagePreview: 'Hey Sarah! Loved the beach photos? Check out the exclusive video! 🏖️',
    },
  ],
  stats: {
    totalOpportunities: 12,
    expectedRevenue: 450,
    averageBuyRate: 0.72,
  },
  metadata: {
    lastUpdated: new Date().toISOString(),
  },
};

// Forecast fixtures
export const FORECAST_FIXTURES = {
  VALID_GOAL: {
    creatorId: TEST_CREATORS.VALID,
    goalAmount: 20000,
    targetMonth: '2024-12',
  },
  VALID_SCENARIO: {
    creatorId: TEST_CREATORS.VALID,
    newSubscribers: 50,
    priceIncrease: 2,
    churnReduction: 0.1,
  },
};

// Mock revenue forecast response
export const MOCK_REVENUE_FORECAST: RevenueForecastResponse = {
  historical: [
    { month: '2024-01', revenue: 12340, growth: 15 },
    { month: '2024-02', revenue: 13500, growth: 9.4 },
    { month: '2024-03', revenue: 14200, growth: 5.2 },
  ],
  forecast: [
    {
      month: '2024-12',
      predicted: 18500,
      confidence: { min: 16000, max: 21000 },
    },
  ],
  currentMonth: {
    projected: 15234,
    actual: 12340,
    completion: 81,
    onTrack: false,
  },
  nextMonth: {
    projected: 18500,
    actual: 0,
    completion: 0,
    onTrack: true,
  },
  recommendations: [
    {
      action: 'Add 12 new subscribers',
      impact: 1200,
      effort: 'medium',
      description: 'Focus on Instagram promotion',
    },
  ],
  metadata: {
    modelAccuracy: 0.87,
    lastUpdated: new Date().toISOString(),
  },
};

// Payout fixtures
export const PAYOUT_FIXTURES = {
  VALID_TAX_RATE: {
    creatorId: TEST_CREATORS.VALID,
    taxRate: 0.30,
  },
  VALID_SYNC: {
    creatorId: TEST_CREATORS.VALID,
    platform: 'onlyfans' as const,
  },
};

// Mock payout schedule response
export const MOCK_PAYOUT_SCHEDULE: PayoutScheduleResponse = {
  payouts: [
    {
      id: 'payout_123',
      platform: 'onlyfans',
      amount: 12340,
      date: new Date('2024-11-15'),
      status: 'pending',
      period: {
        start: new Date('2024-11-01'),
        end: new Date('2024-11-14'),
      },
    },
    {
      id: 'payout_456',
      platform: 'fansly',
      amount: 3450,
      date: new Date('2024-11-20'),
      status: 'pending',
      period: {
        start: new Date('2024-11-01'),
        end: new Date('2024-11-14'),
      },
    },
  ],
  summary: {
    totalExpected: 16680,
    taxEstimate: 5004,
    netIncome: 11676,
  },
  platforms: [
    {
      platform: 'onlyfans',
      connected: true,
      lastSync: new Date().toISOString(),
    },
    {
      platform: 'fansly',
      connected: true,
      lastSync: new Date().toISOString(),
    },
  ],
};

// Error fixtures
export const ERROR_FIXTURES = {
  UNAUTHORIZED: {
    error: 'Unauthorized',
  },
  FORBIDDEN: {
    error: 'Forbidden',
  },
  VALIDATION_ERROR: {
    error: 'Validation error',
  },
  RATE_LIMIT: {
    error: 'Too many requests',
  },
  SERVER_ERROR: {
    error: 'Internal server error',
  },
};

// Helper to generate correlation IDs
export function generateCorrelationId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Helper to create authenticated request options
export function createAuthHeaders(sessionToken?: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Cookie': `next-auth.session-token=${sessionToken || 'test_token'}`,
    'X-Correlation-ID': generateCorrelationId(),
  };
}

// Helper to wait for async operations
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to retry operations
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await wait(delay);
      }
    }
  }

  throw lastError;
}

// Factory functions for creating test data
export function createMockFan(overrides: Partial<typeof mockChurnRisks.fans[0]> = {}) {
  return {
    id: `fan_${Math.random().toString(36).substring(7)}`,
    name: 'Test Fan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
    churnProbability: 0.5,
    daysSinceLastActivity: 10,
    riskLevel: 'medium' as const,
    lifetimeValue: 5000,
    lastMessage: 'Test message',
    ...overrides,
  };
}

export function createMockUpsellOpportunity(overrides: Partial<typeof mockUpsellOpportunities.opportunities[0]> = {}) {
  return {
    id: `upsell_${Math.random().toString(36).substring(7)}`,
    fanId: `fan_${Math.random().toString(36).substring(7)}`,
    fanName: 'Test Fan',
    triggerPurchase: {
      item: 'Test Item',
      amount: 10,
      date: new Date(),
    },
    suggestedProduct: {
      name: 'Test Product',
      price: 20,
      description: 'Test description',
    },
    buyRate: 0.7,
    expectedRevenue: 14,
    confidence: 0.8,
    messagePreview: 'Test message',
    ...overrides,
  };
}

export function createMockPayout(overrides: Partial<typeof mockPayoutSchedule.payouts[0]> = {}) {
  return {
    id: `payout_${Math.random().toString(36).substring(7)}`,
    platform: 'onlyfans' as const,
    amount: 1000,
    date: new Date(),
    status: 'pending' as const,
    period: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
    ...overrides,
  };
}
