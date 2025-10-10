import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const appBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const clientKey = process.env.TIKTOK_CLIENT_KEY || process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || `${appBase}/auth/tiktok/callback`;
  const scopes = process.env.TIKTOK_SCOPES || 'user.info.basic,video.upload';

  if (!clientKey || !redirectUri) {
    const fallback = new URL('/auth', request.url);
    fallback.searchParams.set('error', 'tiktok_unavailable');
    return NextResponse.redirect(fallback);
  }
  
  const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientKey}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  return NextResponse.redirect(authUrl);
}
