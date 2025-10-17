import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, QueryCommand, DescribeTableCommand, ScanCommand } from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import { withMonitoring } from '@/lib/monitoring'

function getRegion(): string {
  return process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
}

function daysBack(n: number): string[] {
  const out: string[] = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    const di = new Date(d.getTime() - i * 24 * 60 * 60 * 1000)
    out.push(di.toISOString().slice(0, 10))
  }
  return out
}

function sinceToDate(since: string): Date {
  const now = new Date()
  const value = since.trim().toLowerCase()
  if (value.endsWith('h')) {
    const hours = Number.parseInt(value.slice(0, -1), 10)
    if (!Number.isNaN(hours)) return new Date(now.getTime() - hours * 60 * 60 * 1000)
  }
  if (value.endsWith('d')) {
    const days = Number.parseInt(value.slice(0, -1), 10)
    if (!Number.isNaN(days)) return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  }
  const numericDays = Number.parseInt(value, 10)
  if (!Number.isNaN(numericDays)) return new Date(now.getTime() - numericDays * 24 * 60 * 60 * 1000)
  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
}

async function tableHasDayKey(ddb: DynamoDBClient, table: string): Promise<boolean> {
  try {
    const desc = await ddb.send(new DescribeTableCommand({ TableName: table }))
    return !!desc.Table?.KeySchema?.some((k) => k.AttributeName === 'day')
  } catch {
    return false
  }
}

async function tableHasByDayGsi(ddb: DynamoDBClient, table: string, indexName = 'byDay'): Promise<boolean> {
  try {
    const desc = await ddb.send(new DescribeTableCommand({ TableName: table }))
    return !!desc.Table?.GlobalSecondaryIndexes?.some((g) => g.IndexName === indexName)
  } catch {
    return false
  }
}

const getHandler = async (req: NextRequest): Promise<NextResponse> => {
  const region = getRegion()
  const ddb = new DynamoDBClient({ region })
  const url = new URL(req.url)
  const since = (url.searchParams.get('since') || '7d').trim()
  const days = since.endsWith('d') ? parseInt(since.slice(0, -1), 10) : 7
  const table = process.env.ANALYTICS_TABLE || 'huntaze-analytics-events'

  const dayKeys = daysBack(Math.min(days, 31))
  const results: Array<{ day?: string; platform?: string; type?: string }> = []

  const hasDay = await tableHasDayKey(ddb, table)
  const hasByDay = await tableHasByDayGsi(ddb, table)
  if (hasDay) {
    for (const day of dayKeys) {
      try {
        const res = await ddb.send(new QueryCommand({
          TableName: table,
          KeyConditionExpression: '#d = :d',
          ExpressionAttributeNames: { '#d': 'day' },
          ExpressionAttributeValues: { ':d': { S: day } },
          ScanIndexForward: false,
        }))
        for (const it of res.Items || []) {
          results.push({ day, platform: it.platform?.S, type: it.type?.S })
        }
      } catch (error) {
        console.warn('[analytics-summary] query_by_day_failed', { day, error })
      }
    }
  } else if (hasByDay) {
    for (const day of dayKeys) {
      try {
        const res = await ddb.send(new QueryCommand({
          TableName: table,
          IndexName: 'byDay',
          KeyConditionExpression: '#d = :d',
          ExpressionAttributeNames: { '#d': 'day' },
          ExpressionAttributeValues: { ':d': { S: day } },
          ScanIndexForward: false,
        }))
        for (const it of res.Items || []) {
          results.push({ day, platform: it.platform?.S, type: it.type?.S })
        }
      } catch (error) {
        console.warn('[analytics-summary] query_by_day_gsi_failed', { day, error })
      }
    }
  } else {
    const sinceIso = sinceToDate(since).toISOString()
    let exclusiveStartKey: Record<string, AttributeValue> | undefined
    do {
      try {
        const res = await ddb.send(new ScanCommand({
          TableName: table,
          ExclusiveStartKey: exclusiveStartKey,
          FilterExpression: '#ts >= :since',
          ExpressionAttributeNames: { '#ts': 'ts' },
          ExpressionAttributeValues: { ':since': { S: sinceIso } },
        }))
        for (const it of res.Items || []) {
          results.push({ day: it.day?.S, platform: it.platform?.S, type: it.type?.S })
        }
        exclusiveStartKey = res.LastEvaluatedKey
      } catch {
        break
      }
    } while (exclusiveStartKey)
  }

  type PlatformSummary = { clicks: number; publish: number; stat_snapshots: number }
  const summary: {
    clicks: number
    publish: number
    stat_snapshots: number
    perPlatform: Record<string, PlatformSummary>
  } = {
    clicks: 0,
    publish: 0,
    stat_snapshots: 0,
    perPlatform: {},
  }

  for (const ev of results) {
    const platform = ev.platform || 'unknown'
    const type = ev.type || 'unknown'
    if (!summary.perPlatform[platform]) {
      summary.perPlatform[platform] = { clicks: 0, publish: 0, stat_snapshots: 0 }
    }
    if (type === 'click') {
      summary.clicks += 1
      summary.perPlatform[platform].clicks += 1
    } else if (type === 'publish') {
      summary.publish += 1
      summary.perPlatform[platform].publish += 1
    } else if (type === 'stat_snapshot') {
      summary.stat_snapshots += 1
      summary.perPlatform[platform].stat_snapshots += 1
    }
  }

  return NextResponse.json({
    rangeDays: dayKeys.length,
    totalEvents: results.length,
    ...summary,
  })
}

export const GET = withMonitoring(getHandler, 'analytics-summary-get')
