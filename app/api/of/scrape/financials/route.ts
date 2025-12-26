/**
 * POST /api/of/scrape/financials
 * 
 * Triggers a financials scrape job for the authenticated user.
 * Uses the browser worker to capture earnings, stats, and revenue data.
 * 
 * Budget-friendly: Only 1 page load, captures all data from API responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { enqueueJob } from '@/lib/queue/of-sqs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if SQS is configured
    if (!process.env.OF_SQS_SEND_QUEUE_URL) {
      return NextResponse.json(
        { error: 'Scraping service not configured', details: 'OF_SQS_SEND_QUEUE_URL not set' },
        { status: 503 }
      );
    }

    // Enqueue the scrape job
    await enqueueJob({
      type: 'scrape_financials',
      userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Financials scrape job queued',
      jobType: 'scrape_financials',
      userId,
      estimatedDuration: '30-60 seconds',
    });

  } catch (error) {
    console.error('[API] scrape/financials error:', error);
    return NextResponse.json(
      { error: 'Failed to queue scrape job' },
      { status: 500 }
    );
  }
}
