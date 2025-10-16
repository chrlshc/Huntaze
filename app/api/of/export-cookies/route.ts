export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { getDecryptedCookies } from '@/lib/of/aws-session-store';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const json = await getDecryptedCookies(userId);
    if (!json) return NextResponse.json({ error: 'No cookies found' }, { status: 404 });

    let cookies: unknown;
    try {
      cookies = JSON.parse(json);
    } catch {
      return NextResponse.json({ error: 'Corrupt cookies payload' }, { status: 500 });
    }

    return NextResponse.json({ userId, cookies });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

