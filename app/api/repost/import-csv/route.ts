import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const form = await request.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 });
    const text = await file.text();

    // Naive CSV parser (comma separated, first row headers)
    const rows = text.split(/\r?\n/).filter(Boolean);
    if (rows.length < 2) return NextResponse.json({ error: 'CSV is empty' }, { status: 400 });
    const headers = rows[0].split(',').map((h) => h.trim());
    const idx = (name: string) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());
    const idxDate = idx('date');
    const idxAssetUrl = idx('assetUrl');
    const idxPlatform = idx('platformType');
    const idxImpr = idx('impressions');
    const idxClicks = idx('clicks');
    const idxPpv = idx('ppvPurchases');
    const idxSubs = idx('subscriptions');
    const idxRev = idx('revenueCents');

    const records: any[] = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(',');
      if (cols.length !== headers.length) continue;
      records.push({
        date: cols[idxDate]?.trim(),
        assetUrl: cols[idxAssetUrl]?.trim(),
        platformType: cols[idxPlatform]?.trim(),
        impressions: Number(cols[idxImpr] || 0),
        clicks: Number(cols[idxClicks] || 0),
        ppvPurchases: Number(cols[idxPpv] || 0),
        subscriptions: Number(cols[idxSubs] || 0),
        revenueCents: Number(cols[idxRev] || 0),
      });
    }

    const resp = await fetch(`${API_URL}/repost/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ records }),
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to import CSV' }, { status: 500 });
  }
}

