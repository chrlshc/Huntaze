import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { tiktokService } from '@/lib/services/tiktok';

export const dynamic = 'force-dynamic';

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const user = await tiktokService.getCurrentUser();
    
    if (!user) {
      const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }
    
    const r = NextResponse.json({ ...user, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('tiktok_user_failed', { error: error?.message || 'unknown_error' });
    const rr = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    rr.headers.set('X-Request-Id', requestId);
    return rr;
  }
}
