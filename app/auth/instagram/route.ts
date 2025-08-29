import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || 'https://huntaze.com/auth/instagram/callback';
  
  if (!clientId) {
    return NextResponse.json({ error: 'Instagram app not configured' }, { status: 500 });
  }

  // Instagram OAuth URL
  const scope = 'user_profile,user_media';
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
  
  return NextResponse.redirect(authUrl);
}