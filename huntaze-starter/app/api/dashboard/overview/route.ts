import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withMonitoring } from '@/lib/monitoring'

const getHandler = async (_req: NextRequest): Promise<NextResponse> => {
  void _req
  try {
    const [fanCount, perfAgg, latestPerf, topFans] = await Promise.all([
      prisma.fan.count(),
      prisma.contentPerformance.aggregate({
        _sum: { revenue: true, views: true, likes: true, comments: true, shares: true },
      }),
      prisma.contentPerformance.findMany({ orderBy: { recordedAt: 'desc' }, take: 100 }),
      prisma.fan.findMany({ orderBy: { lifetimeValue: 'desc' }, take: 5 }),
    ])

    const totalRevenue = perfAgg._sum.revenue || 0
    const totalViews = perfAgg._sum.views || 0
    const interactions = (perfAgg._sum.likes || 0) + (perfAgg._sum.comments || 0) + (perfAgg._sum.shares || 0)
    const engagementRate = totalViews > 0 ? interactions / totalViews : 0
    const avgRevenuePerFan = fanCount > 0 ? totalRevenue / fanCount : 0

    const whales = topFans.map((f) => ({
      id: String(f.id),
      username: f.username || null,
      displayName: f.username || null,
      fanTier: f.lifetimeValue > 500 ? 'whale' : f.lifetimeValue > 150 ? 'vip' : 'regular',
      totalSpent: f.lifetimeValue,
      lifetimeValue: f.lifetimeValue,
      lastPurchaseAt: f.lastActiveAt ? f.lastActiveAt.toISOString() : null,
    }))

    const opportunities = [
      { title: 'Re‑engage recent tippers with a PPV bundle' },
      { title: 'Schedule a teaser at peak time tonight' },
      { title: 'A/B test your caption on next reel' },
    ]

    return NextResponse.json({
      stats: {
        revenue: totalRevenue,
        fans: fanCount,
        engagementRate,
        avgRevenuePerFan,
      },
      whales,
      opportunities,
      latestPerformance: latestPerf.map((perf) => ({
        id: perf.id,
        recordedAt: perf.recordedAt,
        views: perf.views,
        likes: perf.likes,
        comments: perf.comments,
        shares: perf.shares,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ error: 'Failed to build overview', details: message }, { status: 500 })
  }
}

export const GET = withMonitoring(getHandler, 'dashboard-overview-get')
