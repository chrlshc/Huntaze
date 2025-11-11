import { NextRequest, NextResponse } from 'next/server'
import { getLatestInsightSummary } from '@/src/lib/db/summaryRepo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function handler(req: NextRequest) {
  const url = new URL(req.url)
  const accountId = url.searchParams.get('account_id') || ''
  const period = url.searchParams.get('period') || undefined
  if (!accountId) return NextResponse.json({ error: 'account_id required' }, { status: 400 })
  const s = await getLatestInsightSummary(accountId, period)
  if (!s) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(s, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
}

export const GET = handler as any
export const HEAD = GET
