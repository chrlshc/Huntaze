import { NextRequest, NextResponse } from 'next/server'
import { withMonitoring } from '@/lib/observability/bootstrap'
import { PlanRequest, ContentReady } from '@/src/lib/agents/events'
import { azurePlannerAgent } from '@/src/lib/agents/azure-planner'
import { getBus } from '@/src/lib/bus'
import { insertPlan, insertPlanItems } from '@/src/lib/db/planRepo'
import { outboxInsert } from '@/src/lib/db/outboxRepo'
import crypto from 'crypto'

export const runtime = 'nodejs'

function enabled() {
  const v = String(process.env.ENABLE_AZURE_AI_TEAM || '').toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

async function handler(req: NextRequest) {
  if (!enabled()) return new NextResponse('Not Found', { status: 404, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })
  const body = await req.json().catch(() => ({}))
  const parsed = PlanRequest.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })

  const { correlation } = parsed.data
  const plan = await azurePlannerAgent(parsed.data)
  const planId = crypto.randomUUID()
  // persist plan & items
  await insertPlan({ id: planId, source: 'azure_planner', accountId: parsed.data.preferences?.account_id || 'unknown', raw: plan })
  const items = plan.contents.map((c) => ({ id: crypto.randomUUID(), platform: (plan.platforms[0] || 'instagram'), content: c }))
  await insertPlanItems(planId, items)

  const evt = { correlation, contents: plan.contents, platforms: plan.platforms }
  const ok = ContentReady.safeParse(evt).success
  if (!ok) return NextResponse.json({ error: 'invalid_plan' }, { status: 500, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })

  await getBus().publish('CONTENT_READY', evt)
  await outboxInsert({ aggregateType: 'ai_plan', aggregateId: planId, eventType: 'CONTENT_READY', payload: { correlation, platforms: plan.platforms, items: plan.contents.length } })
  return NextResponse.json({ status: 'accepted', correlation, plan_id: planId, counts: { contents: plan.contents.length, platforms: plan.platforms.length } }, { status: 202, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })
}

export const POST = withMonitoring('ai-team.plan.azure', handler as any)
export const GET = POST
export const HEAD = POST
