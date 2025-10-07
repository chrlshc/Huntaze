import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.huntaze.com/api';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    try {
      const resp = await fetch(`${API_URL}/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        cache: 'no-store',
      });
      if (resp.ok) {
        const data = await resp.json();
        return NextResponse.json(data, { status: resp.status });
      }
      return NextResponse.json({ error: 'Upstream returned non-OK status' }, { status: 502 });
    } catch (e) {
      return NextResponse.json({ error: 'Failed to reach analytics service' }, { status: 502 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
