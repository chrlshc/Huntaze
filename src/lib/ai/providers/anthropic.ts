// Note: requires @anthropic-ai/sdk dependency
import { externalFetchJson } from '@/lib/services/external/http';

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

  const json: any = await externalFetchJson('https://api.anthropic.com/v1/messages', {
    service: 'anthropic',
    operation: 'messages.create',
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
    cache: 'no-store',
    timeoutMs: 20_000,
    retry: {
      maxRetries: 1,
      retryMethods: ['POST'],
    },
  })
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
