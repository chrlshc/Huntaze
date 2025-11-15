/**
 * Marketing Campaign Validation Schemas (Zod)
 */

import { z } from 'zod';

export const campaignStatusSchema = z.enum(['draft', 'scheduled', 'active', 'paused', 'completed']);
export const campaignChannelSchema = z.enum(['email', 'dm', 'sms', 'push']);
export const campaignGoalSchema = z.enum(['engagement', 'retention', 'revenue', 'acquisition']);

export const campaignAudienceSchema = z.object({
  segment: z.string().min(1, 'Segment is required'),
  size: z.number().int().positive('Audience size must be positive'),
  criteria: z.record(z.any()).optional(),
});

export const campaignMessageSchema = z.object({
  subject: z.string().optional(),
  body: z.string().min(1, 'Message body is required'),
  template: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

export const createCampaignSchema = z.object({
  creatorId: z.string().min(1, 'Creator ID is required'),
  name: z.string().min(1, 'Campaign name is required').max(100, 'Name too long'),
  channel: campaignChannelSchema,
  goal: campaignGoalSchema,
  audience: campaignAudienceSchema,
  message: campaignMessageSchema,
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  channel: campaignChannelSchema.optional(),
  goal: campaignGoalSchema.optional(),
  audience: campaignAudienceSchema.optional(),
  message: campaignMessageSchema.optional(),
  status: campaignStatusSchema.optional(),
});

export const launchCampaignSchema = z.object({
  creatorId: z.string().min(1, 'Creator ID is required'),
  scheduledFor: z.string().datetime().optional(),
});
