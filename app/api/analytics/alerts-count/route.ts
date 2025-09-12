import { NextRequest, NextResponse } from 'next/server';
import { crmData } from '@/lib/services/crmData';
import { getUserFromRequest } from '@/lib/auth/request';

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  const userId = user?.userId || null;
  if (!userId) return NextResponse.json({ alerts: 0 });
  // Simple heuristic for demo: 1 alert si conversations en attente; +1 si aucun nouveau fan 24h
  const convs = crmData.listConversations(userId);
  let pending = 0;
  for (const c of convs) {
    const msgs = crmData.listMessages(userId, c.id);
    const last = msgs[msgs.length - 1];
    if (last && last.direction === 'in' && !last.read) pending += 1;
  }
  const fans = crmData.listFans(userId);
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const newFans = fans.filter((f) => new Date(f.createdAt).getTime() >= dayAgo).length;
  let alerts = 0;
  if (pending > 0) alerts += 1;
  if (newFans === 0) alerts += 1;
  return NextResponse.json({ alerts });
}
