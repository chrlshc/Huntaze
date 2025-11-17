/**
 * Marketing API Test Fixtures
 * 
 * Sample data for marketing campaign integration tests
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas for Response Validation
// ============================================================================

export const CampaignStatsSchema = z.object({
  sent: z.number().int().min(0),
  opened: z.number().int().min(0),
  clicked: z.number().int().min(0),
  converted: z.number().int().min(0),
  openRate: z.number().min(0).max(100),
  clickRate: z.number().min(0).max(100),
  conversionRate: z.number().min(0).max(100),
});

export const CampaignSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed']),
  channel: z.enum(['email', 'dm', 'sms', 'push']),
  goal: z.enum(['engagement', 'conversion', 'retention']),
  audienceSegment: z.string(),
  audienceSize: z.number().int().min(0),
  message: z.record(z.any()),
  schedule: z.record(z.any()).nullable().optional(),
  stats: CampaignStatsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CampaignListResponseSchema = z.object({
  items: z.array(CampaignSchema),
  pagination: z.object({
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
    hasMore: z.boolean(),
  }),
});

export const CampaignCreateResponseSchema = CampaignSchema;

export const CampaignUpdateResponseSchema = CampaignSchema;

export const CampaignDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
});

// ============================================================================
// Sample Campaign Data
// ============================================================================

export const sampleCampaigns = {
  emailEngagement: {
    name: 'Welcome Email Series',
    status: 'draft' as const,
    channel: 'email' as const,
    goal: 'engagement' as const,
    audienceSegment: 'new_subscribers',
    audienceSize: 1000,
    message: {
      subject: 'Welcome to our community!',
      body: 'Thank you for joining us...',
      template: 'welcome_v1',
    },
    schedule: {
      type: 'immediate',
    },
  },

  dmConversion: {
    name: 'Premium Upsell DM',
    status: 'scheduled' as const,
    channel: 'dm' as const,
    goal: 'conversion' as const,
    audienceSegment: 'free_tier_users',
    audienceSize: 500,
    message: {
      text: 'Upgrade to premium for exclusive content!',
      cta: 'Upgrade Now',
      link: 'https://example.com/upgrade',
    },
    schedule: {
      type: 'scheduled',
      sendAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    },
  },

  smsRetention: {
    name: 'Re-engagement SMS',
    status: 'active' as const,
    channel: 'sms' as const,
    goal: 'retention' as const,
    audienceSegment: 'inactive_30_days',
    audienceSize: 250,
    message: {
      text: 'We miss you! Come back for a special offer.',
      shortLink: 'https://short.link/abc123',
    },
    schedule: {
      type: 'recurring',
      frequency: 'weekly',
    },
  },

  pushNotification: {
    name: 'New Content Alert',
    status: 'paused' as const,
    channel: 'push' as const,
    goal: 'engagement' as const,
    audienceSegment: 'all_users',
    audienceSize: 5000,
    message: {
      title: 'New content available!',
      body: 'Check out the latest updates',
      icon: 'notification_icon.png',
      action: 'open_app',
    },
  },

  completedCampaign: {
    name: 'Black Friday Sale',
    status: 'completed' as const,
    channel: 'email' as const,
    goal: 'conversion' as const,
    audienceSegment: 'all_subscribers',
    audienceSize: 10000,
    message: {
      subject: '50% OFF - Black Friday Sale!',
      body: 'Limited time offer...',
      template: 'sale_v2',
    },
    schedule: {
      type: 'scheduled',
      sendAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    },
  },
};

// ============================================================================
// Sample Stats Data
// ============================================================================

export const sampleStats = {
  noActivity: {
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
  },

  lowEngagement: {
    sent: 1000,
    opened: 100,
    clicked: 10,
    converted: 1,
  },

  mediumEngagement: {
    sent: 1000,
    opened: 300,
    clicked: 60,
    converted: 15,
  },

  highEngagement: {
    sent: 1000,
    opened: 600,
    clicked: 240,
    converted: 80,
  },

  perfectEngagement: {
    sent: 100,
    opened: 100,
    clicked: 100,
    converted: 100,
  },
};

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Generate a unique campaign name for testing
 */
export function generateCampaignName(prefix: string = 'Test Campaign'): string {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create campaign data with overrides
 */
export function createCampaignData(overrides: Partial<typeof sampleCampaigns.emailEngagement> = {}) {
  return {
    ...sampleCampaigns.emailEngagement,
    name: generateCampaignName(),
    ...overrides,
  };
}

/**
 * Calculate expected stats rates
 */
export function calculateExpectedRates(stats: typeof sampleStats.noActivity) {
  const { sent, opened, clicked, converted } = stats;
  
  return {
    openRate: sent > 0 ? (opened / sent) * 100 : 0,
    clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
    conversionRate: sent > 0 ? (converted / sent) * 100 : 0,
  };
}

/**
 * Validate campaign stats calculations
 */
export function validateStatsCalculation(stats: any) {
  const { sent, opened, clicked, converted, openRate, clickRate, conversionRate } = stats;
  
  // Validate rates are calculated correctly
  const expectedOpenRate = sent > 0 ? (opened / sent) * 100 : 0;
  const expectedClickRate = opened > 0 ? (clicked / opened) * 100 : 0;
  const expectedConversionRate = sent > 0 ? (converted / sent) * 100 : 0;
  
  return {
    openRateCorrect: Math.abs(openRate - expectedOpenRate) < 0.01,
    clickRateCorrect: Math.abs(clickRate - expectedClickRate) < 0.01,
    conversionRateCorrect: Math.abs(conversionRate - expectedConversionRate) < 0.01,
  };
}

/**
 * Generate bulk campaign data for load testing
 */
export function generateBulkCampaigns(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    ...sampleCampaigns.emailEngagement,
    name: `Bulk Campaign ${i + 1} - ${Date.now()}`,
    audienceSize: Math.floor(Math.random() * 10000) + 100,
  }));
}

/**
 * Create invalid campaign data for validation testing
 */
export const invalidCampaignData = {
  missingName: {
    status: 'draft',
    channel: 'email',
    goal: 'engagement',
    audienceSegment: 'test',
    audienceSize: 100,
    message: {},
  },

  invalidStatus: {
    name: 'Test Campaign',
    status: 'invalid_status',
    channel: 'email',
    goal: 'engagement',
    audienceSegment: 'test',
    audienceSize: 100,
    message: {},
  },

  invalidChannel: {
    name: 'Test Campaign',
    status: 'draft',
    channel: 'invalid_channel',
    goal: 'engagement',
    audienceSegment: 'test',
    audienceSize: 100,
    message: {},
  },

  negativeAudienceSize: {
    name: 'Test Campaign',
    status: 'draft',
    channel: 'email',
    goal: 'engagement',
    audienceSegment: 'test',
    audienceSize: -100,
    message: {},
  },

  emptyMessage: {
    name: 'Test Campaign',
    status: 'draft',
    channel: 'email',
    goal: 'engagement',
    audienceSegment: 'test',
    audienceSize: 100,
    message: null,
  },
};
