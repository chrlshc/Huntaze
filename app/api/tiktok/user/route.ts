import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.huntaze.com/api';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const resp = await fetch(`${API_URL}/tiktok/user`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!resp.ok) {
      return NextResponse.json({ error: 'Failed to fetch TikTok user' }, { status: resp.status });
    }
    const data = await resp.json();
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch TikTok user' }, { status: 502 });
  }
}

