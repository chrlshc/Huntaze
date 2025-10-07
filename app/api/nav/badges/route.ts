import { NextResponse } from 'next/server';

export const revalidate = 30;

export async function GET() {
  try {
    const [unreadRes, fansRes, campRes, integRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/messages/unread-count`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/crm/fans?since=24h`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/of/campaigns?status=active`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/onlyfans/status`, { cache: 'no-store' }),
    ]);

    const unreadJson = unreadRes.ok ? await unreadRes.json() : {};
    const fansJson = fansRes.ok ? await fansRes.json() : {};
    const campJson = campRes.ok ? await campRes.json() : {};
    const integJson = integRes.ok ? await integRes.json() : {};

    const unread = unreadJson.count ?? 0;
    const fansNew = Array.isArray(fansJson.items) ? fansJson.items.length : 0;
    const campaignsActive = Array.isArray(campJson.items) ? campJson.items.length : 0;
    const integMissing = integJson.connected ? 0 : 1;

    return NextResponse.json({
      'messages.unread': unread,
      'fans.new': fansNew,
      'campaigns.active': campaignsActive,
      'integrations.missing': integMissing,
    });
  } catch {
    return NextResponse.json({
      'messages.unread': 0,
      'fans.new': 0,
      'campaigns.active': 0,
      'integrations.missing': 0,
    });
  }
}

