import { z } from 'zod';

export function sanitizePlainText(input: string): string {
  return input
    .replace(/[\u0000-\u001F\u007F<>`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const campaignCreateSchema = z
  .object({
    userId: z.string().regex(/^user_[A-Za-z0-9]{4,}$/),
    campaignName: z
      .string()
      .min(1)
      .max(128)
      .transform((value) => sanitizePlainText(value)),
    planTier: z.enum(['starter', 'pro', 'scale', 'enterprise']),
  })
  .strict();

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
