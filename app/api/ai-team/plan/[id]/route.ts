import { NextRequest, NextResponse } from 'next/server'
import { getPlan } from '@/src/lib/db/planRepo'

export const runtime = 'nodejs'

async function handler(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const pid = params.id
  if (!pid) return NextResponse.json({ error: 'missing id' }, { status: 400 })
  const data = await getPlan(pid)
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
}

export const GET = handler as any
export const HEAD = GET
