export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/request';
import { getPool } from '@/lib/db/index';
import { OnlyFansRateLimiterService } from '@/lib/services/onlyfans-rate-limiter.service';
import { checkRateLimit, idFromRequestHeaders } from '@/src/lib/rate-limit';
import { withMonitoring } from '@/lib/observability/bootstrap';

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Rate limit retry operations
    const ident = idFromRequestHeaders(request.headers);
    const rl = await checkRateLimit({ id: ident.id, limit: 10, windowSec: 60 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(user.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const messageId = parseInt(id, 10);
    if (isNaN(messageId)) {
      return NextResponse.json({ error: 'Invalid message ID' }, { status: 400 });
    }

    // Get message from database
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        id, user_id as "userId", conversation_id as "conversationId",
        fan_id as "fanId", direction, text, price_cents as "priceCents",
        attachments
      FROM messages 
      WHERE id = $1 AND user_id = $2 AND direction = 'out'`,
      [messageId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const message = result.rows[0];

    // Retry sending via rate limiter service
    const rateLimiterService = new OnlyFansRateLimiterService();
    const sendResult = await rateLimiterService.sendMessage({
      messageId: crypto.randomUUID(),
      userId: user.userId,
      recipientId: message.fanId.toString(),
      content: message.text,
      mediaUrls: message.attachments?.map((a: any) => a.url) || [],
      metadata: {
        originalMessageId: messageId.toString(),
        retry: true,
      },
    });

    if (sendResult.status === 'queued') {
      return NextResponse.json(
        {
          success: true,
          messageId: sendResult.messageId,
          status: 'queued',
          queuedAt: sendResult.queuedAt,
        },
        { status: 202 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: sendResult.error || 'Failed to retry message',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to retry message:', error);
    return NextResponse.json(
      { error: 'Failed to retry message', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export const POST = withMonitoring('onlyfans.messages.retry', postHandler as any, {
  domain: 'crm',
  feature: 'message_retry',
  getUserId: (req) => (req as any)?.headers?.get?.('x-user-id') || undefined,
});
