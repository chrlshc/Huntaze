import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, QueryCommand, DescribeTableCommand, ScanCommand } from '@aws-sdk/client-dynamodb'

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
  const s = since.trim().toLowerCase()
  try {
    if (s.endsWith('h')) {
      const h = parseInt(s.slice(0, -1), 10)
      if (!isNaN(h)) return new Date(now.getTime() - h * 60 * 60 * 1000)
    }
    if (s.endsWith('d')) {
      const d = parseInt(s.slice(0, -1), 10)
      if (!isNaN(d)) return new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
    }
    const n = parseInt(s, 10)
    if (!isNaN(n)) return new Date(now.getTime() - n * 24 * 60 * 60 * 1000)
  } catch {}
  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
}

async function tableHasDayKey(ddb: DynamoDBClient, table: string): Promise<boolean> {
  try {
    const desc = await ddb.send(new DescribeTableCommand({ TableName: table }))
    return !!desc.Table?.KeySchema?.some(k => k.AttributeName === 'day')
  } catch {
    return false
  }
}

async function tableHasByDayGsi(ddb: DynamoDBClient, table: string, indexName = 'byDay'): Promise<boolean> {
  try {
    const desc = await ddb.send(new DescribeTableCommand({ TableName: table }))
    return !!desc.Table?.GlobalSecondaryIndexes?.some(g => g.IndexName === indexName)
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const region = getRegion()
  const ddb = new DynamoDBClient({ region })
  const url = new URL(req.url)
  const since = (url.searchParams.get('since') || '7d').trim()
  const days = since.endsWith('d') ? parseInt(since.slice(0, -1), 10) : 7
  const table = process.env.ANALYTICS_TABLE || 'huntaze-analytics-events'

  const dayKeys = daysBack(Math.min(days, 31))
  const results: any[] = []

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
          // Note: no Limit -> rely on 1MB page default; aggregation is simple counts
          ScanIndexForward: false,
        }))
        for (const it of res.Items || []) {
          results.push({
            day,
            platform: it.platform?.S,
            type: it.type?.S,
          })
        }
      } catch {}
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
          results.push({
            day,
            platform: it.platform?.S,
            type: it.type?.S,
          })
        }
      } catch {}
    }
  } else {
    // Fallback for dev tables without 'day' key: Scan filtered by ISO timestamp
    const sinceIso = sinceToDate(since).toISOString()
    let ExclusiveStartKey: any = undefined
    do {
      try {
        const res = await ddb.send(new ScanCommand({
          TableName: table,
          ExclusiveStartKey,
          FilterExpression: '#ts >= :since',
          ExpressionAttributeNames: { '#ts': 'ts' },
          ExpressionAttributeValues: { ':since': { S: sinceIso } },
        }))
        for (const it of res.Items || []) {
          results.push({
            day: (it.day && it.day.S) || undefined,
            platform: it.platform?.S,
            type: it.type?.S,
          })
        }
        ExclusiveStartKey = res.LastEvaluatedKey
      } catch {
        break
      }
    } while (ExclusiveStartKey)
  }

  const summary: Record<string, any> = {
    clicks: 0,
    publish: 0,
    stat_snapshots: 0,
    perPlatform: {},
  }
  for (const ev of results) {
    const p = ev.platform || 'unknown'
    const t = ev.type || 'unknown'
    if (!summary.perPlatform[p]) summary.perPlatform[p] = { clicks: 0, publish: 0, stat_snapshots: 0 }
    if (t === 'click') { summary.clicks++; summary.perPlatform[p].clicks++ }
    else if (t === 'publish') { summary.publish++; summary.perPlatform[p].publish++ }
    else if (t === 'stat_snapshot') { summary.stat_snapshots++; summary.perPlatform[p].stat_snapshots++ }
  }

  return NextResponse.json({
    rangeDays: dayKeys.length,
    totalEvents: results.length,
    ...summary,
  })
}
