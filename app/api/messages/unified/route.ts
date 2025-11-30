import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import type { MessageThread, UnifiedMessagesResponse } from '@/lib/types/messages';

/**
 * GET /api/messages/unified
 * 
 * Aggregate messages from all platforms (OnlyFans, Instagram, TikTok, Reddit, Fansly)
 * 
 * Query Parameters:
 * - creatorId (required): string - Creator ID
 * - platform (optional): 'onlyfans' | 'instagram' | 'tiktok' | 'reddit' | 'fansly'
 * - filter (optional): 'unread' | 'starred' | 'all'
 * - limit (optional): number - Max threads to return (default: 50, max: 100)
 * - offset (optional): number - Pagination offset (default: 0)
 * 
 * Response: UnifiedMessagesResponse
 * {
 *   threads: MessageThread[],
 *   stats: {
 *     totalUnread: number,
 *     byPlatform: { [platform]: number }
 *   }
 * }
 * 
 * Errors:
 * - 400: Invalid parameters
 * - 401: Unauthorized (no session)
 * - 403: Forbidden (not your data)
 * - 429: Rate limit exceeded
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = request.headers.get('X-Correlation-ID') || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  try {
    // 1. Authentication check
    const session = await getServerSession();
    
    if (!session?.user?.id) {
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

    // 2. Parse and validate parameters
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const platform = searchParams.get('platform');
    const filter = searchParams.get('filter');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0); // Min 0

    // Validation
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

    if (platform && !['onlyfans', 'instagram', 'tiktok', 'reddit', 'fansly'].includes(platform)) {
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

    // 3. Authorization check
    if (session.user.id !== creatorId) {
      console.warn('[API] Unified messages - Forbidden access attempt:', {
        userId: session.user.id,
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

    // 4. Log request
    console.log('[API] Unified messages request:', {
      creatorId,
      platform: platform || 'all',
      filter: filter || 'all',
      limit,
      offset,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual backend service calls
    // Fetch from OnlyFans, Instagram, TikTok, Reddit in parallel
    // const [ofMessages, igMessages, ttMessages, rdMessages] = await Promise.all([
    //   backendOnlyFansService.getMessages(creatorId),
    //   backendInstagramService.getMessages(creatorId),
    //   backendTikTokService.getMessages(creatorId),
    //   backendRedditService.getMessages(creatorId),
    // ]);

    // Mock data
    const mockThreads: MessageThread[] = [
      {
        id: 'thread_1',
        platform: 'onlyfans',
        sender: {
          id: 'user_1',
          name: 'Sarah M.',
          username: '@sarah_m',
          avatar: 'https://i.pravatar.cc/150?img=1',
          platform: 'onlyfans',
          tier: 'VIP',
        },
        lastMessage: {
          id: 'msg_1',
          threadId: 'thread_1',
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
        unreadCount: 2,
        messageCount: 15,
        status: 'unread',
        priority: 'high',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: 'thread_2',
        platform: 'instagram',
        sender: {
          id: 'user_2',
          name: 'Mike R.',
          username: '@mike_r',
          avatar: 'https://i.pravatar.cc/150?img=2',
          platform: 'instagram',
        },
        lastMessage: {
          id: 'msg_2',
          threadId: 'thread_2',
          platform: 'instagram',
          sender: {
            id: 'user_2',
            name: 'Mike R.',
            username: '@mike_r',
            platform: 'instagram',
          },
          content: 'When is your next post?',
          status: 'read',
          priority: 'normal',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        unreadCount: 0,
        messageCount: 8,
        status: 'read',
        priority: 'normal',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: 'thread_3',
        platform: 'tiktok',
        sender: {
          id: 'user_3',
          name: 'Emma L.',
          username: '@emma_l',
          avatar: 'https://i.pravatar.cc/150?img=3',
          platform: 'tiktok',
        },
        lastMessage: {
          id: 'msg_3',
          threadId: 'thread_3',
          platform: 'tiktok',
          sender: {
            id: 'user_3',
            name: 'Emma L.',
            username: '@emma_l',
            platform: 'tiktok',
          },
          content: 'Your videos are amazing! 🔥',
          status: 'starred',
          priority: 'normal',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        unreadCount: 1,
        messageCount: 5,
        status: 'starred',
        priority: 'normal',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ];

    // Filter by platform if specified
    let filteredThreads = platform
      ? mockThreads.filter(t => t.platform === platform)
      : mockThreads;

    // Filter by status if specified
    if (filter === 'unread') {
      filteredThreads = filteredThreads.filter(t => t.unreadCount > 0);
    } else if (filter === 'starred') {
      filteredThreads = filteredThreads.filter(t => t.status === 'starred');
    }

    // Sort by most recent
    filteredThreads.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // Pagination
    const paginatedThreads = filteredThreads.slice(offset, offset + limit);

    // Calculate stats
    const stats = {
      totalUnread: mockThreads.reduce((sum, t) => sum + t.unreadCount, 0),
      byPlatform: {
        onlyfans: mockThreads.filter(t => t.platform === 'onlyfans').reduce((sum, t) => sum + t.unreadCount, 0),
        instagram: mockThreads.filter(t => t.platform === 'instagram').reduce((sum, t) => sum + t.unreadCount, 0),
        tiktok: mockThreads.filter(t => t.platform === 'tiktok').reduce((sum, t) => sum + t.unreadCount, 0),
        reddit: mockThreads.filter(t => t.platform === 'reddit').reduce((sum, t) => sum + t.unreadCount, 0),
        fansly: mockThreads.filter(t => t.platform === 'fansly').reduce((sum, t) => sum + t.unreadCount, 0),
      },
    };

    const response: UnifiedMessagesResponse = {
      threads: paginatedThreads,
      stats,
      metadata: {
        total: filteredThreads.length,
        limit,
        offset,
        hasMore: offset + limit < filteredThreads.length,
      },
    };

    // 5. Log successful response
    const duration = Date.now() - startTime;
    console.log('[API] Unified messages response:', {
      creatorId,
      threadsReturned: paginatedThreads.length,
      totalUnread: stats.totalUnread,
      duration: `${duration}ms`,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return Response.json(response, {
      headers: {
        'X-Correlation-ID': correlationId,
        'X-Response-Time': `${duration}ms`,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // 6. Enhanced error logging
    console.error('[API] Unified messages error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      correlationId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    // 7. User-friendly error response
    return Response.json(
      { 
        error: 'Failed to fetch messages. Please try again.',
        message: error instanceof Error ? error.message : 'Internal server error',
        correlationId,
      },
      { 
        status: 500,
        headers: {
          'X-Correlation-ID': correlationId,
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  }
}
