import { NextRequest, NextResponse } from 'next/server';
import { ConversationsRepository, FansRepository } from '@/lib/db/repositories';
import { getPool } from '@/lib/db';
import { resolveUserId } from '../_lib/auth';

export const dynamic = 'force-dynamic';

async function getHandler(request: NextRequest) {
  try {
    const { userId } = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all conversations for the user
    const conversations = await ConversationsRepository.listConversations(userId);

    const conversationIds = conversations
      .map((conversation) => Number(conversation.id))
      .filter((value) => Number.isFinite(value));

    const lastMessageMap = new Map<number, { text: string | null; createdAt: string; direction: string }>();

    if (conversationIds.length > 0) {
      const pool = getPool();
      const result = await pool.query(
        `SELECT DISTINCT ON (conversation_id)
          conversation_id,
          text,
          created_at,
          direction
        FROM messages
        WHERE user_id = $1 AND conversation_id = ANY($2::int[])
        ORDER BY conversation_id, created_at DESC`,
        [userId, conversationIds],
      );

      for (const row of result.rows) {
        lastMessageMap.set(row.conversation_id, {
          text: row.text ?? null,
          createdAt: row.created_at?.toISOString?.() ?? row.created_at,
          direction: row.direction,
        });
      }
    }

    // Enrich conversations with fan data
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const fanId = Number(conversation.fanId);
        const fan = Number.isFinite(fanId)
          ? await FansRepository.getFan(userId, fanId)
          : null;
        const lastMessage = lastMessageMap.get(Number(conversation.id));
        return {
          ...conversation,
          lastMessage: lastMessage
            ? {
                text: lastMessage.text,
                createdAt: lastMessage.createdAt,
                direction: lastMessage.direction,
              }
            : null,
          fan: fan ? {
            id: fan.id,
            name: fan.name,
            handle: fan.handle,
            platform: fan.platform,
            avatar: fan.avatar || null,
            tags: Array.isArray(fan.tags) ? fan.tags : [],
            valueCents: fan.valueCents ?? 0,
            lastSeenAt: fan.lastSeenAt,
            notes: fan.notes,
            createdAt: fan.createdAt,
            updatedAt: fan.updatedAt,
          } : null,
        };
      })
    );

    return NextResponse.json({
      conversations: enrichedConversations,
      total: enrichedConversations.length,
    });
  } catch (error) {
    console.error('Failed to list conversations:', error);
    return NextResponse.json(
      { error: 'Failed to list conversations' },
      { status: 500 }
    );
  }
}

export const GET = getHandler as any;
