import { query } from '@/src/lib/db/pg'

export async function insertPlan(opts: { id: string; source: string; accountId: string; raw: any }) {
  await query('insert into ai_plan (id, source, account_id, raw) values ($1,$2,$3,$4)', [opts.id, opts.source, opts.accountId, JSON.stringify(opts.raw)])
}

export async function insertPlanItems(planId: string, items: Array<{ id: string; platform: string; content: any; scheduled_at?: string }>) {
  for (const it of items) {
    await query('insert into ai_plan_item (id, plan_id, platform, scheduled_at, content, status) values ($1,$2,$3,$4,$5,$6)', [it.id, planId, it.platform, it.scheduled_at || null, JSON.stringify(it.content), 'scheduled'])
  }
}

export async function getPlan(planId: string) {
  const p = await query('select * from ai_plan where id = $1', [planId])
  if (!p.rowCount) return null
  const items = await query('select * from ai_plan_item where plan_id = $1 order by scheduled_at nulls last, id asc', [planId])
  return { plan: p.rows[0], items: items.rows }
}

