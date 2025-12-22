/**
 * Webhook Worker Trigger Endpoint
 * 
 * POST /api/workers/webhooks
 * Manually triggers webhook worker to process pending events
 * 
 * Can be called by:
 * - Cron job (e.g., every 5 minutes)
 * - AWS EventBridge scheduled rule
 * - Manual trigger for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { runWebhookWorker } from '@/lib/workers/webhookWorker';

// Optional: Add authentication for worker endpoint
const WORKER_SECRET = process.env.WORKER_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production' && !WORKER_SECRET) {
      return NextResponse.json(
        { error: 'Worker endpoint not configured' },
        { status: 503 }
      );
    }

    // Verify worker secret if configured
    if (WORKER_SECRET) {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
      const headerSecret = request.headers.get('x-worker-secret') || undefined;
      const providedSecret = headerSecret ?? bearer;

      if (!providedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const a = Buffer.from(providedSecret);
      const b = Buffer.from(WORKER_SECRET);
      const isValid = a.length === b.length && crypto.timingSafeEqual(a, b);

      if (!isValid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Run worker
    const processed = await runWebhookWorker();

    return NextResponse.json({
      success: true,
      message: 'Webhook worker completed',
      processed,
    });
  } catch (error) {
    console.error('Webhook worker trigger error:', error);
    
    return NextResponse.json(
      {
        error: 'Worker execution failed',
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
    worker: 'webhook-processor',
    message: 'Use POST to trigger worker',
  });
}
