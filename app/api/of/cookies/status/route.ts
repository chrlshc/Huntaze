import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { getDecryptedCookies, getSessionMeta } from '@/lib/of/aws-session-store';

export async function GET(req: NextRequest) {
  const session = await getServerSession().catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [cookiesJson, meta] = await Promise.all([
    getDecryptedCookies(userId).catch(() => null),
    getSessionMeta(userId).catch(() => ({ updatedAt: null, requiresAction: null })),
  ]);

  let count = 0;
  if (cookiesJson) {
    try {
      const arr = JSON.parse(cookiesJson);
      count = Array.isArray(arr) ? arr.length : 0;
    } catch {}
  }

  return NextResponse.json({
    userId,
    count,
    lastIngestAt: meta.updatedAt,
    requiresAction: meta.requiresAction,
  });
}

