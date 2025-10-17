import { NextResponse } from 'next/server'
import { withMonitoring } from '@/lib/observability/bootstrap'
import { incCounter } from '@/lib/metrics'
import { addEvent, setTerminal } from '@/src/lib/tiktok/events'
import { getRedis } from '@/src/lib/redis'
import crypto from 'crypto'

export const runtime = 'nodejs'

function verifySignature(rawBody: string, headers: Headers) {
  const secret = process.env.TIKTOK_WEBHOOK_SECRET
  if (!secret) return true
  const sig =
    headers.get('x-tt-webhook-signature') ||
    headers.get('x-tiktok-signature') ||
    headers.get('x-signature') ||
    ''
  if (!sig) return false
  const h = crypto.createHmac('sha256', secret)
  h.update(Buffer.from(rawBody, 'utf-8'))
  const expected = h.digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

async function handler(req: Request) {
  const raw = await req.text()
  if (!verifySignature(raw, req.headers)) {
    return new NextResponse('invalid signature', { status: 401 })
  }
  // Replay protection if timestamp header exists (10 min skew)
  const tsHeader = req.headers.get('x-tt-webhook-timestamp') || req.headers.get('x-timestamp')
  if (tsHeader) {
    const ts = Number(tsHeader)
    if (Number.isFinite(ts)) {
      const skew = Math.abs(Date.now() - ts * 1000)
      if (skew > 10 * 60 * 1000) return new NextResponse('stale', { status: 400, headers: { 'X-Robots-Tag': 'noindex' } })
    }
  }

  // Idempotency: hash raw body and skip duplicates for 10 minutes
  try {
    const cryptoMod = await import('crypto')
    const idemKey = 'tt:wh:idem:' + cryptoMod.createHash('sha256').update(raw).digest('hex')
    const redis = getRedis()
    const set = await redis.set(idemKey, '1', 'EX', 600, 'NX')
    if (set !== 'OK') return new NextResponse(null, { status: 204, headers: { 'X-Robots-Tag': 'noindex' } })
  } catch {}
  const payload = JSON.parse(raw || '{}') as any
  const type = String(payload?.event || payload?.type || 'unknown')
  const videoId = String(payload?.data?.video_id || payload?.video_id || '')

  incCounter('social_tiktok_webhook_events_total', { type })

  // Persist event timeline + attempt terminal transition
  const now = Date.now()
  await addEvent(videoId, `WEBHOOK:${type}`, now, payload)

  const t = type.toUpperCase()
  if (t.includes('SUCCESS') || t.includes('PUBLISHED')) {
    await setTerminal(videoId, 'PUBLISHED', now)
  } else if (t.includes('FAILED') || t.includes('ERROR')) {
    await setTerminal(videoId, 'FAILED', now)
  }

  return new NextResponse(null, { status: 204, headers: { 'X-Robots-Tag': 'noindex' } })
}

export const POST = withMonitoring('webhooks.tiktok', handler)
export const GET = POST
export const HEAD = POST
