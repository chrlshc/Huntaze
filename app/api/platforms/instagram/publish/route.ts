export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const Body = z.object({
  caption: z.string().min(1).max(2200),
  imageUrl: z.string().url(),
  scheduleAt: z.string().datetime().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    // TODO: integrate Instagram Graph API here
    // For now, return a stub externalId and echo input
    const externalId = `ig_${Date.now()}`;
    return NextResponse.json({ ok: true, externalId, scheduledAt: body.scheduleAt ?? new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'invalid_request' }, { status: 400 });
  }
}

