import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ connected: false, reason: 'unauthenticated' }, { status: 401 });

    // Proxy to backend platforms list to infer OF connection
    const resp = await fetch(`${API_URL}/platforms`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!resp.ok) return NextResponse.json({ connected: false }, { status: 200 });
    const data = await resp.json();
    const platforms = Array.isArray(data.platforms) ? data.platforms : [];
    const of = platforms.find((p: any) => (p.type === 'ONLYFANS') && p.active);
    return NextResponse.json({ connected: !!of, platform: of || null });
  } catch (e) {
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}

