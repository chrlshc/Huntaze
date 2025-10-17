import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { crmConnections, CrmProviderId } from '@/lib/services/crmConnections';
import { getUserFromRequest } from '@/lib/auth/request';

export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }
    const userId = user.userId as string;

    const provider = (params.provider || '').toLowerCase() as CrmProviderId;
    if (!['inflow', 'supercreator'].includes(provider)) {
      const r = NextResponse.json({ error: 'Unknown provider', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const { apiKey } = await request.json();
    if (!apiKey || typeof apiKey !== 'string') {
      const r = NextResponse.json({ error: 'apiKey is required', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // TODO: Validate the API key by calling provider API once docs are available

    const masked = apiKey.length > 6 ? apiKey.slice(0, 3) + '***' + apiKey.slice(-3) : '***';
    const now = new Date().toISOString();
    const existing = crmConnections.get(userId) || [];

    const idx = existing.findIndex((c) => c.provider === provider);
    const record = {
      id: `${provider}_${userId}`,
      userId,
      provider,
      apiKeyMasked: masked,
      isActive: true,
      createdAt: idx >= 0 ? existing[idx].createdAt : now,
      updatedAt: now,
    };
    if (idx >= 0) existing[idx] = record; else existing.push(record);
    crmConnections.set(userId, existing);

    const r = NextResponse.json({ ok: true, connection: { ...record }, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('crm_connect_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to connect CRM', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const requestId = crypto.randomUUID();
  try {
    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }
    const userId = user.userId as string;

    const provider = (params.provider || '').toLowerCase() as CrmProviderId;
    const existing = (crmConnections.get(userId) || []).find((c) => c.provider === provider);
    const r = NextResponse.json({ connection: existing || null, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error) {
    const r = NextResponse.json({ error: 'Failed to get CRM connection', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
