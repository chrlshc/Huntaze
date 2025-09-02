import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY || '',
        client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || 'https://huntaze.com/auth/tiktok/callback',
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
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
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
    
    // Get user stats (followers, likes, etc.)
    const statsResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
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

    // TODO: Save to your database
    // await saveTikTokConnection({
    //   openId: userInfo.open_id,
    //   unionId: userInfo.union_id,
    //   displayName: userInfo.display_name,
    //   avatarUrl: userInfo.avatar_url,
    //   accessToken: tokenData.access_token,
    //   refreshToken: tokenData.refresh_token,
    //   expiresIn: tokenData.expires_in,
    //   stats: stats
    // });

    return NextResponse.json({ 
      success: true,
      user: {
        displayName: userInfo?.display_name,
        avatarUrl: userInfo?.avatar_url,
        followerCount: stats?.follower_count || 0,
        likesCount: stats?.likes_count || 0,
        videoCount: stats?.video_count || 0
      }
    });
  } catch (error) {
    console.error('TikTok callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}