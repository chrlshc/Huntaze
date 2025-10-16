import { NextRequest, NextResponse } from 'next/server'
import { getLLMProvider, type LLMDraftParams, type ContentGuardrails } from '@/services/llm-providers'

// POST /api/ai/draft
// Body: { fanMessage: string, fanData?: {...}, persona?: {...}, platform?: string }
// Returns: { draft, confidence, upsell_opportunity, recommended_ppv_price, guardrails: { valid, triggered_rules } }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const fanMessage: string = String(body.fanMessage || '')
    if (!fanMessage) {
      return NextResponse.json({ error: 'fanMessage is required' }, { status: 400 })
    }

    const providerName = process.env.LLM_PROVIDER || (process.env.AZURE_LLM_ENABLED === 'true' ? 'azure' : 'claude')
    const provider = getLLMProvider(providerName)

    const params: LLMDraftParams = {
      fanMessage,
      fanData: body.fanData || {
        name: body?.fanData?.name || 'fan',
        rfmSegment: body?.fanData?.rfmSegment || 'UNKNOWN',
        lastActive: body?.fanData?.lastActive || new Date().toISOString(),
        totalSpent: Number(body?.fanData?.totalSpent || 0),
        messageCount: Number(body?.fanData?.messageCount || 0),
        propensityScore: body?.fanData?.propensityScore,
      },
      persona: body.persona || {
        name: 'Creator',
        style_guide: 'Friendly, concise, authentic. Avoid overpromising. Subtle upsell only when appropriate.',
        tone_keywords: ['friendly', 'warm', 'engaging'],
        templates: {
          welcome: 'Hey ${name}! Thanks for your message 💕',
          upsell: 'Hey ${name}! I have something special just for you... interested? 😘',
          reactivation: "Hey ${name}! Haven't heard from you in a while. Miss chatting with you! 💭",
        },
      },
      conversationHistory: Array.isArray(body.conversationHistory) ? body.conversationHistory : undefined,
      platform: body.platform || 'onlyfans',
    }

    const draft = await provider.generateDraft(params)

    // Basic guardrails (local) — platform policies/length/link blocks
    const guardrails: ContentGuardrails = {
      forbidden_words: Array.isArray(body?.guardrails?.forbidden_words) ? body.guardrails.forbidden_words : [],
      escalation_triggers: Array.isArray(body?.guardrails?.escalation_triggers) ? body.guardrails.escalation_triggers : ['refund', 'chargeback', 'sue'],
      frequency_limits: { max_per_hour: 30, cooldown_minutes: 1 },
      max_length: Number(body?.guardrails?.max_length || 1000),
      require_cta: false,
      block_external_links: true,
    }
    const validation = await provider.validateContent(draft.draft, guardrails)

    return NextResponse.json({
      provider: provider.name,
      ...draft,
      guardrails: validation,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to draft reply' }, { status: 500 })
  }
}

