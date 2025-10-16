export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth';
import { getBus } from '@/src/lib/agents/runtime';
import { makeCorrelation } from '@/src/lib/agents/events';
import { EVENT_PPV_CAMPAIGN_REQUEST } from '@/src/lib/agents/content-pipeline';

const Body = z.object({
  modelId: z.string(),
  runId: z.string().uuid().optional(),
  content: z.object({ media: z.string().url(), caption: z.string().min(1).max(1000) }),
  targets: z.array(z.object({ conversationId: z.string(), fanValue: z.number().nonnegative(), segment: z.enum(['whale','vip','regular','cold']) })).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = Body.parse(await req.json());
    const correlation = body.runId ? { modelId: body.modelId, runId: body.runId, traceId: body.runId } : makeCorrelation(body.modelId);
    const bus = getBus();

    await bus.publish(EVENT_PPV_CAMPAIGN_REQUEST, {
      correlation,
      userId,
      targets: body.targets,
      content: body.content,
    });

    return NextResponse.json({ ok: true, correlation, stream: `/api/ai-team/stream/${body.modelId}` });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

