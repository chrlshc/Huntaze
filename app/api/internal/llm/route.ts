import { NextResponse } from 'next/server'

// Simple in-memory circuit breaker per provider (best-effort in serverless)
type Circuit = { failures: number; lastFailedAt: number; openUntil: number }
const circuits: Record<string, Circuit> = {
  azure: { failures: 0, lastFailedAt: 0, openUntil: 0 },
  openai: { failures: 0, lastFailedAt: 0, openUntil: 0 },
}

function isOpen(name: 'azure' | 'openai') {
  return Date.now() < circuits[name].openUntil
}

function onFailure(name: 'azure' | 'openai') {
  const c = circuits[name]
  c.failures += 1
  c.lastFailedAt = Date.now()
  if (c.failures >= 3) {
    const cooldown = Math.min(60000, 5000 * c.failures) // up to 60s
    c.openUntil = Date.now() + cooldown
  }
}

function onSuccess(name: 'azure' | 'openai') {
  const c = circuits[name]
  c.failures = 0
  c.openUntil = 0
}

async function withRetry<T>(name: 'azure' | 'openai', fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: any
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fn()
      onSuccess(name)
      return res
    } catch (e: any) {
      lastErr = e
      onFailure(name)
      if (attempt < maxAttempts) {
        const backoff = Math.min(2000 * attempt, 5000) + Math.floor(Math.random() * 250)
        await new Promise((r) => setTimeout(r, backoff))
        continue
      }
    }
  }
  throw lastErr
}

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

function toChatMessages(system?: string, messages?: ChatMessage[]): ChatMessage[] {
  const out: ChatMessage[] = []
  if (system) out.push({ role: 'system', content: String(system) })
  for (const m of messages || []) {
    if (m && m.role && typeof m.content === 'string') out.push({ role: m.role, content: m.content })
  }
  return out
}

async function callAzure({ system, messages, temperature, max_tokens, response_format }: any) {
  const start = Date.now()
  const { AzureOpenAI } = await import('openai')
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT!
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-04-01-preview'
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!

  let client: any
  try {
    const { DefaultAzureCredential, getBearerTokenProvider } = await import('@azure/identity')
    const credential = new DefaultAzureCredential()
    const azureADTokenProvider = getBearerTokenProvider(credential, 'https://cognitiveservices.azure.com/.default')
    client = new AzureOpenAI({ endpoint, azureADTokenProvider, apiVersion, deployment } as any)
  } catch (_e) {
    const apiKey = process.env.AZURE_OPENAI_API_KEY
    if (!apiKey) throw _e
    client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment } as any)
  }

  const chatMessages = toChatMessages(system, messages)
  // If structured outputs requested and supported, use Responses API
  if (response_format?.type === 'json_schema') {
    try {
      const resp = await (client as any).responses.create({
        model: deployment,
        input: chatMessages,
        response_format,
      })
      const latency_ms = Date.now() - start
      const text: string = (resp as any)?.output_text || ''
      const usage = (resp as any)?.usage ? { prompt: (resp as any).usage.input_tokens, completion: (resp as any).usage.output_tokens } : undefined
      return { text, usage, model: deployment, provider: 'Azure OpenAI', latency_ms }
    } catch (_e) {
      // fallback to chat completions below
    }
  }
  const resp = await client.chat.completions.create({
    model: deployment,
    messages: chatMessages,
    temperature: temperature ?? 0.5,
    max_tokens: max_tokens ?? 512,
  })
  const latency_ms = Date.now() - start
  const text: string = resp?.choices?.[0]?.message?.content ?? ''
  const usage = resp?.usage ? { prompt: resp.usage.prompt_tokens, completion: resp.usage.completion_tokens } : undefined
  return { text, usage, model: deployment, provider: 'Azure OpenAI', latency_ms }
}

async function callOpenAI({ system, messages, temperature, max_tokens, response_format }: any) {
  const start = Date.now()
  const { OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const chatMessages = toChatMessages(system, messages)
  if (response_format?.type === 'json_schema') {
    const resp = await (client as any).responses.create({
      model,
      input: chatMessages,
      response_format,
    })
    const latency_ms = Date.now() - start
    const text: string = (resp as any)?.output_text || ''
    const usage = (resp as any)?.usage ? { prompt: (resp as any).usage.input_tokens, completion: (resp as any).usage.output_tokens } : undefined
    return { text, usage, model, provider: 'OpenAI', latency_ms }
  } else {
    const resp = await client.chat.completions.create({
      model,
      messages: chatMessages,
      temperature: temperature ?? 0.5,
      max_tokens: max_tokens ?? 512,
    })
    const latency_ms = Date.now() - start
    const text: string = resp?.choices?.[0]?.message?.content ?? ''
    const usage = resp?.usage ? { prompt: resp.usage.prompt_tokens, completion: resp.usage.completion_tokens } : undefined
    return { text, usage, model, provider: 'OpenAI', latency_ms }
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { system, messages, temperature, max_tokens, response_format } = body || {}

  const prefer = (process.env.LLM_PROVIDER || '').toLowerCase()
  const candidates: Array<() => Promise<any>> = []

  const azureReady = !!process.env.AZURE_OPENAI_ENDPOINT && !!process.env.AZURE_OPENAI_DEPLOYMENT
  const openaiReady = !!process.env.OPENAI_API_KEY

  const args = { system, messages, temperature, max_tokens, response_format }

  const push = (name: string) => {
    if (name === 'azure' && azureReady && !isOpen('azure')) candidates.push(() => withRetry('azure', () => callAzure(args)))
    if (name === 'openai' && openaiReady && !isOpen('openai')) candidates.push(() => withRetry('openai', () => callOpenAI(args)))
  }

  if (prefer) push(prefer)
  if (!prefer) {
    if (azureReady) push('azure')
    if (openaiReady) push('openai')
  } else {
    if (prefer !== 'azure' && azureReady) push('azure')
    if (prefer !== 'openai' && openaiReady) push('openai')
  }

  if (!candidates.length) {
    return NextResponse.json({ error: 'No LLM provider configured' }, { status: 500 })
  }

  let lastErr: any
  for (const fn of candidates) {
    try {
      const out = await fn()
      return NextResponse.json(out)
    } catch (e: any) {
      lastErr = e
      continue
    }
  }
  return NextResponse.json({ error: String(lastErr?.message || 'LLM failed') }, { status: 502 })
}
export const runtime = 'nodejs'
