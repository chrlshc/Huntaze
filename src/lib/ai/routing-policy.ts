// Routing policy to reduce COGS while protecting revenue-critical flows

export type Segment = 'VIP' | 'Whale' | 'BigSpender' | 'Dormant' | 'New' | 'General'
export type Action = 'Upsell' | 'Winback' | 'Welcome' | 'Broadcast' | 'Reply' | 'Caption' | 'Tagging' | 'ComplianceCheck'
export type Risk = 'ToS_sensitive' | 'NSFW' | 'SFW' | 'Unknown'

export type PolicyInput = {
  segment: Segment
  action: Action
  risk: Risk
  expectedValueUsd?: number
}

export type ModelTier = 'economy' | 'standard' | 'premium'

export function decideTier(input: PolicyInput): ModelTier {
  const { segment, action, risk, expectedValueUsd = 0 } = input

  // Hard guards: compliance or high-risk → premium
  if (risk === 'ToS_sensitive' || risk === 'NSFW' || action === 'ComplianceCheck') {
    return 'premium'
  }

  // Revenue-critical flows → premium/standard based on EV
  if (action === 'Upsell' || action === 'Winback') {
    if (expectedValueUsd >= 50) return 'premium'
    return 'standard'
  }

  // High-value segments always get better treatment
  if (segment === 'VIP' || segment === 'Whale' || segment === 'BigSpender') {
    if (action === 'Reply' || expectedValueUsd >= 50) return 'premium'
    return 'standard'
  }

  // Routine / low-importance
  if (action === 'Tagging' || action === 'Broadcast' || action === 'Welcome' || action === 'Caption') return 'economy'

  // Standard replies for other segments
  if (action === 'Reply') return 'standard'

  return 'economy'
}

export function modelForTier(tier: ModelTier) {
  switch (tier) {
    case 'premium':
      return { provider: 'openai' as const, model: 'gpt-4o' }
    case 'standard':
      return { provider: 'anthropic' as const, model: 'claude-3-5-sonnet' }
    case 'economy':
      return { provider: 'anthropic' as const, model: 'claude-3-haiku' }
  }
}
