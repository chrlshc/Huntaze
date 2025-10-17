import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireUser } from '@/lib/server-auth';
import { saveOAuthToken } from '@/lib/auth/oauth-providers';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireUser();
    const shortToken = request.cookies.get('instagram_access_token')?.value;
    const appSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.INSTAGRAM_APP_SECRET || '';
    if (!shortToken || !appSecret) {
      const r = NextResponse.json({ error: 'Missing token or app secret', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const url = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(shortToken)}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      const r = NextResponse.json({ error: 'IG exchange failed', details: text, requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }
    const data = await resp.json();

    const r = NextResponse.json({ success: true, requestId });
    r.headers.set('X-Request-Id', requestId);
    if (data.access_token) {
      r.cookies.set('instagram_access_token', data.access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: (data.expires_in || 60 * 24 * 60 * 60),
      });
      try {
        await saveOAuthToken({
          platform: 'instagram',
          accessToken: data.access_token,
          refreshToken: '',
          expiresAt: new Date(Date.now() + (data.expires_in || 60 * 24 * 60 * 60) * 1000),
          scope: ['user_profile', 'user_media'],
          userId: user.id,
        });
      } catch {}
    }
    return r;
  } catch (e: any) {
    const r = NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

