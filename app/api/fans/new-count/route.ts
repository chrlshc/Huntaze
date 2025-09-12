import { NextRequest, NextResponse } from 'next/server';
import { crmData } from '@/lib/services/crmData';
import { getUserFromRequest } from '@/lib/auth/request';

async function getUserId(request: NextRequest): Promise<string | null> {
  const user = await getUserFromRequest(request);
  return user?.userId || null;
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ new: 0, pending: 0 });
  const fans = crmData.listFans(userId);
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const newFans = fans.filter((f) => new Date(f.createdAt).getTime() >= dayAgo).length;

  const convs = crmData.listConversations(userId);
  let pending = 0;
  for (const c of convs) {
    const msgs = crmData.listMessages(userId, c.id);
    const last = msgs[msgs.length - 1];
    if (last && last.direction === 'in' && !last.read) pending += 1;
  }
  return NextResponse.json({ new: newFans, pending });
}
