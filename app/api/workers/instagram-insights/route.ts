import { NextRequest, NextResponse } from 'next/server';
import { runInstagramInsightsWorker } from '@/lib/workers/instagramInsightsWorker';

/**
 * POST /api/workers/instagram-insights
 * Trigger Instagram insights sync worker
 * 
 * This endpoint can be called by:
 * - Cron jobs (Vercel Cron, AWS EventBridge, etc.)
 * - Manual triggers
 * - Scheduled tasks
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Instagram Insights API] Worker triggered');

    // Run the worker
    await runInstagramInsightsWorker();

    return NextResponse.json({
      success: true,
      message: 'Instagram insights sync completed',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Instagram Insights API] Worker failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Instagram insights sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workers/instagram-insights
 * Get worker status and last run info
 */
export async function GET() {
  return NextResponse.json({
    worker: 'instagram-insights',
    status: 'ready',
    description: 'Syncs Instagram media insights and account metrics',
    schedule: 'Every 6 hours (recommended)',
    endpoint: 'POST /api/workers/instagram-insights',
  });
}
