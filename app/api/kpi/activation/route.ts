export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { CloudWatchLogsClient, StartQueryCommand, GetQueryResultsCommand } from '@aws-sdk/client-cloudwatch-logs'

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
const LOG_GROUPS = (process.env.API_LOG_GROUP || '').split(',').map(s => s.trim()).filter(Boolean)

const client = new CloudWatchLogsClient({ region: REGION })

async function runQuery(queryString: string, logGroupNames: string[], startTime: number, endTime: number) {
  const start = await client.send(new StartQueryCommand({
    queryString,
    logGroupNames,
    startTime: Math.floor(startTime / 1000),
    endTime: Math.floor(endTime / 1000),
    limit: 10000,
  }))
  const qid = start.queryId!
  for (let i = 0; i < 60; i++) {
    const r = await client.send(new GetQueryResultsCommand({ queryId: qid }))
    if (r.status === 'Complete') return r.results || []
    await new Promise(res => setTimeout(res, 800))
  }
  return []
}

export async function GET(_req: NextRequest) {
  try {
    if (!LOG_GROUPS.length) return Response.json({ error: 'API_LOG_GROUP not set' }, { status: 500 })

    // Use last 24 hours up to now to avoid creation/retention edge cases on fresh log groups
    const end = new Date()
    const start = new Date(end.getTime() - 24 * 3600 * 1000)

    const qStarted = `
fields @timestamp, @message
| filter @message like /"event":"api_request"/
| parse @message '"route":"*"' as route
| parse @message '"userId":"*"' as userId
| filter route like /onboarding.*start/
| stats count_distinct(userId) as started
`

    const qCompleted = `
fields @timestamp, @message
| filter @message like /"event":"api_request"/
| parse @message '"route":"*"' as route
| parse @message '"status":*' as status
| parse @message '"userId":"*"' as userId
| filter route like /onboarding.*(complete|finish)/ and status >= 200 and status < 300
| stats count_distinct(userId) as completed
`

    const [rsStarted, rsCompleted] = await Promise.all([
      runQuery(qStarted, LOG_GROUPS, start.getTime(), end.getTime()),
      runQuery(qCompleted, LOG_GROUPS, start.getTime(), end.getTime()),
    ])

    const getVal = (rows: any[], field: string) => {
      try {
        const r = rows?.[0] || []
        const kv = Array.isArray(r) ? r.find((f: any) => f?.field === field) : null
        return Number(kv?.value || 0)
      } catch { return 0 }
    }

    const started = getVal(rsStarted as any, 'started')
    const completed = getVal(rsCompleted as any, 'completed')
    const activation_rate = started ? Math.round((completed * 10000) / started) / 100 : 0

    return Response.json({ date: start.toISOString().slice(0, 10), started, completed, activation_rate })
  } catch (e: any) {
    return Response.json({ error: e?.message || 'query_failed' }, { status: 500 })
  }
}
