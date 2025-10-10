import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.huntaze.com/api';

export async function GET(request: NextRequest) {
  try {
    const DEMO = process.env.NEXT_PUBLIC_DEMO === 'true' || process.env.DEMO_MODE === 'true';
    if (DEMO) {
      // Build 30-day series
      const days = Array.from({ length: 30 }).map((_, i) => {
        const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
        return d.toISOString().slice(0, 10)
      })
      const base = 800
      const revenue = days.map((_, i) => Math.round((base + i * 15 + Math.random() * 60) * 100) / 100)
      const fanNew = days.map((_, i) => Math.round(20 + Math.sin(i / 3) * 8 + Math.random() * 5))
      const fanActive = days.map((_, i) => Math.round(200 + i * 2 + Math.random() * 10))
      const platformDist = [
        { platform: 'onlyfans', share: 0.55 },
        { platform: 'instagram', share: 0.25 },
        { platform: 'tiktok', share: 0.18 },
        { platform: 'reddit', share: 0.02 },
      ]
      return NextResponse.json({
        revenueSeries: { labels: days, values: revenue },
        fanGrowth: { labels: days, newFans: fanNew, activeFans: fanActive },
        platformDistribution: platformDist,
        demo: true,
      })
    }
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    try {
      const resp = await fetch(`${API_URL}/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        cache: 'no-store',
      });
      if (resp.ok) {
        const data = await resp.json();
        return NextResponse.json(data, { status: resp.status });
      }
      return NextResponse.json({ error: 'Upstream returned non-OK status' }, { status: 502 });
    } catch (e) {
      return NextResponse.json({ error: 'Failed to reach analytics service' }, { status: 502 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
