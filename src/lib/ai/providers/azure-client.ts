import OpenAI from 'openai'

let _client: OpenAI | null = null

export function getAzureOpenAIClient(): OpenAI {
  if (_client) return _client
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview'
  if (!endpoint) throw new Error('AZURE_OPENAI_ENDPOINT is required for Azure OpenAI client')
  if (!apiKey) throw new Error('AZURE_OPENAI_API_KEY is required for Azure OpenAI client')
  // Azure SDK usage: baseURL should be <endpoint>/openai (no /v1), with api-version as default query
  const baseURL = `${endpoint.replace(/\/$/, '')}/openai`
  _client = new OpenAI({
    baseURL,
    apiKey, // OpenAI SDK requires this, but Azure also needs api-key header
    defaultHeaders: { 'api-key': apiKey },
    defaultQuery: { 'api-version': apiVersion },
  } as any)
  return _client
}
