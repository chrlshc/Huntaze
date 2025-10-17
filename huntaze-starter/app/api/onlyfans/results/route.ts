import { NextResponse } from 'next/server'
import { z } from 'zod'

const payloadSchema = z.object({
  jobId: z.string(),
  scrapeType: z.enum(['posts', 'messages', 'analytics']),
  data: z.unknown(),
  creatorId: z.string().optional()
})

export async function POST(request: Request) {
  const enabled = String(process.env.OF_INGEST_ENABLED || '').toLowerCase() === 'true'
  if (!enabled) {
    return NextResponse.json({ error: 'OnlyFans ingest disabled' }, { status: 404 })
  }
  try {
    const body = await request.json()
    const parse = payloadSchema.safeParse(body)

    if (!parse.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parse.error.flatten() }, { status: 400 })
    }

    const { jobId, scrapeType, data, creatorId } = parse.data

    // TODO: mapper `data` vers Prisma selon `scrapeType`
    try {
      const { prisma } = await import('@/lib/prisma')
      await prisma.scrapeLog.create({
        data: {
          jobId,
          scrapeType,
          creatorId,
          payload: data as Record<string, unknown>,
        },
      })
    } catch (error) {
      console.error('[POST /api/onlyfans/results] prisma_insert_failed', error)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/onlyfans/results]', error)
    return NextResponse.json({ error: 'Failed to ingest results' }, { status: 500 })
  }
}
