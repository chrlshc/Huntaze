import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireUser } from '@/lib/server-auth';
import { saveOAuthToken } from '@/lib/auth/oauth-providers';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireUser();

    const refreshToken = request.cookies.get('tiktok_refresh_token')?.value;
    if (!refreshToken) {
      const r = NextResponse.json({ error: 'No refresh token', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY || '',
        client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      const r = NextResponse.json({ error: 'Refresh failed', details: text, requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const data = await resp.json();

    const r = NextResponse.json({ success: true, requestId });
    r.headers.set('X-Request-Id', requestId);
    if (data.access_token) {
      r.cookies.set('tiktok_access_token', data.access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: data.expires_in || 86400,
      });
    }
    if (data.refresh_token) {
      r.cookies.set('tiktok_refresh_token', data.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    try {
      await saveOAuthToken({
        platform: 'tiktok',
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: new Date(Date.now() + (data.expires_in || 86400) * 1000),
        scope: (data.scope?.split(' ') || ['user.info.basic']).filter(Boolean),
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

