import { DEFAULTS, NICHES } from '@/src/lib/onboarding/config'

export function ppvTypicalWithMultipliers(selected: string[]) {
  const base = DEFAULTS.ppv.typical
  if (!selected || selected.length === 0) return base
  const multipliers = selected.map((slug) => {
    const def = NICHES.find((n) => n.id === (slug as any))
    return def?.ppvMultiplier ?? 1
  })
  const best = Math.max(...multipliers)
  const raw = Math.round(base * best)
  // clamp to min/max defaults for safety
  return Math.min(Math.max(raw, DEFAULTS.ppv.min), DEFAULTS.ppv.max)
}

