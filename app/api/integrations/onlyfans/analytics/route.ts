import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import type { FanAnalytics } from '@/lib/types/onlyfans';

export const dynamic = 'force-dynamic';

type Period = '24h' | '7d' | '30d' | 'all';

function normalizePeriod(value: string | null): Period {
  if (value === '24h' || value === '7d' || value === '30d' || value === 'all') {
    return value;
  }
  return '30d';
}

function periodStart(period: Period): Date | null {
  if (period === 'all') return null;
  const now = Date.now();
  const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
  return new Date(now - days * 24 * 60 * 60 * 1000);
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const period = normalizePeriod(request.nextUrl.searchParams.get('period'));
  const startDate = periodStart(period);
  const userId = Number.parseInt(session.user.id, 10);

  try {
    const baseFilters = {
      user_id: userId,
      platform: 'onlyfans',
      ...(startDate ? { created_at: { gte: startDate } } : {}),
    } as const;

    const [totalFans, newFans, expiredFans] = await Promise.all([
      prisma.subscriptions.count({
        where: {
          user_id: userId,
          platform: 'onlyfans',
        },
      }),
      prisma.subscriptions.count({
        where: {
          user_id: userId,
          platform: 'onlyfans',
          ...(startDate ? { started_at: { gte: startDate } } : {}),
        },
      }),
      prisma.subscriptions.count({
        where: {
          user_id: userId,
          platform: 'onlyfans',
          status: 'expired',
          ...(startDate ? { ends_at: { gte: startDate } } : {}),
        },
      }),
    ]);

    const [subscriptionsSum, tipsSum, ppvSum] = await Promise.all([
      prisma.transactions.aggregate({
        where: {
          ...baseFilters,
          status: 'completed',
          type: 'subscription',
        },
        _sum: { amount: true },
      }),
      prisma.transactions.aggregate({
        where: {
          ...baseFilters,
          status: 'completed',
          type: 'tip',
        },
        _sum: { amount: true },
      }),
      prisma.transactions.aggregate({
        where: {
          ...baseFilters,
          status: 'completed',
          type: 'ppv',
        },
        _sum: { amount: true },
      }),
    ]);

    const revenue = {
      subscriptions: subscriptionsSum._sum.amount ?? 0,
      tips: tipsSum._sum.amount ?? 0,
      ppv: ppvSum._sum.amount ?? 0,
      total: 0,
    };
    revenue.total = revenue.subscriptions + revenue.tips + revenue.ppv;

    const topSubscriptions = await prisma.subscriptions.findMany({
      where: {
        user_id: userId,
        platform: 'onlyfans',
      },
      orderBy: { amount: 'desc' },
      take: 5,
    });

    const analytics: FanAnalytics = {
      userId: String(userId),
      period,
      metrics: {
        totalFans,
        newFans,
        expiredFans,
        activeConversations: 0,
        revenue,
        averageSpendPerFan: totalFans > 0 ? revenue.total / totalFans : 0,
        topSpenders: topSubscriptions.map((sub) => ({
          username: sub.fan_id,
          totalSpent: sub.amount,
          lastPurchase: sub.ends_at ?? sub.started_at,
        })),
        conversionRates: {
          freeToSaid: 0,
          subscriberToPurchaser: 0,
          ppvOpenRate: 0,
        },
      },
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('OnlyFans analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
