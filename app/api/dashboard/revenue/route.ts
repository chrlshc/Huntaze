import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

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
    const range = searchParams.get('range') || 'week';
    const userId = session.user.id;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let groupBy: 'day' | 'week' | 'month';

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupBy = 'month';
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
    }

    // Fetch revenue data
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        status: 'completed',
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch messages data
    const messages = await prisma.message.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group data by date
    const revenueData = groupDataByDate(transactions, messages, startDate, now, groupBy);

    return NextResponse.json({
      success: true,
      data: revenueData,
    });
  } catch (error) {
    console.error('[Dashboard Revenue API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch revenue data',
        },
      },
      { status: 500 }
    );
  }
}

function groupDataByDate(
  transactions: { amount: number; createdAt: Date }[],
  messages: { createdAt: Date }[],
  startDate: Date,
  endDate: Date,
  groupBy: 'day' | 'week' | 'month'
) {
  const data: { date: string; revenue: number; messages: number }[] = [];
  const dateMap = new Map<string, { revenue: number; messages: number }>();

  // Initialize all dates
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = formatDateKey(current, groupBy);
    dateMap.set(key, { revenue: 0, messages: 0 });
    
    if (groupBy === 'day') {
      current.setDate(current.getDate() + 1);
    } else if (groupBy === 'month') {
      current.setMonth(current.getMonth() + 1);
    }
  }

  // Aggregate transactions
  transactions.forEach((transaction) => {
    const key = formatDateKey(transaction.createdAt, groupBy);
    const existing = dateMap.get(key);
    if (existing) {
      existing.revenue += transaction.amount;
    }
  });

  // Aggregate messages
  messages.forEach((message) => {
    const key = formatDateKey(message.createdAt, groupBy);
    const existing = dateMap.get(key);
    if (existing) {
      existing.messages += 1;
    }
  });

  // Convert to array
  dateMap.forEach((value, key) => {
    data.push({
      date: key,
      revenue: value.revenue,
      messages: value.messages,
    });
  });

  return data;
}

function formatDateKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  if (groupBy === 'day') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (groupBy === 'month') {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return date.toLocaleDateString();
}
