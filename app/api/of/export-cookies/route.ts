export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-protection';
import { sessionManager } from '@/lib/of/session-manager';

export async function GET(req: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const userId = authResult.user.id;

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
