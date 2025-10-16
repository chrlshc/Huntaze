export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import crypto from 'crypto'

const SECRET = process.env.AUTOGEN_HMAC_SECRET || 'change-me'

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

export async function POST(req: Request) {
  // Raw body first (signature must be computed on raw bytes)
  const raw = await req.text()
  const sig = req.headers.get('x-autogen-signature') || ''
  const ts = req.headers.get('x-autogen-timestamp') || ''

  // Reject stale or missing timestamp (>5min)
  const ageSec = Math.abs(Date.now() - Number(ts)) / 1000
  if (!ts || !Number.isFinite(Number(ts)) || ageSec > 300) {
    return new NextResponse('stale', { status: 400 })
  }

  // signature = sha256( SECRET, ts + '.' + raw ) prefixed with 'sha256='
  const mac = crypto.createHmac('sha256', SECRET).update(`${ts}.${raw}`, 'utf8').digest('hex')
  if (!safeEqual(`sha256=${mac}`, sig)) {
    return new NextResponse('bad sig', { status: 401 })
  }

  const evt = JSON.parse(raw)
  // TODO: persist/dispatch event (review_needed|progress|done|error)
  return NextResponse.json({ ok: true, type: evt?.type || 'unknown' })
}
