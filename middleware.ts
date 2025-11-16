import { NextResponse, NextRequest } from 'next/server'
import { resolveRateLimit } from './src/lib/rateLimits'
import { createLogger } from './lib/utils/logger'

const logger = createLogger('middleware')

// ============================================================================
// Task 3.3: Lazy Loading for Rate Limiter Modules
// ============================================================================

// Cache for dynamically loaded rate limiter modules
let rateLimiterModules: {
  extractIdentity?: any;
  resolveRateLimitPolicy?: any;
  rateLimiter?: any;
  buildRateLimitResponse?: any;
  addRateLimitHeaders?: any;
  formatPolicyDescription?: any;
} | null = null

// Flag to track if module loading has failed (avoid repeated attempts)
let rateLimiterLoadFailed = false

/**
 * Lazy load rate limiter modules with graceful failure handling
 * Caches loaded modules for performance
 */
async function loadRateLimiterModules() {
  // Return cached modules if already loaded
  if (rateLimiterModules) {
    return rateLimiterModules
  }

  // Don't retry if previous load failed
  if (rateLimiterLoadFailed) {
    return null
  }

  try {
    // Dynamic imports for all rate limiter dependencies
    const [identityModule, policyModule, rateLimiterModule, headersModule] = await Promise.all([
      import('./lib/services/rate-limiter/identity'),
      import('./lib/services/rate-limiter/policy'),
      import('./lib/services/rate-limiter/rate-limiter'),
      import('./lib/services/rate-limiter/headers'),
    ])

    // Cache the loaded modules
    rateLimiterModules = {
      extractIdentity: identityModule.extractIdentity,
      resolveRateLimitPolicy: policyModule.resolveRateLimitPolicy,
      rateLimiter: rateLimiterModule.rateLimiter,
      buildRateLimitResponse: headersModule.buildRateLimitResponse,
      addRateLimitHeaders: headersModule.addRateLimitHeaders,
      formatPolicyDescription: headersModule.formatPolicyDescription,
    }

    logger.info('Rate limiter modules loaded successfully', {
      cached: true,
    })

    return rateLimiterModules
  } catch (error) {
    // Mark as failed to avoid repeated attempts
    rateLimiterLoadFailed = true
    
    logger.error('Failed to load rate limiter modules', error instanceof Error ? error : new Error(String(error)), {
      willRetry: false,
      impact: 'rate-limiting-disabled',
    })
    
    return null
  }
}

// Optional Edge-compatible rate limiting via Upstash. Enabled when env present.
let upstashReady = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
let upstashMod: { Redis: any; Ratelimit: any } | null = null

// Rate limiting enabled by default, can be disabled via env
const rateLimitingEnabled = process.env.RATE_LIMIT_ENABLED !== 'false'

export const config = {
  // Expand matcher to cover all API routes
  matcher: [
    '/api/:path*',
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
  const pathname = new URL(req.url).pathname

  // ============================================================================
  // Bypass diagnostic and auth routes (Task 3.1)
  // ============================================================================
  
  // Skip rate limiting for diagnostic routes and auth routes
  // This ensures critical routes are never blocked by rate limiting
  if (pathname.startsWith('/api/ping') || 
      pathname.startsWith('/api/health-check') || 
      pathname.startsWith('/api/auth/')) {
    logger.info('Bypassing rate limit for diagnostic/auth route', {
      pathname,
      method: req.method,
      reason: pathname.startsWith('/api/auth/') ? 'auth-route' : 'diagnostic-route',
    });
    return NextResponse.next();
  }

  // ============================================================================
  // Comprehensive Rate Limiting (New System) - Task 3.2 & 3.3
  // ============================================================================
  
  if (rateLimitingEnabled && pathname.startsWith('/api/')) {
    try {
      // Task 3.3: Lazy load rate limiter modules
      const modules = await loadRateLimiterModules()
      
      // If modules failed to load, fail open (allow request)
      if (!modules) {
        logger.warn('Rate limiter modules unavailable - allowing request', {
          pathname,
          method: req.method,
          reason: 'module-load-failed',
        })
        return NextResponse.next()
      }

      // Extract identity from request
      const identity = await modules.extractIdentity(req)
      
      // Resolve rate limit policy for this endpoint and identity
      const policy = modules.resolveRateLimitPolicy(pathname, identity)
      
      // If policy is null, it means the identity is whitelisted
      if (policy) {
        // Check rate limit
        const result = await modules.rateLimiter.check(identity, pathname, policy)
        
        if (!result.allowed) {
          // Rate limit exceeded - return 429
          const policyDesc = modules.formatPolicyDescription(
            policy.perMinute,
            policy.perHour,
            policy.perDay
          )
          
          logger.warn('Rate limit exceeded - request blocked', {
            identityType: identity.type,
            endpoint: pathname,
            method: req.method,
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.reset,
          })
          
          return modules.buildRateLimitResponse(result, policyDesc)
        }
        
        // Request allowed - add rate limit headers to response
        const response = NextResponse.next()
        const policyDesc = modules.formatPolicyDescription(
          policy.perMinute,
          policy.perHour,
          policy.perDay
        )
        modules.addRateLimitHeaders(response.headers, result, policyDesc)
        
        // Continue to next middleware/handler
        return response
      }
    } catch (error) {
      // CRITICAL: Fail-open strategy - log error but allow request to continue
      // This ensures rate limiter errors never block legitimate requests
      logger.error('Rate limiting error - allowing request (fail-open)', error instanceof Error ? error : new Error(String(error)), {
        pathname,
        method: req.method,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        failOpenStrategy: 'allow-request',
      })
      // Continue without rate limiting - request is allowed
    }
  }

  // ============================================================================
  // Legacy Rate Limiting (Debug Endpoints Only)
  // ============================================================================
  
  // Edge rate-limit if Upstash configured and we have a config for this path
  const cfg = resolveRateLimit(pathname)
  if (upstashReady && cfg && pathname.startsWith('/debug')) {
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

  // ============================================================================
  // Debug Endpoint Authentication
  // ============================================================================
  
  if (pathname.startsWith('/debug')) {
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

  // ============================================================================
  // Default: Allow Request
  // ============================================================================
  
  return NextResponse.next()
}
