import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/chatbot/auto-reply - Get auto-reply settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const autoReplies = await prisma.autoReply.findMany({
      where: { userId },
      orderBy: { priority: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: autoReplies,
    });
  } catch (error) {
    console.error('[Chatbot Auto-Reply API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch auto-reply settings',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/chatbot/auto-reply - Create auto-reply rule
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
    const { name, triggers, response, isActive, priority, conditions } = body;

    if (!name || !triggers || !response) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name, triggers, and response are required',
          },
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const autoReply = await prisma.autoReply.create({
      data: {
        userId,
        name,
        triggers: JSON.stringify(triggers),
        response,
        isActive: isActive ?? true,
        priority: priority ?? 0,
        conditions: conditions ? JSON.stringify(conditions) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: autoReply,
    });
  } catch (error) {
    console.error('[Chatbot Auto-Reply API] POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create auto-reply rule',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/chatbot/auto-reply - Process incoming message for auto-reply
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messageId, content, subscriberId } = body;

    if (!messageId || !content || !subscriberId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Message ID, content, and subscriber ID are required',
          },
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Get active auto-reply rules
    const autoReplies = await prisma.autoReply.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { priority: 'asc' },
    });

    // Find matching auto-reply
    let matchedReply = null;
    for (const autoReply of autoReplies) {
      const triggers = JSON.parse(autoReply.triggers as string);
      const conditions = autoReply.conditions ? JSON.parse(autoReply.conditions as string) : null;

      if (matchesTriggers(content, triggers) && matchesConditions(subscriberId, conditions)) {
        matchedReply = autoReply;
        break;
      }
    }

    if (!matchedReply) {
      return NextResponse.json({
        success: true,
        data: { matched: false },
      });
    }

    // Get conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        userId,
        subscriberId,
        status: 'active',
      },
    });

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found',
          },
        },
        { status: 404 }
      );
    }

    // Send auto-reply
    const replyMessage = await prisma.message.create({
      data: {
        userId,
        conversationId: conversation.id,
        content: matchedReply.response,
        type: 'text',
        direction: 'outgoing',
        status: 'sent',
        isAutoReply: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        matched: true,
        reply: replyMessage,
        rule: matchedReply.name,
      },
    });
  } catch (error) {
    console.error('[Chatbot Auto-Reply Process API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process auto-reply',
        },
      },
      { status: 500 }
    );
  }
}

// Helper functions
function matchesTriggers(content: string, triggers: string[]): boolean {
  const lowerContent = content.toLowerCase();
  return triggers.some((trigger) => lowerContent.includes(trigger.toLowerCase()));
}

function matchesConditions(subscriberId: string, conditions: any): boolean {
  if (!conditions) return true;
  
  // Add condition matching logic here
  // For example: subscriber tier, time of day, etc.
  return true;
}
