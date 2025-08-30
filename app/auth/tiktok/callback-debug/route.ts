import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const appBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  console.log('=== TikTok Callback Debug ===');
  
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  console.log('Received params:', {
    code: code ? 'present' : 'missing',
    error,
    allParams: Object.fromEntries(searchParams.entries())
  });

  if (error || !code) {
    return NextResponse.redirect(new URL(`/debug-tiktok-connection?error=${error || 'no_code'}`, appBase));
  }

  try {
    // Token exchange via v2 endpoint (production)
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = (process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || `${appBase}/auth/tiktok/callback`)?.replace('/callback', '/callback-debug');
    
    console.log('Token exchange config:', {
      clientKey,
      hasSecret: !!clientSecret,
      redirectUri
    });

    // Exchange code for token (v2)
    const tokenResponse = await fetch('https://open-api.tiktok.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey || '',
        client_secret: clientSecret || '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || '',
      }),
    });

    const tokenText = await tokenResponse.text();
    console.log('Token response:', {
      status: tokenResponse.status,
      headers: Object.fromEntries(tokenResponse.headers.entries()),
      body: tokenText
    });

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      console.error('Failed to parse token response:', tokenText);
      throw new Error('Invalid token response');
    }

    if (tokenData.data?.access_token) {
      // Success! Store the token
      const cookieStore = cookies();
      cookieStore.set('tiktok_access_token', tokenData.data.access_token, {
        httpOnly: true,
        secure: appBase.startsWith('https://'),
        sameSite: 'lax',
        maxAge: 86400,
        path: '/',
      });
      
      console.log('Token stored successfully');
      
      return NextResponse.redirect(new URL('/debug-tiktok-connection?success=true', appBase));
    } else {
      console.error('No access token in response:', tokenData);
      throw new Error('No access token received');
    }

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/debug-tiktok-connection?error=token_exchange_failed', appBase));
  }
}
