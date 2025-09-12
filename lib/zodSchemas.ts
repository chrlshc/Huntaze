import { z } from 'zod';

// Step 1: OnlyFans Connection
export const onlyFansConnectionSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  twoFactorCode: z.string().optional(),
  acceptCompliance: z.literal(true).refine((val) => val === true, {
    message: 'You must accept the compliance terms',
  }),
});

// Step 2: AI Configuration
export const aiConfigurationSchema = z.object({
  enableAI: z.boolean(),
  aiFeatures: z.object({
    autoReply: z.boolean(),
    contentSuggestions: z.boolean(),
    analyticsInsights: z.boolean(),
    dmcaProtection: z.boolean(),
  }),
  replyStyle: z.enum(['friendly', 'flirty', 'professional', 'custom']),
  customInstructions: z.string().max(500).optional(),
});

// Step 3: Payment Setup
export const paymentSetupSchema = z.object({
  plan: z.enum(['pro', 'growth', 'scale', 'enterprise']),
  billingInterval: z.enum(['monthly', 'yearly']),
  promoCode: z.string().optional(),
  acceptTerms: z.literal(true).refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

// Complete onboarding schema
export const completeOnboardingSchema = z.object({
  onlyFansConnection: onlyFansConnectionSchema,
  aiConfiguration: aiConfigurationSchema,
  paymentSetup: paymentSetupSchema,
});

export type OnlyFansConnectionData = z.infer<typeof onlyFansConnectionSchema>;
export type AIConfigurationData = z.infer<typeof aiConfigurationSchema>;
export type PaymentSetupData = z.infer<typeof paymentSetupSchema>;
export type CompleteOnboardingData = z.infer<typeof completeOnboardingSchema>;

// ===== Extended Onboarding (MVP) =====

export const goalsSchema = z.object({
  revenueTarget: z.number().nullable().optional(),
  timeSaved: z.number().nullable().optional(),
  automationLevel: z.number().min(0).max(100).optional(),
});

export const personaSchema = z.object({
  toneSliders: z
    .object({ friendlyFlirty: z.number().min(0).max(100).optional(), playfulRefined: z.number().min(0).max(100).optional(), directSoft: z.number().min(0).max(100).optional() })
    .partial()
    .optional(),
  emojiUsage: z.enum(['low', 'med', 'high']).optional(),
  punctuationStyle: z.enum(['sober', 'energetic']).optional(),
  complexity: z.enum(['simple', 'rich']).optional(),
  signaturePhrases: z.array(z.string()).optional(),
  forbiddenPhrases: z.array(z.string()).optional(),
});

export const boundariesSchema = z.object({
  nsfwLevel: z.enum(['soft', 'explicit']).optional(),
  restrictedTopics: z.array(z.string()).optional(),
  safeWord: z.string().nullable().optional(),
  platformRulesFlags: z
    .object({ OF: z.boolean().optional(), IG: z.boolean().optional(), TT: z.boolean().optional() })
    .partial()
    .optional(),
});

export const monetizationSchema = z.object({
  subPrice: z.number().min(0).optional(),
  trialEnabled: z.boolean().optional(),
  trialDays: z.number().int().min(0).max(30).optional(),
  ppvRange: z.object({ min: z.number(), typical: z.number(), max: z.number() }).partial().optional(),
  bundles: z.array(z.object({ months: z.number().int().positive(), discountPct: z.number().min(0).max(100) })).optional(),
  discountCapPct: z.number().min(0).max(100).optional(),
  upsellMenu: z.array(z.object({ item: z.string(), price: z.number().min(0), eta: z.string().optional() })).optional(),
  customContentEnabled: z.boolean().optional(),
});

export const opsSchema = z.object({
  timezone: z.string().optional(),
  activeHours: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
  responseSLA: z.object({ normal: z.string().optional(), vip: z.string().optional() }).optional(),
  automationLevel: z.number().min(0).max(100).optional(),
  reviewThresholds: z.object({ ppvAmount: z.number().optional(), customRequest: z.boolean().optional() }).optional(),
  dailyCaps: z.object({ global: z.number().optional(), vip: z.number().optional() }).optional(),
  reengageWindows: z.array(z.string()).optional(),
});

export const segmentationSchema = z.object({
  whaleThreshold: z.number().optional(),
  cohorts: z.array(z.object({ name: z.string(), min: z.number().optional(), max: z.number().optional() })).optional(),
});

export const dataConsentSchema = z.object({
  trainingConsent: z.boolean().optional(),
  retentionDays: z.number().int().optional(),
});

export const funnelsSchema = z.object({
  linkHub: z.string().url().optional(),
  priorityGoals: z.array(z.string()).optional(),
});

export const nichesSchema = z.object({ niches: z.array(z.string()) });

export type GoalsData = z.infer<typeof goalsSchema>;
export type PersonaData = z.infer<typeof personaSchema>;
export type BoundariesData = z.infer<typeof boundariesSchema>;
export type MonetizationData = z.infer<typeof monetizationSchema>;
export type OpsData = z.infer<typeof opsSchema>;
export type SegmentationData = z.infer<typeof segmentationSchema>;
export type DataConsentData = z.infer<typeof dataConsentSchema>;
export type FunnelsData = z.infer<typeof funnelsSchema>;
export type NichesData = z.infer<typeof nichesSchema>;
