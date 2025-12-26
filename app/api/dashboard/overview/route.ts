/**
 * Dashboard Overview API Endpoint
 * 
 * GET /api/dashboard/overview
 * Returns KPIs, revenue time series, and live feed for the overview page.
 * 
 * Query params:
 * - from: ISO date (YYYY-MM-DD)
 * - to: ISO date (YYYY-MM-DD)
 * 
 * Requirements: 16.1, 16.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';
import type { OverviewResponse, RetentionKpis, TimeSeriesPoint } from '@/lib/dashboard/types';

export const dynamic = 'force-dynamic';

const DEFAULT_RANGE_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toUtcStart(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function toUtcEnd(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function addUtcDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function resolveDateRange(fromParam: string | null, toParam: string | null) {
  const toInput = parseDateParam(toParam) ?? new Date();
  const fromInput = parseDateParam(fromParam) ?? addUtcDays(toInput, -(DEFAULT_RANGE_DAYS - 1));
  const startDay = toUtcStart(fromInput);
  const endDay = toUtcStart(toInput);

  if (Number.isNaN(startDay.getTime()) || Number.isNaN(endDay.getTime()) || startDay > endDay) {
    return null;
  }

  const days = Math.floor((endDay.getTime() - startDay.getTime()) / MS_PER_DAY) + 1;
  return {
    startDay,
    endDay,
    queryStart: startDay,
    queryEnd: toUtcEnd(toInput),
    days,
  };
}

function buildSeries(
  startDay: Date,
  endDay: Date,
  totals: Map<string, number>
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  for (let cursor = new Date(startDay); cursor <= endDay; cursor = addUtcDays(cursor, 1)) {
    const key = formatDateKey(cursor);
    points.push({ date: key, value: totals.get(key) ?? 0 });
  }
  return points;
}

function sumTransactionsByDay(
  transactions: Array<{ amount: number; created_at: Date }>
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const tx of transactions) {
    const key = formatDateKey(tx.created_at);
    totals.set(key, (totals.get(key) ?? 0) + tx.amount);
  }
  return totals;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function deltaPct(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

async function countActiveFans(userId: number, atDay: Date): Promise<number> {
  const subs = await prisma.subscriptions.findMany({
    where: {
      user_id: userId,
      started_at: { lte: atDay },
      OR: [{ ends_at: null }, { ends_at: { gte: atDay } }],
    },
    select: { fan_id: true },
  });

  return new Set(subs.map((sub) => sub.fan_id)).size;
}

function averageTenureDays(
  subs: Array<{ started_at: Date; ends_at: Date | null }>
): number {
  const durations = subs
    .map((sub) => {
      if (!sub.ends_at) return null;
      return (toUtcStart(sub.ends_at).getTime() - toUtcStart(sub.started_at).getTime()) / MS_PER_DAY;
    })
    .filter((value): value is number => typeof value === 'number' && value >= 0);

  if (durations.length === 0) return 0;
  return durations.reduce((sum, value) => sum + value, 0) / durations.length;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number.parseInt(session.user.id, 10);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const range = resolveDateRange(from, to);
    if (!range) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    if (ENABLE_MOCK_DATA) {
      const retention: RetentionKpis = generateMockRetentionKpis();
      const mockResponse: OverviewResponse = {
        kpis: {
          netRevenue: {
            value: 12345.67,
            deltaPct: 12.5,
            label: 'Net Revenue',
            tooltip: 'Subscriptions + PPV + Tips + Customs - Refunds - Chargebacks - Platform Fees',
          },
          activeFans: {
            value: 1234,
            deltaPct: 8.3,
            label: 'Active Fans',
            tooltip: 'Fans with active paid subscriptions at period end',
          },
          conversionRate: {
            value: 3.2,
            deltaPct: -1.5,
            label: 'Conversion Rate',
            tooltip: 'New Subs / Link Taps x 100',
          },
          ltv: {
            value: 245.8,
            deltaPct: 5.7,
            label: 'LTV',
            tooltip: 'Lifetime Value = Net Revenue / Unique Paying Fans',
          },
        },
        retention,
        revenueDaily: generateMockTimeSeries(from, to, 300, 500),
        revenueDailyPrev: generateMockTimeSeries(from, to, 250, 450),
        liveFeed: generateMockLiveFeed(),
        lastSyncAt: new Date().toISOString(),
      };

      return NextResponse.json(mockResponse);
    }

    const prevEndDay = addUtcDays(range.startDay, -1);
    const prevStartDay = addUtcDays(prevEndDay, -(range.days - 1));
    const prevQueryStart = prevStartDay;
    const prevQueryEnd = toUtcEnd(prevEndDay);
    const churnStatuses = ['expired', 'cancelled'];

    const [
      transactions,
      prevTransactions,
      newSubs,
      prevNewSubs,
      churnedSubs,
      prevChurnedSubs,
      endedSubs,
      prevEndedSubs,
      activeFans,
      prevActiveFans,
    ] = await Promise.all([
      prisma.transactions.findMany({
        where: {
          user_id: userId,
          status: 'completed',
          created_at: { gte: range.queryStart, lte: range.queryEnd },
        },
        select: { amount: true, created_at: true },
      }),
      prisma.transactions.findMany({
        where: {
          user_id: userId,
          status: 'completed',
          created_at: { gte: prevQueryStart, lte: prevQueryEnd },
        },
        select: { amount: true, created_at: true },
      }),
      prisma.subscriptions.count({
        where: {
          user_id: userId,
          started_at: { gte: range.queryStart, lte: range.queryEnd },
        },
      }),
      prisma.subscriptions.count({
        where: {
          user_id: userId,
          started_at: { gte: prevQueryStart, lte: prevQueryEnd },
        },
      }),
      prisma.subscriptions.count({
        where: {
          user_id: userId,
          status: { in: churnStatuses },
          ends_at: { gte: range.queryStart, lte: range.queryEnd },
        },
      }),
      prisma.subscriptions.count({
        where: {
          user_id: userId,
          status: { in: churnStatuses },
          ends_at: { gte: prevQueryStart, lte: prevQueryEnd },
        },
      }),
      prisma.subscriptions.findMany({
        where: {
          user_id: userId,
          status: { in: churnStatuses },
          ends_at: { gte: range.queryStart, lte: range.queryEnd },
        },
        select: { started_at: true, ends_at: true },
      }),
      prisma.subscriptions.findMany({
        where: {
          user_id: userId,
          status: { in: churnStatuses },
          ends_at: { gte: prevQueryStart, lte: prevQueryEnd },
        },
        select: { started_at: true, ends_at: true },
      }),
      countActiveFans(userId, range.endDay),
      countActiveFans(userId, prevEndDay),
    ]);

    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const prevRevenue = prevTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    const revenueDaily = buildSeries(
      range.startDay,
      range.endDay,
      sumTransactionsByDay(transactions)
    );

    const revenueDailyPrev = buildSeries(
      prevStartDay,
      prevEndDay,
      sumTransactionsByDay(prevTransactions)
    );

    const netNewSubs = newSubs - churnedSubs;
    const prevNetNewSubs = prevNewSubs - prevChurnedSubs;

    const avgTenure = averageTenureDays(endedSubs);
    const prevAvgTenure = averageTenureDays(prevEndedSubs);

    const rebillRateValue =
      activeFans + churnedSubs > 0
        ? (activeFans / (activeFans + churnedSubs)) * 100
        : 0;

    const prevRebillRateValue =
      prevActiveFans + prevChurnedSubs > 0
        ? (prevActiveFans / (prevActiveFans + prevChurnedSubs)) * 100
        : 0;

    const ltv = activeFans > 0 ? totalRevenue / activeFans : 0;
    const prevLtv = prevActiveFans > 0 ? prevRevenue / prevActiveFans : 0;

    const response: OverviewResponse = {
      kpis: {
        netRevenue: {
          value: round2(totalRevenue),
          deltaPct: round2(deltaPct(totalRevenue, prevRevenue)),
          label: 'Net Revenue',
          tooltip: 'Subscriptions + PPV + Tips + Customs - Refunds - Chargebacks - Platform Fees',
        },
        activeFans: {
          value: activeFans,
          deltaPct: round2(deltaPct(activeFans, prevActiveFans)),
          label: 'Active Fans',
          tooltip: 'Fans with active paid subscriptions at period end',
        },
        conversionRate: {
          value: 0,
          deltaPct: 0,
          label: 'Conversion Rate',
          tooltip: 'New Subs / Link Taps x 100',
        },
        ltv: {
          value: round2(ltv),
          deltaPct: round2(deltaPct(ltv, prevLtv)),
          label: 'LTV',
          tooltip: 'Lifetime Value = Net Revenue / Unique Paying Fans',
        },
      },
      retention: {
        rebillRate: {
          value: round2(rebillRateValue),
          deltaPct: round2(deltaPct(rebillRateValue, prevRebillRateValue)),
          label: 'Rebill Rate',
          tooltip: '% of subscriptions that renewed at expiry this period',
        },
        netNewSubs: {
          value: netNewSubs,
          deltaPct: round2(deltaPct(netNewSubs, prevNetNewSubs)),
          label: 'Net New Subs',
          tooltip: 'New subscribers minus churned subscribers',
        },
        avgTenure: {
          value: round2(avgTenure),
          deltaPct: round2(deltaPct(avgTenure, prevAvgTenure)),
          label: 'Avg Tenure',
          tooltip: 'Average subscriber tenure in days before churn',
        },
        churnedSubs,
        newSubs,
      },
      revenueDaily,
      revenueDailyPrev,
      liveFeed: [],
      lastSyncAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching overview data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock time series data for revenue chart
 */
