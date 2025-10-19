import OpenAI from 'openai'

let _client: OpenAI | null = null

export function getAzureOpenAIClient(): OpenAI {
  if (_client) return _client
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  if (!endpoint) throw new Error('AZURE_OPENAI_ENDPOINT is required for Azure OpenAI client')
  if (!apiKey) throw new Error('AZURE_OPENAI_API_KEY is required for Azure OpenAI client')
  const baseURL = `${endpoint.replace(/\/$/, '')}/openai/v1`
  _client = new OpenAI({
    baseURL,
    apiKey, // required by SDK but Azure also needs api-key header
    defaultHeaders: { 'api-key': apiKey },
  })
  return _client
}

