import { NextRequest, NextResponse } from 'next/server'

function recommendPPV(fan: { totalSpent?: number; purchases?: number }) {
  const base = 12
  const spent = fan.totalSpent || 0
  const mult = Math.min(spent / 100, 3)
  const propensity = fan.purchases && fan.purchases > 3 ? 1.25 : 1
  const price = Math.round((base + 3 * propensity) * (1 + mult))
  return Math.max(5, Math.min(price, 150))
}

export async function POST(req: NextRequest) {
  try {
    const { fan } = await req.json()
    const ppv = recommendPPV({ totalSpent: fan?.totalSpent, purchases: fan?.purchases })
    return NextResponse.json({ recommended_ppv_price: ppv })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ error: 'Failed to suggest', details: message }, { status: 500 })
  }
}
