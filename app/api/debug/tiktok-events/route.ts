import { NextResponse, NextRequest } from 'next/server'
import { getRedis } from '@/src/lib/redis'
import { checkRateLimit, idFromRequestHeaders } from '@/src/lib/rate-limit'
import { prom } from '@/src/lib/prom'

export const dynamic = 'force-dynamic'

type EventRow = { videoId: string; type: string; tsMs: number; payload?: unknown }

export async function GET(req: NextRequest) {
  // Lightweight rate limiting: 60 rpm for token users, 30 rpm by IP otherwise
  const ident = idFromRequestHeaders(req.headers)
  const limit = ident.kind === 'token' ? 60 : 30
  const { allowed, remaining, resetSec } = await checkRateLimit({ id: ident.id, limit, windowSec: 60 })
  if (!allowed) {
    try { prom.counters.debugApiRateLimited.labels({ route: 'tiktok-events' }).inc() } catch {}
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(resetSec),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'Cache-Control': 'no-store',
      },
    })
  }

  const redis = getRedis()
  const qs = req.nextUrl.searchParams
  const mins = Number(qs.get('mins') ?? '120')
  const pageLimit = Number(qs.get('limit') ?? '200')
  const type = (qs.get('type') ?? '').toLowerCase()
  const q = (qs.get('q') ?? '').toLowerCase()

  const since = Date.now() - mins * 60_000
  const rows: EventRow[] = []

  const globalKey = 'tiktok:events:by-time'
  const hasGlobal = (await redis.exists(globalKey)) === 1

  if (hasGlobal) {
    const vals = await redis.zrangebyscore(globalKey, since, '+inf')
    for (const v of vals) {
      try {
        const ev = JSON.parse(v) as EventRow
        if (type && ev.type.toLowerCase() !== type) continue
        if (q && !String(ev.videoId || '').toLowerCase().includes(q)) continue
        rows.push(ev)
      } catch {}
    }
  } else {
    // Fallback: SCAN per-video event keys
    let cursor = '0'
    const maxScanRows = pageLimit * 2
    do {
      const res = (await redis.scan(cursor, 'MATCH', 'tiktok:events:*', 'COUNT', '500')) as unknown as [string, string[]]
      cursor = res[0]
      const keys = res[1]
      for (const key of keys) {
        if (key.startsWith('tiktok:events:by-type:')) continue
        if (key === globalKey) continue
        const vals = await redis.zrangebyscore(key, since, '+inf')
        const videoId = key.substring('tiktok:events:'.length)
        for (const v of vals) {
          try {
            const ev = JSON.parse(v) as any
            const evType = String(ev?.type || '').toLowerCase()
            if (type && evType !== type) continue
            const row: EventRow = {
              videoId,
              type: ev?.type || 'unknown',
              tsMs: Number(ev?.tsMs || 0),
              payload: ev?.payload,
            }
            if (q && !videoId.toLowerCase().includes(q)) continue
            rows.push(row)
          } catch {}
        }
        if (rows.length >= maxScanRows) break
      }
    } while (cursor !== '0' && rows.length < pageLimit * 2)
  }

  rows.sort((a, b) => b.tsMs - a.tsMs)
  return NextResponse.json(
    { items: rows.slice(0, pageLimit) },
    { headers: { 'cache-control': 'no-store', 'X-Robots-Tag': 'noindex' } }
  )
}
