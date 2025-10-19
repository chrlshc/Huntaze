import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { markCompleted } from '@/app/api/_store/onboarding';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { withMonitoring } from '@/lib/observability/bootstrap';
import { upstream } from '@/app/api/_lib/upstream';

export const runtime = 'nodejs';

async function handler(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  const authToken = cookies().get('access_token')?.value;
  
  if (!authToken) {
    const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }

  try {
    // Attempt to update onboarding status in backend if configured
    try {
      const resp = await upstream('/users/onboarding', {
        method: 'PUT',
        body: JSON.stringify({
          profileSetup: true,
          businessSetup: true,
          platformsSetup: true,
          aiSetup: true,
          planSetup: true,
          completed: true,
        }),
      });
      if (!resp.ok) {
        log.warn('onboarding_backend_update_failed');
      }
    } catch (e) {
      log.warn('onboarding_backend_unreachable');
    }

    // Update local in-memory status for demo/dev
    try { markCompleted(authToken); } catch {}

    // Return a response that also sets the bypass cookie used by middleware
    const response = NextResponse.json({ success: true, requestId });
    response.cookies.set('onboarding_completed', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    response.headers.set('X-Request-Id', requestId);
    return response;
  } catch (error: any) {
    log.error('onboarding_complete_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to complete onboarding', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export const POST = withMonitoring('onboarding.complete', handler as any, {
  domain: 'onboarding',
  feature: 'complete',
  getUserId: (req) => req.headers.get('x-user-id') || undefined,
});
