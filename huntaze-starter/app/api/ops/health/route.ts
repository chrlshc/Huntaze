import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, DescribeTableCommand, DescribeTimeToLiveCommand, ScanCommand } from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import { withMonitoring } from '@/lib/monitoring'

function getRegion(): string {
  return process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
}

const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE || 'huntaze-analytics-events'
const TOKENS_TABLE = process.env.TOKENS_TABLE || 'huntaze-oauth-tokens'

type TimeToLiveStatus = {
  status: string
  attribute?: string
  error?: string
}

async function getTTL(ddb: DynamoDBClient, table: string): Promise<TimeToLiveStatus> {
  try {
    const r = await ddb.send(new DescribeTimeToLiveCommand({ TableName: table }))
    return { status: r.TimeToLiveDescription?.TimeToLiveStatus || 'UNKNOWN', attribute: r.TimeToLiveDescription?.AttributeName || undefined }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return { status: 'ERROR', error: message }
  }
}

async function tableExists(ddb: DynamoDBClient, table: string) {
  try {
    await ddb.send(new DescribeTableCommand({ TableName: table }))
    return true
  } catch {
    return false
  }
}

function sinceToDate(hoursBack: number): string {
  const d = new Date(Date.now() - hoursBack * 3600000)
  return d.toISOString()
}

async function recentCounts(ddb: DynamoDBClient, table: string, sinceIso: string): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  let exclusiveStartKey: Record<string, AttributeValue> | undefined
  do {
    const res = await ddb.send(new ScanCommand({
      TableName: table,
      ExclusiveStartKey: exclusiveStartKey,
      FilterExpression: '#ts >= :since',
      ExpressionAttributeNames: { '#ts': 'ts' },
      ExpressionAttributeValues: { ':since': { S: sinceIso } },
      ProjectionExpression: 'type',
    }))
    for (const it of res.Items || []) {
      const type = it.type?.S || 'unknown'
      out[type] = (out[type] || 0) + 1
    }
    exclusiveStartKey = res.LastEvaluatedKey
  } while (exclusiveStartKey)
  return out
}

const getHandler = async (_req: NextRequest): Promise<NextResponse> => {
  void _req
  if (process.env.OPS_UI_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const region = getRegion()
  const ddb = new DynamoDBClient({ region })
  const sinceIso = sinceToDate(24)

  const [analyticsExists, tokensExists] = await Promise.all([
    tableExists(ddb, ANALYTICS_TABLE),
    tableExists(ddb, TOKENS_TABLE),
  ])

  const ttl = analyticsExists ? await getTTL(ddb, ANALYTICS_TABLE) : { status: 'NOT_FOUND' as const }
  const counts = analyticsExists ? await recentCounts(ddb, ANALYTICS_TABLE, sinceIso) : {}

  const sqs = {
    instagram: { present: !!process.env.SQS_PUBLISHER_INSTAGRAM_URL, url: process.env.SQS_PUBLISHER_INSTAGRAM_URL || null },
    tiktok: { present: !!process.env.SQS_PUBLISHER_TIKTOK_URL, url: process.env.SQS_PUBLISHER_TIKTOK_URL || null },
    reddit: { present: !!process.env.SQS_PUBLISHER_REDDIT_URL, url: process.env.SQS_PUBLISHER_REDDIT_URL || null },
  }

  return NextResponse.json({
    region,
    tables: {
      analytics: { name: ANALYTICS_TABLE, exists: analyticsExists, ttl },
      tokens: { name: TOKENS_TABLE, exists: tokensExists },
    },
    sqs,
    recent: { since: sinceIso, counts },
  })
}

export const GET = withMonitoring(getHandler, 'ops-health-get')
