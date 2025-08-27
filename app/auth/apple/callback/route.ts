import { NextRequest, NextResponse } from 'next/server';
import { generateToken, generateRefreshToken, setAuthCookies } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const code = formData.get('code') as string;
    const idToken = formData.get('id_token') as string;
    const user = formData.get('user') as string;

    if (!code) {
      return NextResponse.redirect(new URL('/join?error=no_code', request.url));
    }

    // Apple sends user data only on first authorization
    let userData = null;
    if (user) {
      try {
        userData = JSON.parse(user);
      } catch (e) {
        console.error('Failed to parse Apple user data:', e);
      }
    }

    // TODO: Verify id_token with Apple's public keys
    // TODO: Exchange code for refresh token if needed
    // For now, decode the id_token payload (in production, verify signature!)
    const idTokenPayload = JSON.parse(
      Buffer.from(idToken.split('.')[1], 'base64').toString()
    );

    // TODO: Create or update user in database
    const userId = idTokenPayload.sub;

    // Generate JWT tokens
    const accessToken = await generateToken({
      userId,
      email: idTokenPayload.email,
      name: userData?.name ? `${userData.name.firstName} ${userData.name.lastName}` : null,
      picture: null, // Apple doesn't provide profile pictures
      provider: 'apple',
    });

    const refreshToken = await generateRefreshToken(userId);

    // Set auth cookies
    setAuthCookies(accessToken, refreshToken);

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));

  } catch (error) {
    console.error('Apple OAuth error:', error);
    return NextResponse.redirect(new URL('/join?error=oauth_failed', request.url));
  }
}

// Apple can also use GET for errors
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/join?error=oauth_denied', request.url));
  }

  return NextResponse.redirect(new URL('/join?error=invalid_request', request.url));
}