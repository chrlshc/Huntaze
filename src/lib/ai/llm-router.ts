import { decideTier, type PolicyInput, type ModelTier } from './routing-policy'
import { guardTierForPlan } from './routing-guard'
import { callOpenAI } from './providers/openai'
import { callAzureOpenAI } from './providers/azure'
import { callAnthropic } from './providers/anthropic'
import { logCost } from './cost-logger'

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
type Provider = 'openai' | 'anthropic' | 'azure'

const FALLBACKS: Record<ModelTier, { provider: Provider; model: string }[]> = {
  premium: (() => {
    const preferAzure = (process.env.LLM_PROVIDER || '').toLowerCase() === 'azure'
    if (preferAzure) {
      return [
        { provider: 'azure', model: 'azure-deployment' },
        { provider: 'openai', model: 'gpt-4o' },
        { provider: 'anthropic', model: 'claude-3-5-sonnet' },
      ]
    }
    return [
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'anthropic', model: 'claude-3-5-sonnet' },
      { provider: 'openai', model: 'gpt-4o-mini' },
    ]
  })(),
  standard: (() => {
    const preferAzure = (process.env.LLM_PROVIDER || '').toLowerCase() === 'azure'
    if (preferAzure) {
      return [
        { provider: 'azure', model: 'azure-deployment' },
        { provider: 'openai', model: 'gpt-4o-mini' },
        { provider: 'anthropic', model: 'claude-3-5-sonnet' },
      ]
    }
    return [
      { provider: 'anthropic', model: 'claude-3-5-sonnet' },
      { provider: 'openai', model: 'gpt-4o-mini' },
      { provider: 'anthropic', model: 'claude-3-haiku' },
    ]
  })(),
  economy: (() => {
    const preferAzure = (process.env.LLM_PROVIDER || '').toLowerCase() === 'azure'
    if (preferAzure) {
      return [
        { provider: 'azure', model: 'azure-deployment' },
        { provider: 'openai', model: 'gpt-4o-mini' },
        { provider: 'anthropic', model: 'claude-3-haiku' },
      ]
    }
    return [
      { provider: 'anthropic', model: 'claude-3-haiku' },
      { provider: 'openai', model: 'gpt-4o-mini' },
      { provider: 'anthropic', model: 'claude-3-5-sonnet' },
    ]
  })(),
}

export async function generateWithPolicy(opts: {
  policy: PolicyInput
  messages: ChatMsg[]
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  meta?: { accountId?: string; plan: 'starter' | 'pro' | 'scale' | 'enterprise'; segment?: string; action?: string }
}) {
  const desired = decideTier(opts.policy)
  const tier = opts.meta?.plan ? guardTierForPlan(desired, opts.meta.plan, opts.policy) : desired
  const chain = FALLBACKS[tier]
  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25000)

  let lastErr: any
  for (const step of chain) {
    try {
      const call = step.provider === 'openai' ? callOpenAI : step.provider === 'azure' ? callAzureOpenAI : callAnthropic
      const res = await call({
        model: step.model,
        messages: opts.messages,
        temperature: opts.temperature,
        maxTokens: opts.maxTokens,
        abortSignal: controller.signal,
      })

      clearTimeout(to)

      await logCost({
        when: new Date(),
        plan: opts.meta?.plan ?? 'starter',
        model: step.model,
        provider: step.provider,
        tier,
        tokensIn: res.usage.input,
        tokensOut: res.usage.output,
        msgs: 1,
        segment: opts.meta?.segment,
        action: opts.meta?.action,
        accountId: opts.meta?.accountId,
      })

      return { content: res.content, tier, provider: step.provider, model: step.model, usage: res.usage }
    } catch (e) {
      lastErr = e
      continue
    }
  }

  clearTimeout(to)
  throw lastErr ?? new Error('LLM routing failed')
}
