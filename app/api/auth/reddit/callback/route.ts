import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64')}`,
        'User-Agent': process.env.REDDIT_USER_AGENT || 'Huntaze:v1.0.0'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI || 'https://huntaze.com/auth/reddit/callback'
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Reddit token error:', error);
      return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': process.env.REDDIT_USER_AGENT || 'Huntaze:v1.0.0'
      }
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Failed to get user info' }, { status: 400 });
    }

    const userData = await userResponse.json();
    
    // Save to database (implement based on your backend)
    // await saveRedditConnection({
    //   username: userData.name,
    //   accessToken: tokenData.access_token,
    //   refreshToken: tokenData.refresh_token,
    //   expiresAt: new Date(Date.now() + tokenData.expires_in * 1000)
    // });

    return NextResponse.json({ 
      success: true,
      user: {
        username: userData.name,
        karma: userData.total_karma,
        created: new Date(userData.created_utc * 1000)
      }
    });
  } catch (error) {
    console.error('Reddit callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}