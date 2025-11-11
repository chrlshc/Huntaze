import { NextRequest, NextResponse } from 'next/server'
import { outboxFetchUnsent, outboxMarkSent } from '@/src/lib/db/outboxRepo'
import { putEvent } from '@/src/lib/aws/eventbridge'

export const runtime = 'nodejs'

async function handler(req: NextRequest) {
  const admin = process.env.ADMIN_TOKEN || process.env.AGENTS_PROXY_TOKEN || ''
  const auth = req.headers.get('authorization') || ''
  const raw = auth.startsWith('Bearer ') ? auth.slice(7) : (req.headers.get('x-admin-token') || '')
  if (!admin || raw !== admin) return new NextResponse('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Bearer', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })

  const rows = await outboxFetchUnsent(50)
  let sent = 0
  for (const r of rows) {
    try { await putEvent(r.event_type, { id: r.aggregate_id, ...r.payload }) } catch { continue }
    await outboxMarkSent(r.id)
    sent++
  }
  return NextResponse.json({ sent }, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
}

export const POST = handler as any
export const GET = POST
export const HEAD = POST
