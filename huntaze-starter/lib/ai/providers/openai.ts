import OpenAI from 'openai'
import type { ChatMessage, LLMProvider } from '../types'
import { env } from '@/lib/env'

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai'
  private readonly client: OpenAI

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required when LLM_PROVIDER=openai')
    }
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  }

  async chat(messages: ChatMessage[], options?: { temperature?: number; maxTokens?: number }) {
    const userContent = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n')
      .slice(0, 8000)

    if (userContent) {
      await this.client.moderations.create({
        model: 'omni-moderation-latest',
        input: userContent,
      })
    }

    const completion = await this.client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 600,
    })

    return {
      text: completion.choices[0]?.message?.content ?? '',
      usage: {
        tokens: completion.usage?.total_tokens,
        costUsd: 0,
      },
    }
  }
}
