import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import crypto from 'crypto'
import { authOptions } from '@/lib/auth/options'

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
    const accessToken = body?.accessToken || process.env.IG_GRAPH_ACCESS_TOKEN
    if (!accessToken) {
      const r = NextResponse.json({ error: 'missing_access_token', requestId }, { status: 400 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }

    // Refresh long-lived token to extend validity
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(accessToken)}`
    const resp = await fetch(url, { cache: 'no-store' })
    const text = await resp.text()
    if (!resp.ok) {
      const r = NextResponse.json({ error: 'refresh_failed', details: text, requestId }, { status: 400 })
      r.headers.set('X-Request-Id', requestId)
      return r
    }
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }

    // Do not persist here (starter); return payload so ops can rotate secret
    const r = NextResponse.json({ success: true, token: data, requestId })
    r.headers.set('X-Request-Id', requestId)
    return r
  } catch (error) {
    const r = NextResponse.json({ error: 'Internal server error', requestId, details: error instanceof Error ? error.message : undefined }, { status: 500 })
    r.headers.set('X-Request-Id', requestId)
    return r
  }
}
