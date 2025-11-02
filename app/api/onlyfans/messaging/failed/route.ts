export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/request';
import { getPool } from '@/lib/db/index';
import { withMonitoring } from '@/lib/observability/bootstrap';

async function getHandler(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(user.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Query failed messages from database
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        id, user_id as "userId", conversation_id as "conversationId",
        fan_id as "fanId", direction, text, price_cents as "priceCents",
        read, attachments, created_at as "createdAt"
      FROM messages 
      WHERE user_id = $1 
      AND direction = 'out'
      AND id IN (
        SELECT DISTINCT conversation_id 
        FROM messages 
        WHERE user_id = $1 
        AND created_at > NOW() - INTERVAL '7 days'
      )
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count 
      FROM messages 
      WHERE user_id = $1 
      AND direction = 'out'
      AND created_at > NOW() - INTERVAL '7 days'`,
      [userId]
    );

    return NextResponse.json({
      messages: result.rows,
      total: parseInt(countResult.rows[0]?.count || '0'),
      limit,
      offset,
    });
  } catch (error) {
    console.error('Failed to get failed messages:', error);
    return NextResponse.json(
      { error: 'Failed to get failed messages' },
      { status: 500 }
    );
  }
}

export const GET = withMonitoring('onlyfans.messages.failed', getHandler as any, {
  domain: 'crm',
  feature: 'failed_messages',
  getUserId: (req) => (req as any)?.headers?.get?.('x-user-id') || undefined,
});
