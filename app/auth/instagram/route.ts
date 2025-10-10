import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const appBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
  const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || `${appBase}/auth/instagram/callback`;
  
  if (!clientId) {
    const fallback = new URL('/auth', request.url);
    fallback.searchParams.set('error', 'instagram_unavailable');
    return NextResponse.redirect(fallback);
  }

  // Instagram OAuth URL
  const scope = 'user_profile,user_media';
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
  
  return NextResponse.redirect(authUrl);
}
