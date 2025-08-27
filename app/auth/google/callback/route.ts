import { NextRequest, NextResponse } from 'next/server';
import { generateToken, generateRefreshToken, setAuthCookies } from '../../../../lib/auth/jwt';
import { ensureGoogleOAuthEnv } from '../../../../lib/env';

export async function GET(request: NextRequest) {
  ensureGoogleOAuthEnv();
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle errors
  if (error) {
    return NextResponse.redirect(new URL('/join?error=oauth_denied', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/join?error=no_code', request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const user = await userResponse.json();

    // TODO: Create or update user in database
    // For now, we'll use the Google ID as userId
    const userId = user.id;

    // Generate JWT tokens
    const accessToken = await generateToken({
      userId,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: 'google',
    });

    const refreshToken = await generateRefreshToken(userId);

    // Set auth cookies
    setAuthCookies(accessToken, refreshToken);

    // Redirect to dashboard or home
    return NextResponse.redirect(new URL('/dashboard', request.url));

  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL('/join?error=oauth_failed', request.url));
  }
}
