import { z } from "zod";

export const Correlation = z.string().min(1);

export const PlanRequest = z.object({
  correlation: Correlation,
  period: z.enum(["next_week", "next_month"]),
  platforms: z.array(z.enum(["instagram", "onlyfans", "tiktok", "reddit"])).min(1),
  preferences: z.record(z.string(), z.any()).optional(),
});

export const ContentReady = z.object({
  correlation: Correlation,
  contents: z.array(z.any()),
  platforms: z.array(z.enum(["instagram", "tiktok", "reddit"])),
});

export const PostScheduled = z.object({
  correlation: Correlation,
  scheduled: z.array(
    z.object({
      platform: z.enum(["instagram", "tiktok", "reddit"]),
      externalId: z.string(),
      at: z.string(),
    })
  ),
});

export const PostFailed = z.object({
  correlation: Correlation,
  platform: z.enum(["instagram", "tiktok", "reddit"]),
  contentId: z.string(),
  error: z.object({ message: z.string(), code: z.any().optional() }),
});

