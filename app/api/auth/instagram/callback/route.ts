import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { redactObj } from '@/lib/log-sanitize';
import { requireUser, HttpError } from '@/lib/server-auth';
import { saveOAuthToken } from '@/lib/auth/oauth-providers';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });

  try {
    const user = await requireUser();
    const { code, state } = await request.json();

    if (!code) {
      const r = NextResponse.json({ error: 'Missing authorization code', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Verify state from cookie if present
    const cookieState = request.cookies.get('instagram_oauth_state')?.value;
    if (cookieState && state && cookieState !== state) {
      const r = NextResponse.json({ error: 'Invalid state parameter', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || '';
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.INSTAGRAM_APP_SECRET || '';
    const appBase = process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com';
    const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || `${appBase}/auth/instagram/callback`;

    // Exchange code for access token (Instagram Basic Display flow)
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
      const errorText = await tokenResp.text();
      log.error('instagram_token_error', redactObj({ error: errorText }));
      const r = NextResponse.json({ error: 'Failed to exchange code for token', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const tokenData = await tokenResp.json();
    let accessToken: string = tokenData.access_token as string;
    let expiresIn: number | undefined = undefined;

    // Attempt long-lived exchange immediately
    try {
      const appSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.INSTAGRAM_APP_SECRET || '';
      if (appSecret) {
        const exch = await fetch(
          `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(
            accessToken
          )}`
        );
        if (exch.ok) {
          const edata = await exch.json();
          if (edata?.access_token) {
            accessToken = edata.access_token;
            expiresIn = edata.expires_in;
          }
        }
      }
    } catch {}

    // Fetch basic user info
    let user: { id?: string; username?: string } = {};
    try {
      const meResp = await fetch(
        `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`
      );
      if (meResp.ok) {
        user = await meResp.json();
      }
    } catch (e) {
      // ignore user fetch failure; still set token
    }

    // Persist token (DynamoDB)
    try {
      await saveOAuthToken({
        platform: 'instagram',
        accessToken,
        refreshToken: '',
        expiresAt: new Date(Date.now() + (expiresIn || 60 * 24 * 60 * 60) * 1000),
        scope: ['user_profile', 'user_media'],
        userId: user.id,
        providerUserId: user?.id,
        extra: { username: user?.username },
      });
    } catch {}

    // Set cookies
    const res = NextResponse.json({ success: true, user, requestId });
    res.headers.set('X-Request-Id', requestId);
    res.cookies.set('instagram_access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: expiresIn || 60 * 60 * 24 * 60,
    });
    if (user && (user.id || user.username)) {
      res.cookies.set('instagram_user', JSON.stringify(user), {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 60,
      });
    }
    // Clear old stub cookie if present
    res.cookies.set('instagram_connected', '', { path: '/', maxAge: 0 });
    res.cookies.set('instagram_oauth_state', '', { path: '/', maxAge: 0 });
    return res;
  } catch (error: any) {
    log.error('instagram_callback_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
