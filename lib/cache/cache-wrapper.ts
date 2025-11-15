import { NextRequest, NextResponse } from 'next/server';
import { getCacheOrSet, getCacheKey, deleteCache, invalidateCachePrefix } from './redis';

/**
 * Cache configuration for API routes
 */
export interface CacheConfig {
  prefix: string;
  ttl: number;
  keyGenerator?: (req: NextRequest) => string;
  shouldCache?: (data: any) => boolean;
}

/**
 * Wrap an API handler with caching
 */
export function withCache<T>(
  handler: (req: NextRequest) => Promise<T>,
  config: CacheConfig
) {
  return async (req: NextRequest): Promise<T> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return handler(req);
    }

    // Generate cache key
    const identifier = config.keyGenerator
      ? config.keyGenerator(req)
      : req.url;
    const cacheKey = getCacheKey(config.prefix, identifier);

    try {
      // Get or set cache
      const data = await getCacheOrSet<T>(
        cacheKey,
        config.ttl,
        () => handler(req)
      );

      // Check if we should cache this data
      if (config.shouldCache && !config.shouldCache(data)) {
        await deleteCache(cacheKey);
      }

      return data;
    } catch (error) {
      console.error('Cache wrapper error:', error);
      // Fallback to handler if cache fails
      return handler(req);
    }
  };
}

/**
 * Invalidate cache after mutation
 */
export async function invalidateCache(prefix: string): Promise<void> {
  try {
    await invalidateCachePrefix(prefix);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Generate cache key from request URL and query params
 */
export function generateCacheKey(req: NextRequest): string {
  const url = new URL(req.url);
  const params = Array.from(url.searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return `${url.pathname}${params ? `?${params}` : ''}`;
}

/**
 * Generate cache key from user ID
 */
export function generateUserCacheKey(req: NextRequest, userId: string): string {
  return `${userId}:${generateCacheKey(req)}`;
}

/**
 * Cache middleware for Next.js API routes
 */
export function cacheMiddleware(config: CacheConfig) {
  return async (
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return handler();
    }

    // Generate cache key
    const identifier = config.keyGenerator
      ? config.keyGenerator(req)
      : generateCacheKey(req);
    const cacheKey = getCacheKey(config.prefix, identifier);

    try {
      // Get or set cache
      const response = await getCacheOrSet<any>(
        cacheKey,
        config.ttl,
        async () => {
          const res = await handler();
          const data = await res.json();
          return data;
        }
      );

      // Return cached response
      return NextResponse.json(response, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${config.ttl}`,
        },
      });
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Fallback to handler if cache fails
      const response = await handler();
      return NextResponse.json(await response.json(), {
        headers: {
          'X-Cache': 'MISS',
        },
      });
    }
  };
}
