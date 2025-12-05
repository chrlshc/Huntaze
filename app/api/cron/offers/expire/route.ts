/**
 * Cron: Expire Offers
 * Runs hourly to mark expired offers
 * 
 * EventBridge Schedule: rate(1 hour)
 * Target: POST /api/cron/offers/expire
 */

import { NextRequest, NextResponse } from 'next/server';
import { offersService } from '@/lib/offers/offers.service';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    
    // Expire offers past their validUntil date
    const expiredCount = await offersService.expireOffers();
    
    const duration = Date.now() - startTime;

    console.log(`[CRON] expireOffers: ${expiredCount} offers expired in ${duration}ms`);

    return NextResponse.json({
      success: true,
      expiredCount,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] expireOffers error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to expire offers',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
