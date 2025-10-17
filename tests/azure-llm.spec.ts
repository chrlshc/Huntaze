import { describe, it, expect, beforeAll } from 'vitest'
import { callAzureOpenAI } from '../src/lib/ai/providers/azure'
import { resetUndiciMockAgent, installUndiciMockAgent } from '../src/mocks/undici-agent'

describe('Azure OpenAI provider', () => {
  beforeAll(() => {
    process.env.AZURE_OPENAI_ENDPOINT = 'https://azure.openai.mock'
    process.env.AZURE_OPENAI_DEPLOYMENT = 'test-deploy'
    process.env.AZURE_OPENAI_API_KEY = 'test-key'
    // Reinstall mock agent so Azure intercept picks up env values
    return (async () => {
      try { await resetUndiciMockAgent() } catch {}
      await installUndiciMockAgent()
    })()
  })

  it('returns content and usage from mocked Azure endpoint', async () => {
    const res = await callAzureOpenAI({
      messages: [ { role: 'user', content: 'Hello' } ],
      temperature: 0.2,
      maxTokens: 16,
    })
    expect(res.content).toContain('Hello from Azure')
    expect(res.usage.input).toBeGreaterThanOrEqual(0)
    expect(res.usage.total).toBeGreaterThanOrEqual(res.usage.input)
  })
})
