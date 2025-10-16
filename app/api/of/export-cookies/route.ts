export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/request';
import { sessionManager } from '@/src/lib/of/session-manager';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const userId = user?.userId;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const json = await sessionManager.getDecryptedCookies(userId);
    if (!json) return NextResponse.json({ error: 'No cookies found' }, { status: 404 });

    let cookies: unknown = null;
    try {
      cookies = JSON.parse(json);
    } catch {
      // Not a JSON array; return raw string as fallback
      return NextResponse.json({ userId, cookies: json });
    }

    return NextResponse.json({ userId, cookies });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

