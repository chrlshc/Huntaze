import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createApifyClient } from '@/lib/ai/content-trends/apify/apify-client';
import type { SocialPlatform } from '@/lib/ai/content-trends/apify/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') as SocialPlatform | null;

    const apifyClient = createApifyClient();
    const jobs: Array<{
      platform: string;
      status: string;
      health: string;
      lastRun?: Date;
      successRate: number;
    }> = [];

    const platforms: SocialPlatform[] = platform 
      ? [platform] 
      : ['tiktok', 'instagram', 'youtube', 'twitter'];

    for (const p of platforms) {
      try {
        const health = await apifyClient.getHealthReport(p);
        jobs.push({
          platform: p,
          status: health.activeJobs > 0 ? 'running' : 'idle',
          health: health.status,
          lastRun: health.lastSuccessfulRun,
          successRate: health.successRate,
        });
      } catch {
        jobs.push({
          platform: p,
          status: 'unknown',
          health: 'unknown',
          successRate: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { jobs },
    });
  } catch (error) {
    console.error('[API] Jobs status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
