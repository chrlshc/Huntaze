/*
  OAuth Tokens Refresh Lambda

  - Scans expiring tokens via GSI `byExpiry` if available
  - Refreshes Reddit, TikTok, and Instagram tokens
  - Persists updated tokens in DynamoDB (PK=userId, SK=platform)

  Env vars:
    TOKENS_TABLE (default: huntaze-oauth-tokens)
    TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET
    REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT
    IG_APP_ID, IG_APP_SECRET, IG_GRAPH_VERSION (default: v20.0)
*/

import { DynamoDBClient, QueryCommand, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb'

type Platform = 'tiktok' | 'reddit' | 'instagram'

type TokenItem = {
  userId: string
  platform: Platform
  accessToken: string
  refreshToken?: string
  expiresAt?: number // epoch ms
  scope?: string[]
}

const TABLE = process.env.TOKENS_TABLE || 'huntaze-oauth-tokens'
const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
const ddb = new DynamoDBClient({ region: REGION })
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE || 'huntaze-analytics-events'
const ANALYTICS_TTL_DAYS = parseInt(process.env.ANALYTICS_TTL_DAYS || '60', 10)

async function queryByExpiry(platform: Platform, cutoffMs: number): Promise<TokenItem[]> {
  try {
    const out = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: 'byExpiry',
        KeyConditionExpression: 'platform = :p AND expiresAt <= :t',
        ExpressionAttributeValues: {
          ':p': { S: platform },
          ':t': { N: String(cutoffMs) },
        },
      })
    )
    return (out.Items || []).map((it) => ({
      userId: it.userId?.S || '',
      platform: (it.platform?.S || platform) as Platform,
      accessToken: it.accessToken?.S || '',
      refreshToken: it.refreshToken?.S || undefined,
      expiresAt: it.expiresAt?.N ? Number(it.expiresAt.N) : undefined,
      scope: it.scope?.S ? String(it.scope.S).split(',').filter(Boolean) : undefined,
    }))
  } catch {
    // Fallback to a small scan (best effort)
    const out = await ddb.send(new ScanCommand({ TableName: TABLE, Limit: 100 }))
    return (out.Items || [])
      .filter((it) => it.platform?.S === platform)
      .map((it) => ({
        userId: it.userId?.S || '',
        platform: (it.platform?.S || platform) as Platform,
        accessToken: it.accessToken?.S || '',
        refreshToken: it.refreshToken?.S || undefined,
        expiresAt: it.expiresAt?.N ? Number(it.expiresAt.N) : undefined,
        scope: it.scope?.S ? String(it.scope.S).split(',').filter(Boolean) : undefined,
      }))
  }
}

async function persistToken(tok: TokenItem) {
  await ddb.send(
    new PutItemCommand({
      TableName: TABLE,
      Item: {
        userId: { S: tok.userId },
        platform: { S: tok.platform },
        accessToken: { S: tok.accessToken || '' },
        refreshToken: { S: tok.refreshToken || '' },
        expiresAt: { N: String(tok.expiresAt || (Date.now() + 3600 * 1000)) },
        scope: { S: (tok.scope || []).join(',') },
        expiresAtIso: { S: new Date(tok.expiresAt || Date.now() + 3600 * 1000).toISOString() },
      },
    })
  )
}

