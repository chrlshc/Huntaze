// Shared helpers for publisher workers
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb')
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')

const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
const POSTS_TABLE = process.env.POSTS_TABLE || 'huntaze-posts'
const PUBKEYS_TABLE = process.env.PUBKEYS_TABLE || 'huntaze-pubkeys'
const TOKENS_TABLE = process.env.TOKENS_TABLE || 'huntaze-oauth-tokens'
const UPLOAD_BUCKET = process.env.UPLOAD_BUCKET || ''

const ddbc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const s3 = new S3Client({ region: REGION })

function parseS3Spec(asset) {
  if (!asset) return { bucket: '', key: '' }
  if (typeof asset === 'string') {
    if (asset.startsWith('s3://')) {
      const rest = asset.slice(5)
      const idx = rest.indexOf('/')
      if (idx > 0) return { bucket: rest.slice(0, idx), key: rest.slice(idx + 1) }
    }
    return { bucket: UPLOAD_BUCKET, key: asset }
  }
  if (asset.bucket && asset.key) return { bucket: asset.bucket, key: asset.key }
  return { bucket: UPLOAD_BUCKET, key: String(asset.key || '') }
}

async function getPost(userId, postId) {
  const out = await ddbc.send(new GetCommand({ TableName: POSTS_TABLE, Key: { userId, postId } }))
  return out.Item || null
}

async function claimIdempotency(pk, ttlSeconds = 7 * 24 * 60 * 60) {
  const ttl = Math.floor(Date.now() / 1000) + ttlSeconds
  await ddbc.send(
    new PutCommand({
      TableName: PUBKEYS_TABLE,
      Item: { pk, ttl },
      ConditionExpression: 'attribute_not_exists(pk)'
    })
  )
}

async function markPosted(userId, postId, platform, info = {}) {
  const now = new Date().toISOString()
  // Ensure maps exist
  await ddbc.send(new UpdateCommand({
    TableName: POSTS_TABLE,
    Key: { userId, postId },
    UpdateExpression: 'SET updatedAt = :now, #ext = if_not_exists(#ext, :m), #pub = if_not_exists(#pub, :m), attempts = if_not_exists(attempts, :m)',
    ExpressionAttributeNames: { '#ext': 'externalIds', '#pub': 'publishedAt' },
    ExpressionAttributeValues: { ':now': now, ':m': {} },
  }))
  // Set nested fields
  await ddbc.send(new UpdateCommand({
    TableName: POSTS_TABLE,
    Key: { userId, postId },
    UpdateExpression: 'SET #ext.#p = :extId, #pub.#p = :now, attempts.#p = if_not_exists(attempts.#p, :zero) + :one',
    ExpressionAttributeNames: { '#ext': 'externalIds', '#pub': 'publishedAt', '#p': platform },
    ExpressionAttributeValues: { ':extId': info.externalPostId || 'unknown', ':now': now, ':zero': 0, ':one': 1 },
  }))
}

async function markError(userId, postId, platform, message) {
  const now = new Date().toISOString()
  await ddbc.send(new UpdateCommand({
    TableName: POSTS_TABLE,
    Key: { userId, postId },
    UpdateExpression: 'SET updatedAt = :now, attempts = if_not_exists(attempts, :m)',
    ExpressionAttributeValues: { ':now': now, ':m': {} },
  }))
  await ddbc.send(new UpdateCommand({
    TableName: POSTS_TABLE,
    Key: { userId, postId },
    UpdateExpression: 'SET errors = list_append(if_not_exists(errors, :empty), :err), attempts.#p = if_not_exists(attempts.#p, :zero) + :one',
    ExpressionAttributeNames: { '#p': platform },
    ExpressionAttributeValues: { ':empty': [], ':err': [{ msg: message, at: now, platform }], ':zero': 0, ':one': 1 },
  }))
}

async function getToken(userId, platform) {
  const out = await ddbc.send(new GetCommand({ TableName: TOKENS_TABLE, Key: { userId, platform } }))
  const it = out.Item || null
  if (!it) return null
  return it
}

async function fetchS3Buffer(spec) {
  const { bucket, key } = parseS3Spec(spec)
  if (!bucket || !key) throw new Error('invalid_s3_spec')
  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  const buff = Buffer.from(await obj.Body.transformToByteArray())
  return { buffer: buff, contentType: obj.ContentType || undefined, bucket, key }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }
async function withRetry(fn, attempts = 4) {
  let last
  for (let i = 0; i < attempts; i++) {
    try { return await fn() } catch (e) {
      last = e
      const backoff = Math.min(30000, 250 * Math.pow(2, i)) + Math.floor(Math.random() * 200)
      await sleep(backoff)
    }
  }
  throw last
}

module.exports = {
  getPost,
  claimIdempotency,
  markPosted,
  markError,
  getToken,
  fetchS3Buffer,
  withRetry,
}
