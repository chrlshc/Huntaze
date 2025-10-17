import { query } from '@/src/lib/db/pg'

export async function insertInsightSummary(opts: { platform: string; accountId: string; period: string; summary: any }) {
  await query('insert into insight_summary (platform, account_id, period, summary) values ($1,$2,$3,$4)', [opts.platform, opts.accountId, opts.period, JSON.stringify(opts.summary)])
}

export async function getLatestInsightSummary(accountId: string, period?: string) {
  if (period) {
    const r = await query('select * from insight_summary where account_id=$1 and period=$2 order by created_at desc limit 1', [accountId, period])
    return r.rowCount ? r.rows[0] : null
  }
  const r = await query('select * from insight_summary where account_id=$1 order by created_at desc limit 1', [accountId])
  return r.rowCount ? r.rows[0] : null
}

