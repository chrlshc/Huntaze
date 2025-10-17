/*
  Lambda: ingest-of-results

  Trigger: S3 ObjectCreated with filters (prefix: jobs/, suffix: result.json)
  Purpose: Ingest OnlyFans worker outputs into DynamoDB analytics table and update a few user fields.

  Env vars:
    ANALYTICS_TABLE (default: huntaze-analytics-events)
    USERS_TABLE (required for user updates; optional)
    AWS_REGION/NEXT_PUBLIC_AWS_REGION

  Expected object shape (written by workers):
  {
    jobId, creatorId, result: { ... }
  }
*/

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const { DynamoDBClient, PutItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb')
const https = require('https')

const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE || 'huntaze-analytics-events'
const USERS_TABLE = process.env.USERS_TABLE || ''
const AGG_ENDPOINT = process.env.OF_AGGREGATES_ENDPOINT || ''
const CRON_SECRET = process.env.CRON_SECRET || ''

const s3 = new S3Client({ region: REGION })
const ddb = new DynamoDBClient({ region: REGION })

async function getJsonFromS3(bucket, key) {
  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  const text = await obj.Body.transformToString()
  return JSON.parse(text)
}

async function putAnalyticsEvent(payload) {
  const ts = new Date().toISOString()
  const day = ts.slice(0, 10)
  const sk = `type#of.result#ts#${ts}`
  const ttlDays = parseInt(process.env.ANALYTICS_TTL_DAYS || '60', 10)
  const ttl = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60
  const Item = {
    day: { S: day },
    sk: { S: sk },
    ts: { S: ts },
    type: { S: 'of.result' },
    provider: { S: 'onlyfans' },
    payload: { S: JSON.stringify(payload) },
    ttl: { N: String(ttl) },
  }
  try {
    await ddb.send(new PutItemCommand({ TableName: ANALYTICS_TABLE, Item }))
  } catch (e) {
    console.error('[ingest-of-results] analytics put failed', e?.message)
  }
}

async function safeUpdateUser(userId, obj) {
  if (!USERS_TABLE || !userId) return
  try {
    const UpdateExpression = ['SET updatedAt = :t']
    const ExpressionAttributeValues = { ':t': { S: new Date().toISOString() } }
    if (typeof obj?.monthlyEarnings === 'number') {
      UpdateExpression.push(', lastMonthlyEarnings = :e')
      ExpressionAttributeValues[':e'] = { N: String(obj.monthlyEarnings) }
    }
    await ddb.send(
      new UpdateItemCommand({
        TableName: USERS_TABLE,
        Key: { userId: { S: String(userId) } },
        UpdateExpression: UpdateExpression.join(' '),
        ExpressionAttributeValues,
      })
    )
  } catch (e) {
    console.error('[ingest-of-results] user update failed', e?.message)
  }
}

async function postJson(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url)
      const body = Buffer.from(JSON.stringify(data))
      const req = https.request({
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + (u.search || ''),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': body.length,
          ...headers,
        },
        timeout: 5000,
      }, (res) => {
        const chunks = []
        res.on('data', (d) => chunks.push(d))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          resolve({ statusCode: res.statusCode, body: text })
        })
      })
      req.on('error', reject)
      req.write(body)
      req.end()
    } catch (e) {
      reject(e)
    }
  })
}

exports.handler = async (event = {}) => {
  const records = Array.isArray(event?.Records) ? event.Records : []
  let ok = 0
  for (const r of records) {
    try {
      if (r.eventSource !== 'aws:s3') continue
      const bucket = r.s3.bucket.name
      const key = decodeURIComponent(r.s3.object.key.replace(/\+/g, ' '))
      if (!/jobs\/.+\/result\.json$/i.test(key)) continue
      const doc = await getJsonFromS3(bucket, key)
      const { jobId, creatorId, result } = doc || {}
      await putAnalyticsEvent({ bucket, key, jobId, creatorId, result })
      // Optional: update user snapshot (e.g., earnings surfaced by worker)
      const earnings = Number(result?.earnings || result?.monthlyEarnings || NaN)
      if (!Number.isNaN(earnings)) {
        await safeUpdateUser(creatorId, { monthlyEarnings: earnings })
        // If aggregates endpoint configured, upsert monthly aggregates
        if (AGG_ENDPOINT && CRON_SECRET) {
          const d = new Date()
          const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`
          try {
            const resp = await postJson(AGG_ENDPOINT, {
              userId: String(creatorId || ''),
              month,
              gross: earnings,
              net: earnings,
              fees: 0,
              currency: 'USD',
              source: { bucket, key, etag: r.s3.object.eTag }
            }, { 'x-cron-secret': CRON_SECRET })
            if ((resp.statusCode || 0) >= 400) {
              console.error('[ingest-of-results] aggregates endpoint failed', resp.statusCode, resp.body)
            }
          } catch (e) {
            console.error('[ingest-of-results] aggregates post error', e?.message)
          }
        }
      }
      ok++
    } catch (e) {
      console.error('[ingest-of-results] record failed', e?.message)
    }
  }
  return { ok, total: records.length }
}
