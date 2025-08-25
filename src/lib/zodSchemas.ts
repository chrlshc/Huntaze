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