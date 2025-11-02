/**
 * POST /api/onlyfans/messages/send
 * 
 * Envoie un message OnlyFans via le rate limiter AWS (SQS + Lambda + Redis).
 * Le message est queued et sera envoyé avec rate limiting automatique (10 msg/min).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth/request';
import { checkRateLimit, idFromRequestHeaders } from '@/src/lib/rate-limit';
import { onlyFansRateLimiterService } from '@/lib/services/onlyfans-rate-limiter.service';
import { logger } from '@/lib/utils/logger';

// Zod schema pour validation du body
const SendMessageSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long (max 5000 chars)'),
  mediaUrls: z.array(z.string().url('Invalid media URL')).optional(),
  priority: z.number().min(1).max(10).optional(),
  metadata: z.record(z.any()).optional(),
});

type SendMessageRequest = z.infer<typeof SendMessageSchema>;

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      logger.warn('OnlyFans send message: Unauthorized request');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 2. Rate limiting (60 req/min per user)
    const ident = idFromRequestHeaders(request.headers);
    const rl = await checkRateLimit({ 
      id: `onlyfans-send:${user.userId}`, 
      limit: 60, 
      windowSec: 60 
    });
    
    if (!rl.allowed) {
      logger.warn('OnlyFans send message: Rate limit exceeded', {
        userId: user.userId,
      });
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    let validated: SendMessageRequest;
    
    try {
      validated = SendMessageSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        
        logger.warn('OnlyFans send message: Validation failed', {
          userId: user.userId,
          errors,
        });
        
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: errors,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // 4. Generate message ID
    const messageId = onlyFansRateLimiterService.generateMessageId();

    // 5. Send message via rate limiter service
    const result = await onlyFansRateLimiterService.sendMessage({
      messageId,
      userId: user.userId,
      recipientId: validated.recipientId,
      content: validated.content,
      mediaUrls: validated.mediaUrls,
      metadata: validated.metadata,
      priority: validated.priority,
    });

    // 6. Handle result
    if (result.status === 'failed') {
      logger.error('OnlyFans send message: Failed to queue message', {
        userId: user.userId,
        messageId,
        error: result.error,
      });

      // Check if rate limiter is disabled
      if (result.error === 'Rate limiter disabled') {
        return NextResponse.json(
          { 
            error: 'OnlyFans messaging service is currently unavailable',
            details: 'Rate limiter is not configured',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to send message',
          details: result.error,
        },
        { status: 500 }
      );
    }

    // 7. Success - message queued
    logger.info('OnlyFans send message: Message queued successfully', {
      userId: user.userId,
      messageId,
      recipientId: validated.recipientId,
    });

    // Calculate estimated send time (assuming 10 msg/min rate limit)
    const estimatedSendTime = new Date(Date.now() + 6000); // ~6 seconds

    return NextResponse.json(
      {
        messageId: result.messageId,
        status: result.status,
        queuedAt: result.queuedAt,
        estimatedSendTime,
        message: 'Message queued successfully. It will be sent shortly with rate limiting.',
      },
      { status: 202 } // 202 Accepted
    );

  } catch (error) {
    logger.error('OnlyFans send message: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
