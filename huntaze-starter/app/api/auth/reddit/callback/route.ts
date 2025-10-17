import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import { getServerSession } from 'next-auth'
import crypto from 'crypto'
import { authOptions } from '@/lib/auth/options'
import { saveOAuthToken } from '@/lib/oauth/tokens'

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      const r = NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }

    const { code, state } = await request.json()
    if (!code) {
      const r = NextResponse.json({ error: 'Missing authorization code', requestId }, { status: 400 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }

    const cookieState = request.cookies.get('reddit_oauth_state')?.value
    if (cookieState && state && cookieState !== state) {
      const r = NextResponse.json({ error: 'Invalid state parameter', requestId }, { status: 400 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }

    const appBase = process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com'
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64')}`,
        'User-Agent': process.env.REDDIT_USER_AGENT || 'Huntaze:v1.0.0'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI || `${appBase}/auth/reddit/callback`
      })
    })

    if (!tokenResponse.ok) {
      const r = NextResponse.json({ error: 'Failed to exchange code for token', requestId }, { status: 400 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }

    const tokenData = await tokenResponse.json()

    const userResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': process.env.REDDIT_USER_AGENT || 'Huntaze:v1.0.0'
      }
    })
    if (!userResponse.ok) {
      const r = NextResponse.json({ error: 'Failed to get user info', requestId }, { status: 400 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }
    const userData = await userResponse.json()

    try {
      const expiresAt = tokenData?.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined
      await saveOAuthToken({
        userId: String(session.user.id),
        provider: 'reddit',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        providerUserId: userData?.id || userData?.name,
        expiresAt,
        extra: {
          name: userData?.name,
          link_karma: userData?.link_karma,
          comment_karma: userData?.comment_karma,
          has_verified_email: userData?.has_verified_email,
        },
      })
    } catch (error) {
      console.error('[reddit-callback] save_oauth_token_failed', error)
    }

    try {
      const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
      const ddb = new DynamoDBClient({ region })
      const ts = new Date().toISOString()
      const day = ts.slice(0, 10)
      const eventId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      const payload = {
        name: userData?.name ?? null,
        link_karma: userData?.link_karma ?? null,
        comment_karma: userData?.comment_karma ?? null,
        has_verified_email: userData?.has_verified_email ?? null,
      }
      const item: Record<string, AttributeValue> = {
        day: { S: day },
        sk: { S: `ts#${ts}#${eventId}` },
        ts: { S: ts },
        eventId: { S: eventId },
        platform: { S: 'reddit' },
        type: { S: 'stat_snapshot' },
        payload: { S: JSON.stringify(payload) },
      }
      const ttlDays = parseInt(process.env.ANALYTICS_TTL_DAYS || '60', 10)
      const ttlSec = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60
      item.ttl = { N: String(ttlSec) }
      await ddb.send(new PutItemCommand({ TableName: process.env.ANALYTICS_TABLE || 'huntaze-analytics-events', Item: item }))
    } catch (error) {
      console.error('[reddit-callback] stat_snapshot_failed', error)
    }

    const r = NextResponse.json({
      success: true,
      user: {
        username: userData?.name,
        karma: userData?.total_karma,
        created: userData?.created_utc ? new Date(userData.created_utc * 1000) : undefined,
      },
      requestId,
    })
    r.headers.set('X-Request-Id', requestId)

    if (tokenData.access_token) {
      r.cookies.set('reddit_access_token', tokenData.access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: tokenData.expires_in || 3600,
      })
    }
    if (tokenData.refresh_token) {
      r.cookies.set('reddit_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      })
    }
    try {
      r.cookies.set('reddit_user', JSON.stringify({ username: userData?.name }), {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      })
    } catch (error) {
      console.error('[reddit-callback] set_cookie_failed', error)
    }

    r.cookies.set('reddit_connected', '', { path: '/', maxAge: 0 })
    r.cookies.set('reddit_oauth_state', '', { path: '/', maxAge: 0 })
    return r
  } catch (error) {
    const r = NextResponse.json({ error: 'Internal server error', requestId, details: error instanceof Error ? error.message : undefined }, { status: 500 })
    r.headers.set('X-Request-Id', requestId)
    return r
  }
}
