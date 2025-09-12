// Pricing engine: single source of truth for quotes, caps, and effective take rate

export type Plan = 'starter' | 'pro' | 'scale' | 'enterprise'

interface Input {
  plan: Plan
  gmvUsd: number // monthly GMV
  aiMsgs: number // monthly AI messages used
  enterpriseAnnual?: boolean // kept for UI toggle; enterprise remains 2% with annual commitment
}

const PLANS = {
  starter: { base: 19, pct: 0.09, cap: 180, eligibilityGmv: 2000, includedMsgs: 1000 },
  pro: { base: 39, pct: 0.07, cap: 525, eligibilityGmv: null as number | null, includedMsgs: 5000 },
  scale: { base: 79, pct: 0.05, cap: 1250, eligibilityGmv: null as number | null, includedMsgs: 25000 },
  // Enterprise (annual commitment): 2% platform fee
  enterpriseA: { base: 399, pct: 0.02, cap: 0, includedMsgs: Infinity },
  // Keep B path aligned to A unless configured differently later
  enterpriseB: { base: 399, pct: 0.02, cap: 0, includedMsgs: Infinity },
}

import { calcOverage, INCLUDED_MSGS } from './overage'

export type Quote = {
  plan: Plan
  platformFee: number // percentage fee applied (capped)
  base: number // base monthly (or monthly equivalent for annual)
  overage: number // AI msgs overage
  total: number // base + platformFee + overage
  effectiveTakeRate: number // total / gmvUsd (0 if gmvUsd=0)
  notes: string[]
}

export function quote({ plan, gmvUsd, aiMsgs, enterpriseAnnual = true, billOverage = true }: Input & { billOverage?: boolean }): Quote {
  const notes: string[] = []

  const calc = (p: { base: number; pct: number; cap: number; includedMsgs: number | typeof Infinity }) => {
    const pctFee = Math.min(p.pct * gmvUsd, p.cap ?? Number.POSITIVE_INFINITY)
    let overCost = 0
    if (plan === 'enterprise') {
      // EnterpriseA (0% annual) uses included infinity → overage estimated at 0 unless enabled contractually
      overCost = 0
    } else {
      const over = calcOverage(plan as any, aiMsgs ?? 0, billOverage)
      overCost = over.cost
    }
    const total = p.base + pctFee + overCost
    const rate = gmvUsd > 0 ? total / gmvUsd : 0
    return { platformFee: pctFee, base: p.base, overage: overCost, total, effectiveTakeRate: rate }
  }

  if (plan === 'enterprise') {
    const p = enterpriseAnnual ? PLANS.enterpriseA : PLANS.enterpriseB
    const q = calc(p)
    if (enterpriseAnnual) notes.push('2% platform fee (annual commitment)')
    else notes.push('2% platform fee (configurable)')
    return { plan, ...q, notes }
  }

  const p = (PLANS as any)[plan]
  const q = calc(p)

  if (plan === 'starter' && gmvUsd > PLANS.starter.eligibilityGmv) {
    notes.push('Ineligible: Starter is for ≤ $2,000 GMV/mo')
  }
  if (plan === 'pro' && q.platformFee >= PLANS.pro.cap) notes.push('Fee capped at $375/mo')
  if (plan === 'scale' && q.platformFee >= PLANS.scale.cap) notes.push('Fee capped at $750/mo')

  return { plan, ...q, notes }
}

// Convenience helper for UI: returns the cheapest eligible plan for the given usage
export function recommendPlan(input: Omit<Input, 'plan'>): Plan {
  const plans: Plan[] = ['starter', 'pro', 'scale', 'enterprise']
  const quotes = plans.map((plan) => ({ plan, q: quote({ plan, ...input }) }))
  const eligible = quotes.filter(({ plan, q }) => !(plan === 'starter' && q.notes.some((n) => n.includes('Ineligible'))))
  eligible.sort((a, b) => a.q.total - b.q.total)
  return eligible[0].plan
}
