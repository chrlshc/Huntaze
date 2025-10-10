import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const DEMO = process.env.NEXT_PUBLIC_DEMO === 'true' || process.env.DEMO_MODE === 'true'
  if (DEMO) {
    return NextResponse.json({
      earnings: { total: 2486.75, last30d: 1245.5 },
      subscribers: { active: 437, churn30d: 0.07 },
      messages: { total: 312, last24h: 28 },
    })
  }
  return NextResponse.json({ earnings: { total: 0 }, subscribers: { active: 0 }, messages: { total: 0 } })
}

