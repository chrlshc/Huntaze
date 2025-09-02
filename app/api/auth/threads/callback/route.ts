import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    // Exchange code for access token
    // Note: Threads uses Instagram's API infrastructure
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.THREADS_CLIENT_ID || process.env.INSTAGRAM_CLIENT_ID || '',
        client_secret: process.env.THREADS_CLIENT_SECRET || process.env.INSTAGRAM_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        redirect_uri: process.env.NEXT_PUBLIC_THREADS_REDIRECT_URI || 'https://huntaze.com/auth/threads/callback',
        code: code
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Threads token error:', error);
      return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    
    // Get user profile with Threads data
    const profileResponse = await fetch(`https://graph.instagram.com/v18.0/me?fields=id,username,account_type,media_count&access_token=${tokenData.access_token}`);
    
    if (!profileResponse.ok) {
      return NextResponse.json({ error: 'Failed to get user profile' }, { status: 400 });
    }

    const profileData = await profileResponse.json();
    
    // Get Threads-specific data (when API is available)
    // For now, we'll store the Instagram connection which gives access to Threads
    
    // TODO: Save to your database
    // await saveThreadsConnection({
    //   instagramId: profileData.id,
    //   username: profileData.username,
    //   accessToken: tokenData.access_token,
    //   accountType: profileData.account_type
    // });

    return NextResponse.json({ 
      success: true,
      user: {
        username: profileData.username,
        accountType: profileData.account_type,
        mediaCount: profileData.media_count
      }
    });
  } catch (error) {
    console.error('Threads callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}