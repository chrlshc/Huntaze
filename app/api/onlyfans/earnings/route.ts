import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/onlyfans/earnings - Get earnings data
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

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch earnings data
    const [totalEarnings, subscriptionEarnings, tipEarnings, messageEarnings] = await Promise.all([
      // Total earnings
      prisma.transaction.aggregate({
        where: {
          userId,
          createdAt: { gte: startDate },
          status: 'completed',
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Subscription earnings
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'subscription',
          createdAt: { gte: startDate },
          status: 'completed',
        },
        _sum: { amount: true },
      }),
      // Tip earnings
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'tip',
          createdAt: { gte: startDate },
          status: 'completed',
        },
        _sum: { amount: true },
      }),
      // Message earnings
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'message',
          createdAt: { gte: startDate },
          status: 'completed',
        },
        _sum: { amount: true },
      }),
    ]);

    // Get top subscribers by spending
    const topSubscribers = await prisma.subscriber.findMany({
      where: { userId },
      include: {
        transactions: {
          where: {
            createdAt: { gte: startDate },
            status: 'completed',
          },
          select: { amount: true },
        },
      },
      take: 10,
    });

    // Calculate top subscribers with total spent
    const topSpenders = topSubscribers
      .map((sub) => ({
        id: sub.id,
        username: sub.username,
        tier: sub.tier,
        totalSpent: sub.transactions.reduce((sum, t) => sum + t.amount, 0),
      }))
      .filter((sub) => sub.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    const earnings = {
      total: {
        amount: totalEarnings._sum.amount || 0,
        transactions: totalEarnings._count,
      },
      breakdown: {
        subscriptions: subscriptionEarnings._sum.amount || 0,
        tips: tipEarnings._sum.amount || 0,
        messages: messageEarnings._sum.amount || 0,
      },
      topSpenders,
    };

    return NextResponse.json({
      success: true,
      data: earnings,
    });
  } catch (error) {
    console.error('[OnlyFans Earnings API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch earnings data',
        },
      },
      { status: 500 }
    );
  }
}
