import { NextResponse } from 'next/server'

const FUNC_BASE = process.env.FUNC_BASE || ''
const FUNC_KEY = process.env.FUNC_KEY || ''

export async function POST(req: Request) {
  if (!FUNC_BASE) return NextResponse.json({ error: 'FUNC_BASE not configured' }, { status: 500 })
  const body = await req.text()
  const r = await fetch(`${FUNC_BASE}/api/triage/classify`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(FUNC_KEY ? { 'x-functions-key': FUNC_KEY } : {}),
    },
    body,
    cache: 'no-store',
  })
  const text = await r.text()
  return new NextResponse(text, {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') || 'application/json' },
  })
}

