import { NextRequest, NextResponse } from 'next/server'

function summarize(messages: Array<{ sender: 'creator' | 'fan'; text: string; ts?: string }>) {
  const last = messages[messages.length - 1]
  const words = messages.map(m => m.text).join(' ').split(/\s+/)
  const vip = words.filter(w => /tip|ppv|buy|spent/i.test(w)).length >= 2
  const rec: string[] = []
  if (last?.sender === 'fan') rec.push('Offer a teaser with a friendly tone')
  if (vip) rec.push('Suggest a VIP bundle at a premium price')
  return {
    summary: `Thread with ${messages.length} messages. Latest from ${last?.sender || 'unknown'}.`,
    isVIP: vip,
    recommendations: rec,
  }
}

type IncomingMessage = { sender?: string; text?: unknown; ts?: string }

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    if (!Array.isArray(messages) || messages.length === 0) return NextResponse.json({ error: 'Missing messages' }, { status: 400 })
    const normalized = (messages as IncomingMessage[]).map((m) => ({
      sender: m.sender === 'creator' ? 'creator' : 'fan',
      text: typeof m.text === 'string' ? m.text : String(m.text ?? ''),
      ts: m.ts,
    }))
    const out = summarize(normalized)
    const actions = [
      { type: 'pricing_suggestion', price: out.isVIP ? 25 : 15 },
      { type: 'schedule', label: 'Schedule teaser tonight', data: { hour: 21 } },
      { type: 'ab_test', variants: 2, metric: 'ctr' },
    ]
    return NextResponse.json({ mode: 'human_in_the_loop', ...out, actions })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ error: 'Failed to parse conversation', details: message }, { status: 500 })
  }
}
