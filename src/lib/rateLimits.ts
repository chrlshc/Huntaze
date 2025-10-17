export type RateLimitCfg = { tokenRpm: number; ipRpm: number }

// Centralized per-path rate limit config (can expand as needed)
export const RATE_LIMITS: Record<string, RateLimitCfg> = {
  '/api/debug/tiktok-events': { tokenRpm: 60, ipRpm: 30 },
  // Example: cron endpoint tighter by default
  '/api/cron/tiktok-status': { tokenRpm: 20, ipRpm: 10 },
}

export function resolveRateLimit(pathname: string): RateLimitCfg | null {
  // Exact match first
  if (RATE_LIMITS[pathname]) return RATE_LIMITS[pathname]
  // Prefix match (fallback)
  for (const key of Object.keys(RATE_LIMITS)) {
    if (pathname.startsWith(key)) return RATE_LIMITS[key]
  }
  return null
}

