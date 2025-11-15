/**
 * Marketing API Integration Tests - Fixtures
 * 
 * Test data fixtures for marketing campaigns
 */

import type { Campaign, CampaignStatus, CampaignChannel, CampaignGoal } from '@/lib/types/marketing';

// Campaign fixtures
export const validCampaign: Campaign = {
  id: 'camp_test_001',
  creatorId: 'test_creator_123',
  name: 'Welcome New Subscribers',
  description: 'Automated welcome sequence for new subscribers',
  status: 'active',
  channel: 'email',
  goal: 'engagement',
  trigger: {
    type: 'event',
    event: 'subscriber.new',
  },
  content: {
    subject: 'Welcome to my exclusive content!',
    body: 'Hi {{name}}, thanks for subscribing!',
    mediaUrls: [],
  },
  schedule: {
    startDate: new Date('2024-01-01').toISOString(),
    endDate: null,
    timezone: 'America/New_York',
  },
  targeting: {
    segments: ['new_subscribers'],
    excludeSegments: [],
  },
  metrics: {
    sent: 150,
    delivered: 145,
    opened: 87,
    clicked: 34,
    converted: 12,
    revenue: 1200,
  },
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-15').toISOString(),
};

export const draftCampaign: Campaign = {
  ...validCampaign,
  id: 'camp_test_002',
  name: 'PPV Promotion',
  status: 'draft',
  metrics: {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    revenue: 0,
  },
};

export const scheduledCampaign: Campaign = {
  ...validCampaign,
  id: 'camp_test_003',
  name: 'Weekend Special',
  status: 'scheduled',
  schedule: {
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    timezone: 'America/New_York',
  },
};

export const pausedCampaign: Campaign = {
  ...validCampaign,
  id: 'camp_test_004',
  name: 'Paused Campaign',
  status: 'paused',
};

export const completedCampaign: Campaign = {
  ...validCampaign,
  id: 'camp_test_005',
  name: 'Completed Campaign',
  status: 'completed',
  schedule: {
    startDate: new Date('2024-01-01').toISOString(),
    endDate: new Date('2024-01-31').toISOString(),
    timezone: 'America/New_York',
  },
};

// Campaign list fixtures
export const campaignsList: Campaign[] = [
  validCampaign,
  draftCampaign,
  scheduledCampaign,
  pausedCampaign,
  completedCampaign,
];

// Create campaign request fixtures
export const validCreateRequest = {
  creatorId: 'test_creator_123',
  name: 'New Test Campaign',
  description: 'Test campaign description',
  channel: 'email' as CampaignChannel,
  goal: 'conversion' as CampaignGoal,
  trigger: {
    type: 'event' as const,
    event: 'subscriber.new',
  },
  content: {
    subject: 'Test Subject',
    body: 'Test body content',
    mediaUrls: [],
  },
  targeting: {
    segments: ['all'],
    excludeSegments: [],
  },
};

export const invalidCreateRequest = {
  // Missing required fields
  creatorId: 'test_creator_123',
  name: '',
  channel: 'invalid_channel',
};

// Update campaign request fixtures
export const validUpdateRequest = {
  name: 'Updated Campaign Name',
  description: 'Updated description',
  status: 'paused' as CampaignStatus,
};

export const invalidUpdateRequest = {
  status: 'invalid_status',
};

// Launch campaign request fixtures
export const validLaunchRequest = {
  creatorId: 'test_creator_123',
  schedule: {
    startDate: new Date(Date.now() + 60000).toISOString(),
    timezone: 'America/New_York',
  },
};

export const invalidLaunchRequest = {
  creatorId: 'test_creator_123',
  schedule: {
    startDate: new Date(Date.now() - 60000).toISOString(), // Past date
    timezone: 'Invalid/Timezone',
  },
};

// Filter fixtures
export const validFilters = {
  status: 'active' as CampaignStatus,
  channel: 'email' as CampaignChannel,
  goal: 'engagement' as CampaignGoal,
};

export const invalidFilters = {
  status: 'invalid_status',
  channel: 'invalid_channel',
};

// Pagination fixtures
export const paginationParams = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
};

// Error response fixtures
export const unauthorizedError = {
  error: 'Unauthorized',
  message: 'Authentication required',
};

export const forbiddenError = {
  error: 'Forbidden',
  message: 'You do not have permission to access this resource',
};

export const validationError = {
  error: 'Validation Error',
  message: 'Invalid request parameters',
  details: [
    { field: 'name', message: 'Name is required' },
    { field: 'channel', message: 'Invalid channel value' },
  ],
};

export const notFoundError = {
  error: 'Not Found',
  message: 'Campaign not found',
};

