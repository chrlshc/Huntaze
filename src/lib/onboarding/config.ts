// Onboarding configuration: niches (US market) and defaults

export type NicheId =
  | 'gfe'
  | 'cosplay'
  | 'dominatrix'
  | 'fetish'
  | 'milf'
  | 'alt'
  | 'bbw'
  | 'gamer'
  | 'fitness'
  | 'fashion'
  | 'couple'
  | 'college'
  | 'ethnic'
  | 'luxury'

export interface NicheDef {
  id: NicheId
  name: string
  description: string
  ppvMultiplier: number // e.g., 1.5 = +50%
}

export const NICHES: NicheDef[] = [
  { id: 'gfe', name: 'GFE / Amateur', description: 'Intimate daily life, “virtual girlfriend” vibe', ppvMultiplier: 1.0 },
  { id: 'cosplay', name: 'Cosplay / Roleplay', description: 'Anime/game-inspired costumes and scenarios', ppvMultiplier: 1.0 },
  { id: 'dominatrix', name: 'Dominatrix / BDSM', description: 'Fetish-focused, strict boundaries and consent', ppvMultiplier: 1.2 },
  { id: 'fetish', name: 'Fetish (Feet & Legs, etc.)', description: 'Focused on a specific fetish with dedicated content', ppvMultiplier: 1.1 },
  { id: 'milf', name: 'MILF / Mature', description: 'Experienced, sensual, premium positioning', ppvMultiplier: 1.15 },
  { id: 'alt', name: 'Alt / Goth', description: 'Alternative aesthetics: tattoos, piercings, goth/punk', ppvMultiplier: 1.0 },
  { id: 'bbw', name: 'BBW / Curvy', description: 'Curvy/plus-size inclusive niche with loyal fanbase', ppvMultiplier: 1.0 },
  { id: 'gamer', name: 'Gamer', description: 'Gaming/streaming crossover with geek audience', ppvMultiplier: 1.0 },
  { id: 'fitness', name: 'Fitness / Coaching', description: 'Fitness lifestyle + coaching offers', ppvMultiplier: 1.0 },
  { id: 'fashion', name: 'Fashion / Beauty', description: 'Glamour positioning: outfits, lingerie, makeup', ppvMultiplier: 1.0 },
  { id: 'couple', name: 'Couple / Girl-Girl', description: 'Authentic duo content with variety', ppvMultiplier: 1.0 },
  { id: 'college', name: 'College / Coed (18+)', description: 'Playful “coed” persona, strictly adult', ppvMultiplier: 0.9 },
  { id: 'ethnic', name: 'Ethnic Focus (Latina, Ebony…)', description: 'Branding around cultural/ethnic identity', ppvMultiplier: 1.0 },
  { id: 'luxury', name: 'Luxury / High‑roller', description: 'Exclusive lifestyle for whales and high tippers', ppvMultiplier: 1.5 },
]

export const DEFAULTS = {
  subscription: {
    price: 9.99,
    trialEnabled: false,
    trialDays: 7,
  },
  ppv: {
    min: 5,
    typical: 15,
    max: 40,
  },
  discounts: {
    maxContentDiscountPct: 30, // never exceed −40% (guardrail in UI)
    bundles: [
      { months: 3, discountPct: 10 },
      { months: 6, discountPct: 20 },
      { months: 12, discountPct: 30 },
    ],
  },
  thresholds: {
    whaleLtvUsd: 500,
    reviewPpvAboveUsd: 150,
  },
  automation: {
    defaultPct: 80,
  },
  caps: {
    dailyGlobal: 30,
    dailyVip: 60,
  },
  reengage: {
    windows: ['48h', '72h', '7d'] as const,
  },
} as const

export const AUTO_CALIBRATION_MVP = {
  heatmapHours: true,
  volumeUpDown: true,
  vipEarlyMode: true,
  igTtRiskSoftSell: true,
} as const

export type Defaults = typeof DEFAULTS

