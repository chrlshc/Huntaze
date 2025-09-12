import { NextRequest, NextResponse } from 'next/server';
import { crmData } from '@/lib/services/crmData';
import { getUserFromRequest } from '@/lib/auth/request';

async function getUserId(request: NextRequest): Promise<string | null> {
  const user = await getUserFromRequest(request);
  return user?.userId || null;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const conv = crmData.getConversation(userId, params.id);
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // Return the conversation object directly, as expected by the client
    return NextResponse.json(conv);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get conversation' }, { status: 500 });
  }
}
