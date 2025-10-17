import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import crypto from 'crypto'

export const runtime = 'nodejs'

const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
const TABLE = process.env.OF_AGGREGATES_TABLE || 'huntaze-of-aggregates'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const userId: string = body.userId
    const month: string = body.month // YYYY-MM
    const gross: number = Number(body.gross || 0)
    const net: number = Number(body.net || 0)
    const fees: number = Number(body.fees || 0)
    const currency: string = body.currency || 'USD'
    const source = body.source || {}
    if (!userId || !month) {
      return NextResponse.json({ error: 'userId and month are required' }, { status: 400 })
    }

    const idem = source?.etag
      ? crypto.createHash('sha256').update(`${source.bucket || ''}#${source.key || ''}#${source.etag}`).digest('hex')
      : crypto.createHash('sha256').update(`${userId}#${month}`).digest('hex')

    const ddb = new DynamoDBClient({ region: REGION })
    const cmd = new UpdateItemCommand({
      TableName: TABLE,
      Key: {
        PK: { S: `USER#${userId}` },
        SK: { S: `EARNINGS#${month}` },
      },
      UpdateExpression: 'ADD gross :g, net :n, fees :f SET currency = if_not_exists(currency, :c), lastSourceIdem = :idem, updatedAt = :now',
      ConditionExpression: 'attribute_not_exists(lastSourceIdem) OR lastSourceIdem <> :idem',
      ExpressionAttributeValues: {
        ':g': { N: String(gross) },
        ':n': { N: String(net) },
        ':f': { N: String(fees) },
        ':c': { S: currency },
        ':idem': { S: idem },
        ':now': { S: new Date().toISOString() },
      },
      ReturnValues: 'ALL_NEW',
    })

    try {
      const out = await ddb.send(cmd)
      return NextResponse.json({ ok: true, item: out.Attributes })
    } catch (e: any) {
      if (e?.name === 'ConditionalCheckFailedException') {
        return NextResponse.json({ ok: true, deduplicated: true })
      }
      throw e
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'ingest_failed' }, { status: 500 })
  }
}

