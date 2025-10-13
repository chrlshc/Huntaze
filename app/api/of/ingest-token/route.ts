import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/request';
import { createIngestToken } from '@/lib/bridgeTokens';

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
  const user = await getUserFromRequest(req).catch(() => null);
  const userId = user?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ingestToken = await createIngestToken({ userId, ttlSeconds: 300 });
  const apiBase = getApiBase();
  return NextResponse.json({ ingestToken, userId, apiBase });
}

export async function GET(req: NextRequest) {
  // Convenience: allow GET for simple clients
  return POST(req);
}
