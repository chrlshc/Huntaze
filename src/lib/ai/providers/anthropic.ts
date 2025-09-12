// Note: requires @anthropic-ai/sdk dependency
export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }

export async function callAnthropic(opts: {
  model: string
  messages: ChatMsg[]
  temperature?: number
  maxTokens?: number
  abortSignal?: AbortSignal
}) {
  const userContent = opts.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })) as any

  const sys = opts.messages.find((m) => m.role === 'system')?.content ?? undefined

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Anthropic not configured. Set ANTHROPIC_API_KEY to enable provider.')

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 512,
      temperature: opts.temperature ?? 0.6,
      system: sys,
      messages: userContent,
    }),
    signal: opts.abortSignal as any,
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Anthropic request failed: ${resp.status} ${text}`)
  }
  const json: any = await resp.json()
  const content = json?.content?.[0]?.text ?? ''
  const usage = json?.usage ?? { input_tokens: 0, output_tokens: 0 }
  return {
    content,
    usage: {
      input: usage.input_tokens ?? 0,
      output: usage.output_tokens ?? 0,
      total: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
    },
  }
}
