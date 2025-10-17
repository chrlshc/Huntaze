import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb'

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

function ensureArray<T>(x: any): T[] { return Array.isArray(x) ? x : (x?.events && Array.isArray(x.events) ? x.events : []) }

export async function POST(req: NextRequest) {
  const region = getRegion()
  const ddb = new DynamoDBClient({ region })
  const retentionDays = parseInt(process.env.ANALYTICS_TTL_DAYS || '60', 10)
  const now = Date.now()
  const ttlSec = Math.floor(now / 1000) + retentionDays * 24 * 60 * 60

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const events = ensureArray<any>(payload)
  if (!events.length) {
    return NextResponse.json({ accepted: 0 }, { status: 202 })
  }

  const table = 'huntaze-analytics-events'
  const writeRequests = events.slice(0, 50).map((ev: any) => {
    const eventId = String(ev.eventId || globalThis.crypto?.randomUUID?.() || `${now}-${Math.random().toString(36).slice(2)}`)
    const ts = String(ev.ts || new Date().toISOString())
    const day = toDay(ts)
    const platform = String(ev.platform || 'unknown')
    const type = String(ev.type || 'unknown')
    const sk = `ts#${ts}#${eventId}`
    const item: any = {
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
  } catch (e: any) {
    return NextResponse.json({ error: 'ddb_write_failed', message: e?.message }, { status: 500 })
  }
}

