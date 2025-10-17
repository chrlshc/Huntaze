import { AzureOpenAI } from 'openai'
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity'
import type { ChatMessage, LLMProvider } from '../types'
import { env } from '@/lib/env'

export class AzureProvider implements LLMProvider {
  readonly name = 'azure'
  private readonly client: AzureOpenAI

  constructor() {
    if (!env.AZURE_OPENAI_ENDPOINT || !env.AZURE_OPENAI_DEPLOYMENT) {
      throw new Error('Azure OpenAI endpoint and deployment must be configured')
    }

    const baseOptions: Record<string, unknown> = {
      apiVersion: env.AZURE_OPENAI_API_VERSION,
      endpoint: env.AZURE_OPENAI_ENDPOINT,
    }

    if (env.AZURE_OPENAI_API_KEY) {
      baseOptions.apiKey = env.AZURE_OPENAI_API_KEY
    } else {
      const scope = 'https://cognitiveservices.azure.com/.default'
      baseOptions.azureADTokenProvider = getBearerTokenProvider(new DefaultAzureCredential(), scope)
    }

    baseOptions.deployment = env.AZURE_OPENAI_DEPLOYMENT
    this.client = new AzureOpenAI(baseOptions)
  }

  async chat(messages: ChatMessage[], options?: { temperature?: number; maxTokens?: number }) {
    const completion = await this.client.chat.completions.create({
      model: env.AZURE_OPENAI_DEPLOYMENT,
      messages,
      temperature: options?.temperature ?? 0.2,
      max_output_tokens: options?.maxTokens ?? 600,
    })

    return {
      text: completion.choices?.[0]?.message?.content ?? '',
      usage: {
        tokens: completion.usage?.total_tokens,
        costUsd: 0,
      },
    }
  }
}
