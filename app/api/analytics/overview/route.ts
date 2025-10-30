import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/analytics/overview - Get analytics overview
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || 'month';
    const userId = session.user.id;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    }

    // Fetch analytics data
    const [
      currentRevenue,
      previousRevenue,
      currentSubscribers,
      previousSubscribers,
      currentMessages,
      previousMessages,
      currentViews,
      previousViews,
      topContent,
      subscriberGrowth,
    ] = await Promise.all([
      // Current period revenue
      prisma.transaction.aggregate({
        where: {
          userId,
          createdAt: { gte: startDate },
          status: 'completed',
        },
        _sum: { amount: true },
      }),
      // Previous period revenue
      prisma.transaction.aggregate({
        where: {
          userId,
          createdAt: { gte: previousStartDate, lt: startDate },
          status: 'completed',
        },
        _sum: { amount: true },
      }),
      // Current subscribers
      prisma.subscriber.count({
        where: {
          userId,
          createdAt: { gte: startDate },
          isActive: true,
        },
      }),
      // Previous subscribers
      prisma.subscriber.count({
        where: {
          userId,
          createdAt: { gte: previousStartDate, lt: startDate },
          isActive: true,
        },
      }),
      // Current messages
      prisma.message.count({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
      }),
      // Previous messages
      prisma.message.count({
        where: {
          userId,
          createdAt: { gte: previousStartDate, lt: startDate },
        },
      }),
      // Current views (mock data)
      Promise.resolve(15420),
      // Previous views (mock data)
      Promise.resolve(13250),
      // Top performing content
      prisma.media.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        include: {
          _count: {
            select: { messages: true },
          },
        },
        orderBy: {
          messages: {
            _count: 'desc',
          },
        },
        take: 5,
      }),
      // Subscriber growth over time
      prisma.subscriber.groupBy({
        by: ['createdAt'],
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
    ]);

    // Calculate changes
    const revenueChange = calculatePercentageChange(
      currentRevenue._sum.amount || 0,
      previousRevenue._sum.amount || 0
    );

    const subscribersChange = calculatePercentageChange(
      currentSubscribers,
      previousSubscribers
    );

    const messagesChange = calculatePercentageChange(
      currentMessages,
      previousMessages
    );

    const viewsChange = calculatePercentageChange(currentViews, previousViews);

    const analytics = {
      overview: {
        revenue: {
          current: currentRevenue._sum.amount || 0,
          change: revenueChange,
          changeType: revenueChange >= 0 ? 'increase' : 'decrease',
        },
        subscribers: {
          current: currentSubscribers,
          change: subscribersChange,
          changeType: subscribersChange >= 0 ? 'increase' : 'decrease',
        },
        messages: {
          current: currentMessages,
          change: messagesChange,
          changeType: messagesChange >= 0 ? 'increase' : 'decrease',
        },
        views: {
          current: currentViews,
          change: viewsChange,
          changeType: viewsChange >= 0 ? 'increase' : 'decrease',
        },
      },
      topContent: topContent.map((content) => ({
        id: content.id,
        title: content.title,
        type: content.type,
        engagement: content._count.messages,
        createdAt: content.createdAt,
      })),
      subscriberGrowth: subscriberGrowth.map((item) => ({
        date: item.createdAt.toISOString().split('T')[0],
        count: item._count,
      })),
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('[Analytics Overview API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch analytics data',
        },
      },
      { status: 500 }
    );
  }
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
