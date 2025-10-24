export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }

function isTruthy(v: any) {
  const s = String(v || '').toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'on'
}

function isBillingLocked() {
  return isTruthy(process.env.AZURE_BILLING_LOCK)
}

export async function callAzureOpenAI(opts: {
  model?: string
  messages: ChatMsg[]
  temperature?: number
  maxTokens?: number
  abortSignal?: AbortSignal
}) {
  // Global kill switch to prevent any accidental spend
  if (isBillingLocked()) {
    return { content: '', usage: { input: 0, output: 0, total: 0 } }
  }
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview'

  if (!endpoint || !deployment) throw new Error('Azure OpenAI not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT.')
  if (!apiKey) throw new Error('Azure OpenAI API key missing. Set AZURE_OPENAI_API_KEY.')

  const defaultProd = (process.env.NODE_ENV || '').toLowerCase() === 'production'
  const useResponses = isTruthy(process.env.USE_AZURE_RESPONSES) || (!('USE_AZURE_RESPONSES' in process.env) && defaultProd)

  if (useResponses) {
    // Prefer new Responses API via OpenAI SDK, against Azure v1 base URL
    const { getAzureOpenAIClient } = await import('./azure-client')
    const client = getAzureOpenAIClient()
    const prompt = opts.messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n')
    const r: any = await client.responses.create({
      model: opts.model || deployment,
      input: prompt,
      temperature: opts.temperature ?? 0.6,
      max_output_tokens: opts.maxTokens,
    } as any)

    const content = (r as any).output_text ?? ''
    const usageObj: any = (r as any).usage || {}
    const inputTokens = usageObj.input_tokens ?? usageObj.prompt_tokens ?? 0
    const outputTokens = usageObj.output_tokens ?? usageObj.completion_tokens ?? 0
    const totalTokens = usageObj.total_tokens ?? (inputTokens + outputTokens)
    return {
      content,
      usage: { input: inputTokens, output: outputTokens, total: totalTokens },
    }
  }

  // Legacy Chat Completions path (kept for compatibility)
  const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: opts.messages,
      temperature: opts.temperature ?? 0.6,
      max_tokens: opts.maxTokens,
      stream: false,
    }),
    signal: opts.abortSignal as any,
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Azure OpenAI request failed: ${resp.status} ${text}`)
  }

  const json: any = await resp.json().catch(() => ({}))
  const content = json?.choices?.[0]?.message?.content ?? ''
  const usage = json?.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  return {
    content,
    usage: {
      input: usage.prompt_tokens ?? 0,
      output: usage.completion_tokens ?? 0,
      total: usage.total_tokens ?? 0,
    },
  }
}
