import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const [contentCount, fanCount, perfAgg] = await Promise.all([
      prisma.content.count(),
      prisma.fan.count(),
      prisma.contentPerformance.aggregate({ _sum: { revenue: true, likes: true, comments: true, shares: true, views: true } })
    ])

    const revenue = perfAgg._sum.revenue || 0
    const views = perfAgg._sum.views || 0
    const engagement = (perfAgg._sum.likes || 0) + (perfAgg._sum.comments || 0) + (perfAgg._sum.shares || 0)

    return NextResponse.json({
      data: {
        posts: contentCount,
        fans: fanCount,
        revenue,
        engagementRate: views > 0 ? engagement / views : 0,
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ error: 'Unable to load insights', details: message }, { status: 500 })
  }
}
