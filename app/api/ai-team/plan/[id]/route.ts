import { NextRequest, NextResponse } from 'next/server'
import { withMonitoring } from '@/lib/observability/bootstrap'
import { getPlan } from '@/src/lib/db/planRepo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function handler(req: NextRequest, ctx: { params: { id: string } }) {
  const pid = ctx.params.id
  if (!pid) return NextResponse.json({ error: 'missing id' }, { status: 400 })
  const data = await getPlan(pid)
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
}

export const GET = withMonitoring('ai-team.plan.get', handler as any)
export const HEAD = GET
