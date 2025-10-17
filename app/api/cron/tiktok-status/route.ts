import { NextResponse } from 'next/server'
import { withMonitoring } from '@/lib/observability/bootstrap'
import { processDueTikTokStatusJobs } from '@/src/lib/tiktok/worker'

export const runtime = 'nodejs'

async function handler() {
  const { processed } = await processDueTikTokStatusJobs(50)
  return NextResponse.json({ processed })
}

export const GET = withMonitoring('cron.tiktok-status', handler)
export const POST = GET
export const HEAD = GET

