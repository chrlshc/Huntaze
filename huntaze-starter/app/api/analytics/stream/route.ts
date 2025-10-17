import { NextRequest } from 'next/server'
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'

function getRegion(): string {
  return process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
}

function sinceToDate(since: string): Date {
  const now = new Date()
  const value = since.trim().toLowerCase()
  if (value.endsWith('h')) {
    const hours = Number.parseInt(value.slice(0, -1), 10)
    if (!Number.isNaN(hours)) return new Date(now.getTime() - hours * 3_600_000)
  }
  if (value.endsWith('d')) {
    const days = Number.parseInt(value.slice(0, -1), 10)
    if (!Number.isNaN(days)) return new Date(now.getTime() - days * 86_400_000)
  }
  const numericDays = Number.parseInt(value, 10)
  if (!Number.isNaN(numericDays)) return new Date(now.getTime() - numericDays * 86_400_000)
  return new Date(now.getTime() - 24 * 3_600_000)
}

async function fetchCounts(ddb: DynamoDBClient, table: string, sinceIso: string): Promise<Record<string, number>> {
  let exclusiveStartKey: Record<string, AttributeValue> | undefined
  const counts: Record<string, number> = {}
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
      const t = it.type?.S || 'unknown'
      counts[t] = (counts[t] || 0) + 1
    }
    exclusiveStartKey = res.LastEvaluatedKey
  } while (exclusiveStartKey)
  return counts
}

export async function GET(req: NextRequest) {
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  const url = new URL(req.url)
  const since = (url.searchParams.get('since') || '6h').trim()
  const region = getRegion()
  const table = process.env.ANALYTICS_TABLE || 'huntaze-analytics-events'
  const ddb = new DynamoDBClient({ region })

  const write = (data: unknown) => writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  const ping = () => writer.write(encoder.encode(`event: ping\ndata: keepalive\n\n`))

  const intervalMs = 15000
  let interval: ReturnType<typeof setInterval> | undefined
  const sinceIso = sinceToDate(since).toISOString()

  ;(async () => {
    write({ ready: true, since })
    try {
      const counts = await fetchCounts(ddb, table, sinceIso)
      write({ type: 'counts', counts })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'scan_failed'
      write({ type: 'error', message })
    }
    interval = setInterval(async () => {
      try {
        const counts = await fetchCounts(ddb, table, sinceIso)
        write({ type: 'counts', counts, ts: new Date().toISOString() })
        ping()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'scan_failed'
        write({ type: 'error', message })
      }
    }, intervalMs)
  })()

  req.signal.addEventListener('abort', () => {
    if (interval) {
      clearInterval(interval)
    }
    try {
      writer.close()
    } catch (error) {
      console.warn('[analytics-stream] writer_close_failed', error)
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
