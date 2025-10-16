export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBus } from '@/src/lib/agents/runtime';
import { makeCorrelation } from '@/src/lib/agents/events';
import { getServerSession } from '@/lib/auth';

const Body = z.object({
  modelId: z.string(),
  platforms: z.array(z.enum(['instagram', 'onlyfans', 'tiktok', 'reddit'])).min(1),
  period: z.enum(['next_week', 'next_month']).default('next_week'),
  preferences: z.record(z.any()).optional(),
  timezone: z.string().optional(),
  ofTargets: z.array(z.object({ conversationId: z.string() })).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const body = Body.parse(await req.json());
    const correlation = makeCorrelation(body.modelId);
    // Publish PLAN_REQUEST on the global bus; agents attached in runtime will process it asynchronously
    const bus = getBus();
    await bus.publish('PLAN_REQUEST', {
      correlation,
      period: body.period,
      platforms: body.platforms,
      preferences: body.preferences,
      timezone: body.timezone,
      userId,
      ofTargets: body.ofTargets,
    });

    return NextResponse.json({ ok: true, correlation, stream: `/api/ai-team/stream/${body.modelId}` });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'invalid_request' }, { status: 400 });
  }
}
