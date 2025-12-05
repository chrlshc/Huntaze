/**
 * Cron: Activate Scheduled Offers
 * Runs hourly to activate offers that have reached their validFrom date
 * 
 * EventBridge Schedule: rate(1 hour)
 * Target: POST /api/cron/offers/activate
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
    
    // Activate scheduled offers that have reached their start date
    const activatedCount = await offersService.activateScheduledOffers();
    
    const duration = Date.now() - startTime;

    console.log(`[CRON] activateScheduledOffers: ${activatedCount} offers activated in ${duration}ms`);

    return NextResponse.json({
      success: true,
      activatedCount,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] activateScheduledOffers error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to activate offers',
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
