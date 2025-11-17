import { NextRequest, NextResponse } from 'next/server';
import { getOptionalAuth } from '@/lib/auth/api-protection';
import { createIngestToken } from '@/lib/bridgeTokens';
import crypto from 'crypto';

function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_ORIGIN || '';
  if (!base) return '';
  try {
    const u = new URL(base);
    return `${u.protocol}//${u.hostname}${u.port ? ':' + u.port : ''}`;
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  // Use optional auth since this endpoint supports public bridge mode
  const authResult = await getOptionalAuth(req);
  let userId = authResult?.user.id;
  const bridgePublic = (process.env.BRIDGE_PUBLIC === '1') || (process.env.NEXT_PUBLIC_BRIDGE_PUBLIC === '1' || process.env.NEXT_PUBLIC_BRIDGE_PUBLIC === 'true');
  if (!userId) {
    if (bridgePublic) {
      userId = `anon-${crypto.randomBytes(4).toString('hex')}`;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const ingestToken = await createIngestToken({ userId, ttlSeconds: 300 });
  const apiBase = getApiBase();
  return NextResponse.json({ ingestToken, userId, apiBase });
}

export async function GET(req: NextRequest) {
  // Convenience: allow GET for simple clients
  return POST(req);
}
