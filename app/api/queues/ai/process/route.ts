import { NextRequest, NextResponse } from 'next/server'
import { queueProcessors } from '@/lib/queue/queue-manager'
import { requireInternalKey } from '@/lib/api/internal-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = requireInternalKey(req)
  if (guard) return guard
  try {
    const startedAt = Date.now()
    await queueProcessors.processAIQueue()
    const durationMs = Date.now() - startedAt

    return NextResponse.json({ ok: true, processed: true, durationMs })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'queue_processing_failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = requireInternalKey(req)
  if (guard) return guard
  try {
    const { iterations = 1 } = await req.json().catch(() => ({ iterations: 1 }))

    const startedAt = Date.now()
    let runs = 0
    for (let i = 0; i < Number(iterations) || 1; i++) {
      await queueProcessors.processAIQueue()
      runs++
    }
    const durationMs = Date.now() - startedAt

    return NextResponse.json({ ok: true, runs, durationMs })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'queue_processing_failed' }, { status: 500 })
  }
}
