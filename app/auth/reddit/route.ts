import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const appBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const clientId = process.env.REDDIT_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI || `${appBase}/auth/reddit/callback`;
  
  if (!clientId) {
    return NextResponse.json({ error: 'Reddit app not configured' }, { status: 500 });
  }

  // Generate state for security
  const state = Math.random().toString(36).substring(7);
  
  // Reddit OAuth URL
  const scope = 'identity read mysubreddits';
  const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&duration=permanent&scope=${scope}`;
  
  return NextResponse.redirect(authUrl);
}
