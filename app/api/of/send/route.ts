import { NextRequest, NextResponse } from 'next/server';
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
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    // Check rate limits
    const userId = session.user?.id as string;
    const now = new Date();
    const userRateLimit = rateLimitMap.get(userId);

    if (userRateLimit) {
      if (userRateLimit.resetAt > now) {
        if (userRateLimit.count >= DEFAULT_RATE_LIMITS.dm.messagesPerMinute) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please wait before sending another message.' },
            { status: 429 }
          );
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
    return NextResponse.json({
      success: true,
      messageId,
      status: 'queued',
      estimatedSendTime
    });

  } catch (error) {
    console.error('Error sending message:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
