import { decideTier, type PolicyInput, type ModelTier } from './routing-policy'
import { guardTierForPlan } from './routing-guard'
import { callOpenAI } from './providers/openai'
import { callAnthropic } from './providers/anthropic'
import { callAzureAI } from './providers/azure-ai'
import { logCost } from './cost-logger'

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
type Provider = 'openai' | 'anthropic' | 'azure'

const FALLBACKS: Record<ModelTier, { provider: Provider; model: string }[]> = {
  premium: [
    { provider: 'azure', model: 'deepseek' },
    { provider: 'openai', model: 'gpt-4o' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet' },
    { provider: 'azure', model: 'phi4' },
    { provider: 'openai', model: 'gpt-4o-mini' },
  ],
  standard: [
    { provider: 'azure', model: 'phi4' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet' },
    { provider: 'azure', model: 'deepseek' },
    { provider: 'openai', model: 'gpt-4o-mini' },
    { provider: 'anthropic', model: 'claude-3-haiku' },
  ],
  economy: [
    { provider: 'azure', model: 'phi4' },
    { provider: 'anthropic', model: 'claude-3-haiku' },
    { provider: 'openai', model: 'gpt-4o-mini' },
    { provider: 'azure', model: 'deepseek' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet' },
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
      let res
      if (step.provider === 'openai') {
        res = await callOpenAI({
          model: step.model,
          messages: opts.messages,
          temperature: opts.temperature,
          maxTokens: opts.maxTokens,
          abortSignal: controller.signal,
        })
      } else if (step.provider === 'anthropic') {
        res = await callAnthropic({
          model: step.model,
          messages: opts.messages,
          temperature: opts.temperature,
          maxTokens: opts.maxTokens,
          abortSignal: controller.signal,
        })
      } else if (step.provider === 'azure') {
        res = await callAzureAI({
          model: step.model as 'deepseek' | 'phi4' | 'llama',
          messages: opts.messages,
          temperature: opts.temperature,
          maxTokens: opts.maxTokens,
          abortSignal: controller.signal,
        })
      }

      if (!res) {
        throw new Error('No response from AI provider')
      }

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

      return { content: res.content, usage: res.usage, provider: step.provider, model: step.model }
    } catch (e) {
      lastErr = e
      continue
    }
  }

  clearTimeout(to)
  throw lastErr ?? new Error('LLM routing failed')
}
