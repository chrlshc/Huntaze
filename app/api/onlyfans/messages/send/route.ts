/**
 * OnlyFans Messages Send API Route
 * 
 * POST /api/onlyfans/messages/send
 * 
 * Sends OnlyFans messages with automatic rate limiting via AWS SQS + Lambda.
 * Messages are queued and processed at 10 messages/minute.
 * 
 * @module api-onlyfans-messages-send
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { createOnlyFansRateLimiterService, OnlyFansMessageSchema } from '@/lib/services/onlyfans-rate-limiter.service';
import { getIntelligentQueueManager } from '@/lib/services/intelligent-queue-manager';
import { CloudWatchMetricsService } from '@/lib/services/cloudwatch-metrics.service';
import { getRateLimiterStatus } from '@/lib/config/rate-limiter.config';

// Initialize services
const prisma = new PrismaClient();

/**
 * Request body schema
 */
const SendMessageRequestSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  mediaUrls: z.array(z.string().url()).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  metadata: z.record(z.any()).optional(),
});

type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

/**
 * POST /api/onlyfans/messages/send
 * 
 * Send a message to OnlyFans with rate limiting
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authentication
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Check if rate limiter is configured
    const rateLimiterStatus = getRateLimiterStatus();
    
    if (!rateLimiterStatus.active) {
      console.warn('[API] Rate limiter not active', {
        configured: rateLimiterStatus.configured,
        enabled: rateLimiterStatus.enabled,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limiter service unavailable',
          details: 'Rate limiting is currently disabled or not configured',
        },
        { status: 503 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    
    let validatedMessage: SendMessageRequest;
    try {
      validatedMessage = SendMessageRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: issues,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // 4. Initialize services
    const queueManager = await getIntelligentQueueManager();
    const metrics = new CloudWatchMetricsService();
    const rateLimiterService = createOnlyFansRateLimiterService(
      queueManager,
      prisma,
      metrics
    );

    // 5. Send message
    const result = await rateLimiterService.sendMessage(userId, validatedMessage);

    // 6. Calculate latency
    const latency = Date.now() - startTime;

    // 7. Log request
    console.info('[API] Message send request processed', {
      userId,
      messageId: result.messageId,
      recipientId: validatedMessage.recipientId,
      success: result.success,
      latency,
      sqsMessageId: result.sqsMessageId,
      fallbackUsed: result.fallbackUsed,
    });

    // 8. Return response
    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          messageId: result.messageId,
          queuedAt: result.queuedAt.toISOString(),
          estimatedDelivery: new Date(
            result.queuedAt.getTime() + 60000 // +1 minute estimate
          ).toISOString(),
          sqsMessageId: result.sqsMessageId,
        },
        { status: 202 } // Accepted
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          messageId: result.messageId,
          error: result.error || 'Failed to queue message',
          fallbackUsed: result.fallbackUsed,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const latency = Date.now() - startTime;

    console.error('[API] Unexpected error in message send', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      latency,
    });

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

/**
 * GET /api/onlyfans/messages/send
 * 
 * Get rate limiter status (for health checks)
 */
export async function GET(request: NextRequest) {
  try {
    const status = getRateLimiterStatus();

    return NextResponse.json({
      configured: status.configured,
      enabled: status.enabled,
      active: status.active,
      queueUrl: status.queueUrl,
      region: status.region,
      features: status.features,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
