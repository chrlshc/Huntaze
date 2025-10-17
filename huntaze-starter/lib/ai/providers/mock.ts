import type { ChatMessage, LLMProvider } from '../types'

export class MockProvider implements LLMProvider {
  readonly name = 'mock'

  async chat(messages: ChatMessage[]) {
    const lastUserMessage = messages.filter((m) => m.role === 'user').at(-1)?.content ?? ''
    const preview = lastUserMessage.slice(0, 180)
    return { text: `⚙️ Mock response — echoing: ${preview}`, usage: { tokens: 0, costUsd: 0 } }
  }
}
