import { NextRequest } from 'next/server';
import { ConversationsRepository, MessagesRepository } from '@/lib/db/repositories';
import type { Message } from '@/lib/types/messages';
import { resolveUserId } from '@/app/api/crm/_lib/auth';

/**
 * POST /api/messages/[threadId]/send
 * 
 * Send a message in a thread
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;

    const { userId } = await resolveUserId(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = parseInt(threadId, 10);
    if (Number.isNaN(conversationId)) {
      return Response.json({ error: 'Invalid threadId' }, { status: 400 });
    }

    const body = await request.json();
    const { creatorId, content, media } = body ?? {};

    if (!content || typeof content !== 'string') {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (creatorId && String(userId) !== String(creatorId)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const conversation = await ConversationsRepository.getConversation(userId, conversationId);
    if (!conversation) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    const attachments = Array.isArray(media)
      ? media.map((url: string, index: number) => ({
          id: `${conversationId}-${Date.now()}-${index}`,
          type: 'image',
          url,
        }))
      : undefined;

    const created = await MessagesRepository.createMessage(
      userId,
      conversationId,
      Number(conversation.fanId),
      'out',
      content,
      undefined,
      attachments
    );

    const platform =
      conversation.platform?.toLowerCase?.() === 'instagram' ||
      conversation.platform?.toLowerCase?.() === 'tiktok' ||
      conversation.platform?.toLowerCase?.() === 'reddit' ||
      conversation.platform?.toLowerCase?.() === 'fansly'
        ? (conversation.platform.toLowerCase() as Message['platform'])
        : 'onlyfans';

    const responseMessage: Message = {
      id: String(created.id),
      threadId: String(conversation.id),
      platform,
      sender: {
        id: String(userId),
        name: 'You',
        username: 'creator',
        platform,
      },
      content: created.text || '',
      media: attachments?.map((attachment: any, index: number) => ({
        id: attachment.id || `${created.id}-${index}`,
        type: attachment.type || 'file',
        url: attachment.url,
        size: attachment.size,
      })),
      status: 'read',
      priority: 'normal',
      timestamp:
        typeof created.createdAt === 'string'
          ? created.createdAt
          : new Date(created.createdAt).toISOString(),
    };

    return Response.json({ message: responseMessage }, { status: 201 });
  } catch (error) {
    console.error('[API] Send message error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
