import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-protection';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.huntaze.com/api';

export async function GET(request: NextRequest) {
  const DEMO = process.env.NEXT_PUBLIC_DEMO === 'true' || process.env.DEMO_MODE === 'true';
  if (DEMO) {
    return NextResponse.json({ hours: [10, 13, 16, 21] }, { status: 200 })
  }

  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;

  // Note: This endpoint proxies to an external API that still uses Bearer tokens
  // We get the session token from NextAuth but the external API expects Bearer format
  const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Session token not found' }, { status: 401 });
  }

  const url = new URL(request.url);
  const platformType = url.searchParams.get('platformType') || '';
  const resp = await fetch(`${API_URL}/schedule/recommendations${platformType ? `?platformType=${encodeURIComponent(platformType)}` : ''}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  const data = await resp.json();
  return NextResponse.json({ hours: data.hours || [10,16,21] }, { status: resp.status });
}
