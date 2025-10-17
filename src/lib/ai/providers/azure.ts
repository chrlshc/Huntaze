export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }

export async function callAzureOpenAI(opts: {
  model?: string
  messages: ChatMsg[]
  temperature?: number
  maxTokens?: number
  abortSignal?: AbortSignal
}) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview'

  if (!endpoint || !deployment) throw new Error('Azure OpenAI not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT.')
  if (!apiKey) throw new Error('Azure OpenAI API key missing. Set AZURE_OPENAI_API_KEY.')

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

