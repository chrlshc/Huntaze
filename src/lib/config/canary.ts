export type Platform = 'reddit' | 'tiktok' | 'instagram'

const djb2 = (s: string) => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i)
  return (h >>> 0)
}

export function inCanary(userKey: string, percent: number): boolean {
  if (!percent || percent <= 0) return false
  const bucket = djb2(userKey) % 100
  return bucket < Math.min(100, Math.max(0, Math.floor(percent)))
}

// Stable salted bucketing using SHA-256 for consistent rollouts
export function inBucket(userKey: string, feature: string, percent: number, salt = process.env.REDDIT_CANARY_SALT || 'reddit-canary-v1') {
  if (!percent || percent <= 0) return false
  try {
    const crypto = require('crypto') as typeof import('crypto')
    const h = crypto.createHash('sha256').update(`${feature}:${userKey}:${salt}`).digest()
    const n = h.readUInt32BE(0)
    const bucket = n % 100
    return bucket < Math.min(100, Math.max(0, Math.floor(percent)))
  } catch {
    // Fallback to djb2 if crypto unavailable
    return inCanary(userKey, percent)
  }
}
