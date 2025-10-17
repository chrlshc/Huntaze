import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import crypto from 'crypto'

function getRegion(): string {
  return process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
}

function toDay(tsIso: string): string {
  try {
    return tsIso.slice(0, 10)
  } catch {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  }
}

type EventEnvelope<T> = { events?: T[] }

type IncomingEvent = {
  eventId?: unknown
  ts?: unknown
  platform?: unknown
  type?: unknown
  payload?: unknown
}

function ensureArray<T>(input: unknown): T[] {
  if (Array.isArray(input)) return input as T[]
  if (input && typeof input === 'object' && Array.isArray((input as EventEnvelope<T>).events)) {
    return (input as EventEnvelope<T>).events ?? []
  }
  return []
}

export async function POST(req: NextRequest) {
  const region = getRegion()
  const ddb = new DynamoDBClient({ region })
  const retentionDays = parseInt(process.env.ANALYTICS_TTL_DAYS || '60', 10)
  const now = Date.now()
  const ttlSec = Math.floor(now / 1000) + retentionDays * 24 * 60 * 60

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const events = ensureArray<IncomingEvent>(payload)
  if (!events.length) {
    return NextResponse.json({ accepted: 0 }, { status: 202 })
  }

  const table = process.env.ANALYTICS_TABLE || 'huntaze-analytics-events'
  const fallbackId = typeof crypto.randomUUID === 'function'
    ? () => crypto.randomUUID()
    : () => `${now}-${Math.random().toString(36).slice(2)}`

  const writeRequests = events.slice(0, 50).map((ev) => {
    const rawEventId = ev.eventId
    const eventId = typeof rawEventId === 'string' && rawEventId
      ? rawEventId
      : typeof rawEventId === 'number'
        ? String(rawEventId)
        : fallbackId()

    const rawTs = ev.ts
    const ts = typeof rawTs === 'string' && rawTs ? rawTs : new Date().toISOString()
    const day = toDay(ts)
    const platform = String(ev.platform ?? 'unknown')
    const type = String(ev.type ?? 'unknown')
    const sk = `ts#${ts}#${eventId}`
    const item: Record<string, AttributeValue> = {
      day: { S: day },
      sk: { S: sk },
      ts: { S: ts },
      eventId: { S: eventId },
      platform: { S: platform },
      type: { S: type },
      ttl: { N: String(ttlSec) },
    }
    if (ev.payload !== undefined) {
      item.payload = { S: JSON.stringify(ev.payload) }
    }
    return { PutRequest: { Item: item } }
  })

  try {
    await ddb.send(new BatchWriteItemCommand({ RequestItems: { [table]: writeRequests } }))
    return NextResponse.json({ accepted: writeRequests.length }, { status: 202 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ error: 'ddb_write_failed', message }, { status: 500 })
  }
}
