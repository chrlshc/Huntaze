import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Get the correct base URL
  const appBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  // Handle errors
  if (error) {
    console.error('TikTok OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/dashboard?error=tiktok_auth_failed&message=${encodeURIComponent(errorDescription || error)}`, appBase)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard?error=no_code', appBase)
    );
  }

  console.log('TikTok callback received with code:', code);

  try {
    // Exchange code for access token
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || `${appBase}/auth/tiktok/callback`;
    const isSandbox = process.env.TIKTOK_SANDBOX_MODE === 'true';
    
    console.log('Token exchange params:', {
      clientKey,
      clientSecret: clientSecret ? '***' : 'missing',
      redirectUri,
      code: code.substring(0, 10) + '...'
    });

    // Token endpoint - Use new production API URL
    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey!,
        client_secret: clientSecret!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Token response:', { status: tokenResponse.status, data: tokenData });

    if (!tokenResponse.ok || tokenData.error) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.redirect(
        new URL(`/dashboard?error=token_exchange_failed`, appBase)
      );
    }

    // Get user info - Use new production API URL
    const userInfoUrl = 'https://open.tiktokapis.com/v2/user/info/';

    const userResponse = await fetch(userInfoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // Store token securely (you should encrypt this in production)
    // For now, we'll store in cookies (not ideal for production)
    const cookieStore = cookies();
    cookieStore.set('tiktok_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokenData.expires_in || 86400, // 24 hours default
    });

    // Store user info
    cookieStore.set('tiktok_user', JSON.stringify({
      id: userData.data?.user?.open_id,
      display_name: userData.data?.user?.display_name,
      avatar_url: userData.data?.user?.avatar_url,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Redirect to dashboard with success
    return NextResponse.redirect(
      new URL('/dashboard?success=tiktok_connected', appBase)
    );

  } catch (error) {
    console.error('TikTok callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?error=callback_failed', appBase)
    );
  }
}
