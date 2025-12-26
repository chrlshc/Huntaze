/**
 * POST /api/of/scrape/content
 * 
 * Triggers a content/posts stats scrape job.
 * Captures post performance metrics (likes, tips, views).
 * 
 * Lower priority for beta - useful for content analytics
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
    const maxCount = Math.min(body.maxCount || 50, 200); // Cap at 200

    // Check if SQS is configured
    if (!process.env.OF_SQS_SEND_QUEUE_URL) {
      return NextResponse.json(
        { error: 'Scraping service not configured', details: 'OF_SQS_SEND_QUEUE_URL not set' },
        { status: 503 }
      );
    }

    // Enqueue the scrape job
    await enqueueJob({
      type: 'scrape_content',
      userId,
      options: { maxCount },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Content scrape job queued',
      jobType: 'scrape_content',
      userId,
      options: { maxCount },
      estimatedDuration: '30-60 seconds',
    });

  } catch (error) {
    console.error('[API] scrape/content error:', error);
    return NextResponse.json(
      { error: 'Failed to queue scrape job' },
      { status: 500 }
    );
  }
}
