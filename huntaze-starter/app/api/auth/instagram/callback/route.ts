import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import { getServerSession } from 'next-auth'
import crypto from 'crypto'
import { authOptions } from '@/lib/auth/options'
import { saveOAuthToken } from '@/lib/oauth/tokens'

function getRegion(): string {
  return process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
}

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

    const cookieState = request.cookies.get('instagram_oauth_state')?.value
    if (cookieState && state && cookieState !== state) {
      const r = NextResponse.json({ error: 'Invalid state parameter', requestId }, { status: 400 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || ''
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.INSTAGRAM_APP_SECRET || ''
    const appBase = process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com'
    const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || `${appBase}/auth/instagram/callback`

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
    })

    if (!tokenResp.ok) {
      const msg = await tokenResp.text()
      const r = NextResponse.json({ error: 'Failed to exchange code', details: msg, requestId }, { status: 400 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }

    const tokenData = await tokenResp.json()
    let accessToken: string = tokenData.access_token as string
    let expiresIn: number | undefined

    try {
      if (clientSecret) {
        const exch = await fetch(
          `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(clientSecret)}&access_token=${encodeURIComponent(
            accessToken
          )}`
        )
        if (exch.ok) {
          const ed = await exch.json()
          if (ed?.access_token) {
            accessToken = ed.access_token
            expiresIn = ed.expires_in
          }
        }
      }
    } catch (error) {
      console.error('[instagram-callback] exchange_to_long_token_failed', error)
    }

    let igUserId: string | undefined
    let username: string | undefined
    let mediaCount: number | undefined
    try {
      const me = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${encodeURIComponent(accessToken)}`
      )
      if (me.ok) {
        const data = await me.json()
        igUserId = data?.id
        username = data?.username
        mediaCount = data?.media_count
      }
    } catch (error) {
      console.error('[instagram-callback] fetch_profile_failed', error)
    }

    try {
      const region = getRegion()
      const ddb = new DynamoDBClient({ region })
      const ts = new Date().toISOString()
      const day = ts.slice(0, 10)
      const eventId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      const payload = {
        username: username ?? null,
        media_count: mediaCount ?? null,
        followers_count: null,
      }
      const item: Record<string, AttributeValue> = {
        day: { S: day },
        sk: { S: `ts#${ts}#${eventId}` },
        ts: { S: ts },
        eventId: { S: eventId },
        platform: { S: 'instagram' },
        type: { S: 'stat_snapshot' },
        payload: { S: JSON.stringify(payload) },
      }
      const ttlDays = parseInt(process.env.ANALYTICS_TTL_DAYS || '60', 10)
      const ttlSec = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60
      item.ttl = { N: String(ttlSec) }
      await ddb.send(new PutItemCommand({ TableName: process.env.ANALYTICS_TABLE || 'huntaze-analytics-events', Item: item }))
    } catch (error) {
      console.error('[instagram-callback] stat_snapshot_failed', error)
    }

    const r = NextResponse.json({ success: true, user: { username, mediaCount }, requestId })
    r.headers.set('X-Request-Id', requestId)
    if (accessToken) {
      r.cookies.set('instagram_access_token', accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: expiresIn || 60 * 24 * 60 * 60,
      })
    }
    if (username) {
      r.cookies.set('instagram_user', JSON.stringify({ username }), {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 24 * 60 * 60,
      })
    }

    try {
      const ea = expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined
      await saveOAuthToken({
        userId: String(session.user.id),
        provider: 'instagram-basic',
        accessToken,
        providerUserId: igUserId,
        expiresAt: ea,
        extra: { username, media_count: mediaCount },
      })
    } catch (error) {
      console.error('[instagram-callback] save_oauth_token_failed', error)
    }
    return r
  } catch (error) {
    const r = NextResponse.json({ error: 'Internal server error', requestId, details: error instanceof Error ? error.message : undefined }, { status: 500 })
    r.headers.set('X-Request-Id', requestId)
    return r
  }
}
