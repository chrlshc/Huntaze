import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';

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
    // Await params in Next.js 16
    const { threadId } = await params;
    
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, content, media } = body;

    if (!creatorId || !content) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (session.user.id !== creatorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('[API] Send message request:', {
      creatorId,
      threadId,
      contentLength: content.length,
      hasMedia: !!media,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual backend service call
    // const message = await backendMessagesService.sendMessage(creatorId, threadId, content, media);

    // Mock response
    const message = {
      id: `msg_${Date.now()}`,
      threadId,
      platform: 'onlyfans',
      sender: {
        id: creatorId,
        name: 'You',
        username: '@you',
        platform: 'onlyfans' as const,
      },
      content,
      media,
      status: 'read' as const,
      priority: 'normal' as const,
      timestamp: new Date().toISOString(),
    };

    return Response.json({ message }, { status: 201 });
  } catch (error) {
    console.error('[API] Send message error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
