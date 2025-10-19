export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { CloudWatchLogsClient, StartQueryCommand, GetQueryResultsCommand } from '@aws-sdk/client-cloudwatch-logs'

const DEFAULT_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
const client = new CloudWatchLogsClient({ region: DEFAULT_REGION })

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

export async function GET(req: NextRequest) {
  try {
    let logGroups = (process.env.API_LOG_GROUP || '').split(',').map(s => s.trim()).filter(Boolean)
    if (!logGroups.length) {
      // Fallback: derive from host for Amplify default domains, or assume prod custom domain.
      const host = (() => { try { return new URL(req.url).host } catch { return '' } })()
      // Pattern: <branch>.<appId>.amplifyapp.com
      const m = host.match(/^([^.]+)\.([^.]+)\.amplifyapp\.com$/)
      if (m) {
        const br = m[1]
        const app = m[2]
        logGroups = [`/aws/amplify/${app}/branches/${br}/compute/default`]
      } else {
        // Custom domain fallback: assume prod branch and known app id if provided
        const app = process.env.AMPLIFY_APP_ID || process.env.APP_ID || 'd33l77zi1h78ce'
        logGroups = [`/aws/amplify/${app}/branches/prod/compute/default`]
      }
    }

    const now = new Date()
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) // today 00:00Z
    const start = new Date(end.getTime() - 24 * 3600 * 1000) // yesterday 00:00Z

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
      runQuery(qStarted, logGroups, start.getTime(), end.getTime()),
      runQuery(qCompleted, logGroups, start.getTime(), end.getTime()),
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
