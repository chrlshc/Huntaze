import { NextResponse } from 'next/server'
import { getLLMProvider } from '@/services/llm-providers'

export async function GET() {
  const providerName = process.env.LLM_PROVIDER || (process.env.AZURE_LLM_ENABLED === 'true' ? 'azure' : 'claude')
  const provider = getLLMProvider(providerName)
  return NextResponse.json({ provider: provider.name, selected: providerName })
}
export const dynamic = 'force-dynamic'
