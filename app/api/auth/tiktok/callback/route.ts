import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

async function handleExchange(code: string, codeVerifier?: string) {
  // Exchange code for access token
  const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY || '',
      client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com'}/auth/tiktok/callback`,
      code_verifier: codeVerifier || ''
    })
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error('TikTok token error:', error);
    return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 400 });
  }

  const tokenData = await tokenResponse.json();
  
  // Get user info
  const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        user_info: ['open_id', 'union_id', 'display_name', 'avatar_url', 'profile_deep_link']
      }
    })
  });

  if (!userResponse.ok) {
    return NextResponse.json({ error: 'Failed to get user info' }, { status: 400 });
  }

  const userData = await userResponse.json();
  const userInfo = userData.data?.user;
  
  // Get user stats
  const statsResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        user_info: ['follower_count', 'following_count', 'likes_count', 'video_count']
      }
    })
  });
  
  let stats: any = {};
  if (statsResponse.ok) {
    const statsData = await statsResponse.json();
    stats = statsData.data?.user || {};
  }

  const res = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL || ''}/platforms/connect/tiktok?success=true`);
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  res.cookies.set('tiktok_access_token', tokenData.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge,
  });
  if (userInfo) {
    res.cookies.set('tiktok_user', JSON.stringify({
      id: userInfo.open_id,
      name: userInfo.display_name,
      avatar: userInfo.avatar_url,
      followers: stats?.follower_count || 0,
    }), {
      httpOnly: false,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge,
    });
  }
  return res;
}

export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier } = await request.json();
    if (!code) return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    return handleExchange(code, codeVerifier);
  } catch (error) {
    console.error('TikTok callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Support GET callbacks from TikTok (typical OAuth flow)
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code') || '';
    const codeVerifier = request.nextUrl.searchParams.get('code_verifier') || undefined;
    if (!code) {
      const url = new URL((process.env.NEXT_PUBLIC_APP_URL || '') + '/platforms/connect/tiktok');
      url.searchParams.set('error', 'missing_code');
      return NextResponse.redirect(url);
    }
    return handleExchange(code, codeVerifier);
  } catch (error) {
    console.error('TikTok GET callback error:', error);
    const url = new URL((process.env.NEXT_PUBLIC_APP_URL || '') + '/platforms/connect/tiktok');
    url.searchParams.set('error', 'callback_failed');
    return NextResponse.redirect(url);
  }
}