function generateMockTimeSeries(
  from: string | null,
  to: string | null,
  minValue: number,
  maxValue: number
) {
  const days = 30; // Default to 30 days
  const data = [];
  const endDate = to ? new Date(to) : new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const value = Math.floor(Math.random() * (maxValue - minValue) + minValue);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value
    });
  }
  
  return data;
}

/**
 * Generate mock live feed events
 */
function generateMockLiveFeed() {
  const eventTypes = ['NEW_SUB', 'AI_MESSAGE', 'TIP', 'PPV_PURCHASE', 'CUSTOM_ORDER'] as const;
  const sources = ['Instagram', 'TikTok', 'Twitter', 'OnlyFans'] as const;
  const fanHandles = ['@fan_user1', '@creator_fan', '@subscriber123', '@top_supporter', '@new_member'];
  
  const events = [];
  const now = new Date();
  
  for (let i = 0; i < 15; i++) {
    const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000); // 5 min intervals
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    events.push({
      id: `event_${i}_${Date.now()}`,
      timestamp: timestamp.toISOString(),
      type,
      amount: ['TIP', 'PPV_PURCHASE', 'CUSTOM_ORDER', 'NEW_SUB'].includes(type)
        ? Math.floor(Math.random() * 100) + 10
        : undefined,
      source: sources[Math.floor(Math.random() * sources.length)],
      fanHandle: fanHandles[Math.floor(Math.random() * fanHandles.length)]
    });
  }
  
  return events;
}

/**
 * Generate mock retention KPIs (P0 Creator-specific)
 */
function generateMockRetentionKpis(): RetentionKpis {
  const newSubs = Math.floor(Math.random() * 150) + 80;
  const churnedSubs = Math.floor(Math.random() * 60) + 20;
  const netNew = newSubs - churnedSubs;
  
  return {
    rebillRate: {
      value: 78.5 + Math.random() * 10,
      deltaPct: 2.3,
      label: 'Rebill Rate',
      tooltip: '% of subscriptions that renewed at expiry this period'
    },
    netNewSubs: {
      value: netNew,
      deltaPct: netNew > 50 ? 15.2 : -8.4,
      label: 'Net New Subs',
      tooltip: 'New subscribers minus churned subscribers'
    },
    avgTenure: {
      value: 45 + Math.floor(Math.random() * 30),
      deltaPct: 5.1,
      label: 'Avg Tenure',
      tooltip: 'Average subscriber tenure in days before churn'
    },
    churnedSubs,
    newSubs
  };
}
