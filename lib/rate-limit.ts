import { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Create separate caches for different rate limit tiers
const caches = {
  strict: new LRUCache<string, RateLimitEntry>({
    max: 5000, // Max 5000 unique IPs
    ttl: 15 * 60 * 1000, // 15 minutes
  }),
  normal: new LRUCache<string, RateLimitEntry>({
    max: 10000,
    ttl: 5 * 60 * 1000, // 5 minutes
  }),
  relaxed: new LRUCache<string, RateLimitEntry>({
    max: 20000,
    ttl: 60 * 1000, // 1 minute
  }),
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export type RateLimitTier = 'strict' | 'normal' | 'relaxed';

// Rate limit configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints
  '/api/auth/login': { limit: 5, windowMs: 15 * 60 * 1000, tier: 'strict' as RateLimitTier },
  '/api/auth/signup': { limit: 3, windowMs: 60 * 60 * 1000, tier: 'strict' as RateLimitTier },
  '/api/auth/forgot-password': { limit: 3, windowMs: 15 * 60 * 1000, tier: 'strict' as RateLimitTier },
  '/api/auth/confirm-forgot-password': { limit: 5, windowMs: 15 * 60 * 1000, tier: 'strict' as RateLimitTier },
  '/api/auth/refresh': { limit: 10, windowMs: 60 * 1000, tier: 'normal' as RateLimitTier },
  
  // API endpoints
  '/api/user': { limit: 100, windowMs: 60 * 1000, tier: 'normal' as RateLimitTier },
  '/api/billing': { limit: 20, windowMs: 60 * 1000, tier: 'normal' as RateLimitTier },
  '/api/content': { limit: 50, windowMs: 60 * 1000, tier: 'relaxed' as RateLimitTier },
};

export function getClientIdentifier(request: NextRequest): string {
  // Priority order for identifying clients
  // 1. Authenticated user ID from header
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }
  
  // 2. IP address from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`;
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return `ip:${realIp}`;
  }
  
  // 3. Fallback to request IP or a generic identifier
  return `ip:${request.ip || 'unknown'}`;
}

export function rateLimit(
  request: NextRequest,
  limit?: number,
  windowMs?: number,
  tier: RateLimitTier = 'normal'
): RateLimitResult {
  const path = request.nextUrl.pathname;
  const config = RATE_LIMIT_CONFIGS[path] || { limit: limit || 60, windowMs: windowMs || 60000, tier };
  
  const identifier = getClientIdentifier(request);
  const now = Date.now();
  const cache = caches[config.tier];
  
  // Get or create rate limit entry
  let entry = cache.get(identifier);
  
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }
  
  entry.count++;
  cache.set(identifier, entry);
  
  const allowed = entry.count <= config.limit;
  const remaining = Math.max(0, config.limit - entry.count);
  const reset = Math.ceil(entry.resetTime / 1000);
  
  const result: RateLimitResult = {
    allowed,
    remaining,
    reset,
  };
  
  if (!allowed) {
    result.retryAfter = Math.ceil((entry.resetTime - now) / 1000);
  }
  
  return result;
}

// Middleware helper to apply rate limiting with proper headers
export function applyRateLimit(
  request: NextRequest,
  limit?: number,
  windowMs?: number,
  tier?: RateLimitTier
): Response | null {
  const rateLimitResult = rateLimit(request, limit, windowMs, tier);
  
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(limit || 60),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
          'Retry-After': String(rateLimitResult.retryAfter),
        },
      }
    );
  }
  
  return null;
}

// Distributed rate limiting for production (Redis-based)
export interface DistributedRateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

// This would be implemented with Redis in production
export class RedisRateLimiter implements DistributedRateLimiter {
  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    // TODO: Implement Redis-based rate limiting
    // For now, fallback to in-memory
    return rateLimit({ headers: { get: () => key } } as any, limit, windowMs);
  }
}