import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const revalidate = 30;

export async function GET() {
  try {
    const DEMO = process.env.NEXT_PUBLIC_DEMO === 'true' || process.env.DEMO_MODE === 'true';
    if (DEMO) {
      return NextResponse.json({
        'messages.unread': 4,
        'fans.new': 12,
        'campaigns.active': 2,
        'integrations.missing': 0,
        'analytics.alerts': 1,
        demo: true,
      })
    }
    const cookieHeader = (await cookies()).toString();
    const opts = { headers: { cookie: cookieHeader }, cache: 'no-store' as const };

    const [unreadRes, fansRes, campRes, integRes, alertsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/messages/unread-count`, opts),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/crm/fans?since=24h`, opts),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/of/campaigns?status=active`, opts),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/onlyfans/status`, opts),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analytics/alerts-count`, opts),
    ]);

    const unreadJson = unreadRes.ok ? await unreadRes.json() : {};
    const fansJson = fansRes.ok ? await fansRes.json() : {};
    const campJson = campRes.ok ? await campRes.json() : {};
    const integJson = integRes.ok ? await integRes.json() : {};
    const alertsJson = alertsRes.ok ? await alertsRes.json() : {};

    const unread = unreadJson.count ?? 0;
    const fansNew = Array.isArray(fansJson.items) ? fansJson.items.length : 0;
    const campaignsActive = Array.isArray(campJson.items) ? campJson.items.length : 0;
    const integMissing = integJson.connected ? 0 : 1;
    const analyticsAlerts = alertsJson.count ?? 0;

    return NextResponse.json({
      'messages.unread': unread,
      'fans.new': fansNew,
      'campaigns.active': campaignsActive,
      'integrations.missing': integMissing,
      'analytics.alerts': analyticsAlerts,
    });
  } catch {
    return NextResponse.json({
      'messages.unread': 0,
      'fans.new': 0,
      'campaigns.active': 0,
      'integrations.missing': 0,
      'analytics.alerts': 0,
    });
  }
}
