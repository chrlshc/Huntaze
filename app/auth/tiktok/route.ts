import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const appBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || `${appBase}/auth/tiktok/callback`;
  const isSandbox = process.env.TIKTOK_SANDBOX_MODE === 'true';
  
  if (!clientKey) {
    return NextResponse.json({ error: 'TikTok app not configured' }, { status: 500 });
  }

  // Generate state for security (you should store this in session)
  const state = Math.random().toString(36).substring(7);
  
  // Choose auth base URL
  // Note: Even in sandbox mode, we use the production auth URL as sandbox domain might not be accessible
  const baseUrl = 'https://www.tiktok.com';
  
  // TikTok OAuth scopes; keep minimal by default to avoid invalid_scope
  const scope = process.env.TIKTOK_SCOPES || 'user.info.basic';
  const authUrl = `${baseUrl}/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  
  return NextResponse.redirect(authUrl);
}
