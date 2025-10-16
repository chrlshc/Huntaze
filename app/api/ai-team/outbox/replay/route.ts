export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { FileOutbox, replayUndelivered } from '@/src/lib/agents/outbox';
import { buildExternalPublisher } from '@/src/lib/agents/event-bus';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const limit = typeof body?.limit === 'number' ? body.limit : 100;
    const external = buildExternalPublisher('ai-team');
    if (!external) return NextResponse.json({ ok: false, error: 'External publisher not configured' }, { status: 400 });
    const stats = await replayUndelivered({ outbox: new FileOutbox(), external, limit });
    return NextResponse.json({ ok: true, ...stats });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[outbox/replay] error:', error);
    return NextResponse.json({ ok: false, error: 'Replay failed' }, { status: 500 });
  }
}

export async function GET() {
  // Convenience GET (no body) with default limit
  const external = buildExternalPublisher('ai-team');
  if (!external) return NextResponse.json({ ok: false, error: 'External publisher not configured' }, { status: 400 });
  const stats = await replayUndelivered({ outbox: new FileOutbox(), external, limit: 50 });
  return NextResponse.json({ ok: true, ...stats });
}

