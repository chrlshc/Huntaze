import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const url = new URL(request.url);
  const tz = url.searchParams.get('timezone');
  const resp = await fetch(`${API_URL}/schedule/recommendations${tz ? `?timezone=${encodeURIComponent(tz)}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}

