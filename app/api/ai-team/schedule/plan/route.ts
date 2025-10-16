export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { runContentPipeline } from '@/src/lib/agents/content-pipeline';

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) ?? {};
    const { modelId, platforms, window, timezone, perPlatform, constraints } = payload as Record<string, unknown>;

    // Kick off a simple content pipeline flow; adapt fields as needed
    const result = await runContentPipeline({
      period: typeof window === 'object' && window ? 'custom' : 'next_week',
      modelId: typeof modelId === 'string' ? modelId : undefined,
      platforms: Array.isArray(platforms) ? (platforms as string[]) : undefined,
      timezone: typeof timezone === 'string' ? timezone : undefined,
    });

    return NextResponse.json({
      ok: true,
      modelId: result?.plan?.length ? modelId ?? 'default-model' : modelId ?? 'default-model',
      plan: result.plan,
      contents: result.contents,
      metrics: result.metrics,
      trends: result.trends,
      // echo back for transparency
      constraints: constraints ?? null,
      perPlatform: perPlatform ?? null,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[ai-team/schedule/plan] error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to plan schedule' }, { status: 500 });
  }
}

