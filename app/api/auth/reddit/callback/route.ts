import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
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

    // Verify state (if we initiated via /api/auth/reddit)
    const cookieState = request.cookies.get('reddit_oauth_state')?.value;
    if (cookieState && state && cookieState !== state) {
      const r = NextResponse.json({ error: 'Invalid state parameter', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Exchange code for access token
    // For Reddit we keep production callback on https://huntaze.com
    const appBase = process.env.NEXT_PUBLIC_APP_URL || 'https://huntaze.com';
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
        redirect_uri: process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI || `${appBase}/auth/reddit/callback`
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      log.error('reddit_token_error', redactObj({ error: errorText }));
      const r = NextResponse.json({ error: 'Failed to exchange code for token', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
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
      const r = NextResponse.json({ error: 'Failed to get user info', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const userData = await userResponse.json();

    // Build response and set cookies
    const r = NextResponse.json({
      success: true,
      user: {
        username: userData.name,
        karma: userData.total_karma,
        created: new Date(userData.created_utc * 1000),
      },
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    // Set cookies for access and refresh tokens
    if (tokenData.access_token) {
      r.cookies.set('reddit_access_token', tokenData.access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: tokenData.expires_in || 3600,
      });
    }
    if (tokenData.refresh_token) {
      r.cookies.set('reddit_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }
    // Store minimal user info for UI convenience
    try {
      r.cookies.set('reddit_user', JSON.stringify({ username: userData.name }), {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    } catch {}
    // Snapshot analytics: reddit stat_snapshot (best-effort)
    try {
      const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
      const ddb = new DynamoDBClient({ region });
      const ts = new Date().toISOString();
      const day = ts.slice(0, 10);
      const eventId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const payload = {
        name: userData?.name ?? null,
        link_karma: userData?.link_karma ?? null,
        comment_karma: userData?.comment_karma ?? null,
        has_verified_email: userData?.has_verified_email ?? null,
      };
      const item: any = {
        day: { S: day },
        sk: { S: `ts#${ts}#${eventId}` },
        ts: { S: ts },
        eventId: { S: eventId },
        platform: { S: 'reddit' },
        type: { S: 'stat_snapshot' },
        payload: { S: JSON.stringify(payload) },
      };
      const ttlDays = parseInt(process.env.ANALYTICS_TTL_DAYS || '60', 10);
      const ttlSec = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60;
      item.ttl = { N: String(ttlSec) };
      await ddb.send(new PutItemCommand({ TableName: 'huntaze-analytics-events', Item: item }));
    } catch {}

    // Persist tokens to DynamoDB
    try {
      await saveOAuthToken({
        platform: 'reddit',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000),
        scope: (tokenData.scope?.split(' ') || ['identity']).filter(Boolean),
        userId: user.id,
        providerUserId: userData?.id,
        extra: { name: userData?.name },
      });
    } catch {}

    // Clear stub state/connected cookies
    r.cookies.set('reddit_connected', '', { path: '/', maxAge: 0 });
    r.cookies.set('reddit_oauth_state', '', { path: '/', maxAge: 0 });
    return r;
  } catch (error: any) {
    log.error('reddit_callback_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
