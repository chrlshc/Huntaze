import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const to = url.searchParams.get('to');
  const assetId = url.searchParams.get('assetId');
  const platform = url.searchParams.get('platform');
  const rid = url.searchParams.get('rid') || '';

  if (!to || !assetId || !platform) {
    return NextResponse.json({ error: 'Missing to/assetId/platform' }, { status: 400 });
  }

  // Fire-and-forget logging (no auth): backend will infer user from assetId
  try {
    await fetch(
      `${API_URL}/repost/click?assetId=${encodeURIComponent(assetId)}&platform=${encodeURIComponent(platform)}&rid=${encodeURIComponent(rid)}`,
      { method: 'POST' }
    );
  } catch {}

  // Redirect to target
  return NextResponse.redirect(to, { status: 302 });
}

