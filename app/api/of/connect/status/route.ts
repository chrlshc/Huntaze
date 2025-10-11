import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { getOfLinkStatus, type OfLinkState } from '@/lib/of/link-store';
import { getDecryptedCookies } from '@/lib/of/aws-session-store';

export async function GET(req: NextRequest) {
  const session = await getServerSession().catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ state: 'PENDING' });

  // Prioritise explicit link state when present
  const explicit = await getOfLinkStatus(userId).catch(() => null);
  if (explicit) {
    return NextResponse.json(explicit, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }

  // Fallback heuristic from session cookies in DDB
  const cookies = await getDecryptedCookies(userId).catch(() => null);
  if (cookies) {
    try {
      const arr = JSON.parse(cookies);
      if (Array.isArray(arr) && arr.length > 0) {
        return NextResponse.json({ state: 'CONNECTED' as OfLinkState }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            Pragma: 'no-cache',
            Expires: '0',
          },
        });
      }
    } catch {}
  }

  return NextResponse.json({ state: 'PENDING' as OfLinkState }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
export const dynamic = 'force-dynamic';
export const revalidate = 0;
