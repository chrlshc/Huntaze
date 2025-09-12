// Threshold helpers to compute dominance ranges and breakpoints between plans

type PlanParams = { base: number; pct: number; cap?: number }

export const DEFAULTS = {
  starter: { base: 19, pct: 0.07, cap: 140 },
  pro: { base: 39, pct: 0.05, cap: 375 },
  scale: { base: 79, pct: 0.03, cap: 750 },
  enterpriseA: { base: 399, pct: 0 }, // 0% annual
}

// Solve for G in: base1 + p1*G = base2 + p2*G
export function linearThreshold(p1: PlanParams, p2: PlanParams): number {
  const denom = p1.pct - p2.pct
  if (Math.abs(denom) < 1e-9) return Infinity
  return (p2.base - p1.base) / denom
}

// Solve for G when one side is capped: base1 + min(p1*G, cap1) = base2 + p2*G
export function capThreshold(p1: PlanParams, p2: PlanParams): number {
  if (!p1.cap && p1.cap !== 0) return Infinity
  // At cap point, fee1 = cap1
  // base1 + cap1 = base2 + p2*G  =>  G = (base1 + cap1 - base2)/p2
  if (p2.pct <= 0) return Infinity
  return (p1.base + (p1.cap as number) - p2.base) / p2.pct
}

// Common thresholds with defaults (Scale base set at $79)
export function thresholds() {
  const s = DEFAULTS.starter
  const p = DEFAULTS.pro
  const sc = DEFAULTS.scale
  const eA = DEFAULTS.enterpriseA

  return {
    starterToPro: linearThreshold(s, p), // ≈ $1k
    proToScale: linearThreshold(p, sc), // ≈ $2k
    proCapVsScale: capThreshold(p, sc), // ≈ $11.17k
    scaleVsEnterpriseA: linearThreshold(sc, eA), // ≈ $10.7k
  }
}

