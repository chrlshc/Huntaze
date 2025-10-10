import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const appBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const clientId = process.env.REDDIT_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI || `${appBase}/auth/reddit/callback`;

  if (!clientId || !redirectUri) {
    const fallback = new URL('/auth', request.url);
    fallback.searchParams.set('error', 'reddit_unavailable');
    return NextResponse.redirect(fallback);
  }
  
  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');
  
  // Store state in cookie for verification
  const response = NextResponse.redirect(
    `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&duration=permanent&scope=identity`
  );
  
  response.cookies.set('reddit_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 minutes
  });
  
  return response;
}
