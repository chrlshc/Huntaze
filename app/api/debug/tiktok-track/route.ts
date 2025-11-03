import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/src/lib/redis'
import { checkRateLimit, idFromRequestHeaders } from '@/src/lib/rate-limit'

export const runtime = 'nodejs'

const SET_KEY = 'tiktok:insights:track'

function noindex(res: NextResponse) {
  res.headers.set('X-Robots-Tag', 'noindex')
  res.headers.set('Cache-Control', 'no-store')
  return res
}

function enabled() {
  const v = String(process.env.ENABLE_TIKTOK_INSIGHTS || '').toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

export async function GET() {
  if (!enabled()) return noindex(new NextResponse('Not Found', { status: 404 }))
  const r = getRedis()
  const ids = await r.smembers(SET_KEY)
  return noindex(NextResponse.json({ ids: ids || [] }))
}

export async function POST(req: NextRequest) {
  if (!enabled()) return noindex(new NextResponse('Not Found', { status: 404 }))
  const ident = idFromRequestHeaders(req.headers)
  const limit = ident.kind === 'token' ? 60 : 30
  const rl = await checkRateLimit({ id: ident.id, limit, windowSec: 60 })
  if (!rl.allowed) {
    return noindex(new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': String(rl.resetSec), 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': '0' } }))
  }
  const body = await req.json().catch(() => ({} as any))
  const ids = Array.isArray(body?.ids) ? body.ids : []
  if (!ids.length || !ids.every((x: any) => typeof x === 'string' && x.length > 0)) {
    return noindex(NextResponse.json({ error: 'invalid_ids' }, { status: 400 }))
  }
  const r = getRedis()
  await r.sadd(SET_KEY, ...ids)
  return noindex(NextResponse.json({ ok: true, added: ids.length }))
}

export async function DELETE(req: NextRequest) {
  if (!enabled()) return noindex(new NextResponse('Not Found', { status: 404 }))
  const ident = idFromRequestHeaders(req.headers)
  const limit = ident.kind === 'token' ? 60 : 30
  const rl = await checkRateLimit({ id: ident.id, limit, windowSec: 60 })
  if (!rl.allowed) {
    return noindex(new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': String(rl.resetSec), 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': '0' } }))
  }
  const body = await req.json().catch(() => ({} as any))
  const ids = Array.isArray(body?.ids) ? body.ids : []
  if (!ids.every((x: any) => typeof x === 'string' && x.length > 0)) {
    return noindex(NextResponse.json({ error: 'invalid_ids' }, { status: 400 }))
  }
  const r = getRedis()
  const removed = ids.length ? await r.srem(SET_KEY, ...ids) : 0
  return noindex(NextResponse.json({ ok: true, removed }))
}

