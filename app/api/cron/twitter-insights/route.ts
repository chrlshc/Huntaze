import { NextResponse } from 'next/server'
import { withMonitoring } from '@/lib/observability/bootstrap'
import { processTwitterInsights } from '@/src/lib/twitter/worker'

export const runtime = 'nodejs'

function isEnabled() {
  const v = String(process.env.ENABLE_TWITTER || '').toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

async function handler() {
  if (!isEnabled()) return new NextResponse('Not Found', { status: 404, headers: { 'X-Robots-Tag': 'noindex', 'cache-control': 'no-store' } })
  const res = await processTwitterInsights()
  return NextResponse.json(res, { headers: { 'cache-control': 'no-store', 'X-Robots-Tag': 'noindex' } })
}

export const GET = withMonitoring('cron.twitter-insights', handler)
export const POST = GET
export const HEAD = GET
