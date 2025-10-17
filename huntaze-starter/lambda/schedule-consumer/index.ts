import { DynamoDBClient, ScanCommand, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'

const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE || 'huntaze-analytics-events'
const Q_IG = process.env.SQS_PUBLISHER_INSTAGRAM_URL || ''
const Q_TK = process.env.SQS_PUBLISHER_TIKTOK_URL || ''
const Q_RD = process.env.SQS_PUBLISHER_REDDIT_URL || ''

const ddb = new DynamoDBClient({ region: REGION })
const sqs = new SQSClient({ region: REGION })

type Item = {
  day: { S: string }
  sk: { S: string }
  ts: { S: string }
  type: { S: string }
  payload?: { S: string }
  processed?: { S?: string }
}

function parsePayload(it: Item): any {
  try { return JSON.parse(it.payload?.S || '{}') } catch { return {} }
}

async function markProcessed(it: Item) {
  await ddb.send(new UpdateItemCommand({
    TableName: ANALYTICS_TABLE,
    Key: { day: { S: it.day.S }, sk: { S: it.sk.S } },
    UpdateExpression: 'SET #p = :one',
    ExpressionAttributeNames: { '#p': 'processed' },
    ExpressionAttributeValues: { ':one': { S: '1' } },
  }))
}

async function emitManualTask(origin: Item, payload: any) {
  const ts = new Date().toISOString()
  const day = ts.slice(0, 10)
  const eventId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const deepLink = 'https://onlyfans.com/my/messages/new'
  const item: any = {
    day: { S: day },
    sk: { S: `ts#${ts}#${eventId}` },
    ts: { S: ts },
    eventId: { S: eventId },
    platform: { S: 'onlyfans' },
    type: { S: 'manual_task' },
    payload: { S: JSON.stringify({
      origin: origin.sk.S,
      instructions: 'Prepare OF message manually and send from UI.',
      content: payload?.content,
      price: payload?.price,
      time: payload?.time,
      deepLink,
    }) },
  }
  await ddb.send(new PutItemCommand({ TableName: ANALYTICS_TABLE, Item: item }))
}

async function enqueue(url: string, msg: any) {
  if (!url) return
  await sqs.send(new SendMessageCommand({ QueueUrl: url, MessageBody: JSON.stringify(msg) }))
}

export const handler = async () => {
  const now = new Date()
  const soon = new Date(now.getTime() + 2 * 60 * 1000) // 2 minutes window
  const res = await ddb.send(new ScanCommand({
    TableName: ANALYTICS_TABLE,
    FilterExpression: '#type = :t AND attribute_not_exists(processed)',
    ExpressionAttributeNames: { '#type': 'type' },
    ExpressionAttributeValues: { ':t': { S: 'schedule_request' } },
    ProjectionExpression: 'day, sk, ts, type, payload, processed',
  }))

  const items = (res.Items || []) as unknown as Item[]
  for (const it of items) {
    const payload = parsePayload(it)
    const when = payload?.time ? new Date(payload.time) : null
    if (!when || when > soon) continue

    try {
      const platforms: string[] = Array.isArray(payload?.platforms) ? payload.platforms : []
      // Route to SQS for allowed platforms (exclude OnlyFans)
      if (platforms.includes('instagram')) await enqueue(Q_IG, { type: 'publish', payload })
      if (platforms.includes('tiktok')) await enqueue(Q_TK, { type: 'publish', payload })
      if (platforms.includes('reddit')) await enqueue(Q_RD, { type: 'publish', payload })
      if (platforms.includes('onlyfans')) await emitManualTask(it, payload)
    } finally {
      await markProcessed(it)
    }
  }

  return { scanned: items.length }
}

