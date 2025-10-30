/**
 * OnlyFans Messages Status API Route
 * 
 * GET /api/onlyfans/messages/status
 * 
 * Returns queue status and health metrics for the rate limiter.
 * 
 * @module api-onlyfans-messages-status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { createOnlyFansRateLimiterService } from '@/lib/services/onlyfans-rate-limiter.service';
import { getIntelligentQueueManager } from '@/lib/services/intelligent-queue-manager';
import { CloudWatchMetricsService } from '@/lib/services/cloudwatch-metrics.service';
import { getRateLimiterStatus } from '@/lib/config/rate-limiter.config';

const prisma = new PrismaClient();

/**
 * GET /api/onlyfans/messages/status
 * 
 * Get queue status and metrics
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get rate limiter configuration status
    const configStatus = getRateLimiterStatus();

    // 3. Get queue status
    let queueStatus;
    try {
      const queueManager = await getIntelligentQueueManager();
      const metrics = new CloudWatchMetricsService();
      const rateLimiterService = createOnlyFansRateLimiterService(
        queueManager,
        prisma,
        metrics
      );

      queueStatus = await rateLimiterService.getQueueStatus();
    } catch (error) {
      console.error('[API] Failed to get queue status', { error });
      queueStatus = {
        healthy: false,
        messagesQueued: 0,
        messagesProcessing: 0,
        messagesFailed: 0,
        averageLatency: 0,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // 4. Return combined status
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      configuration: {
        configured: configStatus.configured,
        enabled: configStatus.enabled,
        active: configStatus.active,
        queueUrl: configStatus.queueUrl,
        region: configStatus.region,
        features: configStatus.features,
      },
      queue: {
        healthy: queueStatus.healthy,
        messagesQueued: queueStatus.messagesQueued,
        messagesProcessing: queueStatus.messagesProcessing,
        messagesFailed: queueStatus.messagesFailed,
        averageLatency: queueStatus.averageLatency,
        lastError: queueStatus.lastError,
      },
    });
  } catch (error) {
    console.error('[API] Unexpected error in status endpoint', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
