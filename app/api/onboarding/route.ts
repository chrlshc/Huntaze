import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { saveOnboarding } from '@/lib/db/onboarding';
import { withMonitoring } from '@/lib/observability/bootstrap';

export const runtime = 'nodejs';

async function handler(req: Request) {
  const user = await requireUser();
  const { step, data } = await req.json().catch(() => ({ step: null, data: {} }));
  if (!step) return NextResponse.json({ error: 'step required' }, { status: 400 });
  await saveOnboarding(user.id, step, data ?? {});
  return NextResponse.json({ ok: true });
}

export const POST = withMonitoring('onboarding.save', handler);
