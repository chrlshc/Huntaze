import { z } from 'zod'
import { callAzureOpenAI } from '@/src/lib/ai/providers/azure'
import { PlanRequest } from '@/src/lib/agents/events'

const SupportedPlatforms = ['instagram','tiktok','reddit'] as const

export type PlannedContent = { id: string; idea: string; text: string; assets: Array<{ kind: 'image'|'video'; uri?: string }> }

export async function azurePlannerAgent(req: z.infer<typeof PlanRequest>): Promise<{ contents: PlannedContent[]; platforms: string[] }> {
  const platforms = (req.platforms || []).filter((p) => (SupportedPlatforms as readonly string[]).includes(p))
  const sys = `You are an AI planner that prepares a content schedule. Output STRICT JSON with key \"contents\" as array of items: {id, idea, text, assets:[{kind:"image"|"video"}]}. Keep it concise.`
  const user = `Plan a ${req.period.replace('_', ' ')} content batch for platforms ${platforms.join(', ') || 'instagram'}. Use 2-4 items.`

  // Respect global billing lock: skip remote call, return fallback plan
  if (String(process.env.AZURE_BILLING_LOCK || '').toLowerCase() === '1') {
    return {
      platforms,
      contents: [
        { id: 'P1', idea: 'Teaser', text: 'New drop this week! 🚀', assets: [{ kind: 'image' }] },
        { id: 'P2', idea: 'Behind the scenes', text: 'BTS clip (60s)', assets: [{ kind: 'video' }] },
      ],
    }
  }

  try {
    const out = await callAzureOpenAI({
      messages: [ { role: 'system', content: sys }, { role: 'user', content: user } ],
      maxTokens: 400,
      temperature: 0.3,
    })
    const txt = String(out.content || '').trim()
    const jsonStart = txt.indexOf('{')
    const jsonEnd = txt.lastIndexOf('}')
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(txt.slice(jsonStart, jsonEnd + 1))
      const contents: PlannedContent[] = Array.isArray(parsed?.contents) ? parsed.contents : []
      if (contents.length) return { contents, platforms }
    }
  } catch {
    // fallthrough to fallback plan
  }
  // Fallback deterministic plan
  return {
    platforms,
    contents: [
      { id: 'P1', idea: 'Teaser', text: 'New drop this week! 🚀', assets: [{ kind: 'image' }] },
      { id: 'P2', idea: 'Behind the scenes', text: 'BTS clip (60s)', assets: [{ kind: 'video' }] },
    ],
  }
}
