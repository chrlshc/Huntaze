import { env } from '@/lib/env'
import type { LLMProvider } from './types'
import { MockProvider } from './providers/mock'
import { OpenAIProvider } from './providers/openai'
import { AzureProvider } from './providers/azure'

let providerInstance: LLMProvider | null = null

function createProvider(): LLMProvider {
  switch (env.LLM_PROVIDER) {
    case 'openai':
      return new OpenAIProvider()
    case 'azure':
      return new AzureProvider()
    default:
      return new MockProvider()
  }
}

export function getLLMProvider(): LLMProvider {
  if (!providerInstance) {
    providerInstance = createProvider()
  }
  return providerInstance
}
