import { NextRequest } from 'next/server';
import { ConversationsRepository, MessagesRepository, FansRepository } from '@/lib/db/repositories';
import type { Message } from '@/lib/types/messages';
import { resolveUserId } from '@/app/api/crm/_lib/auth';

/**
 * GET /api/messages/[threadId]
 * 
 * Get messages for a specific thread
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    // Await params in Next.js 16
    const { threadId } = await params;

    const { userId } = await resolveUserId(request);

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const platformParam = searchParams.get('platform');

    if (creatorId && String(userId) !== creatorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('[API] Thread messages request:', {
      creatorId: creatorId || String(userId),
      threadId,
      timestamp: new Date().toISOString(),
    });

    const conversationId = parseInt(threadId, 10);
    if (Number.isNaN(conversationId)) {
      return Response.json({ error: 'Invalid threadId' }, { status: 400 });
    }

    const conversation = await ConversationsRepository.getConversation(userId, conversationId);
    if (!conversation) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    const fanId = parseInt(conversation.fanId, 10);
    const fan = Number.isFinite(fanId) ? await FansRepository.getFan(userId, fanId) : null;

    const messages = await MessagesRepository.listMessages(userId, conversationId, { order: 'asc' });

    const platform =
      platformParam ||
      (conversation.platform ? conversation.platform.toLowerCase() : 'onlyfans');
    const platformValue =
      platform === 'instagram' || platform === 'tiktok' || platform === 'reddit' || platform === 'fansly'
        ? platform
        : 'onlyfans';

    const normalizedMessages: Message[] = messages.map((message) => {
      const isInbound = message.direction === 'in';
      const senderName = isInbound ? fan?.name || `Fan ${conversation.fanId}` : 'Creator';
      const senderUsername = isInbound ? fan?.handle || senderName : 'creator';
      const attachments =
        typeof message.attachments === 'string'
          ? JSON.parse(message.attachments || '[]')
          : Array.isArray(message.attachments)
          ? message.attachments
          : [];

      return {
        id: String(message.id),
        threadId: String(conversation.id),
        platform: platformValue,
        sender: {
          id: isInbound ? String(conversation.fanId) : String(userId),
          name: senderName,
          username: senderUsername,
          avatar: isInbound ? fan?.avatar || undefined : undefined,
          platform: platformValue,
          tier: isInbound && fan?.tags?.includes('VIP') ? 'VIP' : undefined,
        },
        content: message.text || '',
        media: attachments.map((attachment: any, index: number) => ({
          id: attachment.id || `${message.id}-${index}`,
          type:
            attachment.type === 'video' ||
            attachment.type === 'audio' ||
            attachment.type === 'file' ||
            attachment.type === 'image'
              ? attachment.type
              : 'file',
          url: attachment.url,
          size: attachment.size,
        })),
        status: !isInbound || message.read ? 'read' : 'unread',
        priority: !isInbound && message.read ? 'normal' : message.read ? 'normal' : 'high',
        timestamp: message.createdAt,
        readAt: message.read ? message.createdAt : undefined,
      };
    });

    return Response.json({ messages: normalizedMessages });
  } catch (error) {
    console.error('[API] Thread messages error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
