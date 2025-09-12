import { z } from 'zod';

export const sellPlanSchema = z
  .array(z.enum(['subs','ppv','customs','sexting','calls','merch','later']))
  .min(1);

export type SellPlan = z.infer<typeof sellPlanSchema>;

