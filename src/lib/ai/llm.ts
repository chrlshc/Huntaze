import { decideTier, type PolicyInput, type ModelTier } from './routing-policy'
import { guardTierForPlan } from './routing-guard'
import { callOpenAI } from './providers/openai'
import { callAnthropic } from './providers/anthropic'
import { logCost } from './cost-logger'

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
type Provider = 'openai' | 'anthropic'

const CHAIN: Record<ModelTier, { provider: Provider; model: string }[]> = {
  premium: [
    { provider: 'openai', model: 'gpt-4o' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet' },
    { provider: 'openai', model: 'gpt-4o-mini' },
  ],
  standard: [
    { provider: 'anthropic', model: 'claude-3-5-sonnet' },
    { provider: 'openai', model: 'gpt-4o-mini' },
    { provider: 'anthropic', model: 'claude-3-haiku' },
  ],
  economy: [
    { provider: 'anthropic', model: 'claude-3-haiku' },
    { provider: 'openai', model: 'gpt-4o-mini' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet' },
  ],
}

export async function generateWithPlan(opts: {
  policy: PolicyInput
  plan: 'starter' | 'pro' | 'scale' | 'enterprise'
  messages: ChatMsg[]
  accountId?: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
}) {
  const desired = decideTier(opts.policy)
  const guarded = guardTierForPlan(desired, opts.plan, opts.policy)
  const chain = CHAIN[guarded]

  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25000)

  let lastErr: any
  for (const step of chain) {
    try {
      const call = step.provider === 'openai' ? callOpenAI : callAnthropic
      const res = await call({
        model: step.model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.6,
        maxTokens: opts.maxTokens ?? 512,
        abortSignal: controller.signal,
      })
      clearTimeout(to)

      await logCost({
        when: new Date(),
        plan: opts.plan,
        provider: step.provider,
        model: step.model,
        tier: guarded,
        tokensIn: res.usage.input,
        tokensOut: res.usage.output,
        msgs: 1,
        segment: opts.policy.segment,
        action: opts.policy.action,
        accountId: opts.accountId,
      })

      return { content: res.content, usage: res.usage, tier: guarded, model: step.model, provider: step.provider }
    } catch (e) {
      lastErr = e
      continue
    }
  }

  clearTimeout(to)
  throw lastErr ?? new Error('All providers failed')
}

