// In-memory cost logger with simple $/1k token mapping

type CostEvent = {
  when: Date
  plan: 'starter' | 'pro' | 'scale' | 'enterprise'
  provider: 'openai' | 'anthropic'
  model: string
  tier: 'economy' | 'standard' | 'premium'
  tokensIn: number
  tokensOut: number
  msgs: number
  segment?: string
  action?: string
  accountId?: string
}

const MEM: CostEvent[] = []

// Approximate $/1k tokens (adjust to contracts)
const DOLLARS_PER_1K: Record<string, { in: number; out: number }> = {
  'gpt-4o': { in: 0.0025, out: 0.005 },
  'gpt-4o-mini': { in: 0.00015, out: 0.0006 },
  'claude-3-5-sonnet': { in: 0.003, out: 0.015 },
  'claude-3-haiku': { in: 0.00025, out: 0.00125 },
}

export async function logCost(evt: CostEvent) {
  MEM.push(evt)
}

export function getCostsWindow(days = 30) {
  const since = Date.now() - days * 24 * 3600 * 1000
  const rows = MEM.filter((e) => e.when.getTime() >= since)

  const withCost = rows.map((e) => {
    const m = DOLLARS_PER_1K[e.model] ?? { in: 0.001, out: 0.003 }
    const cost = (e.tokensIn / 1000) * m.in + (e.tokensOut / 1000) * m.out
    return { ...e, costUsd: cost }
  })

  const totals = withCost.reduce(
    (acc, r) => {
      acc.totalCost += r.costUsd
      acc.totalMsgs += r.msgs
      acc.totalTokensIn += r.tokensIn
      acc.totalTokensOut += r.tokensOut
      return acc
    },
    { totalCost: 0, totalMsgs: 0, totalTokensIn: 0, totalTokensOut: 0 }
  )

  const byTier: Record<string, { costUsd: number; msgs: number }> = {}
  const byPlan: Record<string, { costUsd: number; msgs: number }> = {}
  withCost.forEach((r) => {
    byTier[r.tier] ??= { costUsd: 0, msgs: 0 }
    byTier[r.tier].costUsd += r.costUsd
    byTier[r.tier].msgs += r.msgs

    byPlan[r.plan] ??= { costUsd: 0, msgs: 0 }
    byPlan[r.plan].costUsd += r.costUsd
    byPlan[r.plan].msgs += r.msgs
  })

  return { totals, byTier, byPlan, sample: withCost.slice(-200) }
}
