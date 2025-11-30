import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import type { Message } from '@/lib/types/messages';

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
    
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return Response.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    if (session.user.id !== creatorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('[API] Thread messages request:', {
      creatorId,
      threadId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual backend service call
    // const messages = await backendMessagesService.getThreadMessages(creatorId, threadId);

    // Mock data
    const mockMessages: Message[] = [
      {
        id: 'msg_1',
        threadId,
        platform: 'onlyfans',
        sender: {
          id: 'user_1',
          name: 'Sarah M.',
          username: '@sarah_m',
          platform: 'onlyfans',
          tier: 'VIP',
        },
        content: 'Hey! Love your latest content 😍',
        status: 'unread',
        priority: 'high',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: 'msg_2',
        threadId,
        platform: 'onlyfans',
        sender: {
          id: 'creator_123',
          name: 'You',
          username: '@you',
          platform: 'onlyfans',
        },
        content: 'Thank you so much! 💕',
        status: 'read',
        priority: 'normal',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        readAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
      },
    ];

    return Response.json({ messages: mockMessages });
  } catch (error) {
    console.error('[API] Thread messages error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
