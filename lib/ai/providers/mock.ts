import type { ChatMessage, LLMProvider } from '../types'

export class MockProvider implements LLMProvider {
  readonly name = 'mock'

  async chat(messages: ChatMessage[]): Promise<{ text: string }> {
    const lastUserMessage = messages.filter((m) => m.role === 'user').at(-1)?.content ?? ''
    const preview = lastUserMessage.slice(0, 180)
    return { text: `⚙️ Mock response — echoing: ${preview}` }
  }
}
