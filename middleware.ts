import { NextResponse, NextRequest } from 'next/server'
import { resolveRateLimit } from '@/src/lib/rateLimits'
// Optional Edge-compatible rate limiting via Upstash. Enabled when env present.
let upstashReady = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
let upstashMod: { Redis: any; Ratelimit: any } | null = null

export const config = {
  matcher: [
    // Match all app pages except Next internals and static assets
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|fonts|styles|images|public|manifest.json|icon-\\d+x\\d+\\.png|apple-touch-icon).*)',
    '/api/ai/azure/smoke',
    '/api/debug/:path*',
    '/debug/:path*',
  ],
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
  const { pathname, host } = new URL(req.url)
  const hostname = host || req.headers.get('host') || ''
  const isLocal = /^localhost(:\d+)?$/.test(hostname) || /^127\.0\.0\.1(:\d+)?$/.test(hostname) || hostname.endsWith('.local')
  const envBypass = (process.env.LOCAL_BYPASS || process.env.NEXT_PUBLIC_LOCAL_BYPASS || process.env.BYPASS_MIDDLEWARE || '').toLowerCase() === 'true' || (process.env.LOCAL_BYPASS || process.env.NEXT_PUBLIC_LOCAL_BYPASS || process.env.BYPASS_MIDDLEWARE) === '1'
  const allowAllLocal = false // no global bypass; we will apply per-page behavior instead
  const appHome = process.env.NEXT_PUBLIC_APP_HOME || '/dashboard'
  const localAllowCSV = process.env.LOCAL_ALLOW || process.env.NEXT_PUBLIC_LOCAL_ALLOW || ''
  const localAllow = localAllowCSV.split(',').map(s => s.trim()).filter(Boolean)
  // Default allowed prefixes in local/dev
  const defaultAllowedPrefixes = [
    '/',
    '/join',
    '/auth',
    '/dashboard',
    '/of-messages',
    '/of-analytics',
    '/features',
  ]

  // Edge rate-limit if Upstash configured and we have a config for this path
  const cfg = resolveRateLimit(pathname)
  if (isLocal || envBypass || process.env.NODE_ENV === 'development') {
    // Per-page local behavior: redirect most routes to app home unless explicitly allowed
    // Skip API/static
    // Allow Next internals and static assets
    const isStatic = (
      pathname.startsWith('/_next') ||
      pathname === '/favicon.ico' ||
      pathname === '/manifest.json' ||
      pathname.startsWith('/icon-') ||
      pathname.startsWith('/apple-touch-icon') ||
      pathname.startsWith('/fonts') ||
      pathname.startsWith('/styles') ||
      pathname.startsWith('/images') ||
      pathname.startsWith('/public') ||
      pathname.endsWith('.js') || pathname.endsWith('.css') || pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.svg')
    )
    if (!pathname.startsWith('/api') && !isStatic) {
      const allowed = defaultAllowedPrefixes.some(p => pathname.startsWith(p)) || localAllow.some(p => p && pathname.startsWith(p))
      if (!allowed) {
        const url = new URL(appHome, req.url)
        const res = NextResponse.redirect(url, { status: 302 })
        res.headers.set('Cache-Control', 'no-store')
        return res
      }
    }
  }

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
      // Extra burst limiter for azure smoke route: 3/30s per IP, 20/30s per token
      if (pathname === '/api/ai/azure/smoke') {
        const shortLimiter = new upstashMod!.Ratelimit({ redis, limiter: upstashMod!.Ratelimit.fixedWindow(bearer ? 20 : 3, '30 s') })
        const short = await shortLimiter.limit(id)
        if (!short?.success) {
          const retryAfter = Math.max(0, Math.floor((short?.reset || 0) - Date.now() / 1000))
          return new NextResponse('Too Many Requests', {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter || 30),
              'Cache-Control': 'no-store',
            },
          })
        }
      }
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

  // Debug-only auth gate
  if (pathname.startsWith('/debug') || pathname.startsWith('/api/debug')) {
    const authed = okBasic(req) || okBearerOrHeader(req)
    if (authed) {
      const res = NextResponse.next()
      res.headers.set('X-Robots-Tag', 'noindex')
      return res
    }
    const headers = new Headers({ 'WWW-Authenticate': 'Basic realm="Debug"' })
    return new NextResponse('Unauthorized', { status: 401, headers })
  }

  // Global page pruning for beta: allow only home ('/'), join ('/join') and auth routes
  if (!pathname.startsWith('/api') && pathname !== '/' && pathname !== '/join' && !pathname.startsWith('/auth')) {
    const url = new URL('/', req.url)
    const res = NextResponse.redirect(url, { status: 302 })
    res.headers.set('Cache-Control', 'no-store')
    return res
  }

  return NextResponse.next()
}
