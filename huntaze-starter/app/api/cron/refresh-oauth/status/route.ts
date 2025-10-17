import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { withMonitoring } from '@/lib/monitoring'

function getRegion(): string {
  return process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
}

const getHandler = async (_req: NextRequest): Promise<NextResponse> => {
  void _req
  const region = getRegion()
  const ddb = new DynamoDBClient({ region })
  const table = process.env.ANALYTICS_TABLE || 'huntaze-analytics-events'

  const sinceDays = 7
  const sinceIso = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString()

  try {
    const res = await ddb.send(new ScanCommand({
      TableName: table,
      FilterExpression: '#ts >= :since AND #type = :t',
      ExpressionAttributeNames: { '#ts': 'ts', '#type': 'type' },
      ExpressionAttributeValues: { ':since': { S: sinceIso }, ':t': { S: 'token_refresh' } },
      ProjectionExpression: 'platform, ts, payload',
    }))

    const items = res.Items || []
    const out: Record<string, { ok: number; error: number }> = {}
    for (const it of items) {
      const platform = it.platform?.S || 'unknown'
      const payloadStr = it.payload?.S
      let status: string | undefined
      if (payloadStr) {
        try {
          const parsed = JSON.parse(payloadStr) as { status?: unknown }
          if (typeof parsed.status === 'string') {
            status = parsed.status
          }
        } catch (error) {
          console.warn('[cron-refresh-status] parse_failed', error)
        }
      }
      if (!out[platform]) out[platform] = { ok: 0, error: 0 }
      if (status === 'ok') out[platform].ok += 1
      else out[platform].error += 1
    }

    return NextResponse.json({ since: sinceIso, data: out })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ error: 'Failed to load status', details: message }, { status: 500 })
  }
}

export const GET = withMonitoring(getHandler, 'cron-refresh-oauth-status-get')
