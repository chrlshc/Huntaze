export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMProvider {
  readonly name: 'mock' | 'openai' | 'azure'
  chat(
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<{ text: string; usage?: { tokens?: number; costUsd?: number } }>
}
