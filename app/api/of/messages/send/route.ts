/**
 * POST /api/of/messages/send
 * 
 * Envoie un message via le scraper (async)
 * Le message sera envoyé via l'API OF en utilisant le contexte du navigateur
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addScrapeJob } from '@/lib/of-scraper/queue';
import { z } from 'zod';

const SendMessageSchema = z.object({
  threadId: z.string(),
  content: z.string().min(1).max(10000),
  mediaIds: z.array(z.string()).optional(),
  price: z.number().positive().optional(), // For PPV messages
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id, 10) 
      : session.user.id;

    const body = await req.json();
    const validation = SendMessageSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { threadId, content, mediaIds, price } = validation.data;

    // Get user's OF credentials
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { of_cookies: true, of_user_agent: true, of_auth_id: true },
    });

    if (!user?.of_cookies) {
      return NextResponse.json(
        { error: 'OnlyFans account not linked' },
        { status: 400 }
      );
    }

    // Queue the send message job
    const jobId = `send-message-${userId}-${Date.now()}`;
    const callbackUrl = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/api/of/scrape-callback`;

    // Build the message payload for OF API
    const messagePayload = {
      text: content,
      ...(mediaIds?.length ? { mediaFiles: mediaIds } : {}),
      ...(price ? { price } : {}),
    };

    await addScrapeJob({
      jobId,
      userId,
      cookies: user.of_cookies,
      userAgent: user.of_user_agent || undefined,
      // Special endpoint that the worker will handle differently
      endpoint: `/api2/v2/chats/${threadId}/messages`,
      callbackUrl,
      metadata: {
        type: 'send-message',
        threadId,
        messagePayload,
        creatorOfId: user.of_auth_id,
      },
    });

    // Create optimistic message in DB (will be updated by callback)
    const optimisticId = `pending-${Date.now()}`;
    await prisma.oFMessage.create({
      data: {
        id: optimisticId,
        threadId,
        userId,
        senderId: user.of_auth_id || 'creator',
        senderType: 'creator',
        content,
        mediaIds: mediaIds || [],
        price: price || null,
        isPaid: false,
        isRead: true,
        sentAt: new Date(),
      },
    });

    // Update thread's last message
    await prisma.oFThread.update({
      where: { id_userId: { id: threadId, userId } },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: content.substring(0, 100),
      },
    });

    return NextResponse.json({
      success: true,
      jobId,
      optimisticId,
      message: 'Message queued for sending',
    });

  } catch (error) {
    console.error('Error sending OF message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
