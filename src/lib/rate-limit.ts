import crypto from 'node:crypto'
import { getRedis } from '@/src/lib/redis'

export async function checkRateLimit(opts: { id: string; limit: number; windowSec: number }) {
  const redis = getRedis()
  const now = Date.now()
  const window = Math.floor(now / (opts.windowSec * 1000))
  const key = `rl:${opts.id}:${window}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, opts.windowSec)
  const remaining = Math.max(0, opts.limit - count)
  const elapsedInWindowSec = Math.floor((now / 1000) % opts.windowSec)
  const resetSec = Math.max(0, opts.windowSec - elapsedInWindowSec)
  return { allowed: count <= opts.limit, remaining, resetSec, count }
}

export function idFromRequestHeaders(h: Headers) {
  const ip = (h.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'unknown'
  const auth = h.get('authorization') || ''
  let tok = ''
  if (auth.startsWith('Bearer ')) tok = auth.slice(7)
  const xdebug = h.get('x-debug-token') || ''
  const raw = tok || xdebug
  if (raw) {
    const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 12)
    return { id: `tok:${hash}`, kind: 'token' as const }
  }
  return { id: `ip:${ip}`, kind: 'ip' as const }
}

