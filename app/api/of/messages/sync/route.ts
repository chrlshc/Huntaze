/**
 * POST /api/of/messages/sync
 * 
 * Déclenche une synchronisation des messages via le scraper
 * Le scraper appellera /api/of/scrape-callback avec les résultats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addScrapeJob } from '@/lib/of-scraper/queue';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id, 10) 
      : session.user.id;

    // Check if sync is already in progress
    const syncStatus = await prisma.oFSyncStatus.findUnique({
      where: { userId },
    });

    if (syncStatus?.syncInProgress) {
      return NextResponse.json(
        { error: 'Sync already in progress', syncStatus },
        { status: 409 }
      );
    }

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

    // Parse request body for options
    const body = await req.json().catch(() => ({}));
    const { threadId, limit = 50, forceFullSync = false } = body;

    // INCREMENTAL SYNC: Determine if we need full or incremental
    const isIncremental = !forceFullSync && syncStatus?.lastSyncAt;
    const syncType = isIncremental ? 'incremental' : 'full';

    // Mark sync as in progress
    await prisma.oFSyncStatus.upsert({
      where: { userId },
      create: {
        userId,
        syncInProgress: true,
        lastSyncType: syncType,
      },
      update: {
        syncInProgress: true,
        lastSyncType: syncType,
        errorMessage: null,
      },
    });

    // Queue the sync job
    const jobId = `messages-sync-${userId}-${Date.now()}`;
    const callbackUrl = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/api/of/scrape-callback`;

    // INCREMENTAL: Only fetch 20 recent threads instead of 50
    const syncLimit = isIncremental ? 20 : limit;

    await addScrapeJob({
      jobId,
      userId,
      cookies: user.of_cookies,
      userAgent: user.of_user_agent || undefined,
      endpoint: threadId 
        ? `/api2/v2/chats/${threadId}/messages?limit=${limit}`
        : `/api2/v2/chats?limit=${syncLimit}&order=desc`,
      callbackUrl,
      metadata: {
        type: 'messages-sync',
        threadId,
        creatorOfId: user.of_auth_id,
        syncType,
        lastSyncAt: syncStatus?.lastSyncAt?.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      jobId,
      syncType,
      message: `${syncType} sync job queued`,
    });

  } catch (error) {
    console.error('Error starting OF messages sync:', error);
    return NextResponse.json(
      { error: 'Failed to start sync' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/of/messages/sync
 * 
 * Récupère le statut de synchronisation
 */
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id, 10) 
      : session.user.id;

    const syncStatus = await prisma.oFSyncStatus.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      syncStatus: syncStatus || {
        lastSyncAt: null,
        syncInProgress: false,
        threadCount: 0,
        messageCount: 0,
      },
    });

  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}
