import { NextResponse } from 'next/server'
import { processDueTikTokStatusJobs } from '@/src/lib/tiktok/worker'

export const runtime = 'nodejs'

async function handler() {
  const { processed } = await processDueTikTokStatusJobs(50)
  return NextResponse.json({ processed })
}

export const GET = handler as any
export const POST = GET
export const HEAD = GET
