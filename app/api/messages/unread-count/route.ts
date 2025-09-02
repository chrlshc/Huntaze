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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ count: 0 }, { status: 200 });
    // Naive unread: count inbound messages (direction === 'in') across all conversations
    // In a real system, we'd track read receipts per message.
    const convs = crmData.listConversations(userId);
    let count = 0;
    for (const c of convs) {
      const msgs = crmData.listMessages(userId, c.id);
      count += msgs.filter((m) => m.direction === 'in' && !m.read).length;
    }
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
