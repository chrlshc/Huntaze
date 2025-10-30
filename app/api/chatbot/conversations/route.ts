import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/chatbot/conversations - List chatbot conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');

    const userId = session.user.id;

    // Build where clause
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          subscriber: {
            select: {
              id: true,
              username: true,
              tier: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: conversations,
      metadata: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('[Chatbot Conversations API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch conversations',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/chatbot/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriberId, initialMessage } = body;

    if (!subscriberId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Subscriber ID is required',
          },
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId,
        subscriberId,
        status: 'active',
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          subscriberId,
          status: 'active',
        },
      });
    }

    // Add initial message if provided
    if (initialMessage) {
      await prisma.message.create({
        data: {
          userId,
          conversationId: conversation.id,
          content: initialMessage,
          type: 'text',
          direction: 'outgoing',
          status: 'sent',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('[Chatbot Conversations API] POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create conversation',
        },
      },
      { status: 500 }
    );
  }
}
