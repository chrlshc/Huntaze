import { NextResponse } from 'next/server'
// Monitoring simplified for build compatibility
import { callAzureOpenAI } from '@/src/lib/ai/providers/azure'

export const runtime = 'nodejs'

function enabled() {
  const v = String(process.env.ENABLE_AZURE_AI || process.env.USE_AZURE_OPENAI || '').toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

async function handler() {
  if (!enabled()) return new NextResponse('Not Found', { status: 404, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })

  const started = Date.now()
  const provider = 'azure'
  try {
    const res = await callAzureOpenAI({ messages: [{ role: 'user', content: 'ping' }], maxTokens: 16, temperature: 0.2 })
    const elapsed = (Date.now() - started) / 1000

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT || ''
    const host = (() => { try { return new URL(endpoint).host } catch { return '' } })()
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || ''

    return NextResponse.json({
      status: 'ok',
      provider,
      host,
      deployment,
      content: String(res.content || '').slice(0, 200),
      usage: res.usage,
    }, { headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    const elapsed = (Date.now() - started) / 1000
    return NextResponse.json({ status: 'error', message: e?.message || 'Azure call failed' }, { status: 500, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } })
  }
}

export const GET = handler as any
export const POST = handler as any
export const HEAD = handler as any
