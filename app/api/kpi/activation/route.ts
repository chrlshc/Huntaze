export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { CloudWatchLogsClient, StartQueryCommand, GetQueryResultsCommand } from '@aws-sdk/client-cloudwatch-logs'

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
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

export async function GET(req: NextRequest) {
  try {
    // Resolve log groups: prefer env, fallback to host-derived default
    let logGroups = (process.env.API_LOG_GROUP || '').split(',').map(s => s.trim()).filter(Boolean)
    if (!logGroups.length) {
      const host = (() => { try { return new URL(req.url).host } catch { return '' } })()
      // Map custom domains to branches
      let br = 'prod'
      if (/^kpi\./i.test(host) || /(^|\.)kpi\.huntaze\.com$/i.test(host)) br = 'kpi'
      else if (/^stagging\./i.test(host) || /(^|\.)stagging\.huntaze\.com$/i.test(host)) br = 'stagging'
      // Amplify default domain pattern: <branch>.<appId>.amplifyapp.com
      const m = host.match(/^([^.]+)\.([^.]+)\.amplifyapp\.com$/)
      const app = m ? m[2] : (process.env.AMPLIFY_APP_ID || process.env.APP_ID || 'd33l77zi1h78ce')
      if (m) br = m[1] || br
      logGroups = [`/aws/amplify/${app}/branches/${br}/compute/default`]
    }
    // Windows to try: 24h → 6h → 1h → 15m → 5m
    const end = new Date()
    const windowsMs = [24*3600*1000, 6*3600*1000, 3600*1000, 15*60*1000, 5*60*1000]

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

    let rsStarted: any[] = []
    let rsCompleted: any[] = []
    let usedStart = new Date(end.getTime() - windowsMs[0])
    let ok = false
    for (const w of windowsMs) {
      const s = new Date(end.getTime() - w)
      try {
        const [a, b] = await Promise.all([
          runQuery(qStarted, logGroups, s.getTime(), end.getTime()),
          runQuery(qCompleted, logGroups, s.getTime(), end.getTime()),
        ])
        rsStarted = a || []
        rsCompleted = b || []
        usedStart = s
        ok = true
        break
      } catch (e) {
        // try next window
      }
    }
    if (!ok) {
      return Response.json({ date: new Date(end.getTime() - windowsMs[0]).toISOString().slice(0,10), started: 0, completed: 0, activation_rate: 0 })
    }

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

    return Response.json({ date: usedStart.toISOString().slice(0, 10), started, completed, activation_rate })
  } catch (e: any) {
    return Response.json({ error: e?.message || 'query_failed' }, { status: 500 })
  }
}
