import type { ModelTier, PolicyInput } from './routing-policy'

export function guardTierForPlan(
  desired: ModelTier,
  plan: 'starter' | 'pro' | 'scale' | 'enterprise',
  policy: PolicyInput
): ModelTier {
  const allowed: Record<typeof plan, ModelTier[]> = {
    starter: ['economy', 'standard'],
    pro: ['economy', 'standard'],
    scale: ['economy', 'standard', 'premium'],
    enterprise: ['economy', 'standard', 'premium'],
  }

  const compliance = policy.risk === 'ToS_sensitive' || policy.risk === 'NSFW' || policy.action === 'ComplianceCheck'
  const revenueCritical =
    policy.action === 'Upsell' ||
    policy.action === 'Winback' ||
    policy.segment === 'VIP' ||
    policy.segment === 'Whale' ||
    policy.segment === 'BigSpender'

  if (allowed[plan].includes(desired)) return desired
  if (compliance || revenueCritical) return 'premium'
  if (desired === 'premium') return 'standard'
  return 'economy'
}

