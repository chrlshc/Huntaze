import { NextResponse } from 'next/server'
import { processInsightsSchedule } from '@/src/lib/insights/schedulerWorker'
import { seedFromTrackedSets } from '@/src/lib/insights/scheduler'

export const runtime = 'nodejs'

function isEnabled() {
  const t = String(process.env.ENABLE_TIKTOK_INSIGHTS || '').toLowerCase()
  const i = String(process.env.ENABLE_INSTAGRAM_INSIGHTS || '').toLowerCase()
  return (t === '1' || t === 'true' || t === 'yes' || t === 'on') || (i === '1' || i === 'true' || i === 'yes' || i === 'on')
}

async function handler() {
  if (!isEnabled()) return new NextResponse('Not Found', { status: 404, headers: { 'X-Robots-Tag': 'noindex', 'cache-control': 'no-store' } })
  // Seed once (idempotent enough) — optional
  await seedFromTrackedSets()
  const res = await processInsightsSchedule(200)
  return NextResponse.json(res, { headers: { 'cache-control': 'no-store', 'X-Robots-Tag': 'noindex' } })
}

export const GET = handler as any
export const POST = GET
export const HEAD = GET
