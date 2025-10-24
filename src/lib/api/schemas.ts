import { z } from 'zod';

// Standard error payload returned by API
export const ErrorObject = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string().optional(),
});
export type ErrorObject = z.infer<typeof ErrorObject>;

export const ErrorResponse = z.object({ error: ErrorObject });
export type ErrorResponse = z.infer<typeof ErrorResponse>;

// Pagination structure
export const Pagination = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().min(0),
});
export type Pagination = z.infer<typeof Pagination>;

// Helper to build a paginated list schema with items of type T
export const paginatedOf = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({ items: z.array(itemSchema), pagination: Pagination });

// Domain models (shared)
export const MediaAsset = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['photo', 'video', 'story']),
  status: z.enum(['draft', 'scheduled', 'published']),
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
  thumbnail: z.string().url().optional(),
  metrics: z
    .object({ views: z.number().optional(), likes: z.number().optional(), revenue: z.number().optional() })
    .optional(),
});
export type MediaAsset = z.infer<typeof MediaAsset>;

export const PPVCampaign = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
  price: z.number(),
  createdAt: z.string(),
  metrics: z
    .object({ openRate: z.number().optional(), purchaseRate: z.number().optional(), roi: z.number().optional(), revenue: z.number().optional() })
    .optional(),
});
export type PPVCampaign = z.infer<typeof PPVCampaign>;

export const AIInsight = z.object({
  id: z.string(),
  type: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  title: z.string(),
  description: z.string().optional(),
  actions: z.array(z.string()).optional(),
  timestamp: z.string(),
});
export type AIInsight = z.infer<typeof AIInsight>;

// Synchronization & conflict models
export const SyncState = z.object({
  version: z.string().optional(),
  syncedAt: z.string().optional(),
  status: z.enum(['clean', 'dirty', 'conflict', 'resolving']).default('clean'),
});
export type SyncState = z.infer<typeof SyncState>;

export const ConflictDetails = z.object({
  field: z.string(),
  local: z.unknown(),
  remote: z.unknown(),
  strategy: z.enum(['local_wins', 'remote_wins', 'manual']).default('manual'),
});
export type ConflictDetails = z.infer<typeof ConflictDetails>;

