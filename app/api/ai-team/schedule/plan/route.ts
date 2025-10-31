import { NextRequest, NextResponse } from 'next/server'
import { withMonitoring } from '@/lib/observability/bootstrap'
import { PlanRequest } from '@/src/lib/agents/events'
import { azurePlannerAgent } from '@/src/lib/agents/azure-planner'
import { getBus } from '@/src/lib/bus'

export const runtime = 'nodejs'

async function handler(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = PlanRequest.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })

  // Simple delegator: if Azure AI Team enabled, use it, else 404
  const enabled = String(process.env.ENABLE_AZURE_AI_TEAM || '').toLowerCase()
  if (!(enabled === '1' || enabled === 'true' || enabled === 'yes' || enabled === 'on')) {
    return new NextResponse('Not Found', { status: 404, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })
  }

  const plan = await azurePlannerAgent(parsed.data)
  const evt = { correlation: parsed.data.correlation, contents: plan.contents, platforms: plan.platforms }
  await getBus().publish('CONTENT_READY', evt)
  return NextResponse.json({ status: 'accepted', correlation: parsed.data.correlation, counts: { contents: plan.contents.length, platforms: plan.platforms.length } }, { status: 202, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })
}

export const POST = withMonitoring('ai-team.plan', handler)
export const GET = POST
export const HEAD = POST
