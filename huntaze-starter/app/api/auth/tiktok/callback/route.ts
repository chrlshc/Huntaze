import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import crypto from 'crypto'
import { makeReqLogger } from '@/lib/logger'
import { redactObj } from '@/lib/log-sanitize'
import { requireUser, HttpError } from '@/lib/server-auth'
import { saveOAuthToken } from '@/lib/auth/oauth-providers'

type TikTokUserInfo = {
  open_id?: string
  union_id?: string
  display_name?: string
  avatar_url?: string
  profile_deep_link?: string
  follower_count?: number
  likes_count?: number
  video_count?: number
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const { pathname } = new URL(request.url)
  const log = makeReqLogger({ requestId, route: pathname, method: request.method })

  try {
    const user = await requireUser()
    const { code, codeVerifier } = await request.json()

    if (!code) {
      const r = NextResponse.json({ error: 'Missing authorization code', requestId }, { status: 400 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }

    const appBase = process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com'
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY || '',
        client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || `${appBase}/auth/tiktok/callback`,
        code_verifier: codeVerifier || '',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      log.error('tiktok_token_error', redactObj({ error: errorText }))
      const r = NextResponse.json({ error: 'Failed to exchange code for token', requestId }, { status: 400 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }

    const tokenData = await tokenResponse.json()

    const fields = [
      'open_id',
      'union_id',
      'display_name',
      'avatar_url',
      'profile_deep_link',
      'follower_count',
      'likes_count',
      'video_count',
    ]
    const infoUrl = `https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(fields.join(','))}`
    const userResponse = await fetch(infoUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userResponse.ok) {
      const r = NextResponse.json({ error: 'Failed to get user info', requestId }, { status: 400 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }

    const userData = await userResponse.json()
    const userInfo = (userData?.data?.user ?? {}) as TikTokUserInfo

    try {
      const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
      const ddb = new DynamoDBClient({ region })
      const ts = new Date().toISOString()
      const day = ts.slice(0, 10)
      const eventId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      const payload = {
        display_name: userInfo.display_name ?? null,
        follower_count: userInfo.follower_count ?? null,
        likes_count: userInfo.likes_count ?? null,
        video_count: userInfo.video_count ?? null,
      }
      const item: Record<string, AttributeValue> = {
        day: { S: day },
        sk: { S: `ts#${ts}#${eventId}` },
        ts: { S: ts },
        eventId: { S: eventId },
        platform: { S: 'tiktok' },
        type: { S: 'stat_snapshot' },
        payload: { S: JSON.stringify(payload) },
      }
      const ttlDays = parseInt(process.env.ANALYTICS_TTL_DAYS || '60', 10)
      const ttlSec = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60
      item.ttl = { N: String(ttlSec) }
      await ddb.send(new PutItemCommand({ TableName: process.env.ANALYTICS_TABLE || 'huntaze-analytics-events', Item: item }))
    } catch (error) {
      log.warn('tiktok_snapshot_failed', { error })
    }

    const followerCount = typeof userInfo.follower_count === 'number' ? userInfo.follower_count : 0
    const likesCount = typeof userInfo.likes_count === 'number' ? userInfo.likes_count : 0
    const videoCount = typeof userInfo.video_count === 'number' ? userInfo.video_count : 0

    const response = NextResponse.json({
      success: true,
      user: {
        displayName: userInfo.display_name,
        avatarUrl: userInfo.avatar_url,
        followerCount,
        likesCount,
        videoCount,
      },
      requestId,
    })
    response.headers.set('X-Request-Id', requestId)

    if (tokenData.access_token) {
      response.cookies.set('tiktok_access_token', tokenData.access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: tokenData.expires_in || 24 * 60 * 60,
      })
    }
    if (tokenData.refresh_token) {
      response.cookies.set('tiktok_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      })
    }
    if (userInfo.display_name || userInfo.avatar_url) {
      response.cookies.set(
        'tiktok_user',
        JSON.stringify({ displayName: userInfo.display_name, avatarUrl: userInfo.avatar_url }),
        {
          httpOnly: false,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: tokenData.expires_in || 24 * 60 * 60,
        },
      )
    }

    try {
      const expiresAt = tokenData?.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined
      await saveOAuthToken({
        platform: 'tiktok',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        scope: ['user.info.basic', 'user.info.stats', 'video.list'],
        userId: user.id,
        providerUserId: userInfo.open_id,
        extra: {
          display_name: userInfo.display_name,
          avatar_url: userInfo.avatar_url,
          profile_deep_link: userInfo.profile_deep_link,
        },
      })
    } catch (error) {
      log.warn('tiktok_save_oauth_token_failed', { error })
    }

    return response
  } catch (error) {
    if (error instanceof HttpError) {
      const response = NextResponse.json({ error: error.message, requestId }, { status: error.statusCode })
      response.headers.set('X-Request-Id', requestId)
      return response
    }

    log.error('tiktok_callback_failed', { error: error instanceof Error ? error.message : 'unknown_error' })
    const r = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 })
    r.headers.set('X-Request-Id', requestId)
    return r
  }
}
