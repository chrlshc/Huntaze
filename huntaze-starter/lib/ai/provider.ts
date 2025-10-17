// lib/ai/provider.ts
import OpenAI, { AzureOpenAI, type ClientOptions } from 'openai'

export type Role = 'system' | 'user' | 'assistant' | 'developer'
export type Msg = { role: Role; content: string }

export type JsonSchema = {
  type: 'object'
  properties: Record<string, unknown>
  required?: string[]
  additionalProperties: boolean
}

type Provider = 'openai' | 'azure'

function detectProvider(): Provider {
  if (process.env.AZURE_OPENAI_DEPLOYMENT || process.env.AZURE_OPENAI_API_KEY) return 'azure'
  return 'openai'
}

function getOpenAI(): OpenAI {
  if (detectProvider() === 'openai') {
    if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY')
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY } as ClientOptions)
  }

  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-10-01-preview'
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT
  const apiKey = process.env.AZURE_OPENAI_API_KEY

  if (!deployment) throw new Error('Missing AZURE_OPENAI_DEPLOYMENT')
  if (!apiKey) throw new Error('Missing AZURE_OPENAI_API_KEY')

  return new AzureOpenAI({
    apiKey,
    apiVersion,
    deployment,
  } as unknown as ClientOptions)
}

/**
 * Generate structured output (strict JSON Schema) when `schema` is provided; otherwise returns plain text.
 */
type OpenAIResponseParams = Parameters<OpenAI['responses']['create']>[0]
type AzureChatCreateParams = Parameters<AzureOpenAI['chat']['completions']['create']>[0]

export async function generateStructured<T>(opts: {
  system?: string
  messages: Msg[]
  schema?: { name: string; value: JsonSchema }
  model?: string
  maxOutputTokens?: number
}): Promise<{ parsed?: T; text?: string; raw: unknown }> {
  const client = getOpenAI()
  const provider = detectProvider()
  const sys: Msg | undefined = opts.system ? { role: 'system', content: opts.system } : undefined
  const msgs = sys ? [sys, ...opts.messages] : [...opts.messages]

  if (provider === 'openai') {
    const body: OpenAIResponseParams = {
      model: opts.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      input: msgs,
      max_output_tokens: opts.maxOutputTokens ?? 300,
    }
    if (opts.schema) {
      body.response_format = {
        type: 'json_schema',
        json_schema: { name: opts.schema.name, schema: opts.schema.value, strict: true },
      }
    }
    const res = await (client as OpenAI).responses.create(body)
    const outputText = (res as { output_text?: string[] }).output_text
    const text = Array.isArray(outputText) ? outputText.join('') : undefined
    let parsed: T | undefined
    if (opts.schema && text) parsed = JSON.parse(text) as T
    return { parsed, text, raw: res }
  }

  // Azure path
  const azureClient = client as AzureOpenAI
  const azurePayload: AzureChatCreateParams = {
    model: process.env.AZURE_OPENAI_DEPLOYMENT!,
    messages: msgs,
    max_output_tokens: opts.maxOutputTokens ?? 300,
    ...(opts.schema
      ? {
          response_format: {
            type: 'json_schema',
            json_schema: { name: opts.schema.name, schema: opts.schema.value, strict: true },
          },
        }
      : {}),
  }
  const res = await azureClient.chat.completions.create(azurePayload)
  const contentCandidate = res?.choices?.[0]?.message?.content
  const content = typeof contentCandidate === 'string' ? contentCandidate : undefined
  let parsed: T | undefined
  if (opts.schema && content) parsed = JSON.parse(content) as T
  return { parsed, text: content, raw: res }
}
