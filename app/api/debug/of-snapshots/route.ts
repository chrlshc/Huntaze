import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'

const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE || 'huntaze-analytics-events'

export async function GET(request: NextRequest) {
  // Secured via cron secret for now (avoid exposing in prod). Adjust as needed.
  const cronSecret = request.headers.get('x-cron-secret')
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const day = request.nextUrl.searchParams.get('day') || new Date().toISOString().slice(0, 10)
  const limit = Number(request.nextUrl.searchParams.get('limit') || '25')

  const ddb = new DynamoDBClient({ region: REGION })
  // Debug endpoint – do not use Scan in hot paths
  const out = await ddb.send(new ScanCommand({ TableName: ANALYTICS_TABLE, Limit: limit }))
  const items = (out.Items || [])
    .filter((it) => (it.day?.S || '').startsWith(day))
    .map((it) => ({
      day: it.day?.S,
      sk: it.sk?.S,
      ts: it.ts?.S,
      type: it.type?.S,
      provider: it.provider?.S,
      payload: (() => { try { return JSON.parse(it.payload?.S || '{}') } catch { return {} } })(),
    }))

  return NextResponse.json({ ok: true, count: items.length, items })
}

