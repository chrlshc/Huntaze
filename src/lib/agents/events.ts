import { z } from 'zod';

export const Correlation = z.object({
  traceId: z.string().uuid(),
  modelId: z.string(),
  runId: z.string().uuid(),
});
export type Correlation = z.infer<typeof Correlation>;

export const PlanRequest = z.object({
  correlation: Correlation,
  period: z.enum(['next_week', 'next_month']).optional(),
  platforms: z.array(z.enum(['instagram', 'onlyfans', 'tiktok', 'reddit'])).optional(),
  preferences: z.record(z.any()).optional(),
  timezone: z.string().optional(),
});
export type PlanRequest = z.infer<typeof PlanRequest>;

export const PlanReady = z.object({
  correlation: Correlation,
  plan: z.array(z.object({ day: z.string(), idea: z.string() })),
});
export type PlanReady = z.infer<typeof PlanReady>;

export const ContentReady = z.object({
  correlation: Correlation,
  contents: z.array(
    z.object({
      idea: z.string(),
      text: z.string(),
      assets: z
        .array(z.object({ type: z.enum(['image', 'video']), uri: z.string() }))
        .optional(),
    }),
  ),
});
export type ContentReady = z.infer<typeof ContentReady>;

export const PostScheduled = z.object({
  correlation: Correlation,
  scheduled: z.array(
    z.object({ platform: z.string(), externalId: z.string().optional(), at: z.string() }),
  ),
});
export type PostScheduled = z.infer<typeof PostScheduled>;

export const AnalyticsUpdate = z.object({
  correlation: Correlation,
  metrics: z.array(
    z.object({
      idea: z.string(),
      likes: z.number().int().nonnegative(),
      comments: z.number().int().nonnegative(),
      newSubscribers: z.number().int().nonnegative(),
    }),
  ),
});
export type AnalyticsUpdate = z.infer<typeof AnalyticsUpdate>;

export const TrendsUpdate = z.object({
  correlation: Correlation,
  trends: z.array(z.string()),
});
export type TrendsUpdate = z.infer<typeof TrendsUpdate>;

export type EventMap = {
  PLAN_REQUEST: PlanRequest;
  PLAN_READY: PlanReady;
  CONTENT_READY: ContentReady;
  POST_SCHEDULED: PostScheduled;
  ANALYTICS_UPDATE: AnalyticsUpdate;
  TRENDS_UPDATE: TrendsUpdate;
};

export type EventType = keyof EventMap;

export function makeCorrelation(modelId: string): Correlation {
  // Use Node crypto's randomUUID at runtime; here we just type it
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomUUID } = require('crypto');
  return { traceId: randomUUID(), runId: randomUUID(), modelId } as Correlation;
}

