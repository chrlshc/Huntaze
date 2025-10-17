// Lambda: content-dispatcher
// Scans posts due for publishing (status='queued' and scheduledAt<=now) and enqueues per-platform messages

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb')
const { SQSClient, SendMessageBatchCommand } = require('@aws-sdk/client-sqs')

const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
const POSTS_TABLE = process.env.POSTS_TABLE || 'huntaze-posts'
const INDEX = process.env.DUE_INDEX || 'ByStatusScheduledAt'
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '25', 10) // per queue

// Queue URLs per platform
const QUEUES = {
  twitter: process.env.Q_TWITTER || '',
  instagram: process.env.Q_INSTAGRAM || '',
  tiktok: process.env.Q_TIKTOK || '',
  reddit: process.env.Q_REDDIT || '',
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const sqs = new SQSClient({ region: REGION })

async function* queryDue(nowIso) {
  let ExclusiveStartKey
  do {
    const out = await ddb.send(new QueryCommand({
      TableName: POSTS_TABLE,
      IndexName: INDEX,
      KeyConditionExpression: '#s = :queued AND #t <= :now',
      ExpressionAttributeNames: { '#s': 'status', '#t': 'scheduledAt' },
      ExpressionAttributeValues: { ':queued': 'queued', ':now': nowIso },
      ProjectionExpression: 'userId, postId',
      ExclusiveStartKey,
      Limit: 200,
    }))
    yield out.Items || []
    ExclusiveStartKey = out.LastEvaluatedKey
  } while (ExclusiveStartKey)
}

async function getPosts(keys) {
  if (!keys.length) return []
  const batches = []
  const results = []
  for (let i = 0; i < keys.length; i += 100) {
    batches.push(keys.slice(i, i + 100))
  }
  for (const batch of batches) {
    const { BatchGetCommand } = require('@aws-sdk/lib-dynamodb')
    const out = await ddb.send(new BatchGetCommand({
      RequestItems: { [POSTS_TABLE]: { Keys: batch, ProjectionExpression: 'userId, postId, platformTargets' } }
    }))
    results.push(...(out.Responses?.[POSTS_TABLE] || []))
  }
  return results
}

async function enqueuePerPlatform(items) {
  const groups = { twitter: [], instagram: [], tiktok: [], reddit: [] }
  for (const it of items) {
    const { userId, postId } = it
    const targets = Array.isArray(it.platformTargets) ? it.platformTargets : []
    for (const p of targets) {
      if (!groups[p]) continue
      groups[p].push({ Id: `${postId}-${p}`, MessageBody: JSON.stringify({ userId, postId, platform: p }) })
    }
  }
  for (const platform of Object.keys(groups)) {
    const qUrl = QUEUES[platform]
    const batch = groups[platform]
    if (!qUrl || batch.length === 0) continue
    for (let i = 0; i < batch.length; i += BATCH_SIZE) {
      const Entries = batch.slice(i, i + BATCH_SIZE)
      await sqs.send(new SendMessageBatchCommand({ QueueUrl: qUrl, Entries }))
    }
  }
}

exports.handler = async () => {
  const nowIso = new Date().toISOString()
  let total = 0
  for await (const page of queryDue(nowIso)) {
    const full = await getPosts(page)
    total += full.length
    await enqueuePerPlatform(full)
  }
  return { enqueued: total, at: nowIso }
}
