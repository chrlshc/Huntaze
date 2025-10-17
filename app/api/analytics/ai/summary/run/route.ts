import { NextRequest, NextResponse } from 'next/server'
import { withMonitoring } from '@/lib/observability/bootstrap'
import { insertInsightSummary } from '@/src/lib/db/summaryRepo'

export const runtime = 'nodejs'

async function handler(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const accountId = String(body?.account_id || '')
  const period = String(body?.period || '7d')
  const platform = String(body?.platform || 'instagram')
  if (!accountId) return NextResponse.json({ error: 'account_id required' }, { status: 400 })

  // For now, insert a placeholder summary; in prod, invoke summarizer worker
  const summary = {
    period,
    kpis: { reach: { value: 0, delta_pct: 0 }, engagement_rate: { value: 0, delta_pct: 0 } },
    recommendations: [ 'Connect summarizer worker to generate real insights.' ],
  }
  await insertInsightSummary({ platform, accountId, period, summary })
  return NextResponse.json({ status: 'accepted' }, { status: 202, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
}

export const POST = withMonitoring('analytics.ai.summary.run', handler)
export const GET = POST
export const HEAD = POST

