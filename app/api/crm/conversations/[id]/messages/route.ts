import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { crmData } from '@/lib/services/crmData';

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
  const { payload } = await jwtVerify(token, secret);
  return payload.userId as string;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const messages = crmData.listMessages(userId, params.id);
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { fanId, text, direction, priceCents } = await request.json();
    if (!fanId || !text) return NextResponse.json({ error: 'fanId and text are required' }, { status: 400 });
    const dir = direction === 'in' ? 'in' : 'out';
    const msg = crmData.createMessage(userId, params.id, fanId, dir, text, priceCents);
    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

