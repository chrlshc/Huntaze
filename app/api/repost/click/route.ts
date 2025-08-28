import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Proxy click logging to backend
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const assetId = url.searchParams.get('assetId');
  const platform = url.searchParams.get('platform');
  const rid = url.searchParams.get('rid') || '';
  if (!assetId || !platform) return NextResponse.json({ error: 'assetId and platform required' }, { status: 400 });

  const resp = await fetch(`${API_URL}/repost/click?assetId=${encodeURIComponent(assetId)}&platform=${encodeURIComponent(platform)}&rid=${encodeURIComponent(rid)}`, { method: 'POST' });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}

