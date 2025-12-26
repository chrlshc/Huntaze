import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';
import { ConversationsRepository, FansRepository, MessagesRepository } from '@/lib/db/repositories';
import { getPool } from '@/lib/db';

/**
 * POST /api/revenue/churn/bulk-reengage
 * 
 * Bulk re-engage multiple fans
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, fanIds, messageTemplate } = body;

    // Validation
    if (!creatorId || !fanIds || !Array.isArray(fanIds)) {
      return NextResponse.json(
        { error: 'creatorId and fanIds (array) are required' },
        { status: 400 }
      );
    }

    if (fanIds.length === 0) {
      return NextResponse.json(
        { error: 'fanIds array cannot be empty' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Bulk re-engage request:', {
      creatorId,
      fanCount: fanIds.length,
      hasCustomTemplate: !!messageTemplate,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    if (ENABLE_MOCK_DATA) {
      return NextResponse.json({
        success: true,
        sent: fanIds.length,
        failed: 0,
      });
    }

    const userId = Number.parseInt(creatorId, 10);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid creatorId' }, { status: 400 });
    }

    let sent = 0;
    let failed = 0;

    for (const rawFanId of fanIds) {
      const fanIdNum = Number.parseInt(String(rawFanId), 10);
      if (!Number.isFinite(fanIdNum)) {
        failed += 1;
        continue;
      }

      const fan = await FansRepository.getFan(userId, fanIdNum);
      if (!fan) {
        failed += 1;
        continue;
      }

      const conversationId = await getOrCreateConversation(userId, fanIdNum);
      const messageText =
        typeof messageTemplate === 'string' && messageTemplate.trim().length > 0
          ? messageTemplate.trim()
          : `Hey ${fan.name || 'there'}, just checking in. Anything I can help with?`;

      await MessagesRepository.createMessage(
        userId,
        conversationId,
        fanIdNum,
        'out',
        messageText
      );

      sent += 1;
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
    });
  } catch (error) {
    console.error('[API] Bulk re-engage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getOrCreateConversation(userId: number, fanId: number): Promise<number> {
  const pool = getPool();
  const result = await pool.query(
    'SELECT id FROM conversations WHERE user_id = $1 AND fan_id = $2 ORDER BY updated_at DESC LIMIT 1',
    [userId, fanId]
  );

  if (result.rows[0]?.id) {
    return Number(result.rows[0].id);
  }

  const conversation = await ConversationsRepository.createConversation(userId, fanId);
  return Number(conversation.id);
}
