import { NextResponse } from 'next/server'

// Replace this stub with your real data source.
// Latest month first; months as YYYY-MM (for display).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId') ?? 'demo'
  const window = searchParams.get('window') ?? '90d'

  const history = [
    { month: '2025-09', gmvUsd: 8400, aiMsgs: 10500, plan: 'scale', enforcement: 'ok' },
    { month: '2025-08', gmvUsd: 6100, aiMsgs: 8200, plan: 'pro', enforcement: 'ok' },
    { month: '2025-07', gmvUsd: 4100, aiMsgs: 5200, plan: 'pro', enforcement: 'ok' },
  ]

  const current = history[0]
  return NextResponse.json({ accountId, window, current, history })
}

