/**
 * Webhook Callback pour les jobs de scraping terminés
 * 
 * POST /api/of/scrape-callback
 * - Reçoit les résultats du worker
 * - Met à jour la DB avec les données scrapées
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { OFMessagesService } from '@/lib/of-messages/messages.service';
import type { OFApiThread, OFApiMessage } from '@/lib/of-messages/types';

// Secret pour valider les callbacks (à configurer dans le worker)
const CALLBACK_SECRET = process.env.SCRAPER_CALLBACK_SECRET || 'dev-secret';

const CallbackSchema = z.object({
  jobId: z.string(),
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  duration: z.number().optional(),
  timestamp: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Vérifier le secret
    const authHeader = req.headers.get('x-callback-secret');
    if (authHeader !== CALLBACK_SECRET) {
      console.warn('🚨 Invalid callback secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = CallbackSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { jobId, success, data, duration, metadata } = validation.data;

    // Extraire userId du jobId (format: type-userId-timestamp)
    const parts = jobId.split('-');
    const userId = parts.length >= 2 ? parseInt(parts[1], 10) : null;

    console.log(`📥 Callback received: ${jobId} (success: ${success})`);

    if (success && data && userId) {
      // Traiter les données selon le type de job
      await processScrapedData(jobId, userId, data, metadata);
    }

    // Log le résultat
    console.log(`✅ Callback processed: ${jobId} in ${duration}ms`);

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error('Error processing callback:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function processScrapedData(jobId: string, userId: number, data: unknown, metadata?: Record<string, unknown>) {
  const jobType = jobId.split('-')[0];

  try {
    switch (jobType) {
      case 'messages':
        // Messages sync - handle threads or messages
        await processMessagesSync(userId, data, metadata);
        break;

      case 'send':
        // Send message - save the sent message to DB
        await processSentMessage(userId, data, metadata);
        break;

      case 'sync':
        // Profile sync - update user info
        if (isProfileData(data)) {
          await prisma.users.update({
            where: { id: userId },
            data: {
              of_linked_at: new Date(),
            },
          });
          console.log(`   Updated sync timestamp for user ${userId} (username: ${data.username})`);
        }
        break;

      default:
        console.log(`   No handler for job type: ${jobType}`);
    }
  } catch (error) {
    console.error(`Error processing ${jobType} data:`, error);
    throw error;
  }
}

/**
 * Process a sent message callback - update the optimistic message with real OF data
 */
async function processSentMessage(userId: number, data: unknown, metadata?: Record<string, unknown>) {
  const threadId = metadata?.threadId as string | undefined;
  const creatorOfId = metadata?.creatorOfId as string | undefined;
  const messagePayload = metadata?.messagePayload as { text?: string; price?: number } | undefined;

  if (!threadId) {
    console.warn('   No threadId in send-message callback');
    return;
  }

  // OF API returns the sent message with its real ID
  if (isSentMessageResponse(data)) {
    const realMessageId = String(data.id);
    const content = data.text || messagePayload?.text || '';

    // Find and update the optimistic message (pending-*) or create new one
    const pendingMessages = await prisma.oFMessage.findMany({
      where: {
        userId,
        threadId,
        id: { startsWith: 'pending-' },
      },
      orderBy: { sentAt: 'desc' },
      take: 1,
    });

    if (pendingMessages.length > 0) {
      // Update the optimistic message with real ID
      await prisma.oFMessage.update({
        where: { id_userId: { id: pendingMessages[0].id, userId } },
        data: {
          id: realMessageId,
          content: content,
          sentAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        },
      });
      console.log(`   Updated pending message to real ID: ${realMessageId}`);
    } else {
      // Create the message if no pending found
      await prisma.oFMessage.upsert({
        where: { id_userId: { id: realMessageId, userId } },
        create: {
          id: realMessageId,
          threadId,
          userId,
          senderId: creatorOfId || 'creator',
          senderType: 'creator',
          content: content,
          mediaIds: data.media?.map((m: { id: number | string }) => String(m.id)) || [],
          price: data.price || null,
          isPaid: false,
          isRead: true,
          sentAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        },
        update: {
          content: content,
          sentAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        },
      });
      console.log(`   Created sent message: ${realMessageId}`);
    }

    // Update thread's last message
    await prisma.oFThread.update({
      where: { id_userId: { id: threadId, userId } },
      data: {
        lastMessageAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        lastMessagePreview: content.substring(0, 100),
      },
    });

    console.log(`   ✅ Message sent successfully to thread ${threadId}`);
  } else {
    console.warn('   Invalid send-message response format:', data);
  }
}

