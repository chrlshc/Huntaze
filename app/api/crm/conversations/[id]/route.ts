import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { crmData } from '@/lib/services/crmData';

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

