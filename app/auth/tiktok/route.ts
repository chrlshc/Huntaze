import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || 'https://huntaze.com/auth/tiktok/callback';
  
  if (!clientKey) {
    return NextResponse.json({ error: 'TikTok app not configured' }, { status: 500 });
  }

  // Generate state for security (you should store this in session)
  const state = Math.random().toString(36).substring(7);
  
  // TikTok OAuth URL
  const scope = 'user.info.basic,user.info.stats,video.list';
  const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  
  return NextResponse.redirect(authUrl);
}