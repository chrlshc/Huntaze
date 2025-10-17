import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import { withMonitoring } from '@/lib/monitoring'

function getRegion(): string {
  return process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
}

function sinceToDate(since: string): Date {
  const now = new Date()
  const value = since.trim().toLowerCase()
  if (value.endsWith('h')) {
    const hours = Number.parseInt(value.slice(0, -1), 10)
    if (!Number.isNaN(hours)) return new Date(now.getTime() - hours * 3600000)
  }
  if (value.endsWith('d')) {
    const days = Number.parseInt(value.slice(0, -1), 10)
    if (!Number.isNaN(days)) return new Date(now.getTime() - days * 86400000)
  }
  const numericDays = Number.parseInt(value, 10)
  if (!Number.isNaN(numericDays)) return new Date(now.getTime() - numericDays * 86400000)
  return new Date(now.getTime() - 7 * 86400000)
}

const getHandler = async (req: NextRequest): Promise<NextResponse> => {
  const region = getRegion()
  const ddb = new DynamoDBClient({ region })
  const url = new URL(req.url)
  const since = (url.searchParams.get('timeRange') || '7d').trim()
  const table = process.env.ANALYTICS_TABLE || 'huntaze-analytics-events'

  try {
    const sinceIso = sinceToDate(since).toISOString()
    let exclusiveStartKey: Record<string, AttributeValue> | undefined
    const results: Array<{ platform?: string; type?: string }> = []
    do {
      const res = await ddb.send(new ScanCommand({
        TableName: table,
        ExclusiveStartKey: exclusiveStartKey,
        FilterExpression: '#ts >= :since',
        ExpressionAttributeNames: { '#ts': 'ts' },
        ExpressionAttributeValues: { ':since': { S: sinceIso } },
        ProjectionExpression: 'platform, type',
      }))
      for (const it of res.Items || []) {
        results.push({ platform: it.platform?.S, type: it.type?.S })
      }
      exclusiveStartKey = res.LastEvaluatedKey
    } while (exclusiveStartKey)

    const metrics = { totalRevenue: 0, fanEngagement: { active: 0 } }
    const byType: Record<string, number> = {}
    for (const r of results) {
      const key = r.type || 'unknown'
      byType[key] = (byType[key] || 0) + 1
    }
    metrics.fanEngagement.active = byType['message'] || 0

    return NextResponse.json({ success: true, metrics, counts: byType })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

const postHandler = async (req: NextRequest): Promise<NextResponse> => {
  const region = getRegion()
  const ddb = new DynamoDBClient({ region })
  const table = process.env.ANALYTICS_TABLE || 'huntaze-analytics-events'

  try {
    const { type, platform, payload } = await req.json()
    if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 })
    const ts = new Date().toISOString()
    const day = ts.slice(0, 10)
    const eventId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const item: Record<string, AttributeValue> = {
      day: { S: day },
      sk: { S: `ts#${ts}#${eventId}` },
      ts: { S: ts },
      eventId: { S: eventId },
      platform: { S: String(platform || 'unknown') },
      type: { S: String(type) },
      payload: { S: JSON.stringify(payload || {}) },
    }
    const ttlDays = parseInt(process.env.ANALYTICS_TTL_DAYS || '60', 10)
    const ttlSec = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60
    item.ttl = { N: String(ttlSec) }
    await ddb.send(new PutItemCommand({ TableName: table, Item: item }))
    return NextResponse.json({ success: true, id: eventId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export const GET = withMonitoring(getHandler, 'analytics-track-get')
export const POST = withMonitoring(postHandler, 'analytics-track-post')