async function processMessagesSync(userId: number, data: unknown, metadata?: Record<string, unknown>) {
  const threadId = metadata?.threadId as string | undefined;
  const creatorOfId = metadata?.creatorOfId as string | undefined;
  const syncType = metadata?.syncType as string || 'full';
  const lastSyncAt = metadata?.lastSyncAt ? new Date(metadata.lastSyncAt as string) : null;

  try {
    if (threadId && creatorOfId) {
      // Sync messages for a specific thread
      if (isMessagesArray(data)) {
        const count = await OFMessagesService.upsertMessagesFromApi(
          userId,
          threadId,
          creatorOfId,
          data
        );
        console.log(`   Synced ${count} messages for thread ${threadId}`);

        // Update sync status
        await prisma.oFSyncStatus.upsert({
          where: { userId },
          create: {
            userId,
            lastSyncAt: new Date(),
            lastSyncType: 'incremental',
            syncInProgress: false,
            messageCount: count,
          },
          update: {
            lastSyncAt: new Date(),
            lastSyncType: 'incremental',
            syncInProgress: false,
            messageCount: { increment: count },
          },
        });
      }
    } else {
      // Sync threads list
      if (isThreadsArray(data)) {
        // INCREMENTAL: Filter threads that have new messages since lastSyncAt
        let threadsToSync = data;
        let skippedCount = 0;

        if (syncType === 'incremental' && lastSyncAt) {
          threadsToSync = data.filter(thread => {
            const threadLastMessage = thread.lastMessage?.createdAt 
              ? new Date(thread.lastMessage.createdAt) 
              : null;
            // Keep thread if it has new messages OR unread messages
            const hasNewMessages = threadLastMessage && threadLastMessage > lastSyncAt;
            const hasUnread = (thread.unreadMessagesCount || 0) > 0;
            return hasNewMessages || hasUnread;
          });
          skippedCount = data.length - threadsToSync.length;
          console.log(`   Incremental sync: ${threadsToSync.length} threads with changes, ${skippedCount} skipped`);
        }

        const count = await OFMessagesService.upsertThreadsFromApi(userId, threadsToSync);
        console.log(`   Synced ${count} threads for user ${userId}`);

        // Update sync status
        await prisma.oFSyncStatus.upsert({
          where: { userId },
          create: {
            userId,
            lastSyncAt: new Date(),
            lastSyncType: syncType,
            syncInProgress: false,
            threadCount: count,
          },
          update: {
            lastSyncAt: new Date(),
            lastSyncType: syncType,
            syncInProgress: false,
            threadCount: count,
          },
        });
      }
    }
  } catch (error) {
    // Mark sync as failed
    await prisma.oFSyncStatus.upsert({
      where: { userId },
      create: {
        userId,
        syncInProgress: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
      update: {
        syncInProgress: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}

// Type guards
function isProfileData(data: unknown): data is { username: string; name: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'username' in data &&
    'name' in data
  );
}

function isSentMessageResponse(data: unknown): data is { 
  id: number | string; 
  text?: string; 
  createdAt?: string;
  price?: number;
  media?: Array<{ id: number | string }>;
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data
  );
}

function isThreadsArray(data: unknown): data is OFApiThread[] {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return true;
  const first = data[0];
  return (
    typeof first === 'object' &&
    first !== null &&
    'id' in first &&
    'withUser' in first
  );
}

function isMessagesArray(data: unknown): data is OFApiMessage[] {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return true;
  const first = data[0];
  return (
    typeof first === 'object' &&
    first !== null &&
    'id' in first &&
    'fromUser' in first
  );
}
