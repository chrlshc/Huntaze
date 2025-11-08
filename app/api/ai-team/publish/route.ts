import { NextRequest, NextResponse } from 'next/server'
import { withMonitoring } from '@/lib/observability/bootstrap'
import { PostSchedulerAgent } from '@/src/lib/agents/content-pipeline'

export const runtime = 'nodejs'

async function handler(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { correlation, contents, platforms } = body || {}
  if (!correlation || !Array.isArray(contents) || !Array.isArray(platforms)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })
  }
  const agent = new PostSchedulerAgent()
  await agent.onContentReady({ correlation, contents, platforms })
  return NextResponse.json({ status: 'accepted', correlation, counts: { contents: contents.length, platforms: platforms.length } }, { status: 202, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })
}

export const POST = withMonitoring('ai-team.publish', handler as any)
export const GET = POST
export const HEAD = POST

