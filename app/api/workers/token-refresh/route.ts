/**
 * Token Refresh Worker Trigger Endpoint
 * 
 * POST /api/workers/token-refresh
 * Manually triggers token refresh scheduler
 * 
 * Can be called by:
 * - Cron job (e.g., every 30 minutes)
 * - AWS EventBridge scheduled rule
 * - Manual trigger for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { runTokenRefresh } from '@/lib/workers/tokenRefreshScheduler';

// Optional: Add authentication for worker endpoint
const WORKER_SECRET = process.env.WORKER_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify worker secret if configured
    if (WORKER_SECRET) {
      const authHeader = request.headers.get('authorization');
      const providedSecret = authHeader?.replace('Bearer ', '');

      if (providedSecret !== WORKER_SECRET) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('Token refresh scheduler triggered via API');

    // Run scheduler
    const result = await runTokenRefresh();

    return NextResponse.json({
      success: true,
      message: 'Token refresh completed',
      result: {
        total: result.total,
        refreshed: result.refreshed,
        failed: result.failed,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Token refresh trigger error:', error);

    return NextResponse.json(
      {
        error: 'Scheduler execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health check
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    worker: 'token-refresh-scheduler',
    message: 'Use POST to trigger scheduler',
  });
}
