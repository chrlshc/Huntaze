/**
 * POST /api/of/scrape/fans
 * 
 * Triggers a fans/subscribers scrape job for the authenticated user.
 * Captures subscriber list with spending data for CRM.
 * 
 * Budget-conscious: Limited to 100 fans by default (configurable)
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
    
    // Parse options from body
    const body = await request.json().catch(() => ({}));
    const maxCount = Math.min(body.maxCount || 100, 500); // Cap at 500 for budget
    const type = body.type || 'active'; // 'active' | 'expired' | 'all'

    // Check if SQS is configured
    if (!process.env.OF_SQS_SEND_QUEUE_URL) {
      return NextResponse.json(
        { error: 'Scraping service not configured', details: 'OF_SQS_SEND_QUEUE_URL not set' },
        { status: 503 }
      );
    }

    // Enqueue the scrape job
    await enqueueJob({
      type: 'scrape_fans',
      userId,
      options: { maxCount, type },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Fans scrape job queued',
      jobType: 'scrape_fans',
      userId,
      options: { maxCount, type },
      estimatedDuration: '60-120 seconds',
    });

  } catch (error) {
    console.error('[API] scrape/fans error:', error);
    return NextResponse.json(
      { error: 'Failed to queue scrape job' },
      { status: 500 }
    );
  }
}
