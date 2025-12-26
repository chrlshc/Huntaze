/**
 * API Route: Async OF Scraping
 * 
 * POST /api/of/scrape-async
 * - Enqueue un job de scraping
 * - Retourne immédiatement avec jobId
 * - Le worker traite en arrière-plan
 * 
 * GET /api/of/scrape-async?jobId=xxx
 * - Récupère le statut d'un job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { safeDecrypt } from '@/lib/security/crypto';
import { enqueueScrapeJob, getJobStatus, OF_SCRAPE_ENDPOINTS } from '@/lib/of-scraper/queue';
import type { ScrapeJobType } from '@/lib/of-scraper/types';
import { z } from 'zod';

const ScrapeRequestSchema = z.object({
  type: z.enum([
    'sync-profile',
    'sync-subscribers',
    'sync-earnings',
    'sync-messages',
    'sync-statistics',
    'sync-full',
  ]),
  callbackUrl: z.string().url().optional(),
});

// GET: Check job status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = req.nextUrl.searchParams.get('jobId');
    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    }

    const status = await getJobStatus(jobId);
    return NextResponse.json(status);

  } catch (error) {
    console.error('Error checking job status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Enqueue scrape job
export async function POST(req: NextRequest) {
  try {
    // 🛡️ Auth obligatoire
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    // Validation input
    const body = await req.json();
    const validation = ScrapeRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { type, callbackUrl } = validation.data;

    // Récupérer les cookies OF de l'utilisateur
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { of_cookies: true, of_user_agent: true },
    });

    if (!user?.of_cookies) {
      return NextResponse.json(
        { error: 'OnlyFans account not linked' },
        { status: 400 }
      );
    }

    // 🛡️ Déchiffrer les cookies
    const decryptedCookies = safeDecrypt(user.of_cookies);

    // Déterminer l'endpoint selon le type
    const endpoint = getEndpointForType(type);

    // Enqueue le job
    const result = await enqueueScrapeJob(type, {
      userId,
      endpoint,
      cookies: decryptedCookies,
      userAgent: user.of_user_agent || undefined,
      proxyUrl: process.env.ONLYFANS_PROXY_URL,
      callbackUrl,
    });

    console.log(`✅ Scrape job queued: ${result.jobId} for user ${userId}`);

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      status: 'queued',
      message: 'Job enqueued. Poll GET /api/of/scrape-async?jobId=xxx for status.',
    });

  } catch (error) {
    console.error('Error enqueueing scrape job:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

function getEndpointForType(type: ScrapeJobType): string {
  switch (type) {
    case 'sync-profile':
      return OF_SCRAPE_ENDPOINTS.PROFILE;
    case 'sync-subscribers':
      return OF_SCRAPE_ENDPOINTS.SUBSCRIBERS;
    case 'sync-earnings':
      return OF_SCRAPE_ENDPOINTS.EARNINGS;
    case 'sync-messages':
      return OF_SCRAPE_ENDPOINTS.MESSAGES;
    case 'sync-statistics':
      return OF_SCRAPE_ENDPOINTS.STATISTICS;
    case 'sync-full':
      return OF_SCRAPE_ENDPOINTS.PROFILE; // Full sync starts with profile
    default:
      return OF_SCRAPE_ENDPOINTS.PROFILE;
  }
}
