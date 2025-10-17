import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { env } from '@/lib/env'
import { getLLMProvider, type ChatMessage } from '@/lib/ai'
import { trackAIUsage, withMonitoring } from '@/lib/monitoring'

const ENABLED = env.ENABLE_CIN_AI === 'true'

function detectIntent(text: string) {
  const t = text.toLowerCase()
  if (t.includes('time') || t.includes('schedule') || t.includes('planifier')) return 'scheduling'
  if (t.includes('a/b') || t.includes('variant') || t.includes('test')) return 'ab_testing'
  if (t.includes('price') || t.includes('prix') || t.includes('ppv')) return 'pricing'
  if (t.includes('whale') || t.includes('vip')) return 'vip'
  return 'generic'
}

async function fetchOverview() {
  const [fanCount, perfAgg, topFans] = await Promise.all([
    prisma.fan.count(),
    prisma.contentPerformance.aggregate({
      _sum: { revenue: true, views: true, likes: true, comments: true, shares: true },
    }),
    prisma.fan.findMany({ orderBy: { lifetimeValue: 'desc' }, take: 5 }),
  ])

  const totalRevenue = perfAgg._sum.revenue || 0
  const totalViews = perfAgg._sum.views || 0
  const interactions = (perfAgg._sum.likes || 0) + (perfAgg._sum.comments || 0) + (perfAgg._sum.shares || 0)
  const engagementRate = totalViews > 0 ? interactions / totalViews : 0
  const avgRevenuePerFan = fanCount > 0 ? totalRevenue / fanCount : 0

  const whales = topFans.map((fan) => ({
    id: String(fan.id),
    username: fan.username || null,
    displayName: fan.username || null,
    fanTier: fan.lifetimeValue > 500 ? 'whale' : fan.lifetimeValue > 150 ? 'vip' : 'regular',
    totalSpent: fan.lifetimeValue,
    lifetimeValue: fan.lifetimeValue,
    lastPurchaseAt: fan.lastActiveAt ? fan.lastActiveAt.toISOString() : null,
  }))

  return {
    stats: {
      revenue: totalRevenue,
      fans: fanCount,
      engagementRate,
      avgRevenuePerFan,
    },
    whales,
  }
}

function buildActions(intent: string, overview: Awaited<ReturnType<typeof fetchOverview>>) {
  const actions: Array<Record<string, unknown>> = []

  if (intent === 'scheduling') {
    const peakHour = '21:00'
    actions.push({
      type: 'schedule',
      label: `Queue teaser for ${peakHour}`,
      time: `${new Date().toISOString().slice(0, 10)}T${peakHour}:00Z`,
      platforms: ['instagram', 'tiktok'],
      content: 'Preview teaser + call-to-action for VIP upsell.',
    })
  } else if (intent === 'pricing') {
    const suggested = Math.max(15, Math.round((overview.stats.avgRevenuePerFan || 12) * 1.2))
    actions.push({ type: 'schedule', label: `Draft PPV at $${suggested}`, price: suggested })
  } else if (intent === 'ab_testing') {
    actions.push({ type: 'ab_test', label: 'Create caption A/B test', variants: 2, metric: 'ctr' })
  } else if (intent === 'vip') {
    const topWhale = overview.whales[0]
    if (topWhale) {
      actions.push({ type: 'schedule', label: 'Prep VIP follow-up', fanId: topWhale.id })
    }
  }

  return actions
}

const postHandler = async (req: NextRequest): Promise<NextResponse> => {
  if (!ENABLED) {
    return NextResponse.json({ ok: false, reason: 'CIN AI disabled' }, { status: 503 })
  }

  try {
    const body = (await req.json()) as {
      message?: string
      messages?: ChatMessage[]
    }

    const overview = await fetchOverview()
    const userMessage = typeof body.message === 'string' ? body.message : body.messages?.filter((m) => m.role === 'user').at(-1)?.content
    if (!userMessage) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    const intent = detectIntent(userMessage)
    const actions = buildActions(intent, overview)

    const provider = getLLMProvider()
    const contextualMessages: ChatMessage[] = body.messages?.length
      ? body.messages
      : [
          {
            role: 'system',
            content: `You are CIN AI, an assistant for OnlyFans managers. Reply in concise English (max 4 sentences) with actionable guidance.
Key business metrics (last 30 days):
- Revenue: $${overview.stats.revenue.toFixed(0)}
- Active fans: ${overview.stats.fans}
- Engagement rate: ${(overview.stats.engagementRate * 100).toFixed(1)}%
- Avg revenue per fan: $${overview.stats.avgRevenuePerFan.toFixed(2)}
Top whale lifetime values: ${overview.whales.slice(0, 3).map((w) => `${w.displayName || w.username || 'fan'} $${w.lifetimeValue.toFixed(0)}`).join(', ') || 'none'}
Always keep the human in the loop and never promise automatic actions.`,
          },
          { role: 'user', content: userMessage },
        ]

    const startedAt = Date.now()
    const aiResponse = await provider.chat(contextualMessages, { temperature: 0.2, maxTokens: 600 })
    const latency = Date.now() - startedAt

    const modelName =
      provider.name === 'openai'
        ? env.OPENAI_MODEL
        : provider.name === 'azure'
          ? env.AZURE_OPENAI_DEPLOYMENT ?? 'azure-openai'
          : 'mock'

    trackAIUsage(modelName, 'cin_chat', aiResponse.usage?.tokens ?? 0, aiResponse.usage?.costUsd ?? 0, latency)

    return NextResponse.json({
      ok: true,
      intent,
      stats: overview.stats,
      actions,
      text: aiResponse.text,
      provider: provider.name,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ error: 'Chat failed', details: message }, { status: 500 })
  }
}

export const POST = withMonitoring(postHandler, '/api/cin/chat')
