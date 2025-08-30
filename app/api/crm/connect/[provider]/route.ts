import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { crmConnections, CrmProviderId } from '@/lib/services/crmConnections';

export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const provider = (params.provider || '').toLowerCase() as CrmProviderId;
    if (!['inflow', 'supercreator'].includes(provider)) {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    const { apiKey } = await request.json();
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'apiKey is required' }, { status: 400 });
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

    return NextResponse.json({ ok: true, connection: { ...record } });
  } catch (error) {
    console.error('CRM connect error:', error);
    return NextResponse.json({ error: 'Failed to connect CRM' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const provider = (params.provider || '').toLowerCase() as CrmProviderId;
    const existing = (crmConnections.get(userId) || []).find((c) => c.provider === provider);
    return NextResponse.json({ connection: existing || null });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get CRM connection' }, { status: 500 });
  }
}

