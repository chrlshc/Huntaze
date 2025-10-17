import { NextResponse, NextRequest } from 'next/server'
import { resolveRateLimit } from '@/src/lib/rateLimits'
// Optional Edge-compatible rate limiting via Upstash. Enabled when env present.
let upstashReady = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
let upstashMod: { Redis: any; Ratelimit: any } | null = null

export const config = {
  matcher: ['/debug/:path*', '/api/debug/:path*'],
}

function ctEq(a: string, b: string) { // constant-time compare
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

function okBearerOrHeader(req: NextRequest) {
  const hdr = req.headers.get('authorization')
  const xhdr = req.headers.get('x-debug-token')
  const token = process.env.DEBUG_TOKEN || ''
  if (hdr?.startsWith('Bearer ') && token) return ctEq(hdr.slice(7), token)
  if (xhdr && token) return ctEq(xhdr, token)
  return false
}

function okBasic(req: NextRequest) {
  const hdr = req.headers.get('authorization')
  const user = process.env.DEBUG_USER || ''
  const pass = process.env.DEBUG_PASS || ''
  if (!hdr?.startsWith('Basic ') || !user || !pass) return false
  try {
    const decoded = (globalThis as any).atob ? (globalThis as any).atob(hdr.slice(6)) : ''
    const idx = decoded.indexOf(':')
    const u = idx >= 0 ? decoded.slice(0, idx) : decoded
    const p = idx >= 0 ? decoded.slice(idx + 1) : ''
    return ctEq(u || '', user) && ctEq(p || '', pass)
  } catch {
    return false
  }
}

export default async function middleware(req: NextRequest) {
  const pathname = new URL(req.url).pathname

  // Edge rate-limit if Upstash configured and we have a config for this path
  const cfg = resolveRateLimit(pathname)
  if (upstashReady && cfg) {
    try {
      if (!upstashMod) {
        const { Redis } = (await import('@upstash/redis')) as any
        const { Ratelimit } = (await import('@upstash/ratelimit')) as any
        upstashMod = { Redis, Ratelimit }
      }
      const redis = upstashMod!.Redis.fromEnv()
      // Create per-request limiters so we can vary rates by path/identity
      const tokenLimiter = new upstashMod!.Ratelimit({ redis, limiter: upstashMod!.Ratelimit.fixedWindow(cfg.tokenRpm, '1 m') })
      const ipLimiter = new upstashMod!.Ratelimit({ redis, limiter: upstashMod!.Ratelimit.fixedWindow(cfg.ipRpm, '1 m') })

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      const bearer = req.headers.get('authorization')?.startsWith('Bearer ')
        ? req.headers.get('authorization')!.slice(7)
        : ''
      const id = bearer ? `tok:${pathname}:${bearer}` : `ip:${pathname}:${ip}`
      const rl = bearer ? tokenLimiter : ipLimiter
      const result = await rl.limit(id)
      if (!result?.success) {
        const retryAfter = Math.max(0, Math.floor((result?.reset || 0) - Date.now() / 1000))
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(cfg ? (bearer ? cfg.tokenRpm : cfg.ipRpm) : ''),
            'X-RateLimit-Remaining': '0',
            'Cache-Control': 'no-store',
          },
        })
      }
    } catch {}
  }

  const authed = okBasic(req) || okBearerOrHeader(req)
  if (authed) {
    const res = NextResponse.next()
    // Extra safety: advise no indexing for any debug paths
    res.headers.set('X-Robots-Tag', 'noindex')
    return res
  }

  // For browser UX, trigger Basic Auth prompt
  const headers = new Headers({ 'WWW-Authenticate': 'Basic realm="Debug"' })
  return new NextResponse('Unauthorized', { status: 401, headers })
}
