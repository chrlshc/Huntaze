import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, DescribeTableCommand, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb'

function getRegion(): string {
  return process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
}

function daysBack(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
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
  const table = process.env.ANALYTICS_TABLE || 'huntaze-analytics-events'
  const days = Math.min(parseInt(process.env.REFRESH_STATUS_WINDOW_DAYS || '7', 10), 31)
  const keys = daysBack(days)

  const providers = ['tiktok', 'reddit', 'instagram'] as const
  type Prov = typeof providers[number]
  const agg: Record<Prov, { lastRun?: string; ok: number; errors: number }> = {
    tiktok: { ok: 0, errors: 0 },
    reddit: { ok: 0, errors: 0 },
    instagram: { ok: 0, errors: 0 },
  }

  const hasDay = await tableHasDayKey(ddb, table)
  const hasByDay = await tableHasByDayGsi(ddb, table)

  async function processItems(items: any[]) {
    for (const it of items) {
      const type = it.type?.S || undefined
      const provider = (it.provider?.S || it.platform?.S) as Prov | undefined
      if (type !== 'token.refresh' || !provider || !providers.includes(provider)) continue
      const ok = it.ok?.N ? Number(it.ok.N) : 0
      const errors = it.errors?.N ? Number(it.errors.N) : 0
      const endedAt = it.endedAt?.S || it.ts?.S || undefined
      agg[provider].ok += ok
      agg[provider].errors += errors
      if (!agg[provider].lastRun || (endedAt && endedAt > (agg[provider].lastRun!))) {
        agg[provider].lastRun = endedAt
      }
    }
  }

  if (hasDay) {
    for (const day of keys) {
      try {
        const res = await ddb.send(new QueryCommand({
          TableName: table,
          KeyConditionExpression: '#d = :d AND begins_with(#sk, :pfx)',
          ExpressionAttributeNames: { '#d': 'day', '#sk': 'sk' },
          ExpressionAttributeValues: { ':d': { S: day }, ':pfx': { S: 'type#token.refresh#' } },
          ScanIndexForward: false,
        }))
        await processItems(res.Items || [])
      } catch {}
    }
  } else if (hasByDay) {
    for (const day of keys) {
      try {
        const res = await ddb.send(new QueryCommand({
          TableName: table,
          IndexName: 'byDay',
          KeyConditionExpression: '#d = :d',
          ExpressionAttributeNames: { '#d': 'day' },
          ExpressionAttributeValues: { ':d': { S: day } },
          ScanIndexForward: false,
        }))
        await processItems(res.Items || [])
      } catch {}
    }
  } else {
    // Fallback: scan recent (best-effort)
    let ExclusiveStartKey: any = undefined
    do {
      try {
        const res = await ddb.send(new ScanCommand({ TableName: table, ExclusiveStartKey }))
        await processItems(res.Items || [])
        ExclusiveStartKey = res.LastEvaluatedKey
      } catch {
        break
      }
    } while (ExclusiveStartKey)
  }

  return NextResponse.json({ providers: agg, windowDays: days })
}

