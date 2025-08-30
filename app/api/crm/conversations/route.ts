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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const conversations = crmData.listConversations(userId);
    return NextResponse.json({ conversations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { fanId, platform } = await request.json();
    if (!fanId) return NextResponse.json({ error: 'fanId is required' }, { status: 400 });
    const conv = crmData.createConversation(userId, fanId, platform);
    return NextResponse.json({ conversation: conv }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}

