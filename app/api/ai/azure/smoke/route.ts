import { NextResponse } from 'next/server'
import { withMonitoring } from '@/lib/observability/bootstrap'
import { callAzureOpenAI } from '@/src/lib/ai/providers/azure'
import { prom } from '@/src/lib/prom'
import { createHash, timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'

function truthy(v: any) {
  const s = String(v ?? '').toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'on'
}

function ctEq(a: string, b: string) {
  // Digest-to-digest constant-time compare to avoid length leak
  const da = createHash('sha256').update(a).digest()
  const db = createHash('sha256').update(b).digest()
  try { return timingSafeEqual(da, db) } catch { return false }
}

function parseAuth(req: Request): { ok: boolean; provided: boolean } {
  const hdr = req.headers.get('authorization') || ''
  const xhdr = req.headers.get('x-ai-smoke-token') || ''
  const token = process.env.AI_SMOKE_TOKEN || ''
  const bearer = hdr.startsWith('Bearer ') ? hdr.slice(7) : ''
  if (!token) return { ok: false, provided: false }
  const providedVal = bearer || xhdr
  if (!providedVal) return { ok: false, provided: false }
  return { ok: ctEq(providedVal, token), provided: true }
}

async function incrFail(ip: string) {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis') as any
      const redis = Redis.fromEnv()
      const key = `ai:smoke:fail:${ip}`
      const cnt = await redis.incr(key)
      if (cnt === 1) await redis.expire(key, 300) // 5 min window
      return cnt as number
    }
  } catch {}
  const g: any = globalThis as any
  g.__aiSmokeFail = g.__aiSmokeFail || new Map<string, { n: number; exp: number }>()
  const now = Date.now()
  const cur = g.__aiSmokeFail.get(ip)
  if (!cur || cur.exp < now) {
    g.__aiSmokeFail.set(ip, { n: 1, exp: now + 5 * 60 * 1000 })
    return 1
  }
  cur.n += 1
  return cur.n
}

async function failCount(ip: string) {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis') as any
      const redis = Redis.fromEnv()
      const key = `ai:smoke:fail:${ip}`
      const v = await redis.get<number>(key)
      return Number(v || 0)
    }
  } catch {}
  const g: any = globalThis as any
  const cur = g.__aiSmokeFail?.get(ip)
  if (!cur) return 0
  if (cur.exp < Date.now()) return 0
  return cur.n
}

async function handler(req: Request) {
  // Read env at request time to avoid stale POP/module caching
  const useAzure = truthy(process.env.ENABLE_AZURE_AI || process.env.USE_AZURE_OPENAI)
  const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '')
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || ''
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview'
  const billingLocked = truthy(process.env.AZURE_BILLING_LOCK)
  const url = new URL(req.url)
  const force = url.searchParams.get('force') === '1' || req.headers.get('x-ai-force') === '1'
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  const labelsBase = { path: '/api/ai/azure/smoke', env: String(process.env.NODE_ENV || 'development'), force: force ? '1' : '0', source: 'node' }

  if (!useAzure) {
    return NextResponse.json(
      { status: 'disabled', provider: 'azure', endpoint, deployment, apiVersion },
      { status: 503, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } }
    )
  }
  if (billingLocked && !force) {
    prom.counters.azureSmokeEvents.labels({ action: 'locked', ...labelsBase } as any).inc(1)
    return NextResponse.json(
      { status: 'locked', provider: 'azure', endpoint, deployment, apiVersion },
      { status: 503, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store', 'X-Azure-Call': 'skipped', 'Retry-After': '600' } }
    )
  }
  if (!endpoint || !deployment) {
    return NextResponse.json(
      { status: 'misconfigured', provider: 'azure', endpoint, deployment, apiVersion },
      { status: 503, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } }
    )
  }

  // Require token for real Azure call to avoid accidental spend
  const auth = parseAuth(req)
  if (!auth.provided) {
    prom.counters.azureSmokeEvents.labels({ action: 'auth_missing', ...labelsBase } as any).inc(1)
    await incrFail(ip)
    return new NextResponse('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="smoke", error="invalid_token"' } })
  }
  if (!auth.ok) {
    const n = await incrFail(ip)
    prom.counters.azureSmokeEvents.labels({ action: 'auth_invalid', ...labelsBase } as any).inc(1)
    if (n > 5) {
      const cur = await failCount(ip)
      const retrySec = 300 // 5 minutes
      prom.counters.azureSmokeEvents.labels({ action: 'rate_limited', ...labelsBase } as any).inc(1)
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': String(retrySec), 'X-Robots-Tag': 'noindex' } })
    }
    return new NextResponse('Forbidden', { status: 403, headers: { 'X-Robots-Tag': 'noindex' } })
  }
  if (!force) {
    prom.counters.azureSmokeEvents.labels({ action: 'force_required', ...labelsBase } as any).inc(1)
    return NextResponse.json(
      { status: 'skipped', reason: 'force_required', provider: 'azure', endpoint, deployment, apiVersion },
      { status: 400, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store', 'X-Azure-Call': 'skipped' } }
    )
  }

  const started = Date.now()
  const provider = 'azure'
  try {
    const res = await callAzureOpenAI({ messages: [{ role: 'user', content: 'ping' }], maxTokens: 16, temperature: 0.2 })
    const elapsed = (Date.now() - started) / 1000
    prom.histograms.llmLatency.labels({ provider }).observe(elapsed)
    prom.counters.llmRequests.labels({ provider, status: 'ok' }).inc(1)
    prom.counters.llmTokens.labels({ provider, kind: 'input' }).inc(res.usage.input || 0)
    prom.counters.llmTokens.labels({ provider, kind: 'output' }).inc(res.usage.output || 0)
    prom.counters.azureSmokeEvents.labels({ action: 'ok', ...labelsBase } as any).inc(1)

    const host = (() => { try { return new URL(endpoint).host } catch { return '' } })()
    return NextResponse.json(
      {
        status: 'ok',
        provider,
        endpoint,
        host,
        deployment,
        apiVersion,
        content: String(res.content || '').slice(0, 200),
        usage: res.usage,
      },
      { headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    const elapsed = (Date.now() - started) / 1000
    prom.histograms.llmLatency.labels({ provider }).observe(elapsed)
    prom.counters.llmRequests.labels({ provider, status: 'error' }).inc(1)
    return NextResponse.json(
      { status: 'error', provider: 'azure', endpoint, deployment, apiVersion, message: e?.message || 'Azure call failed' },
      { status: 500, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } }
    )
  }
}

export const GET = withMonitoring('ai.azure.smoke', handler)
export const POST = GET
export const HEAD = GET
