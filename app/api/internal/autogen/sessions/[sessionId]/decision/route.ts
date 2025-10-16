import { NextResponse } from 'next/server'

const BASE = process.env.AGENTS_API_URL || process.env.AUTOGEN_SERVICE_URL || 'https://app.huntaze.com/autogen'

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  const body = await req.text()
  const r = await fetch(`${BASE}/sessions/${params.sessionId}/human_decision`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
  const text = await r.text()
  return new NextResponse(text, { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/json' } })
}
