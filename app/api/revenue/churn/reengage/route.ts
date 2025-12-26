import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';
import { ConversationsRepository, FansRepository, MessagesRepository } from '@/lib/db/repositories';
import { getPool } from '@/lib/db';

/**
 * POST /api/revenue/churn/reengage
 * 
 * Send re-engagement message to a fan
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, fanId, messageTemplate } = body;

    // Validation
    if (!creatorId || !fanId) {
      return NextResponse.json(
        { error: 'creatorId and fanId are required' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Re-engage fan request:', {
      creatorId,
      fanId,
      hasCustomTemplate: !!messageTemplate,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    if (ENABLE_MOCK_DATA) {
      const messageId = `msg_${Date.now()}`;
      return NextResponse.json({ success: true, messageId });
    }

    const userId = Number.parseInt(creatorId, 10);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid creatorId' }, { status: 400 });
    }

    const fanIdNum = Number.parseInt(String(fanId), 10);
    if (!Number.isFinite(fanIdNum)) {
      return NextResponse.json({ error: 'Invalid fanId' }, { status: 400 });
    }

    const fan = await FansRepository.getFan(userId, fanIdNum);
    if (!fan) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 });
    }

    const conversationId = await getOrCreateConversation(userId, fanIdNum);
    const messageText =
      typeof messageTemplate === 'string' && messageTemplate.trim().length > 0
        ? messageTemplate.trim()
        : `Hey ${fan.name || 'there'}, just checking in. Anything I can help with?`;

    const message = await MessagesRepository.createMessage(
      userId,
      conversationId,
      fanIdNum,
      'out',
      messageText
    );

    return NextResponse.json({
      success: true,
      messageId: String(message.id),
    });
  } catch (error) {
    console.error('[API] Re-engage error:', error);
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