export const handler = async (event: any = {}) => {
  // Optional startup jitter to spread load (default 120s)
  const jitterSec = Number.parseInt(process.env.JITTER_SECONDS || '120', 10)
  if (jitterSec > 0) {
    const delay = Math.floor(Math.random() * jitterSec * 1000)
    await new Promise((r) => setTimeout(r, delay))
  }
  const providers: Platform[] = Array.isArray(event?.providers) && event.providers.length
    ? event.providers
    : (['reddit', 'tiktok', 'instagram'] as Platform[])

  const now = Date.now()
  const toRefresh: TokenItem[] = []

  if (providers.includes('reddit')) {
    toRefresh.push(...(await queryByExpiry('reddit', now + 20 * 60 * 1000)))
  }
  if (providers.includes('tiktok')) {
    toRefresh.push(...(await queryByExpiry('tiktok', now + 12 * 60 * 60 * 1000)))
  }
  if (providers.includes('instagram')) {
    toRefresh.push(...(await queryByExpiry('instagram', now + 7 * 24 * 60 * 60 * 1000)))
  }

  const results: any[] = []
  let refreshed = 0
  const startedAtIso = new Date().toISOString()

  for (const tok of toRefresh) {
    const msLeft = typeof tok.expiresAt === 'number' ? tok.expiresAt - now : undefined
    try {
      switch (tok.platform) {
        case 'reddit': {
          if (!tok.refreshToken || (msLeft !== undefined && msLeft > 20 * 60 * 1000)) break
          const resp = await fetchWithRetry('https://www.reddit.com/api/v1/access_token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64')}`,
              'User-Agent': process.env.REDDIT_USER_AGENT || 'Huntaze:v1.0.0',
            },
            body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tok.refreshToken }),
          })
          if (resp.ok) {
            const data = await resp.json()
            tok.accessToken = data.access_token || tok.accessToken
            tok.refreshToken = data.refresh_token || tok.refreshToken
            tok.expiresAt = Date.now() + (data.expires_in || 3600) * 1000
            await persistToken(tok)
            refreshed++
            results.push({ platform: tok.platform, userId: tok.userId, status: 'refreshed' })
          }
          break
        }
        case 'tiktok': {
          if (!tok.refreshToken || (msLeft !== undefined && msLeft > 12 * 60 * 60 * 1000)) break
          const resp = await fetchWithRetry('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_key: process.env.TIKTOK_CLIENT_KEY || '',
              client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
              grant_type: 'refresh_token',
              refresh_token: tok.refreshToken,
            }),
          })
          if (resp.ok) {
            const data = await resp.json()
            tok.accessToken = data.access_token || tok.accessToken
            tok.refreshToken = data.refresh_token || tok.refreshToken
            tok.expiresAt = Date.now() + (data.expires_in || 86400) * 1000
            await persistToken(tok)
            refreshed++
            results.push({ platform: tok.platform, userId: tok.userId, status: 'refreshed' })
          }
          break
        }
        case 'instagram': {
          // IG long-lived; refresh if under 7 days left
          if (!tok.accessToken || (msLeft !== undefined && msLeft > 7 * 24 * 60 * 60 * 1000)) break
          const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(tok.accessToken)}`
          const resp = await fetchWithRetry(url)
          if (resp.ok) {
            const data = await resp.json()
            tok.accessToken = data.access_token || tok.accessToken
            tok.expiresAt = Date.now() + (data.expires_in || 60 * 24 * 60 * 60) * 1000
            await persistToken(tok)
            refreshed++
            results.push({ platform: tok.platform, userId: tok.userId, status: 'refreshed' })
          }
          break
        }
      }
    } catch (e: any) {
      results.push({ platform: tok.platform, userId: tok.userId, error: e?.message || 'refresh_failed' })
    }
  }

  // Emit per-provider analytics events
  const endedAtIso = new Date().toISOString()
  const providersSet = new Set<Platform>(toRefresh.map((t) => t.platform))
  for (const provider of providersSet) {
    const provResults = results.filter((r) => r.platform === provider)
    const ok = provResults.filter((r) => r.status === 'refreshed').length
    const errors = provResults.filter((r) => r.error).length
    await putAnalyticsEvent({
      type: 'token.refresh',
      provider,
      startedAt: startedAtIso,
      endedAt: endedAtIso,
      ok,
      errors,
    })
  }

  return {
    ok: true,
    refreshed,
    results,
  }
}

async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit, maxAttempts = 3): Promise<Response> {
  let attempt = 0
  let lastErr: any
  while (attempt < maxAttempts) {
    try {
      const resp = await fetch(input as any, init as any)
      if (resp.status === 429 || resp.status >= 500) {
        attempt++
        const backoff = Math.min(2000, 200 * Math.pow(2, attempt)) + Math.floor(Math.random() * 200)
        await new Promise((r) => setTimeout(r, backoff))
        continue
      }
      return resp
    } catch (e) {
      lastErr = e
      attempt++
      const backoff = Math.min(2000, 200 * Math.pow(2, attempt)) + Math.floor(Math.random() * 200)
      await new Promise((r) => setTimeout(r, backoff))
    }
  }
  throw lastErr || new Error('fetchWithRetry failed')
}

async function putAnalyticsEvent(params: {
  type: 'token.refresh'
  provider: Platform
  startedAt: string
  endedAt: string
  ok: number
  errors: number
}) {
  const { type, provider, startedAt, endedAt, ok, errors } = params
  const ts = endedAt || new Date().toISOString()
  const day = ts.slice(0, 10)
  const sk = `type#${type}#provider#${provider}#ts#${ts}`
  const ttl = Math.floor(Date.now() / 1000) + ANALYTICS_TTL_DAYS * 24 * 60 * 60
  const item: any = {
    day: { S: day },
    sk: { S: sk },
    ts: { S: ts },
    type: { S: type },
    platform: { S: provider },
    provider: { S: provider },
    startedAt: { S: startedAt },
    endedAt: { S: ts },
    ok: { N: String(ok) },
    errors: { N: String(errors) },
    ttl: { N: String(ttl) },
    payload: { S: JSON.stringify({ ok, errors, startedAt, endedAt: ts }) },
  }
  try {
    await ddb.send(new PutItemCommand({ TableName: ANALYTICS_TABLE, Item: item }))
  } catch {
    // best-effort
  }
}
