import { NextResponse } from 'next/server'

const BASE = process.env.AGENTS_API_URL || process.env.AUTOGEN_SERVICE_URL || 'https://app.huntaze.com/autogen'

export async function POST(req: Request) {
  const body = await req.text()
  const r = await fetch(`${BASE}/draft`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    // Forward auth headers if needed in the future
  })
  const text = await r.text()
  return new NextResponse(text, { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/json' } })
}
