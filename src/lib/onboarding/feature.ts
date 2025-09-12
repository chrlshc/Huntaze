import type { SellPlanOption } from '@/src/hooks/useOnboarding';

export const hasFeature = (plan: SellPlanOption[] | undefined, key: SellPlanOption) =>
  !!plan?.includes(key);

export const monetizationEnabled = (plan?: SellPlanOption[]) => ({
  subs: hasFeature(plan, 'subs'),
  ppv: hasFeature(plan, 'ppv'),
  customs: hasFeature(plan, 'customs'),
  calls: hasFeature(plan, 'calls'),
});

