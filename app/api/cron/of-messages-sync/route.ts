/**
 * CRON: Sync OF Messages pour tous les users actifs
 * 
 * Appelé toutes les 5 minutes par Vercel Cron ou AWS EventBridge
 * Sync les messages pour les users qui ont un compte OF lié
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addScrapeJob } from '@/lib/of-scraper/queue';

// Vercel Cron secret (optionnel mais recommandé)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Vérifier le secret si configuré
  if (CRON_SECRET) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Trouver les users avec un compte OF lié et actifs récemment
    const activeUsers = await prisma.users.findMany({
      where: {
        of_cookies: { not: null },
        of_linked_at: { not: null },
      },
      select: {
        id: true,
        of_cookies: true,
        of_user_agent: true,
        of_auth_id: true,
      },
      take: 50, // Limiter pour éviter de surcharger
    });

    if (activeUsers.length === 0) {
      return NextResponse.json({ message: 'No active OF users to sync', synced: 0 });
    }

    // Vérifier quels users ont besoin d'une sync
    const syncStatuses = await prisma.oFSyncStatus.findMany({
      where: {
        userId: { in: activeUsers.map(u => u.id) },
      },
    });

    const syncStatusMap = new Map(syncStatuses.map((s: { userId: number; syncInProgress: boolean; lastSyncAt: Date | null }) => [s.userId, s]));
    const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    const usersToSync = activeUsers.filter(user => {
      const status = syncStatusMap.get(user.id) as { syncInProgress: boolean; lastSyncAt: Date | null } | undefined;
      if (!status) return true; // Never synced
      if (status.syncInProgress) return false; // Already syncing
      const lastSync = status.lastSyncAt ? new Date(status.lastSyncAt).getTime() : 0;
      return now - lastSync > STALE_THRESHOLD_MS;
    });

    console.log(`📬 OF Messages Cron: ${usersToSync.length}/${activeUsers.length} users need sync`);

    // Queue sync jobs
    const callbackUrl = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL}/api/of/scrape-callback`;
    let queued = 0;

    for (const user of usersToSync) {
      if (!user.of_cookies) continue;

      try {
        // Get the sync status for this user
        const userSyncStatus = syncStatusMap.get(user.id) as { syncInProgress: boolean; lastSyncAt: Date | null } | undefined;

        // Mark as syncing
        await prisma.oFSyncStatus.upsert({
          where: { userId: user.id },
          create: { userId: user.id, syncInProgress: true },
          update: { syncInProgress: true, errorMessage: null },
        });

        // INCREMENTAL: Only fetch 20 recent threads (not 50)
        // The callback will skip threads that haven't changed
        await addScrapeJob({
          jobId: `messages-sync-${user.id}-${Date.now()}`,
          userId: user.id,
          cookies: user.of_cookies,
          userAgent: user.of_user_agent || undefined,
          endpoint: '/api2/v2/chats?limit=20&order=desc',
          callbackUrl,
          metadata: {
            type: 'messages-sync',
            creatorOfId: user.of_auth_id,
            syncType: 'incremental',
            lastSyncAt: userSyncStatus?.lastSyncAt ? new Date(userSyncStatus.lastSyncAt).toISOString() : undefined,
          },
        });

        queued++;
      } catch (err) {
        console.error(`Failed to queue sync for user ${user.id}:`, err);
      }
    }

    return NextResponse.json({
      message: 'OF messages sync triggered',
      totalUsers: activeUsers.length,
      usersNeedingSync: usersToSync.length,
      jobsQueued: queued,
    });

  } catch (error) {
    console.error('OF Messages Cron error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}

// Config pour Vercel Cron
export const runtime = 'nodejs';
export const maxDuration = 60;
