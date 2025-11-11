/**
 * Cache Middleware for API Routes
 * Provides decorators and utilities for caching API responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { cacheManager, CacheKeys, CacheTags } from './cacheManager';

interface CacheConfig {
  ttl?: number;
  tags?: string[];
  keyGenerator?: (req: NextRequest) => string;
  shouldCache?: (req: NextRequest, res: NextResponse) => boolean;
  varyBy?: string[]; // Headers to vary cache by (e.g., ['user-agent', 'authorization'])
}

/**
 * Cache decorator for API route handlers
 */
export function withCache(config: CacheConfig = {}) {
  return function <T extends (...args: any[]) => Promise<NextResponse>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (this: any, ...args: any[]) {
      const req = args[0] as NextRequest;
      
      // Generate cache key
      const cacheKey = config.keyGenerator 
        ? config.keyGenerator(req)
        : generateDefaultCacheKey(req, config.varyBy);

      try {
        // Try to get from cache
        const cached = await cacheManager.get(cacheKey);
        if (cached) {
          return new NextResponse(JSON.stringify(cached.data), {
            status: cached.status || 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'HIT',
              ...cached.headers,
            },
          });
        }

        // Execute original method
        const response = await method.apply(this, args);
        
        // Check if we should cache this response
        if (shouldCacheResponse(req, response, config)) {
          const responseData = await response.clone().json().catch(() => null);
          
          if (responseData) {
            await cacheManager.set(
              cacheKey,
              {
                data: responseData,
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
              },
              {
                ttl: config.ttl,
                tags: config.tags,
              }
            );
          }
        }

        // Add cache miss header
        response.headers.set('X-Cache', 'MISS');
        return response;
      } catch (error) {
        console.error('Cache middleware error:', error);
        // Fallback to original method if caching fails
        return method.apply(this, args);
      }
    } as T;

    return descriptor;
  };
}

/**
 * Cache wrapper for API route functions
 */
export function cacheApiResponse<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  config: CacheConfig = {}
): T {
  return (async (...args: any[]) => {
    const req = args[0] as NextRequest;
    
    const cacheKey = config.keyGenerator 
      ? config.keyGenerator(req)
      : generateDefaultCacheKey(req, config.varyBy);

    try {
      // Try cache first
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return new NextResponse(JSON.stringify(cached.data), {
          status: cached.status || 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            ...cached.headers,
          },
        });
      }

      // Execute handler
      const response = await handler(...args);
      
      // Cache successful responses
      if (shouldCacheResponse(req, response, config)) {
        const responseData = await response.clone().json().catch(() => null);
        
        if (responseData) {
          await cacheManager.set(
            cacheKey,
            {
              data: responseData,
              status: response.status,
              headers: Object.fromEntries(response.headers.entries()),
            },
            {
              ttl: config.ttl,
              tags: config.tags,
            }
          );
        }
      }

      response.headers.set('X-Cache', 'MISS');
      return response;
    } catch (error) {
      console.error('Cache wrapper error:', error);
      return handler(...args);
    }
  }) as T;
}

/**
 * Generate default cache key from request
 */
function generateDefaultCacheKey(req: NextRequest, varyBy?: string[]): string {
  const url = new URL(req.url);
  let key = `${req.method}:${url.pathname}`;
  
  // Add query parameters
  if (url.search) {
    key += `:${url.search}`;
  }
  
  // Add vary headers
  if (varyBy) {
    const varyValues = varyBy
      .map(header => `${header}:${req.headers.get(header) || ''}`)
      .join('|');
    key += `:${varyValues}`;
  }
  
  return key;
}

/**
 * Determine if response should be cached
 */
function shouldCacheResponse(
  req: NextRequest,
  res: NextResponse,
  config: CacheConfig
): boolean {
  // Don't cache non-GET requests by default
  if (req.method !== 'GET' && !config.shouldCache) {
    return false;
  }
  
  // Don't cache error responses
  if (res.status >= 400) {
    return false;
  }
  
  // Use custom shouldCache function if provided
  if (config.shouldCache) {
    return config.shouldCache(req, res);
  }
  
  return true;
}

/**
 * Predefined cache configurations for common use cases
 */
export const CacheConfigs = {
  // Short-term cache for frequently changing data
  shortTerm: {
    ttl: 60, // 1 minute
  },
  
  // Medium-term cache for semi-static data
  mediumTerm: {
    ttl: 300, // 5 minutes
  },
  
  // Long-term cache for static data
  longTerm: {
    ttl: 3600, // 1 hour
  },
  
  // User-specific cache
  userSpecific: {
    ttl: 300,
    varyBy: ['authorization'],
    tags: [CacheTags.USER],
  },
  
  // Analytics cache
  analytics: {
    ttl: 600, // 10 minutes
    tags: [CacheTags.ANALYTICS],
  },
  
  // Health check cache
  healthCheck: {
    ttl: 30, // 30 seconds
    tags: [CacheTags.HEALTH],
  },
  
  // Landing page data cache
  landingPage: {
    ttl: 1800, // 30 minutes
    tags: [CacheTags.LANDING],
  },
} as const;

/**
 * Cache invalidation utilities
 */
export const CacheInvalidation = {
  // Invalidate user-related caches
  async invalidateUser(userId: string) {
    await Promise.all([
      cacheManager.delete(CacheKeys.user(userId)),
      cacheManager.delete(CacheKeys.userProfile(userId)),
      cacheManager.delete(CacheKeys.socialAccounts(userId)),
      cacheManager.invalidateByTag(CacheTags.USER),
    ]);
  },
  
  // Invalidate analytics caches
  async invalidateAnalytics(userId?: string) {
    if (userId) {
      // Invalidate specific user analytics
      const periods = ['day', 'week', 'month', 'year'];
      await Promise.all(
        periods.map(period => 
          cacheManager.delete(CacheKeys.analytics(userId, period))
        )
      );
    }
    await cacheManager.invalidateByTag(CacheTags.ANALYTICS);
  },
  
  // Invalidate social platform caches
  async invalidateSocial(userId?: string) {
    if (userId) {
      await cacheManager.delete(CacheKeys.socialAccounts(userId));
    }
    await cacheManager.invalidateByTag(CacheTags.SOCIAL);
  },
  
  // Invalidate landing page cache
  async invalidateLandingPage() {
    await Promise.all([
      cacheManager.delete(CacheKeys.landingPageData()),
      cacheManager.invalidateByTag(CacheTags.LANDING),
    ]);
  },
  
  // Invalidate health check caches
  async invalidateHealthChecks() {
    await cacheManager.invalidateByTag(CacheTags.HEALTH);
  },
};