import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireUser } from '@/lib/server-auth';
import { saveOAuthToken } from '@/lib/auth/oauth-providers';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireUser();

    const refreshToken = request.cookies.get('reddit_refresh_token')?.value;
    if (!refreshToken) {
      const r = NextResponse.json({ error: 'No refresh token', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64')}`,
        'User-Agent': process.env.REDDIT_USER_AGENT || 'Huntaze:v1.0.0',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      const r = NextResponse.json({ error: 'Refresh failed', details: text, requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const data = await tokenResponse.json();

    // Update cookies
    const r = NextResponse.json({ success: true, requestId });
    r.headers.set('X-Request-Id', requestId);
    if (data.access_token) {
      r.cookies.set('reddit_access_token', data.access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: data.expires_in || 3600,
      });
    }
    if (data.refresh_token) {
      r.cookies.set('reddit_refresh_token', data.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    // Persist
    try {
      await saveOAuthToken({
        platform: 'reddit',
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
        scope: (data.scope?.split(' ') || ['identity']).filter(Boolean),
        userId: user.id,
      });
    } catch {}

    return r;
  } catch (e: any) {
    const r = NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

