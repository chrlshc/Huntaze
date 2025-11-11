import { NextRequest, NextResponse } from 'next/server';
import { ConversationsRepository, MessagesRepository } from '@/lib/db/repositories';
import { getUserFromRequest } from '@/lib/auth/request';
import { checkRateLimit, idFromRequestHeaders } from '@/src/lib/rate-limit';
import { z } from 'zod';

// Validation schema for creating messages
const CreateMessageSchema = z.object({
  text: z.string().min(1).max(5000),
  priceCents: z.number().int().min(0).optional(),
  attachments: z.array(z.object({
    type: z.enum(['image', 'video', 'audio', 'file']),
    url: z.string().url(),
    filename: z.string().optional(),
    size: z.number().optional(),
  })).optional(),
});

async function getHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(user.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const resolvedParams = await context.params; const conversationId = parseInt(resolvedParams.id, 10);
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }

    // Verify conversation ownership
    const conversation = await ConversationsRepository.getConversation(userId, conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get messages
    const allMessages = await MessagesRepository.listMessages(userId, conversationId);
    
    // Apply pagination
    const messages = allMessages.slice(offset, offset + limit);

    return NextResponse.json({
      messages,
      total: allMessages.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Failed to list messages:', error);
    return NextResponse.json(
      { error: 'Failed to list messages' },
      { status: 500 }
    );
  }
}

async function postHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit write operations
    const ident = idFromRequestHeaders(request.headers);
    const rl = await checkRateLimit({ id: ident.id, limit: 60, windowSec: 60 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(user.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const resolvedParams = await context.params; const conversationId = parseInt(resolvedParams.id, 10);
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }

    // Verify conversation ownership
    const conversation = await ConversationsRepository.getConversation(userId, conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = CreateMessageSchema.parse(body);

    // Create message in database
    const message = await MessagesRepository.createMessage(
      userId,
      conversationId,
      Number(conversation.fanId),
      'out', // Outgoing message from creator
      validated.text,
      validated.priceCents || undefined,
      validated.attachments || undefined
    );

    // TODO: Queue message for sending via OnlyFansRateLimiterService
    // This will be implemented in Phase 5 (Bulk Messaging Backend)
    // For now, we just store the message in the database

    return NextResponse.json({ message }, { status: 202 }); // 202 Accepted (queued)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to create message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}

export const GET = getHandler as any;
export const POST = postHandler as any;
