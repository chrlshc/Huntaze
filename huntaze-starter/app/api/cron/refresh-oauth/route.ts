import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { handler as refreshHandler } from '@/lambda/refresh-oauth-tokens/index'
import { withMonitoring } from '@/lib/monitoring'

function unauthorized(requestId: string, msg = 'Unauthorized') {
  const r = NextResponse.json({ error: msg, requestId }, { status: 401 })
  r.headers.set('X-Request-Id', requestId)
  return r
}

const postHandler = async (req: NextRequest): Promise<NextResponse> => {
  const requestId = crypto.randomUUID()
  const auth = req.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET
  if (!expected || !auth.startsWith('Bearer ') || auth.substring(7) !== expected) {
    return unauthorized(requestId)
  }

  try {
    const result = await refreshHandler()
    const r = NextResponse.json({ success: true, result, requestId })
    r.headers.set('X-Request-Id', requestId)
    return r
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    const r = NextResponse.json({ error: 'Execution failed', details: message, requestId }, { status: 500 })
    r.headers.set('X-Request-Id', requestId)
    return r
  }
}

export const POST = withMonitoring(postHandler, 'cron-refresh-oauth-post')
