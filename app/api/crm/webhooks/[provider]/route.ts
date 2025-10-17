import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { redactObj } from '@/lib/log-sanitize';

// Generic webhook entrypoint for CRM providers (placeholder)
export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    const provider = (params.provider || '').toLowerCase();
    // TODO: Verify signature once provider docs are known
    const payload = await request.json().catch(() => ({}));
    log.info('crm_webhook_received', redactObj({ provider, payload }));
    const r = NextResponse.json({ ok: true, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error) {
    const r = NextResponse.json({ error: 'Webhook error', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
