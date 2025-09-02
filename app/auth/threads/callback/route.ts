import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.huntaze.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://huntaze.com';
const THREADS_APP_ID = process.env.NEXT_PUBLIC_THREADS_APP_ID!;
const THREADS_APP_SECRET = process.env.THREADS_APP_SECRET!;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  if (error) {
    console.error('Threads OAuth error:', error, error_description);
    return NextResponse.redirect(`${APP_URL}/platforms/connect?error=threads_auth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/platforms/connect?error=no_code`);
  }

  try {
    // Get the JWT token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.redirect(`${APP_URL}/login?redirect=/platforms/connect`);
    }

    // Verify JWT to get user ID
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.threads.net/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: THREADS_APP_ID,
        client_secret: THREADS_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: `${APP_URL}/auth/threads/callback`,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Threads token exchange failed:', error);
      return NextResponse.redirect(`${APP_URL}/platforms/connect?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const threadsUserId = tokenData.user_id;

    // Get Threads user info
    const userResponse = await fetch(`https://graph.threads.net/me?fields=id,username,threads_profile_picture_url&access_token=${accessToken}`);
    const userData = await userResponse.json();

    // Save to backend
    const saveResponse = await fetch(`${API_URL}/api/platforms/connect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform: 'THREADS',
        accessToken: accessToken,
        refreshToken: null, // Threads doesn't use refresh tokens
        expiresAt: null, // Threads tokens don't expire
        platformUserId: threadsUserId,
        platformUsername: userData.username,
        additionalData: {
          profilePictureUrl: userData.threads_profile_picture_url,
        },
      }),
    });

    if (!saveResponse.ok) {
      console.error('Failed to save Threads connection');
      return NextResponse.redirect(`${APP_URL}/platforms/connect?error=save_failed`);
    }

    return NextResponse.redirect(`${APP_URL}/platforms/connect?success=threads_connected`);
  } catch (error) {
    console.error('Threads callback error:', error);
    return NextResponse.redirect(`${APP_URL}/platforms/connect?error=threads_callback_failed`);
  }
}