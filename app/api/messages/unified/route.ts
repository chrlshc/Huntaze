import { NextRequest } from 'next/server';
import { ConversationsRepository } from '@/lib/db/repositories';
import { getPool } from '@/lib/db';
import type { MessagePlatform, MessageThread, UnifiedMessagesResponse } from '@/lib/types/messages';
import { resolveUserId } from '@/app/api/crm/_lib/auth';

const VALID_PLATFORMS: MessagePlatform[] = ['onlyfans', 'instagram', 'tiktok', 'reddit', 'fansly'];

function normalizePlatform(value?: string | null): MessagePlatform {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'instagram') return 'instagram';
  if (normalized === 'tiktok') return 'tiktok';
  if (normalized === 'reddit') return 'reddit';
  if (normalized === 'fansly') return 'fansly';
  return 'onlyfans';
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const correlationId =
    request.headers.get('X-Correlation-ID') ||
    `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  try {
    const { userId } = await resolveUserId(request);

    if (!userId) {
      console.warn('[API] Unified messages - Unauthorized access attempt:', {
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return Response.json(
        {
          error: 'Unauthorized',
          correlationId,
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const platform = searchParams.get('platform');
    const filter = searchParams.get('filter');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    if (!creatorId) {
      console.warn('[API] Unified messages - Missing creatorId:', {
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return Response.json(
        {
          error: 'creatorId is required',
          correlationId,
        },
        { status: 400 }
      );
    }

    if (platform && !VALID_PLATFORMS.includes(platform as MessagePlatform)) {
      return Response.json(
        {
          error: 'Invalid platform. Must be: onlyfans, instagram, tiktok, reddit, or fansly',
          correlationId,
        },
        { status: 400 }
      );
    }

    if (filter && !['unread', 'starred', 'all'].includes(filter)) {
      return Response.json(
        {
          error: 'Invalid filter. Must be: unread, starred, or all',
          correlationId,
        },
        { status: 400 }
      );
    }

    if (String(userId) !== creatorId) {
      console.warn('[API] Unified messages - Forbidden access attempt:', {
        userId,
        requestedCreatorId: creatorId,
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return Response.json(
        {
          error: 'Forbidden',
          correlationId,
        },
        { status: 403 }
      );
    }

    console.log('[API] Unified messages request:', {
      creatorId,
      platform: platform || 'all',
      filter: filter || 'all',
      limit,
      offset,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    const rawConversations = await ConversationsRepository.listConversations(userId);

    let filtered = rawConversations;
    if (platform) {
      filtered = filtered.filter(
        (conversation) => normalizePlatform(conversation.platform) === platform
      );
    }

    if (filter === 'unread') {
      filtered = filtered.filter((conversation) => (conversation.unreadCount || 0) > 0);
    } else if (filter === 'starred') {
      filtered = [];
    }

    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);

    const conversationIds = Array.from(
      new Set(
        page
          .map((conversation) => Number(conversation.id))
          .filter((value) => Number.isFinite(value))
      )
    );
    const fanIds = Array.from(
      new Set(
        page
          .map((conversation) => Number(conversation.fanId))
          .filter((value) => Number.isFinite(value))
      )
    );

    const lastMessageMap = new Map<
      number,
      { id: string; text: string | null; createdAt: string; direction: string }
    >();
    const messageCountMap = new Map<number, number>();
    const fanMap = new Map<
      number,
      { id: number; name: string; handle?: string; avatar?: string | null; tags?: string[] }
    >();

    if (conversationIds.length > 0) {
      const pool = getPool();
      const [lastResult, countResult, fanResult] = await Promise.all([
        pool.query(
          `SELECT DISTINCT ON (conversation_id)
            id,
            conversation_id,
            text,
            created_at,
            direction
          FROM messages
          WHERE user_id = $1 AND conversation_id = ANY($2::int[])
          ORDER BY conversation_id, created_at DESC`,
          [userId, conversationIds]
        ),
        pool.query(
          `SELECT conversation_id, COUNT(*) as count
           FROM messages
           WHERE user_id = $1 AND conversation_id = ANY($2::int[])
           GROUP BY conversation_id`,
          [userId, conversationIds]
        ),
        fanIds.length > 0
          ? pool.query(
              `SELECT id, name, handle, avatar, tags
               FROM fans
               WHERE user_id = $1 AND id = ANY($2::int[])`,
              [userId, fanIds]
            )
          : Promise.resolve({ rows: [] }),
      ]);

      for (const row of lastResult.rows) {
        lastMessageMap.set(row.conversation_id, {
          id: row.id,
          text: row.text ?? null,
          createdAt: row.created_at?.toISOString?.() ?? row.created_at,
          direction: row.direction,
        });
      }

      for (const row of countResult.rows) {
        messageCountMap.set(row.conversation_id, parseInt(row.count, 10));
      }

      for (const row of fanResult.rows) {
        fanMap.set(row.id, {
          id: row.id,
          name: row.name,
          handle: row.handle || undefined,
          avatar: row.avatar || undefined,
          tags: Array.isArray(row.tags) ? row.tags : [],
        });
      }
    }

    const threads: MessageThread[] = page.map((conversation) => {
      const conversationId = Number(conversation.id);
      const fanId = Number(conversation.fanId);
      const fan = fanMap.get(fanId);
      const lastMessage = lastMessageMap.get(conversationId);
      const platformValue = normalizePlatform(conversation.platform);
      const unreadCount = conversation.unreadCount || 0;
      const senderName = fan?.name || `Fan ${conversation.fanId}`;
      const senderUsername = fan?.handle || senderName;
      const lastMessageTimestamp =
        lastMessage?.createdAt || conversation.lastMessageAt || conversation.updatedAt;
      const isUnread = unreadCount > 0;

      return {
        id: String(conversation.id),
        platform: platformValue,
        sender: {
          id: fan ? String(fan.id) : String(conversation.fanId),
          name: senderName,
          username: senderUsername,
          avatar: fan?.avatar,
          platform: platformValue,
          tier: fan?.tags?.includes('VIP') ? 'VIP' : undefined,
        },
        lastMessage: {
          id: lastMessage?.id || `msg-${conversation.id}`,
          threadId: String(conversation.id),
          platform: platformValue,
          sender: {
            id: fan ? String(fan.id) : String(conversation.fanId),
            name: senderName,
            username: senderUsername,
            avatar: fan?.avatar,
            platform: platformValue,
            tier: fan?.tags?.includes('VIP') ? 'VIP' : undefined,
          },
          content: lastMessage?.text || '',
          status: isUnread ? 'unread' : 'read',
          priority: isUnread ? 'high' : 'normal',
          timestamp: lastMessageTimestamp || new Date().toISOString(),
        },
        unreadCount,
        messageCount: messageCountMap.get(conversationId) || 0,
        status: isUnread ? 'unread' : 'read',
        priority: isUnread ? 'high' : 'normal',
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    });

    const stats = {
      totalUnread: threads.reduce((sum, thread) => sum + thread.unreadCount, 0),
      byPlatform: {
        onlyfans: 0,
        instagram: 0,
        tiktok: 0,
        reddit: 0,
        fansly: 0,
      } as Record<MessagePlatform, number>,
    };

    for (const thread of threads) {
      stats.byPlatform[thread.platform] += thread.unreadCount;
    }

    const response: UnifiedMessagesResponse = {
      threads,
      stats,
      metadata: {
        total,
        limit,
        offset,
        hasMore: offset + threads.length < total,
      },
    };

    const duration = Date.now() - startTime;
    console.log('[API] Unified messages response:', {
      correlationId,
      threadsCount: threads.length,
      totalUnread: stats.totalUnread,
      duration,
    });

    return Response.json(response);
  } catch (error) {
    console.error('[API] Unified messages error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId,
    });

    return Response.json(
      {
        error: 'Internal server error',
        correlationId,
      },
      { status: 500 }
    );
  }
}