export const rateLimitError = {
  error: 'Too Many Requests',
  message: 'Rate limit exceeded. Please try again later.',
  retryAfter: 60,
};

export const serverError = {
  error: 'Internal Server Error',
  message: 'An unexpected error occurred',
};

// Success response fixtures
export const createSuccessResponse = {
  success: true,
  campaign: validCampaign,
};

export const updateSuccessResponse = {
  success: true,
  campaign: {
    ...validCampaign,
    ...validUpdateRequest,
    updatedAt: new Date().toISOString(),
  },
};

export const launchSuccessResponse = {
  success: true,
  campaign: {
    ...validCampaign,
    status: 'active' as CampaignStatus,
  },
};

export const deleteSuccessResponse = {
  success: true,
  message: 'Campaign deleted successfully',
};

// Metrics fixtures
export const campaignMetrics = {
  sent: 1000,
  delivered: 980,
  opened: 490,
  clicked: 147,
  converted: 49,
  revenue: 4900,
  openRate: 0.5,
  clickRate: 0.3,
  conversionRate: 0.1,
  revenuePerRecipient: 4.9,
};

// Analytics fixtures
export const campaignAnalytics = {
  campaignId: 'camp_test_001',
  period: {
    start: new Date('2024-01-01').toISOString(),
    end: new Date('2024-01-31').toISOString(),
  },
  metrics: campaignMetrics,
  timeline: [
    {
      date: '2024-01-01',
      sent: 50,
      opened: 25,
      clicked: 8,
      converted: 3,
    },
    {
      date: '2024-01-02',
      sent: 45,
      opened: 23,
      clicked: 7,
      converted: 2,
    },
  ],
  topPerformingContent: [
    {
      contentId: 'content_001',
      subject: 'Special Offer',
      openRate: 0.65,
      clickRate: 0.35,
      conversionRate: 0.15,
    },
  ],
};

// Bulk operation fixtures
export const bulkDeleteRequest = {
  creatorId: 'test_creator_123',
  campaignIds: ['camp_test_001', 'camp_test_002', 'camp_test_003'],
};

export const bulkDeleteResponse = {
  success: true,
  deleted: 3,
  failed: 0,
  errors: [],
};

// Template fixtures
export const campaignTemplate = {
  id: 'template_001',
  name: 'Welcome Series',
  description: 'Standard welcome email sequence',
  category: 'onboarding',
  channel: 'email' as CampaignChannel,
  content: {
    subject: 'Welcome to {{creator_name}}!',
    body: 'Hi {{subscriber_name}}, welcome!',
    mediaUrls: [],
  },
  variables: ['creator_name', 'subscriber_name'],
};

// A/B test fixtures
export const abTestCampaign = {
  ...validCampaign,
  id: 'camp_test_ab_001',
  name: 'A/B Test Campaign',
  abTest: {
    enabled: true,
    variants: [
      {
        id: 'variant_a',
        name: 'Variant A',
        weight: 0.5,
        content: {
          subject: 'Subject A',
          body: 'Body A',
          mediaUrls: [],
        },
      },
      {
        id: 'variant_b',
        name: 'Variant B',
        weight: 0.5,
        content: {
          subject: 'Subject B',
          body: 'Body B',
          mediaUrls: [],
        },
      },
    ],
    winnerMetric: 'conversion_rate' as const,
    testDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

// Export all fixtures
export const fixtures = {
  campaigns: {
    valid: validCampaign,
    draft: draftCampaign,
    scheduled: scheduledCampaign,
    paused: pausedCampaign,
    completed: completedCampaign,
    list: campaignsList,
    abTest: abTestCampaign,
  },
  requests: {
    create: {
      valid: validCreateRequest,
      invalid: invalidCreateRequest,
    },
    update: {
      valid: validUpdateRequest,
      invalid: invalidUpdateRequest,
    },
    launch: {
      valid: validLaunchRequest,
      invalid: invalidLaunchRequest,
    },
    bulkDelete: bulkDeleteRequest,
  },
  responses: {
    success: {
      create: createSuccessResponse,
      update: updateSuccessResponse,
      launch: launchSuccessResponse,
      delete: deleteSuccessResponse,
      bulkDelete: bulkDeleteResponse,
    },
    errors: {
      unauthorized: unauthorizedError,
      forbidden: forbiddenError,
      validation: validationError,
      notFound: notFoundError,
      rateLimit: rateLimitError,
      server: serverError,
    },
  },
  filters: {
    valid: validFilters,
    invalid: invalidFilters,
  },
  pagination: paginationParams,
  metrics: campaignMetrics,
  analytics: campaignAnalytics,
  template: campaignTemplate,
};
