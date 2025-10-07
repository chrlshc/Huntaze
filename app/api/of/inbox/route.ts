import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('access_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const qs = new URL(request.url).search || '';
    const upstream = `${process.env.NEXT_PUBLIC_API_URL}/of/inbox${qs}`;

    const res = await fetch(upstream, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return new NextResponse(res.body, { status: res.status, headers: res.headers });
  } catch (error) {
    console.error('Error proxying OF inbox:', error);
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}
