import { NextResponse } from 'next/server'
import { registry, ensureDefaultMetrics, contentType } from '@/lib/prom'

export const runtime = 'nodejs'

async function handler() {
  ensureDefaultMetrics()
  const body = await registry.metrics()
  return new NextResponse(body, {
    status: 200,
    headers: { 'content-type': contentType },
  })
}

export const GET = handler
export const HEAD = handler
