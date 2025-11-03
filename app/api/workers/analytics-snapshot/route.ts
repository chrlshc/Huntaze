/**
 * Analytics Snapshot Worker API Route
 * 
 * Triggers analytics snapshot collection
 * Can be called by cron jobs or schedulers
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyticsSnapshotWorker } from '@/lib/workers/analyticsSnapshotWorker';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/workers/analytics-snapshot
 * 
 * Trigger analytics snapshot collection
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (optional: add API key check)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.WORKER_API_KEY;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[API] Starting analytics snapshot collection...');

    await analyticsSnapshotWorker.run();

    return NextResponse.json({
      success: true,
      message: 'Analytics snapshot collection completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Analytics snapshot error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to collect analytics snapshots',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workers/analytics-snapshot
 * 
 * Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    worker: 'analytics-snapshot',
    timestamp: new Date().toISOString(),
  });
}
