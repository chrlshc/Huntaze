/**
 * Rate Limiting Middleware for Next.js 16.0.3 App Router
 * 
 * Uses Redis-based rate limiting with fail-open error handling.
 * Extracts client IP from CloudFront x-forwarded-for header.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 * 
 * @module lib/middleware/rate-limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import type { RouteHandler } from './types';

const FAIL_OPEN_LOG_THROTTLE_MS = 60_000;
let lastFailOpenLogAtMs = 0;

/**
 * Redis client instance
 * Lazy-initialized to avoid connection issues during module load
 */
let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 */
function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        // Stop retrying after 3 attempts
        if (times > 3) {
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }
  return redisClient;
}

/**
 * Rate limit configuration options
 */
export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;
  
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  
  /**
   * Optional key prefix for Redis keys
   * @default 'rate-limit'
   */
  keyPrefix?: string;
}

/**
 * Extract client IP from request headers
 * 
 * Follows CloudFront x-forwarded-for format where the first IP
 * in the comma-separated list is the original client IP.
 * 
 * Requirements: 5.1, 5.2
 * 
 * @param req - Next.js request object
 * @returns Client IP address
 */
export function extractClientIp(req: NextRequest): string {
  // Get x-forwarded-for header from CloudFront
  const forwardedFor = req.headers.get('x-forwarded-for');
  
  if (forwardedFor) {
    // First IP in comma-separated list is the original client IP
    const ips = forwardedFor.split(',');
    const clientIp = ips[0].trim();
    return clientIp;
  }
  
  // Fallback to x-real-ip
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Last resort fallback
  return 'unknown';
}

/**
 * Rate limiting middleware wrapper
 * 
 * Implements Redis-based rate limiting with the following features:
 * - IP extraction from x-forwarded-for header (CloudFront)
 * - Fail-open error handling (allows requests if Redis is down)
 * - Rate limit headers in responses
 * - Per-route rate limiting
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 * 
 * @param handler - Route handler to wrap
 * @param options - Rate limit configuration
 * @returns Wrapped route handler with rate limiting
 * 
 * @example
 * ```typescript
 * export const POST = withRateLimit(
 *   async (req) => {
 *     return NextResponse.json({ success: true });
 *   },
 *   { maxRequests: 10, windowMs: 60000 }
 * );
 * ```
 */
export function withRateLimit(
  handler: RouteHandler,
  options: RateLimitOptions
): RouteHandler {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Extract client IP from CloudFront headers
    const ip = extractClientIp(req);
    
    // Build Redis key
    const keyPrefix = options.keyPrefix || 'rate-limit';
    const key = `${keyPrefix}:${ip}:${req.nextUrl.pathname}`;
    
    try {
      const redis = getRedisClient();
      
      // Ensure Redis is connected
      if (redis.status !== 'ready' && redis.status !== 'connect') {
        await redis.connect();
      }
      
      // Increment counter
      const count = await redis.incr(key);
      
      // Set expiry on first request
      if (count === 1) {
        await redis.expire(key, Math.floor(options.windowMs / 1000));
      }
      
      // Check if limit exceeded
      if (count > options.maxRequests) {
        // Get TTL for retry-after header
        const ttl = await redis.ttl(key);
        
        return NextResponse.json(
          {
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: ttl > 0 ? ttl : Math.floor(options.windowMs / 1000),
          },
          {
            status: 429,
            headers: {
              'Retry-After': ttl > 0 ? ttl.toString() : Math.floor(options.windowMs / 1000).toString(),
              'X-RateLimit-Limit': options.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(Date.now() + (ttl > 0 ? ttl * 1000 : options.windowMs)).toISOString(),
            },
          }
        );
      }
      
      // Call handler
      const response = await handler(req);
      
      // Add rate limit headers to successful response
      response.headers.set('X-RateLimit-Limit', options.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', Math.max(0, options.maxRequests - count).toString());
      
      // Get TTL for reset time
      const ttl = await redis.ttl(key);
      if (ttl > 0) {
        response.headers.set('X-RateLimit-Reset', new Date(Date.now() + ttl * 1000).toISOString());
      }
      
      return response;
      
    } catch (error) {
      // Fail open - allow request if Redis is down
      // Requirement 5.6: Fail-open error handling
      const now = Date.now();
      if (now - lastFailOpenLogAtMs >= FAIL_OPEN_LOG_THROTTLE_MS) {
        lastFailOpenLogAtMs = now;
        console.error('[Rate Limit] Error checking rate limit (failing open):', error);
      }
      
      // Call handler without rate limiting
      return handler(req);
    }
  };
}

/**
 * Legacy rate limit configurations for backward compatibility
 */
export const RATE_LIMITS: Record<string, RateLimitOptions> = {
  'PATCH /api/onboarding/steps/:id': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyPrefix: 'rl:onboarding:patch',
  },
  'POST /api/onboarding/snooze': {
    windowMs: 24 * 60 * 60 * 1000, // 1 day
    maxRequests: 3,
    keyPrefix: 'rl:onboarding:snooze',
  },
  'GET /api/onboarding': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyPrefix: 'rl:onboarding:get',
  },
};

/**
 * Reset rate limit for a key (useful for testing)
 * 
 * @param ip - Client IP address
 * @param pathname - Request pathname
 * @param keyPrefix - Optional key prefix
 */
export async function resetRateLimit(
  ip: string,
  pathname: string,
  keyPrefix: string = 'rate-limit'
): Promise<void> {
  try {
    const redis = getRedisClient();
    if (redis.status !== 'ready' && redis.status !== 'connect') {
      await redis.connect();
    }
    const key = `${keyPrefix}:${ip}:${pathname}`;
    await redis.del(key);
  } catch (error) {
    console.error('[Rate Limit] Error resetting rate limit:', error);
  }
}

/**
 * Close Redis connection (useful for testing cleanup)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
