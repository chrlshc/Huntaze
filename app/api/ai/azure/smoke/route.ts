import { NextResponse } from 'next/server'
import { withMonitoring } from '@/lib/observability/bootstrap'
import { callAzureOpenAI } from '@/src/lib/ai/providers/azure'
import { prom } from '@/src/lib/prom'

export const runtime = 'nodejs'

function truthy(v: any) {
  const s = String(v ?? '').toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'on'
}

async function handler() {
  // Read env at request time to avoid stale POP/module caching
  const useAzure = truthy(process.env.ENABLE_AZURE_AI || process.env.USE_AZURE_OPENAI)
  const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '')
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || ''
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview'

  if (!useAzure) {
    return NextResponse.json(
      { status: 'disabled', provider: 'azure', endpoint, deployment, apiVersion },
      { status: 503, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } }
    )
  }
  if (!endpoint || !deployment) {
    return NextResponse.json(
      { status: 'misconfigured', provider: 'azure', endpoint, deployment, apiVersion },
      { status: 503, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } }
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
