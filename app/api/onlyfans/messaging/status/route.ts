/**
 * GET /api/onlyfans/messages/status
 * 
 * Récupère l'état de la queue SQS OnlyFans et les métriques d'envoi.
 * Permet de monitorer le système et détecter les problèmes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/request';
import { onlyFansRateLimiterService } from '@/lib/services/onlyfans-rate-limiter.service';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      logger.warn('OnlyFans queue status: Unauthorized request');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 2. Get queue status from service
    const queueStatus = await onlyFansRateLimiterService.getQueueStatus();

    // 3. Calculate additional metrics
    const totalMessages = queueStatus.queueDepth + queueStatus.messagesInFlight;
    const estimatedProcessingTime = totalMessages * 6; // 6 seconds per message (10 msg/min)

    // 4. Build response
    const response = {
      queue: {
        depth: queueStatus.queueDepth,
        inFlight: queueStatus.messagesInFlight,
        dlqCount: queueStatus.dlqCount,
        total: totalMessages,
      },
      processing: {
        estimatedTimeSeconds: estimatedProcessingTime,
        rateLimit: '10 messages/minute',
        lastProcessedAt: queueStatus.lastProcessedAt,
      },
      health: {
        status: queueStatus.dlqCount > 10 ? 'degraded' : 'healthy',
        message: queueStatus.dlqCount > 10 
          ? `${queueStatus.dlqCount} messages in DLQ - manual intervention may be required`
          : 'All systems operational',
      },
      timestamp: new Date().toISOString(),
    };

    logger.info('OnlyFans queue status: Status retrieved', {
      userId: user.userId,
      queueDepth: queueStatus.queueDepth,
      dlqCount: queueStatus.dlqCount,
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    logger.error('OnlyFans queue status: Failed to get status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Check if it's a service unavailable error
    if (error instanceof Error && error.message.includes('Failed to get queue status')) {
      return NextResponse.json(
        { 
          error: 'Queue status unavailable',
          details: error.message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
