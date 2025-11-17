/**
 * Rate Limiting Middleware for API Routes
 * 
 * Implements rate limiting using the sliding window algorithm with Redis.
 * Provides 100 requests/minute per user limit as specified in requirements.
 * 
 * Features:
 * - Per-user rate limiting (authenticated requests)
 * - Per-IP rate limiting (unauthenticated requests)
 * - Distributed rate limiting with Redis
 * - Fail-open strategy (allows requests on Redis errors)
 * - Standard HTTP 429 responses with retry-after headers
 * 
 * @example
 * ```typescript
 * import { withRateLimit } from '@/lib/api/middleware/rate-limit';
 * 
 * export const GET = withRateLimit(async (req) => {
 *   // Your handler code
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { SlidingWindowLimiter } from '@/lib/services/rate-limiter/sliding-window';
import { errorResponse } from '../utils/response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum requests allowed per window
   * @default 100
   */
  limit?: number;
  
  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number;
  
  /**
   * Custom key generator function
   */
  keyGenerator?: (req: NextRequest) => string | Promise<string>;
  
  /**
   * Skip rate limiting for certain requests
   */
  skip?: (req: NextRequest) => boolean | Promise<boolean>;
  
  /**
   * Custom handler for rate limit exceeded
   */
  handler?: (req: NextRequest) => Response | Promise<Response>;
}

/**
 * Default rate limit configuration
 * 100 requests per minute per user (as per requirement 5.3)
 */
const DEFAULT_CONFIG: Required<Omit<RateLimitConfig, 'keyGenerator' | 'skip' | 'handler'>> = {
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Rate limiter instance
 */
const limiter = new SlidingWindowLimiter();

/**
 * Get client IP address from request
 */
function getClientIp(req: NextRequest): string {
  // Check various headers for IP address
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a default value
  return 'unknown';
}

/**
 * Generate rate limit key for the request
 * Uses user ID for authenticated requests, IP for unauthenticated
 */
async function generateKey(req: NextRequest, customGenerator?: RateLimitConfig['keyGenerator']): Promise<string> {
  // Use custom key generator if provided
  if (customGenerator) {
    return await customGenerator(req);
  }
  
  // Try to get user from session
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      // Use user ID for authenticated requests
      const url = new URL(req.url);
      return `rate:user:${session.user.id}:${url.pathname}`;
    }
  } catch (error) {
    console.error('[RateLimit] Error getting session:', error);
  }
  
  // Fallback to IP-based rate limiting for unauthenticated requests
  const ip = getClientIp(req);
  const url = new URL(req.url);
  return `rate:ip:${ip}:${url.pathname}`;
}

/**
 * Default handler for rate limit exceeded
 */
function defaultRateLimitHandler(retryAfter?: number): Response {
  const response = NextResponse.json(
    errorResponse(
      'RATE_LIMIT_EXCEEDED',
      'Too many requests. Please try again later.',
      {
        retryAfter: retryAfter || 60,
      }
    ),
    { status: 429 }
  );
  
  // Add standard rate limit headers
  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }
  response.headers.set('X-RateLimit-Limit', DEFAULT_CONFIG.limit.toString());
  response.headers.set('X-RateLimit-Remaining', '0');
  
  return response;
}

/**
 * Rate limiting middleware wrapper
 * 
 * @param handler - The route handler to wrap
 * @param config - Rate limit configuration
 * @returns Wrapped handler with rate limiting
 * 
 * @example
 * ```typescript
 * // Use default config (100 req/min)
 * export const GET = withRateLimit(async (req) => {
 *   return Response.json({ data: 'success' });
 * });
 * 
 * // Custom config
 * export const POST = withRateLimit(
 *   async (req) => {
 *     return Response.json({ data: 'success' });
 *   },
 *   { limit: 10, windowMs: 60000 }
 * );
 * ```
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response> | Response,
  config: RateLimitConfig = {}
): (req: NextRequest) => Promise<Response> {
  const {
    limit = DEFAULT_CONFIG.limit,
    windowMs = DEFAULT_CONFIG.windowMs,
    keyGenerator,
    skip,
    handler: customHandler,
  } = config;
  
  return async (req: NextRequest) => {
    try {
      // Check if we should skip rate limiting for this request
      if (skip && await skip(req)) {
        return await handler(req);
      }
      
      // Generate rate limit key
      const key = await generateKey(req, keyGenerator);
      
      // Check rate limit
      const result = await limiter.check(key, limit, windowMs);
      
      // Add rate limit headers to response
      const addRateLimitHeaders = (response: Response) => {
        response.headers.set('X-RateLimit-Limit', result.limit.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString());
        return response;
      };
      
      // If rate limit exceeded, return 429
      if (!result.allowed) {
        console.warn('[RateLimit] Rate limit exceeded', {
          key,
          limit: result.limit,
          remaining: result.remaining,
          resetAt: result.resetAt,
        });
        
        if (customHandler) {
          return await customHandler(req);
        }
        
        return defaultRateLimitHandler(result.retryAfter);
      }
      
      // Rate limit OK, proceed with handler
      const response = await handler(req);
      
      // Add rate limit headers to successful response
      return addRateLimitHeaders(response);
      
    } catch (error) {
      // On error, log and allow request (fail-open strategy)
      console.error('[RateLimit] Error in rate limit middleware:', error);
      return await handler(req);
    }
  };
}

/**
 * Rate limit middleware for specific endpoints with custom limits
 */
export const rateLimitPresets = {
  /**
   * Strict rate limit for sensitive operations (10 req/min)
   */
  strict: (handler: (req: NextRequest) => Promise<Response> | Response) =>
    withRateLimit(handler, { limit: 10, windowMs: 60000 }),
  
  /**
   * Standard rate limit (100 req/min) - default
   */
  standard: (handler: (req: NextRequest) => Promise<Response> | Response) =>
    withRateLimit(handler, { limit: 100, windowMs: 60000 }),
  
  /**
   * Relaxed rate limit for read-heavy operations (200 req/min)
   */
  relaxed: (handler: (req: NextRequest) => Promise<Response> | Response) =>
    withRateLimit(handler, { limit: 200, windowMs: 60000 }),
  
  /**
   * Per-IP rate limit for unauthenticated endpoints (30 req/min)
   */
  perIp: (handler: (req: NextRequest) => Promise<Response> | Response) =>
    withRateLimit(handler, {
      limit: 30,
      windowMs: 60000,
      keyGenerator: async (req) => {
        const ip = getClientIp(req);
        const url = new URL(req.url);
        return `rate:ip:${ip}:${url.pathname}`;
      },
    }),
};

/**
 * Export rate limiter instance for direct use
 */
export { limiter };
