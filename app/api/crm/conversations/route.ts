import { NextRequest, NextResponse } from 'next/server';
import { crmData } from '@/lib/services/crmData';
import { getUserFromRequest } from '@/lib/auth/request';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const userId = user?.userId || null;
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const conversations = crmData.listConversations(userId);
    return NextResponse.json({ conversations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const userId = user?.userId || null;
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { fanId, platform } = await request.json();
    if (!fanId) return NextResponse.json({ error: 'fanId is required' }, { status: 400 });
    const conv = crmData.createConversation(userId, fanId, platform);
    return NextResponse.json({ conversation: conv }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
