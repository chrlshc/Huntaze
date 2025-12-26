import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
  const isSandbox = process.env.TIKTOK_SANDBOX_MODE === 'true';
  const scopes = process.env.TIKTOK_SCOPES || 'user.info.basic';

  // Test direct token exchange with a dummy code
  const testCode = 'test123';
  
  const tokenUrl = 'https://open-api.tiktok.com/v2/oauth/token/';
  
  return NextResponse.json({
    config: {
      clientKeyPresent: !!clientKey,
      clientSecretPresent: !!clientSecret,
      clientSecretLength: clientSecret?.length || 0,
      redirectUri,
      isSandbox,
      scopes,
      tokenUrl,
    },
    testParams: {
      client_key: clientKey,
      code: testCode,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    },
    authUrl: `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri!)}&state=test123`,
  });
}
