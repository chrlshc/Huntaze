import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const contents = await prisma.content.findMany({
      orderBy: { postedAt: 'desc' },
      include: {
        performances: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    })

    return NextResponse.json({ data: contents })
  } catch (error) {
    console.error('[GET /api/onlyfans/content]', error)
    return NextResponse.json({ error: 'Unable to load content' }, { status: 500 })
  }
}
