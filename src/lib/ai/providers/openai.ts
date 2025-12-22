import { externalFetchJson } from '@/lib/services/external/http';

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }

export async function callOpenAI(opts: {
  model: string
  messages: ChatMsg[]
  temperature?: number
  maxTokens?: number
  abortSignal?: AbortSignal
}) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI not configured. Set OPENAI_API_KEY to enable provider.')

  const json: any = await externalFetchJson('https://api.openai.com/v1/chat/completions', {
    service: 'openai',
    operation: 'chat.completions',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.6,
      max_tokens: opts.maxTokens,
      stream: false,
    }),
    signal: opts.abortSignal as any,
    cache: 'no-store',
    timeoutMs: 20_000,
    retry: {
      maxRetries: 1,
      retryMethods: ['POST'],
    },
  })
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
