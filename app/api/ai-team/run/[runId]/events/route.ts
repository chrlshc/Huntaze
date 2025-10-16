export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FileOutbox } from '@/src/lib/agents/outbox';

export async function GET(_req: NextRequest, { params }: { params: { runId: string } }) {
  try {
    const runId = params.runId;
    const outbox = new FileOutbox();
    const events = await outbox.readAll();
    // Filter by correlation.runId in payload
    const filtered = events.filter((e) => e?.payload?.correlation?.runId === runId);
    return NextResponse.json({ ok: true, count: filtered.length, events: filtered });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Failed to read events' }, { status: 500 });
  }
}

