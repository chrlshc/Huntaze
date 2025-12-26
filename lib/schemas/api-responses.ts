import { z } from 'zod';

const dashboardTrendSchema = z.object({
  date: z.string(),
  value: z.number(),
});

const dashboardSummarySchema = z.object({
  totalRevenue: z.object({
    value: z.number(),
    currency: z.string(),
    change: z.number(),
  }),
  activeFans: z.object({
    value: z.number(),
    change: z.number(),
  }),
  messages: z.object({
    total: z.number(),
    unread: z.number(),
  }),
  engagement: z.object({
    value: z.number(),
    change: z.number(),
  }),
});

const dashboardActivitySchema = z.object({
  id: z.string(),
  type: z.enum(['content_published', 'campaign_sent', 'fan_subscribed', 'message_received']),
  title: z.string(),
  createdAt: z.string(),
  source: z.enum(['content', 'marketing', 'onlyfans', 'messages']),
  meta: z.record(z.string(), z.any()).optional(),
});

const dashboardQuickActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  href: z.string(),
});

const dashboardIntegrationsSchema = z.object({
  onlyfans: z.boolean(),
  instagram: z.boolean(),
  tiktok: z.boolean(),
  reddit: z.boolean(),
});

const dashboardDataSchema = z.object({
  summary: dashboardSummarySchema,
  trends: z.object({
    revenue: z.array(dashboardTrendSchema),
    fans: z.array(dashboardTrendSchema),
  }),
  recentActivity: z.array(dashboardActivitySchema),
  quickActions: z.array(dashboardQuickActionSchema),
  connectedIntegrations: dashboardIntegrationsSchema,
  metadata: z.object({
    sources: dashboardIntegrationsSchema,
    hasRealData: z.boolean(),
    generatedAt: z.string(),
  }),
});

export const dashboardResponseSchema = z.object({
  success: z.boolean(),
  data: dashboardDataSchema,
});

export const automationStepSchema = z.object({
  id: z.string(),
  type: z.enum(['trigger', 'condition', 'action']),
  name: z.string(),
  config: z.record(z.string(), z.any()).optional(),
});

export const automationFlowSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'paused', 'draft']),
  description: z.string().nullable().optional(),
  steps: z.array(automationStepSchema).optional(),
  userId: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const automationsListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(automationFlowSchema),
});

export const automationDetailResponseSchema = z.object({
  success: z.boolean(),
  data: automationFlowSchema,
});

const automationMetricsSchema = z.object({
  totalExecutions: z.number(),
  successRate: z.number(),
  successCount: z.number().optional(),
  failedCount: z.number().optional(),
  partialCount: z.number().optional(),
  averageStepsExecuted: z.number().optional(),
});

export const automationsCompareResponseSchema = z.object({
  comparisons: z.array(
    z.object({
      automationId: z.string(),
      metrics: automationMetricsSchema,
    }),
  ),
});

const automationBuilderDataSchema = z.object({
  name: z.string(),
  description: z.string(),
  steps: z.array(automationStepSchema),
  confidence: z.number(),
});

export const automationBuilderResponseSchema = z.object({
  success: z.boolean(),
  data: automationBuilderDataSchema.optional(),
  error: z
    .object({
      code: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
});

export const offerSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'expired', 'scheduled', 'draft']),
  discountType: z.enum(['percentage', 'fixed', 'bogo']),
  discountValue: z.number(),
  redemptionCount: z.number(),
  description: z.string().nullable(),
  originalPrice: z.number().nullable(),
  targetAudience: z.string().nullable(),
  contentIds: z.array(z.string()),
  validFrom: z.string(),
  validUntil: z.string(),
  userId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const offersListResponseSchema = z.object({
  offers: z.array(offerSchema),
  total: z.number(),
});

