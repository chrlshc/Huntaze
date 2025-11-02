import { NextRequest, NextResponse } from 'next/server';
import { ConversationsRepository, FansRepository } from '@/lib/db/repositories';
import { getUserFromRequest } from '@/lib/auth/request';
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

    // Get all conversations for the user
    const conversations = await ConversationsRepository.listConversations(userId);

    // Enrich conversations with fan data
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const fan = await FansRepository.getFan(userId, Number(conversation.fanId));
        return {
          ...conversation,
          fan: fan ? {
            id: fan.id,
            name: fan.name,
            handle: fan.handle,
            platform: fan.platform,
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

export const GET = withMonitoring('crm.conversations.list', getHandler as any, {
  domain: 'crm',
  feature: 'conversations_list',
  getUserId: (req) => (req as any)?.headers?.get?.('x-user-id') || undefined,
});
