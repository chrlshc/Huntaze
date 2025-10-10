import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.huntaze.com/api';

export async function GET(request: NextRequest) {
  const DEMO = process.env.NEXT_PUBLIC_DEMO === 'true' || process.env.DEMO_MODE === 'true';
  if (DEMO) {
    return NextResponse.json({ hours: [10, 13, 16, 21] }, { status: 200 })
  }
  const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const url = new URL(request.url);
  const platformType = url.searchParams.get('platformType') || '';
  const resp = await fetch(`${API_URL}/schedule/recommendations${platformType ? `?platformType=${encodeURIComponent(platformType)}` : ''}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  const data = await resp.json();
  return NextResponse.json({ hours: data.hours || [10,16,21] }, { status: resp.status });
}
