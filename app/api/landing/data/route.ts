/**
 * Landing Page Data API
 * Serves cached landing page data for improved performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { staticDataCache } from '@/lib/cache/staticDataCache';
import { cacheApiResponse, CacheConfigs } from '@/lib/cache/cacheMiddleware';

async function landingDataHandler(request: NextRequest) {
  try {
    const data = await staticDataCache.getLandingPageData();
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Landing data API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to load landing page data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Apply caching to the handler
export const GET = cacheApiResponse(landingDataHandler, {
  ...CacheConfigs.landingPage,
  keyGenerator: () => 'api:landing:data',
});