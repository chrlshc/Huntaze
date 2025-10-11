import { NextRequest, NextResponse } from 'next/server';
import { setOfLinkStatus } from '@/lib/of/link-store';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.WORKER_TOKEN || process.env.OF_WORKER_TOKEN || ''}`;
  if (!expected || auth !== expected) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json();
  const userId = String(body.userId || '');
  const state = String(body.state || '');
  const errorCode = body.errorCode ? String(body.errorCode) : undefined;
  if (!userId || !state) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  await setOfLinkStatus(userId, { state: state as any, errorCode });
  return NextResponse.json({ ok: true });
}

