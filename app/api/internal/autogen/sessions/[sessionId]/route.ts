export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

const BASE = process.env.AGENTS_API_URL || process.env.AUTOGEN_SERVICE_URL || 'https://app.huntaze.com/autogen'

export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  const r = await fetch(`${BASE}/sessions/${params.sessionId}`, { cache: 'no-store' })
  const text = await r.text()
  return new NextResponse(text, { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/json' } })
}
