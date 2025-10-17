import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth';
import { z } from 'zod';
import { DEFAULT_RATE_LIMITS } from '@/lib/types/onlyfans';
import { queueDmMessage } from '@/lib/queue/of-queue';

// Request validation schema
const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.object({
    text: z.string().min(1).max(1000),
    media: z.array(z.string().url()).optional()
  })
});

// Simple in-memory rate limiter (replace with Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: Date }>();

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      const r = NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    // Check rate limits
    const userId = session.user!.id;
    const now = new Date();
    const userRateLimit = rateLimitMap.get(userId);

    if (userRateLimit) {
      if (userRateLimit.resetAt > now) {
        if (userRateLimit.count >= DEFAULT_RATE_LIMITS.dm.messagesPerMinute) {
          const r = NextResponse.json({ error: 'Rate limit exceeded. Please wait before sending another message.', requestId }, { status: 429 });
          r.headers.set('X-Request-Id', requestId);
          return r;
        }
        userRateLimit.count++;
      } else {
        // Reset rate limit
        userRateLimit.count = 1;
        userRateLimit.resetAt = new Date(now.getTime() + 60000); // 1 minute
      }
    } else {
      rateLimitMap.set(userId, {
        count: 1,
        resetAt: new Date(now.getTime() + 60000)
      });
    }

    // Queue the message for browser automation
    const messageId = await queueDmMessage(
      userId,
      validated.conversationId,
      validated.content
    );
    
    // Calculate estimated send time based on queue position
    const estimatedDelay = Math.random() * 
      (DEFAULT_RATE_LIMITS.dm.delayBetweenMessages.max - DEFAULT_RATE_LIMITS.dm.delayBetweenMessages.min) +
      DEFAULT_RATE_LIMITS.dm.delayBetweenMessages.min;
    
    const estimatedSendTime = new Date(now.getTime() + estimatedDelay);

    // Return immediate response
    const r = NextResponse.json({
      success: true,
      messageId,
      status: 'queued',
      estimatedSendTime,
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;

  } catch (error: any) {
    log.error('of_send_failed', { error: error?.message || 'unknown_error' });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    
    const r = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
