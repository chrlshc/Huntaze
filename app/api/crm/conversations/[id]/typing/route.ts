import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { eventEmitter } from '@/lib/services/eventEmitter';

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { fanId, action } = await request.json();
    if (!fanId || !action) return NextResponse.json({ error: 'fanId and action are required' }, { status: 400 });

    if (action !== 'start' && action !== 'stop') {
      return NextResponse.json({ error: 'action must be start or stop' }, { status: 400 });
    }

    const type = action === 'start' ? 'typing-start' : 'typing-stop';
    eventEmitter.emit({ type, conversationId: params.id, fanId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to emit typing event' }, { status: 500 });
  }
}

