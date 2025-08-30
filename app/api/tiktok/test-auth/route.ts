import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
  const isSandbox = process.env.TIKTOK_SANDBOX_MODE === 'true';
  const scopes = process.env.TIKTOK_SCOPES || 'user.info.basic';

  // Test direct token exchange with a dummy code
  const testCode = 'test123';
  
  const tokenUrl = 'https://open-api.tiktok.com/v2/oauth/token/';
  
  const params = new URLSearchParams({
    client_key: clientKey!,
    client_secret: clientSecret!,
    code: testCode,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri!,
  });

  return NextResponse.json({
    config: {
      clientKey,
      clientSecretLength: clientSecret?.length || 0,
      redirectUri,
      isSandbox,
      scopes,
      tokenUrl
    },
    testParams: Object.fromEntries(params),
    authUrl: `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri!)}&state=test123`
  });
}