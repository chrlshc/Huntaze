import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const DEMO = process.env.NEXT_PUBLIC_DEMO === 'true' || process.env.DEMO_MODE === 'true'
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)

  if (DEMO) {
    const now = Date.now()
    const messages = Array.from({ length: limit }).map((_, i) => ({
      id: `demo-${i + 1}`,
      ofMessageId: `of-${1000 + i}`,
      sender: i % 2 === 0 ? 'fan_42' : 'creator',
      content: i % 3 === 0 ? 'Loved your last drop! 🔥' : 'Hey! Any new bundles this week?',
      tipAmount: i % 5 === 0 ? Math.round(Math.random() * 50) / 1 : undefined,
      messageDate: new Date(now - i * 3600 * 1000).toISOString(),
    }))
    return NextResponse.json({ messages })
  }
  return NextResponse.json({ messages: [] })
}

