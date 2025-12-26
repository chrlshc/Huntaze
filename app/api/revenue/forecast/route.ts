import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';
import type { RevenueForecastResponse } from '@/lib/services/revenue/types';


/**
 * GET /api/revenue/forecast
 * 
 * Get revenue forecast for a creator
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const months = parseInt(searchParams.get('months') || '12', 10);

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    if (Number.isNaN(months) || months < 1 || months > 24) {
      return NextResponse.json(
        { error: 'months must be between 1 and 24' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Revenue forecast request:', {
      creatorId,
      months,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    if (ENABLE_MOCK_DATA) {
      const historical = Array.from({ length: 6 }, (_, i) => ({
        month: new Date(Date.now() - (6 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
        revenue: 10000 + i * 1500 + Math.random() * 1000,
        growth: 10 + i * 2,
      }));

      const forecast = Array.from({ length: months }, (_, i) => ({
        month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
        predicted: 15000 + i * 1200,
        confidence: {
          min: 13000 + i * 1000,
          max: 17000 + i * 1400,
        },
      }));

      const response: RevenueForecastResponse = {
        historical,
        forecast,
        currentMonth: {
          projected: 15234,
          actual: 12340,
          completion: 81,
          onTrack: false,
        },
        nextMonth: {
          projected: 18500,
          actual: 0,
          completion: 0,
          onTrack: true,
        },
        recommendations: [
          {
            action: 'Add 12 new subscribers',
            impact: 1200,
            effort: 'medium',
            description: 'Focus on Instagram promotion to attract new subscribers',
          },
          {
            action: 'Increase PPV content',
            impact: 800,
            effort: 'low',
            description: 'Post 2-3 exclusive PPV items per week',
          },
        ],
        metadata: {
          modelAccuracy: 0.87,
          lastUpdated: new Date().toISOString(),
        },
      };

      return NextResponse.json(response);
    }

    const userId = Number.parseInt(creatorId, 10);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid creatorId' }, { status: 400 });
    }

    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const historyMonths = 6;
    const historyStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (historyMonths - 1), 1));

    const transactions = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        status: 'completed',
        created_at: { gte: historyStart, lte: now },
      },
      select: { amount: true, created_at: true },
    });

    const revenueByMonth = new Map<string, number>();
    for (const tx of transactions) {
      const key = formatMonth(tx.created_at);
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + tx.amount);
    }

    const historical = Array.from({ length: historyMonths }, (_, i) => {
      const monthDate = new Date(Date.UTC(historyStart.getUTCFullYear(), historyStart.getUTCMonth() + i, 1));
      const key = formatMonth(monthDate);
      const revenue = revenueByMonth.get(key) ?? 0;
      const prevKey = formatMonth(new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() - 1, 1)));
      const prevRevenue = revenueByMonth.get(prevKey) ?? 0;
      const growth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
      return { month: key, revenue, growth: Math.round(growth * 100) / 100 };
    });

    const recentGrowth = historical
      .slice(1)
      .map((point) => point.growth)
      .filter((value) => Number.isFinite(value));
    const avgGrowth = recentGrowth.length > 0
      ? recentGrowth.reduce((sum, value) => sum + value, 0) / recentGrowth.length
      : 0;

    const lastRevenue = historical[historical.length - 1]?.revenue ?? 0;

    const forecast = Array.from({ length: months }, (_, i) => {
      const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i + 1, 1));
      const predicted = lastRevenue * Math.pow(1 + avgGrowth / 100, i + 1);
      const confidenceMin = predicted * 0.85;
      const confidenceMax = predicted * 1.15;
      return {
        month: formatMonth(monthDate),
        predicted: Math.round(predicted * 100) / 100,
        confidence: {
          min: Math.round(confidenceMin * 100) / 100,
          max: Math.round(confidenceMax * 100) / 100,
        },
      };
    });

    const currentMonthRevenue = transactions
      .filter((tx) => tx.created_at >= currentMonthStart)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
    const dayOfMonth = Math.max(1, now.getUTCDate());
    const projectedCurrent = dayOfMonth > 0
      ? (currentMonthRevenue / dayOfMonth) * daysInMonth
      : currentMonthRevenue;

    const completion = projectedCurrent > 0
      ? (currentMonthRevenue / projectedCurrent) * 100
      : 0;

    const response: RevenueForecastResponse = {
      historical,
      forecast,
      currentMonth: {
        projected: Math.round(projectedCurrent * 100) / 100,
        actual: Math.round(currentMonthRevenue * 100) / 100,
        completion: Math.round(completion),
        onTrack: currentMonthRevenue >= projectedCurrent * 0.9,
      },
      nextMonth: {
        projected: forecast[0]?.predicted ?? 0,
        actual: 0,
        completion: 0,
        onTrack: true,
      },
      recommendations: [],
      metadata: {
        modelAccuracy: 0,
        lastUpdated: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Forecast error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}
