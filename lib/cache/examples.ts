/**
 * Examples of how to use caching in API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCacheOrSet, getCacheKey, CACHE_TTL, CACHE_PREFIX, invalidateCachePrefix } from './redis';

/**
 * Example 1: Simple GET request with caching
 */
export async function GET_DashboardWithCache(req: NextRequest) {
  const userId = 'user-123'; // Get from session
  const cacheKey = getCacheKey(CACHE_PREFIX.DASHBOARD, userId);

  const data = await getCacheOrSet(
    cacheKey,
    CACHE_TTL.DASHBOARD,
    async () => {
      // Fetch data from database
      const dashboardData = {
        revenue: 12500,
        subscribers: 1234,
        engagement: 78,
      };
      return dashboardData;
    }
  );

  return NextResponse.json(data, {
    headers: {
      'X-Cache': 'HIT',
      'Cache-Control': `public, max-age=${CACHE_TTL.DASHBOARD}`,
    },
  });
}

/**
 * Example 2: POST request that invalidates cache
 */
export async function POST_CreateCampaignWithInvalidation(req: NextRequest) {
  const body = await req.json();

  // Create campaign in database
  const campaign = {
    id: 'campaign-123',
    ...body,
  };

  // Invalidate campaigns cache
  await invalidateCachePrefix(CACHE_PREFIX.CAMPAIGNS);

  return NextResponse.json(campaign, { status: 201 });
}

/**
 * Example 3: GET request with query params in cache key
 */
export async function GET_AnalyticsWithParams(req: NextRequest) {
  const url = new URL(req.url);
  const period = url.searchParams.get('period') || '30d';
  const userId = 'user-123'; // Get from session

  const cacheKey = getCacheKey(
    CACHE_PREFIX.ANALYTICS,
    `${userId}:${period}`
  );

  const data = await getCacheOrSet(
    cacheKey,
    CACHE_TTL.ANALYTICS,
    async () => {
      // Fetch analytics data
      return {
        period,
        revenue: 45000,
        growth: 12.5,
      };
    }
  );

  return NextResponse.json(data);
}

/**
 * Example 4: Conditional caching based on data
 */
export async function GET_MessagesWithConditionalCache(req: NextRequest) {
  const userId = 'user-123'; // Get from session
  const cacheKey = getCacheKey(CACHE_PREFIX.MESSAGES, userId);

  const data = await getCacheOrSet(
    cacheKey,
    CACHE_TTL.MESSAGES,
    async () => {
      // Fetch messages
      return {
        messages: [],
        unreadCount: 5,
        lastUpdate: new Date().toISOString(),
      };
    }
  );

  // Don't cache if there are unread messages
  if (data.unreadCount > 0) {
    // Return without caching
    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'SKIP',
        'Cache-Control': 'no-cache',
      },
    });
  }

  return NextResponse.json(data, {
    headers: {
      'X-Cache': 'HIT',
      'Cache-Control': `public, max-age=${CACHE_TTL.MESSAGES}`,
    },
  });
}

/**
 * Example 5: Cache with fallback on error
 */
export async function GET_ContentWithFallback(req: NextRequest) {
  const userId = 'user-123'; // Get from session
  const cacheKey = getCacheKey(CACHE_PREFIX.CONTENT, userId);

  try {
    const data = await getCacheOrSet(
      cacheKey,
      CACHE_TTL.CONTENT,
      async () => {
        // Fetch content from database
        // This might throw an error
        return {
          content: [],
          total: 0,
        };
      }
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('Content fetch error:', error);
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

/**
 * Example 6: Batch invalidation
 */
export async function POST_UpdateUserSettings(req: NextRequest) {
  const userId = 'user-123'; // Get from session
  const body = await req.json();

  // Update settings in database
  const settings = {
    userId,
    ...body,
  };

  // Invalidate multiple cache prefixes
  await Promise.all([
    invalidateCachePrefix(CACHE_PREFIX.DASHBOARD),
    invalidateCachePrefix(CACHE_PREFIX.CONTENT),
    invalidateCachePrefix(CACHE_PREFIX.FANS),
  ]);

  return NextResponse.json(settings);
}
