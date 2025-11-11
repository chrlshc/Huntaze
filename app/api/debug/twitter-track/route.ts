import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/src/lib/redis'
import { checkRateLimit, idFromRequestHeaders } from '@/src/lib/rate-limit'

export const runtime = 'nodejs'

const SET_KEY = 'twitter:insights:track'

function noindex(res: NextResponse) {
  res.headers.set('X-Robots-Tag', 'noindex')
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export async function GET() {
  const v = String(process.env.ENABLE_TWITTER || '').toLowerCase()
  const enabled = v === '1' || v === 'true' || v === 'yes' || v === 'on'
  if (!enabled) return noindex(new NextResponse('Not Found', { status: 404 }))
  const r = getRedis()
  const ids = await r.smembers(SET_KEY)
  return noindex(NextResponse.json({ ids: ids || [] }))
}

export async function POST(req: NextRequest) {
  const { prom } = await import('@/src/lib/prom')
  const v = String(process.env.ENABLE_TWITTER || '').toLowerCase()
  const enabled = v === '1' || v === 'true' || v === 'yes' || v === 'on'
  if (!enabled) return noindex(new NextResponse('Not Found', { status: 404 }))
  // Rate limit (Node/ioredis route-level); Edge limiter also active via middleware if configured
  const ident = idFromRequestHeaders(req.headers)
  const limit = ident.kind === 'token' ? 60 : 30
  const rl = await checkRateLimit({ id: ident.id, limit, windowSec: 60 })
  if (!rl.allowed) {
    // try { prom.counters.debugApiRateLimited.labels({ route: 'twitter-track' }).inc() } catch {}
    return noindex(new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(rl.resetSec),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
      },
    }))
  }

  const body = await req.json().catch(() => ({} as any))
  const ids = Array.isArray(body?.ids) ? body.ids : []
  if (!ids.length || !ids.every((x: any) => typeof x === 'string' && /^\d+$/.test(x))) {
    return noindex(NextResponse.json({ error: 'invalid_ids' }, { status: 400 }))
  }
  const r = getRedis()
  await r.sadd(SET_KEY, ...ids)
  try { (prom.counters as any).twitterTrackMutations?.labels?.({ method: 'post' })?.inc(ids.length) } catch {}
  return noindex(NextResponse.json({ ok: true, added: ids.length }))
}

export async function DELETE(req: NextRequest) {
  const { prom } = await import('@/src/lib/prom')
  const v = String(process.env.ENABLE_TWITTER || '').toLowerCase()
  const enabled = v === '1' || v === 'true' || v === 'yes' || v === 'on'
  if (!enabled) return noindex(new NextResponse('Not Found', { status: 404 }))
  const ident = idFromRequestHeaders(req.headers)
  const limit = ident.kind === 'token' ? 60 : 30
  const rl = await checkRateLimit({ id: ident.id, limit, windowSec: 60 })
  if (!rl.allowed) {
    // try { prom.counters.debugApiRateLimited.labels({ route: 'twitter-track' }).inc() } catch {}
    return noindex(new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(rl.resetSec),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
      },
    }))
  }

  const body = await req.json().catch(() => ({} as any))
  const ids = Array.isArray(body?.ids) ? body.ids : []
  if (!ids.every((x: any) => typeof x === 'string' && /^\d+$/.test(x))) {
    return noindex(NextResponse.json({ error: 'invalid_ids' }, { status: 400 }))
  }
  const r = getRedis()
  let removed = 0
  if (ids.length) removed = await r.srem(SET_KEY, ...ids)
  try { (prom.counters as any).twitterTrackMutations?.labels?.({ method: 'delete' })?.inc(ids.length || 1) } catch {}
  return noindex(NextResponse.json({ ok: true, removed }))
}
