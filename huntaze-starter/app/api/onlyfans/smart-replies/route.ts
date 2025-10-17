import { NextRequest, NextResponse } from 'next/server'
import { generateStructured } from '@/lib/ai/provider'
import { SmartRepliesSchema } from '@/lib/ai/schemas'

export const runtime = 'nodejs'

type Input = {
  latestMessage: string
  fanSegment?: string
  context?: { creatorStyle?: string; campaign?: string }
}

type SmartReplies = {
  replies: {
    friendly: { text: string; policy_tags: string[] }
    direct: { text: string; policy_tags: string[] }
    upsell: { text: string; policy_tags: string[] }
  }
}

const SYSTEM = [
  'You draft short, clear, English-only replies.',
  'Never send messages automatically; the human decides.',
  'No explicit sexual content, no illegal activity, no harassment.',
  'Keep each reply concise and actionable (aim <= 160 chars).',
  'If user asks for off-platform contact or prohibited content, return a brief refusal.'
].join(' ')

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Input
    const latest = (body.latestMessage || '').slice(0, 2000)
    const seg = body.fanSegment || 'general'
    const style = body.context?.creatorStyle || 'friendly, professional'

    const { parsed, text, raw } = await generateStructured<SmartReplies>({
      system: SYSTEM,
      messages: [
        { role: 'user', content: `Latest fan message: """${latest}"""` },
        { role: 'developer', content: `Tone presets: friendly | direct | upsell. Audience segment: ${seg}. Style: ${style}.` },
        { role: 'developer', content: 'Return strictly in the smart_replies JSON schema.' }
      ],
      schema: SmartRepliesSchema,
      maxOutputTokens: 300
    })

    const clamp = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 200)

    const safe = parsed?.replies ?? {
      friendly: { text: text || 'Thanks for the note — I’ll get back to you shortly.', policy_tags: ['fallback'] },
      direct:   { text: 'Got it — I’ll follow up with details soon.', policy_tags: ['fallback'] },
      upsell:   { text: 'Thanks! I’ll share more options shortly.', policy_tags: ['fallback'] }
    }

    const result: SmartReplies = {
      replies: {
        friendly: { text: clamp(safe.friendly.text), policy_tags: safe.friendly.policy_tags || [] },
        direct:   { text: clamp(safe.direct.text),   policy_tags: safe.direct.policy_tags || [] },
        upsell:   { text: clamp(safe.upsell.text),   policy_tags: safe.upsell.policy_tags || [] },
      }
    }

    const requestId = (raw && (raw._request_id || raw.requestId)) || undefined
    return NextResponse.json({ mode: 'human_in_the_loop', ...result, requestId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ error: 'Failed to build smart replies', details: message }, { status: 500 })
  }
}
