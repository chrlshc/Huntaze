import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { tiktokService } from '@/lib/services/tiktok';

export async function POST() {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    await tiktokService.disconnect();
    const r = NextResponse.json({ success: true, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('tiktok_disconnect_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to disconnect', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
