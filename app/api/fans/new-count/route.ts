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

