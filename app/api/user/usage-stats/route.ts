import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { getUsage, getPlanLimits } from '@/lib/db/usage';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await requireUser();
    const usage = await getUsage(user.id);
    // If you store plan per user, read it; for now, expose defaults
    const limitsStarter = getPlanLimits('starter');
    const limitsPro = getPlanLimits('pro');
    const limitsScale = getPlanLimits('scale');
    return NextResponse.json(
      { userId: user.id, usage, limits: { starter: limitsStarter, pro: limitsPro, scale: limitsScale } },
      { headers: { 'Cache-Control': 'private, max-age=10' } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'usage_failed' }, { status: e?.status || 500 });
  }
}
