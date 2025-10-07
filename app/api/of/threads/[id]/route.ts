import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = cookies().get('access_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const upstream = `${process.env.NEXT_PUBLIC_API_URL}/of/threads/${params.id}`;
    const res = await fetch(upstream, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    return new NextResponse(res.body, { status: res.status, headers: res.headers });
  } catch (error) {
    console.error('Error proxying OF thread:', error);
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}
