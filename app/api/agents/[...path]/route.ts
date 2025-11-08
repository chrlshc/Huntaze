import { NextRequest, NextResponse } from 'next/server'
import { withMonitoring } from '@/lib/observability/bootstrap'
import { checkRateLimit, idFromRequestHeaders } from '@/src/lib/rate-limit'

export const runtime = 'nodejs'

function enabled() {
  const v = String(process.env.ENABLE_AGENTS_PROXY || '').toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

function authorized(req: NextRequest) {
  const token = process.env.AGENTS_PROXY_TOKEN || ''
  if (!token) return false
  const auth = req.headers.get('authorization') || ''
  const raw = auth.startsWith('Bearer ') ? auth.slice(7) : (req.headers.get('x-agents-token') || '')
  return !!raw && raw === token
}

async function handler(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  if (!enabled()) return new NextResponse('Not Found', { status: 404, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })
  if (!authorized(req)) return new NextResponse('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Bearer', 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })

  const ident = idFromRequestHeaders(req.headers)
  const limit = ident.kind === 'token' ? 120 : 60
  const rl = await checkRateLimit({ id: ident.id, limit, windowSec: 60 })
  if (!rl.allowed) return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': String(rl.resetSec), 'Cache-Control': 'no-store' } })

  const base = process.env.AGENTS_API_URL || ''
  if (!base) return new NextResponse('Bad Gateway', { status: 502 })

  const params = await ctx.params;
  const path = (params.path || []).join('/')
  const url = `${base.replace(/\/$/,'')}/${path}`
  const method = req.method
  const body = method === 'GET' || method === 'HEAD' ? undefined : await req.text()

  const res = await fetch(url, { method, headers: { 'content-type': req.headers.get('content-type') || 'application/json' }, body })
  const text = await res.text()
  return new NextResponse(text, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json', 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })
}

export const GET = withMonitoring('agents.proxy', handler as any)
export const POST = GET
export const PUT = GET
export const PATCH = GET
export const DELETE = GET
export const HEAD = GET

