import { NextResponse } from 'next/server'

const FUNC_BASE = process.env.FUNC_BASE || ''
const FUNC_KEY = process.env.FUNC_KEY || ''

export async function GET(_req: Request, ctx: { params: { fan_id: string } }) {
  if (!FUNC_BASE) return NextResponse.json({ error: 'FUNC_BASE not configured' }, { status: 500 })
  const url = new URL(`${FUNC_BASE}/api/fan360/${encodeURIComponent(ctx.params.fan_id)}`)
  // pass-through common defaults
  url.searchParams.set('window_days', '30')
  const r = await fetch(url.toString(), {
    headers: { ...(FUNC_KEY ? { 'x-functions-key': FUNC_KEY } : {}) },
    cache: 'no-store',
  })
  const text = await r.text()
  return new NextResponse(text, {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') || 'application/json' },
  })
}

