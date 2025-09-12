import { NextResponse } from 'next/server'
import { generateWithPlan } from '@/src/lib/ai/llm'
import type { PolicyInput } from '@/src/lib/ai/routing-policy'
import { getAccountPlan, getAccountId, getFanSegment, detectRisk } from '@/src/lib/server'
import { consumeMessageCredits } from '@/src/lib/ai/credits'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const accountId = await getAccountId()
    const plan = await getAccountPlan(accountId)

    const policy: PolicyInput = {
      segment: await getFanSegment(body.fanId || ''),
      action: 'Reply',
      risk: await detectRisk(body.context || ''),
      expectedValueUsd: Number(body.estimatedValue || 0),
    }

    const messages = [
      { role: 'system', content: 'You are Huntaze, an assistant that writes concise, on-brand replies for OnlyFans creators.' },
      { role: 'user', content: String(body.prompt || '') },
    ] as const

    const out = await generateWithPlan({
      policy,
      plan,
      messages: messages as any,
      accountId,
      temperature: 0.7,
      maxTokens: 300,
    })

    // Consume one message credit (if packs available). Uncovered > 0 implies overage/policy coverage.
    try { await consumeMessageCredits(accountId, 1) } catch {}

    return NextResponse.json(out)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Generation failed' }, { status: 500 })
  }
}
