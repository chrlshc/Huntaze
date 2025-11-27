/**
 * API route for cache invalidation
 */

import { NextRequest, NextResponse } from 'next/server';
import { invalidateCacheByTag, invalidateCache, clearCache } from '@/lib/cache/api-cache';

/**
 * POST /api/cache/invalidate
 * Invalidates cache by tag or key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tag, key, clearAll } = body;

    if (clearAll) {
      clearCache();
      return NextResponse.json({
        message: 'All cache cleared',
        invalidated: 'all',
      });
    }

    if (tag) {
      const count = invalidateCacheByTag(tag);
      return NextResponse.json({
        message: `Cache invalidated for tag: ${tag}`,
        invalidated: count,
      });
    }

    if (key) {
      const deleted = invalidateCache(key);
      return NextResponse.json({
        message: deleted
          ? `Cache invalidated for key: ${key}`
          : `Key not found: ${key}`,
        invalidated: deleted ? 1 : 0,
      });
    }

    return NextResponse.json(
      { error: 'Either tag, key, or clearAll must be provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
