/**
 * GET /api/of/messages/[threadId]
 * 
 * Récupère les messages d'un thread spécifique depuis la DB locale
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { OFMessagesService } from '@/lib/of-messages/messages.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id, 10) 
      : session.user.id;
    
    const { threadId } = await params;
    const { searchParams } = new URL(req.url);
    
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const before = searchParams.get('before');
    const after = searchParams.get('after');

    // Get thread info
    const thread = await OFMessagesService.getThread(userId, threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Get messages
    const messages = await OFMessagesService.getMessages(userId, threadId, {
      limit,
      before: before ? new Date(before) : undefined,
      after: after ? new Date(after) : undefined,
    });

    return NextResponse.json({
      thread,
      messages,
      pagination: {
        limit,
        hasMore: messages.length === limit,
      },
    });

  } catch (error) {
    console.error('Error fetching OF thread messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/of/messages/[threadId]/read
 * 
 * Marque un thread comme lu
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id, 10) 
      : session.user.id;
    
    const { threadId } = await params;

    await OFMessagesService.markThreadAsRead(userId, threadId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marking thread as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark as read' },
      { status: 500 }
    );
  }
}
