import { DynamoDBClient, ScanCommand, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'

type TokenItem = {
  userId: { S: string }
  provider: { S: string }
  access_token?: { S: string }
  refresh_token?: { S: string }
  expires_at_epoch?: { N: string }
}

function region(): string {
  return process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
}

const TOKENS_TABLE = process.env.TOKENS_TABLE || 'huntaze-oauth-tokens'
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE || 'huntaze-analytics-events'

async function emitAnalytics(ddb: DynamoDBClient, platform: string, status: 'ok' | 'error', details?: any) {
  const ts = new Date().toISOString()
  const day = ts.slice(0, 10)
  const eventId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const item: any = {
    day: { S: day },
    sk: { S: `ts#${ts}#${eventId}` },
    ts: { S: ts },
    eventId: { S: eventId },
    platform: { S: platform },
    type: { S: 'token_refresh' },
    payload: { S: JSON.stringify({ status, ...(details || {}) }) },
  }
  try {
    await ddb.send(new PutItemCommand({ TableName: ANALYTICS_TABLE, Item: item }))
  } catch {}
}

async function refreshReddit(accessToken: string, refreshToken?: string) {
  if (!refreshToken) throw new Error('no_refresh_token')
  const basic = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64')
  const resp = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basic}`,
      'User-Agent': process.env.REDDIT_USER_AGENT || 'Huntaze:v1.0.0'
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  })
  if (!resp.ok) throw new Error('refresh_failed')
  return resp.json()
}

async function refreshTikTok(accessToken: string, refreshToken?: string) {
  if (!refreshToken) throw new Error('no_refresh_token')
  const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY || '',
      client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })
  })
  if (!resp.ok) throw new Error('refresh_failed')
  return resp.json()
}

async function refreshInstagramBasic(accessToken: string) {
  // 60-day long-lived token can be refreshed by hitting ig_refresh_token
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(accessToken)}`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error('refresh_failed')
  return resp.json()
}

function jitter(ms: number) {
  const spread = Math.floor(ms * 0.3)
  return ms + Math.floor(Math.random() * spread)
}

export const handler = async () => {
  const ddb = new DynamoDBClient({ region: region() })
  const nowEpoch = Math.floor(Date.now() / 1000)
  const threshold = nowEpoch + 6 * 60 * 60 // refresh if expires within 6h

  // Scan tokens table (fallback path when GSI isn't available)
  const res = await ddb.send(new ScanCommand({
    TableName: TOKENS_TABLE,
    ProjectionExpression: 'userId, provider, access_token, refresh_token, expires_at_epoch',
    FilterExpression: 'attribute_exists(expires_at_epoch) AND expires_at_epoch <= :t',
    ExpressionAttributeValues: { ':t': { N: String(threshold) } },
  }))

  const items = (res.Items || []) as unknown as TokenItem[]

  for (const it of items) {
    const provider = it.provider.S
    const userId = it.userId.S
    const accessToken = it.access_token?.S
    const refreshToken = it.refresh_token?.S

    const start = Date.now()
    try {
      let data: any
      if (provider === 'reddit') data = await refreshReddit(accessToken || '', refreshToken)
      else if (provider === 'tiktok') data = await refreshTikTok(accessToken || '', refreshToken)
      else if (provider === 'instagram-basic' && accessToken) data = await refreshInstagramBasic(accessToken)
      else {
        continue
      }

      // compute new expiry
      const expiresIn: number | undefined = data?.expires_in
      const expiresAt = expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : undefined

      await ddb.send(new UpdateItemCommand({
        TableName: TOKENS_TABLE,
        Key: { userId: { S: userId }, provider: { S: provider } },
        UpdateExpression: 'SET #at = :at, #ua = :ua, #ttl = :ttl' + (expiresAt ? ', #eae = :eae' : ''),
        ExpressionAttributeNames: { '#at': 'access_token', '#ua': 'updated_at', '#ttl': 'ttl', '#eae': 'expires_at_epoch' },
        ExpressionAttributeValues: {
          ':at': { S: data?.access_token || accessToken || '' },
          ':ua': { S: new Date().toISOString() },
          ':ttl': { N: String((expiresAt || (nowEpoch + 86400)) - 86400) },
          ...(expiresAt ? { ':eae': { N: String(expiresAt) } } : {}),
        },
      }))

      await emitAnalytics(ddb, provider, 'ok', { ms: Date.now() - start })
      await new Promise(r => setTimeout(r, jitter(50)))
    } catch (e: any) {
      await emitAnalytics(ddb, provider, 'error', { err: e?.message })
      await new Promise(r => setTimeout(r, jitter(200)))
    }
  }

  return { refreshed: items.length }
}

