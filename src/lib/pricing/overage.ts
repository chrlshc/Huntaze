// Overage tier configuration and helpers

export const INCLUDED_MSGS = {
  starter: 1000,
  pro: 5000,
  scale: 25000,
  enterprise: Number.POSITIVE_INFINITY,
} as const

export const OVERAGE_PER_1K = {
  starter: 3,
  pro: 15,
  scale: 30,
  enterprise: 40, // contractual; only used for estimates
} as const

export type Plan = keyof typeof INCLUDED_MSGS

export function calcOverage(plan: Plan, aiMsgs: number, billOverage = true) {
  const inc = INCLUDED_MSGS[plan]
  if (!billOverage || !Number.isFinite(inc)) return { units: 0, cost: 0, rate: 0 }
  const extra = Math.max(0, aiMsgs - (inc as number))
  const units = Math.ceil(extra / 1000)
  const rate = OVERAGE_PER_1K[plan]
  return { units, cost: units * rate, rate }
}
