/**
 * GET /api/of/messages
 * 
 * Récupère les threads de messages depuis la DB locale
 * (pas d'appel direct à OF - le scraper remplit la DB)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { OFMessagesService } from '@/lib/of-messages/messages.service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id, 10) 
      : session.user.id;
    const { searchParams } = new URL(req.url);
    
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const threads = await OFMessagesService.getThreads(userId, {
      limit,
      offset,
      unreadOnly,
    });

    const unreadCount = await OFMessagesService.getUnreadCount(userId);

    return NextResponse.json({
      threads,
      unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: threads.length === limit,
      },
    });

  } catch (error) {
    console.error('Error fetching OF messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
