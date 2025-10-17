import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import { withMonitoring } from '@/lib/monitoring'

function getRegion(): string {
  return process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
}

const postHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json()
    const { content, time, platforms, price } = body || {}
    if (!content || !time) {
      return NextResponse.json({ error: 'Missing content or time' }, { status: 400 })
    }

    const ddb = new DynamoDBClient({ region: getRegion() })
    const ts = new Date().toISOString()
    const day = ts.slice(0, 10)
    const eventId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const payload = { content, time, platforms, price }
    const item: Record<string, AttributeValue> = {
      day: { S: day },
      sk: { S: `ts#${ts}#${eventId}` },
      ts: { S: ts },
      eventId: { S: eventId },
      platform: { S: 'onlyfans' },
      type: { S: 'schedule_request' },
      payload: { S: JSON.stringify(payload) },
    }
    const ttlDays = parseInt(process.env.ANALYTICS_TTL_DAYS || '60', 10)
    const ttlSec = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60
    item.ttl = { N: String(ttlSec) }
    await ddb.send(new PutItemCommand({ TableName: process.env.ANALYTICS_TABLE || 'huntaze-analytics-events', Item: item }))

    return NextResponse.json({ scheduled: true, time, id: eventId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ error: 'Failed to schedule', details: message }, { status: 500 })
  }
}

export const POST = withMonitoring(postHandler, 'content-schedule-post')
