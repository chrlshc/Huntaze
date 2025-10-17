import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import crypto from 'crypto'

function getRegion(): string {
  return process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
}

function getAllowedHosts(): string[] {
  const env = process.env.R_ALLOWED_HOSTS
  if (env) return env.split(',').map(s => s.trim()).filter(Boolean)
  return [
    'tiktok.com', 'www.tiktok.com',
    'instagram.com', 'www.instagram.com',
    'reddit.com', 'www.reddit.com',
    'onlyfans.com', 'www.onlyfans.com',
    'huntaze.com', 'www.huntaze.com'
  ]
}

function isAllowedHost(url: URL, allowed: string[]): boolean {
  return allowed.some(h => url.hostname === h || url.hostname.endsWith('.' + h))
}

function canonicalQuery(u: URL): string {
  const p = new URLSearchParams(u.search)
  p.delete('sig')
  const entries = Array.from(p.entries()).sort(([a], [b]) => a.localeCompare(b))
  return new URLSearchParams(entries).toString()
}

function verifySignature(u: URL): boolean {
  const secret = process.env.R_SIGNING_SECRET
  if (!secret) return true
  const sig = u.searchParams.get('sig') || ''
  if (!sig) return false
  const canonical = canonicalQuery(u)
  const mac = crypto.createHmac('sha256', secret).update(canonical).digest('hex')
  if (mac.length !== sig.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(sig))
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const to = url.searchParams.get('to')
  const rid = url.searchParams.get('rid') || undefined
  const platform = url.searchParams.get('platform') || undefined
  const assetId = url.searchParams.get('assetId') || undefined
  const utm_source = url.searchParams.get('utm_source') || undefined
  const utm_medium = url.searchParams.get('utm_medium') || undefined
  const utm_campaign = url.searchParams.get('utm_campaign') || undefined

  if (!to) return NextResponse.json({ error: 'missing_to' }, { status: 400 })

  let dest: URL
  try {
    dest = new URL(to)
    if (!/^https?:$/.test(dest.protocol)) throw new Error('invalid protocol')
  } catch {
    // fallback: home
    dest = new URL('/', url.origin)
  }

  // Security: enforce allowlist and optional signature
  const allowedHosts = getAllowedHosts()
  const okHost = isAllowedHost(dest, allowedHosts)
  const okSig = verifySignature(url)
  if (!okHost || !okSig) {
    return NextResponse.redirect(new URL('/', url.origin), 302)
  }

  // Log click
  try {
    const region = getRegion()
    const ddb = new DynamoDBClient({ region })
    const ts = new Date().toISOString()
    const day = ts.slice(0, 10)
    const eventId = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const item: Record<string, AttributeValue> = {
      day: { S: day },
      sk: { S: `ts#${ts}#${eventId}` },
      ts: { S: ts },
      eventId: { S: String(eventId) },
      platform: { S: String(platform || 'unknown') },
      type: { S: 'click' },
      payload: { S: JSON.stringify({ rid, assetId, utm: { source: utm_source, medium: utm_medium, campaign: utm_campaign }, to: dest.href }) },
    }
    const ttlDays = parseInt(process.env.ANALYTICS_TTL_DAYS || '60', 10)
    const ttlSec = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60
    item.ttl = { N: String(ttlSec) }
    await ddb.send(new PutItemCommand({ TableName: process.env.ANALYTICS_TABLE || 'huntaze-analytics-events', Item: item }))
  } catch (error) {
    console.error('[redirect] failed to log click', error)
  }

  return NextResponse.redirect(dest, 302)
}
