import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { withMonitoring } from '@/lib/observability/bootstrap';

export const runtime = 'nodejs';

async function handler(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const { platform, action } = await request.json();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com';

    if (action === 'connect') {
      const platformRoutes: Record<string, string> = {
        instagram: `${baseUrl}/api/auth/instagram`,
        tiktok: `${baseUrl}/api/auth/tiktok`,
        reddit: `${baseUrl}/api/auth/reddit`,
        onlyfans: `${baseUrl}/auth/onlyfans`
      };

      if (platformRoutes[platform]) {
        const r = NextResponse.json({ authUrl: platformRoutes[platform], message: `Connecting to ${platform}...`, requestId });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }
    } else if (action === 'disconnect') {
      // Handle disconnection
      const r = NextResponse.json({ success: true, message: `Disconnected from ${platform}`, requestId });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const rr = NextResponse.json({ error: 'Invalid platform or action', requestId }, { status: 400 });
    rr.headers.set('X-Request-Id', requestId);
    return rr;
  } catch (error: any) {
    log.error('platform_connect_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Connection failed', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export const POST = withMonitoring('onboarding.connect-platform', handler as any);
