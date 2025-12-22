import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createApifyClient } from '@/lib/ai/content-trends/apify/apify-client';
import { getPrimaryActor, buildActorInput } from '@/lib/ai/content-trends/apify/actor-configs';
import { SocialPlatform } from '@/lib/ai/content-trends/apify/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, searchTerms, hashtags, maxResults = 50 } = body;

    if (!platform || !['tiktok', 'instagram', 'youtube', 'twitter'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const apifyClient = createApifyClient();
    const actorConfig = getPrimaryActor(platform as SocialPlatform);
    
    if (!actorConfig) {
      return NextResponse.json({ error: 'No actor configured for platform' }, { status: 400 });
    }

    const input = buildActorInput(actorConfig, {
      searchTerms,
      hashtags,
      maxResults,
    });

    const run = await apifyClient.runActor(actorConfig.actorId, {
      ...input,
      maxResults,
    });

    return NextResponse.json({
      success: true,
      data: {
        runId: run.id,
        actorId: run.actorId,
        status: run.status,
        platform,
      },
    });
  } catch (error) {
    console.error('[API] Scrape error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json({ error: 'runId required' }, { status: 400 });
    }

    const apifyClient = createApifyClient();
    const run = await apifyClient.getRunStatus(runId);

    return NextResponse.json({
      success: true,
      data: {
        runId: run.id,
        status: run.status,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        datasetId: run.defaultDatasetId,
      },
    });
  } catch (error) {
    console.error('[API] Get run status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
