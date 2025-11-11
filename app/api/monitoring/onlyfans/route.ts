import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/request';
import { OnlyFansRateLimiterService } from '@/lib/services/onlyfans-rate-limiter.service';
import { getPool } from '@/lib/db/index';

async function getHandler(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get queue status from SQS
    const rateLimiterService = new OnlyFansRateLimiterService();
    const queueStatus = await rateLimiterService.getQueueStatus();

    // Check database health
    let dbHealthy = false;
    let dbLatencyMs = 0;
    try {
      const startTime = Date.now();
      const pool = getPool();
      await pool.query('SELECT 1');
      dbLatencyMs = Date.now() - startTime;
      dbHealthy = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Get system metrics
    const systemHealth = {
      status: dbHealthy && queueStatus.queueDepth < 1000 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      components: {
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          latencyMs: dbLatencyMs,
        },
        sqs: {
          status: queueStatus.queueDepth < 1000 ? 'healthy' : 'degraded',
          queueDepth: queueStatus.queueDepth,
          messagesInFlight: queueStatus.messagesInFlight,
          dlqCount: queueStatus.dlqCount,
        },
        rateLimiter: {
          status: queueStatus.dlqCount < 10 ? 'healthy' : 'degraded',
          enabled: true,
        },
      },
      metrics: {
        queueDepth: queueStatus.queueDepth,
        messagesInFlight: queueStatus.messagesInFlight,
        dlqCount: queueStatus.dlqCount,
        dbLatencyMs,
      },
    };

    return NextResponse.json(systemHealth);
  } catch (error) {
    console.error('Failed to get OnlyFans monitoring status:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to get monitoring status',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export const GET = getHandler as any;
