import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code) return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });

    const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json({ error: 'Instagram OAuth not configured' }, { status: 400 });
    }

    const tokenResp = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenResp.ok) {
      const err = await tokenResp.text();
      console.error('Instagram token error:', err);
      return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 400 });
    }

    const tokenData = await tokenResp.json();
    // Short-lived tokens can be exchanged for long-lived via Graph API if needed
    const accessToken: string = tokenData.access_token;
    const userId: string = tokenData.user_id?.toString();

    // Try to fetch username
    let username: string | undefined;
    try {
      const profile = await fetch(`https://graph.instagram.com/${userId}?fields=id,username&access_token=${accessToken}`);
      if (profile.ok) {
        const pjson = await profile.json();
        username = pjson?.username;
      }
    } catch {}

    const res = NextResponse.json({ success: true, user: { id: userId, username } }, { status: 200 });
    const maxAge = 30 * 24 * 60 * 60;
    res.cookies.set('instagram_access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge,
    });
    if (username) {
      res.cookies.set('instagram_user', JSON.stringify({ id: userId, username }), {
        httpOnly: false,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge,
      });
    }
    return res;
  } catch (e) {
    console.error('Instagram callback error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
