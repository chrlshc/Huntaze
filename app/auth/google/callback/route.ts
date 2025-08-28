import { NextRequest, NextResponse } from 'next/server';
import { generateToken, generateRefreshToken, setAuthCookies } from '../../../../lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Get OAuth config from environment
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'https://huntaze.com/auth/google/callback';

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('Missing OAuth config:', {
      hasClientId: !!GOOGLE_CLIENT_ID,
      hasClientSecret: !!GOOGLE_CLIENT_SECRET,
    });
    return NextResponse.redirect(new URL('/join?error=oauth_not_configured', 'https://huntaze.com'));
  }
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle errors
  if (error) {
    return NextResponse.redirect(new URL('/join?error=oauth_denied', 'https://huntaze.com'));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/join?error=no_code', 'https://huntaze.com'));
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
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
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

    // Create response with redirect
    const response = NextResponse.redirect(new URL('/dashboard', 'https://huntaze.com'));
    
    // Set auth cookies
    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    
    return response;

  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL('/join?error=oauth_failed', 'https://huntaze.com'));
  }
}