export const integrationsStatusSchema = z.object({
  id: z.number().optional(),
  provider: z.string(),
  accountId: z.string().optional(),
  providerAccountId: z.string().optional(),
  accountName: z.string().optional(),
  status: z.string().optional(),
  isConnected: z.boolean().optional(),
  expiresAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const integrationsStatusResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z
    .object({
      integrations: z.array(integrationsStatusSchema),
    })
    .optional(),
  integrations: z.array(integrationsStatusSchema).optional(),
});

const assistantConversationSummarySchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  updatedAt: z.string().optional(),
  messages: z
    .array(
      z.object({
        content: z.string(),
      }),
    )
    .optional(),
});

const assistantMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  createdAt: z.string(),
});

const assistantConversationDetailSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  updatedAt: z.string().optional(),
  messages: z.array(assistantMessageSchema).optional(),
});

export const assistantConversationsResponseSchema = z.object({
  conversations: z.array(assistantConversationSummarySchema),
});

export const assistantConversationResponseSchema = z.object({
  conversation: assistantConversationDetailSchema,
});

export const assistantConversationCreateResponseSchema = z.object({
  conversation: assistantConversationDetailSchema,
});

export const assistantReplyResponseSchema = z.object({
  reply: z.string(),
  conversationId: z.string(),
});

const onboardingStatusDataSchema = z
  .object({
    userId: z.string().optional(),
    currentStep: z.string().optional(),
    completedSteps: z.array(z.string()).optional(),
    skippedSteps: z.array(z.string()).optional(),
    progress: z.number().optional(),
    progressPercentage: z.number().optional(),
    creatorLevel: z.string().optional(),
    goals: z.array(z.string()).optional(),
    estimatedTimeRemaining: z.number().optional(),
    isComplete: z.boolean().optional(),
    nextRecommendedStep: z
      .object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        estimatedMinutes: z.number().optional(),
      })
      .optional(),
  })
  .partial();

export const onboardingStatusResponseSchema = z.object({
  success: z.boolean(),
  data: onboardingStatusDataSchema.optional(),
});

const onboardingStepResponseSchema = z.object({
  id: z.string(),
  version: z.number(),
  title: z.string(),
  description: z.string().optional(),
  required: z.boolean(),
  weight: z.number(),
  status: z.enum(['todo', 'done', 'skipped']),
  completedAt: z.string().optional(),
  roleRestricted: z.string().optional(),
});

export const onboardingStepsResponseSchema = z.object({
  progress: z.number(),
  steps: z.array(onboardingStepResponseSchema),
});

export const authOnboardingStatusResponseSchema = z.object({
  onboarding_completed: z.boolean(),
  correlationId: z.string(),
});

const aiQuotaSchema = z.object({
  limit: z.number(),
  spent: z.number(),
  remaining: z.number(),
  percentUsed: z.number(),
  plan: z.enum(['starter', 'pro', 'business']).optional(),
});

export const aiQuotaResponseSchema = z.object({
  success: z.boolean(),
  quota: aiQuotaSchema.nullable().optional(),
  error: z.string().optional(),
});

const aiChatDataSchema = z.object({
  response: z.string(),
  confidence: z.number(),
  suggestedUpsell: z.string().optional(),
  salesTactics: z.array(z.string()).optional(),
  suggestedPrice: z.number().optional(),
  agentsInvolved: z.array(z.string()).optional(),
  usage: z.record(z.string(), z.any()).optional(),
});

export const aiChatResponseSchema = z.object({
  success: z.boolean(),
  data: aiChatDataSchema.optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      retryable: z.boolean().optional(),
      severity: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
  meta: z
    .object({
      timestamp: z.string().optional(),
      requestId: z.string().optional(),
      duration: z.number().optional(),
      version: z.string().optional(),
    })
    .optional(),
});

const aiAgentSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  actions: z.array(z.string()).optional(),
});

export const aiAgentsResponseSchema = z.object({
  agents: z.array(aiAgentSchema).optional(),
});

export const aiAgentActionResponseSchema = z.object({
  message: z.string().optional(),
  type: z.string().optional(),
  result: z.any().optional(),
  error: z.string().optional(),
});
