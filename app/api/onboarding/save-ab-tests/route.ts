import { NextRequest, NextResponse } from 'next/server';
import { mergeOnboarding } from '@/app/api/_store/onboarding';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';

export const runtime = 'nodejs';

async function handler(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const body = await request.json();
    const { selectedTests, niche } = body || {};

    if (!Array.isArray(selectedTests) || !niche) {
      const r = NextResponse.json({ error: 'Invalid payload', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value || 'dev-user';

    mergeOnboarding(token, {
      abTests: {
        selectedTests,
        niche,
        createdAt: new Date().toISOString(),
        status: 'pending_setup',
      },
    });

    const r = NextResponse.json({ success: true, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('onboarding_save_ab_tests_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to save tests', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export const POST = handler as any;
