import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import crypto from 'crypto'
import { authOptions } from '@/lib/auth/options'

function getRegion(): string {
  return process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const igGraphEnabled = String(process.env.IG_GRAPH_ENABLED || '').toLowerCase() === 'true'
  if (!igGraphEnabled) {
    return NextResponse.json({ error: 'IG Graph disabled', requestId }, { status: 404 })
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      const r = NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }

    const body = await request.json().catch(() => ({}))
    const igUserId = body?.igUserId || process.env.IG_GRAPH_USER_ID
    const accessToken = body?.accessToken || process.env.IG_GRAPH_ACCESS_TOKEN
    if (!igUserId || !accessToken) {
      const r = NextResponse.json({ error: 'missing_ig_user_or_token', requestId }, { status: 400 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }

    // Fetch snapshot from Instagram Graph (Business/Creator)
    const version = process.env.IG_GRAPH_VERSION || 'v20.0'
    const url = `https://graph.facebook.com/${version}/${encodeURIComponent(igUserId)}?fields=followers_count,media_count,username&access_token=${encodeURIComponent(accessToken)}`
    const resp = await fetch(url, { cache: 'no-store' })
    if (!resp.ok) {
      const msg = await resp.text()
      const r = NextResponse.json({ error: 'graph_fetch_failed', details: msg, requestId }, { status: 400 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }
    const data = await resp.json()

    // Write stat_snapshot
    try {
      const region = getRegion()
      const ddb = new DynamoDBClient({ region })
      const ts = new Date().toISOString()
      const day = ts.slice(0, 10)
      const eventId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      const payload = {
        username: data?.username ?? null,
        media_count: data?.media_count ?? null,
        followers_count: data?.followers_count ?? null,
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
      console.error('[instagram-snapshot] failed to persist stat_snapshot', error)
    }

    const r = NextResponse.json({ success: true, snapshot: data, requestId })
    r.headers.set('X-Request-Id', requestId)
    return r
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined
    const r = NextResponse.json({ error: 'Internal server error', requestId, details: message }, { status: 500 })
    r.headers.set('X-Request-Id', requestId)
    return r
  }
}
