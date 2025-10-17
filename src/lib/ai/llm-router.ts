import { decideTier, type PolicyInput, type ModelTier } from './routing-policy'
import { guardTierForPlan } from './routing-guard'
import { callOpenAI } from './providers/openai'
import { logCost } from './cost-logger'

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
type Provider = 'openai'

const FALLBACKS: Record<ModelTier, { provider: Provider; model: string }[]> = {
  premium: [
    { provider: 'openai', model: 'gpt-4o' },
    { provider: 'openai', model: 'gpt-4o-mini' },
  ],
  standard: [
    { provider: 'openai', model: 'gpt-4o-mini' },
  ],
  economy: [
    { provider: 'openai', model: 'gpt-4o-mini' },
  ],
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
      const res = await callOpenAI({
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
