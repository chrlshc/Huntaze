export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // In a real implementation, we would persist and dispatch to platform schedulers.
    // Here we accept the plan and acknowledge.
    const plan = body?.plan ?? null;

    return NextResponse.json({ ok: true, applied: Boolean(plan), planSize: Array.isArray(plan?.items) ? plan.items.length : undefined });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[ai-team/schedule/apply] error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to apply schedule' }, { status: 500 });
  }
}

