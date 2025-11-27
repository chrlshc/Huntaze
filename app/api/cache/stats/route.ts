/**
 * API route for cache statistics
 */

import { NextResponse } from 'next/server';
import { getCacheStats, getCacheHitRate } from '@/lib/cache/api-cache';

/**
 * GET /api/cache/stats
 * Returns cache statistics
 */
export async function GET() {
  try {
    const stats = getCacheStats();
    const hitRate = getCacheHitRate();

    return NextResponse.json({
      stats: {
        ...stats,
        hitRate: `${(hitRate * 100).toFixed(2)}%`,
        hitRateDecimal: hitRate,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
