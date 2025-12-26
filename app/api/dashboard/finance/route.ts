/**
 * Dashboard Finance API Endpoint
 * 
 * GET /api/dashboard/finance
 * Returns revenue breakdown, whale list, and AI metrics for the finance page.
 * 
 * Query params:
 * - from: ISO date (YYYY-MM-DD)
 * - to: ISO date (YYYY-MM-DD)
 * 
 * Requirements: 16.2, 16.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';
import type { FinanceResponse, ExpansionKpis, RiskKpis, MessagingKpis, Whale } from '@/lib/dashboard/types';

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

function resolveDateRange(fromParam: string | null, toParam: string | null) {
  const toInput = parseDateParam(toParam) ?? new Date();
  const fromInput = parseDateParam(fromParam) ?? addUtcDays(toInput, -(DEFAULT_RANGE_DAYS - 1));
  const startDay = toUtcStart(fromInput);
  const endDay = toUtcStart(toInput);

  if (Number.isNaN(startDay.getTime()) || Number.isNaN(endDay.getTime()) || startDay > endDay) {
    return null;
  }

  return {
    startDay,
    endDay,
    queryStart: startDay,
    queryEnd: toUtcEnd(toInput),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
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

function normalizeType(value: string | null): string {
  return (value || '').toLowerCase();
}

function normalizeStatus(value: string | null): string {
  return (value || '').toLowerCase();
}

async function buildWhales(userId: number, start: Date, end: Date): Promise<Whale[]> {
  const groups = await prisma.subscriptions.groupBy({
    by: ['fan_id'],
    where: {
      user_id: userId,
      started_at: { gte: start, lte: end },
    },
    _sum: { amount: true },
    _max: { started_at: true, ends_at: true },
    orderBy: {
      _sum: { amount: 'desc' },
    },
    take: 10,
  });

  return groups.map((group) => {
    const totalSpent = group._sum.amount ?? 0;
    const lastPurchase = group._max.ends_at ?? group._max.started_at ?? end;

    return {
      fanId: group.fan_id,
      name: group.fan_id,
      totalSpent: round2(totalSpent),
      lastPurchaseAt: lastPurchase.toISOString(),
      isOnline: false,
      aiPriority: totalSpent >= 1000 ? 'high' : 'normal',
    };
  });
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
      const expansion: ExpansionKpis = generateMockExpansionKpis();
      const risk: RiskKpis = generateMockRiskKpis();
      const messaging: MessagingKpis = generateMockMessagingKpis();

      const mockResponse: FinanceResponse = {
        breakdown: {
          subscriptions: 5234.5,
          ppv: 3456.2,
          tips: 2345.67,
          customs: 1309.3,
          total: 12345.67,
          ppvAttachRate: 18.5,
          tipAttachRate: 12.3,
          customsAttachRate: 4.2,
        },
        expansion,
        risk,
        whales: generateMockWhales(),
        aiMetrics: {
          rpm: {
            value: 2.45,
            deltaPct: 15.3,
            label: 'RPM',
            tooltip: 'Revenue Per Message = Attributed Revenue / Messages Sent (24h attribution window)',
          },
          avgResponseTime: {
            value: 3.2,
            deltaPct: -8.5,
            label: 'Avg Response Time',
            tooltip: 'Average AI response time in seconds',
          },
        },
        messaging,
      };

      return NextResponse.json(mockResponse);
    }

    const transactions = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        created_at: { gte: range.queryStart, lte: range.queryEnd },
      },
      select: { amount: true, type: true, status: true },
    });

    const completedTransactions = transactions.filter(
      (tx) => normalizeStatus(tx.status) === 'completed'
    );

    const breakdown = {
      subscriptions: 0,
      ppv: 0,
      tips: 0,
      customs: 0,
      total: 0,
      ppvAttachRate: 0,
      tipAttachRate: 0,
      customsAttachRate: 0,
    };

    for (const tx of completedTransactions) {
      const type = normalizeType(tx.type);
      if (type === 'subscription') breakdown.subscriptions += tx.amount;
      else if (type === 'ppv') breakdown.ppv += tx.amount;
      else if (type === 'tip' || type === 'tips') breakdown.tips += tx.amount;
      else if (type === 'custom' || type === 'custom_order' || type === 'customs') {
        breakdown.customs += tx.amount;
      }
    }

    breakdown.total = breakdown.subscriptions + breakdown.ppv + breakdown.tips + breakdown.customs;

    const activeFans = await countActiveFans(userId, range.endDay);
    const arppuValue = activeFans > 0 ? breakdown.total / activeFans : 0;

    const expansion: ExpansionKpis = {
      arppu: {
        value: round2(arppuValue),
        deltaPct: 0,
        label: 'ARPPU',
        tooltip: 'Average Revenue Per Paying User (fans who made at least 1 purchase)',
      },
      ppvAttachRate: {
        value: 0,
        deltaPct: 0,
        label: 'PPV Attach Rate',
        tooltip: '% of active fans who purchased at least 1 PPV this period',
      },
      tipConversionRate: {
        value: 0,
        deltaPct: 0,
        label: 'Tip Conversion',
        tooltip: '% of active fans who sent at least 1 tip this period',
      },
      payersRatio: {
        value: 0,
        deltaPct: 0,
        label: 'Payers Ratio',
        tooltip: '% of fans with at least 1 transaction beyond subscription',
      },
    };

    const riskTotalCount = transactions.filter(
      (tx) => normalizeStatus(tx.status) !== 'failed'
    ).length;

    const chargebackStatuses = new Set(['chargeback', 'disputed']);
    const refundStatuses = new Set(['refunded', 'refund']);

    const chargebackTx = transactions.filter((tx) =>
      chargebackStatuses.has(normalizeStatus(tx.status))
    );
    const refundTx = transactions.filter((tx) =>
      refundStatuses.has(normalizeStatus(tx.status))
    );

    const chargebackAmount = chargebackTx.reduce((sum, tx) => sum + tx.amount, 0);
    const refundAmount = refundTx.reduce((sum, tx) => sum + tx.amount, 0);

    const risk: RiskKpis = {
      chargebackRate: {
        value: riskTotalCount > 0 ? round2((chargebackTx.length / riskTotalCount) * 100) : 0,
        deltaPct: 0,
        label: 'Chargeback Rate',
        tooltip: '% of transactions disputed by payment provider',
      },
      chargebackAmount: round2(chargebackAmount),
      refundAmount: round2(refundAmount),
      netRevenueImpact: round2(chargebackAmount + refundAmount),
    };

    const whales = await buildWhales(userId, range.queryStart, range.queryEnd);

    const messaging: MessagingKpis = {
      broadcastOpenRate: {
        value: 0,
        deltaPct: 0,
        label: 'Open Rate',
        tooltip: '% of mass messages opened by recipients',
      },
      unlockRate: {
        value: 0,
        deltaPct: 0,
        label: 'Unlock Rate',
        tooltip: 'PPV purchases / total recipients',
      },
      revenuePerBroadcast: {
        value: 0,
        deltaPct: 0,
        label: 'Rev/Broadcast',
        tooltip: 'Average revenue generated per broadcast message',
      },
      replyRate: {
        value: 0,
        deltaPct: 0,
        label: 'Reply Rate',
        tooltip: '% of conversations with at least 1 reply',
      },
      medianResponseTime: {
        value: 0,
        deltaPct: 0,
        label: 'Response Time',
        tooltip: 'Median time to first response in minutes',
      },
    };

    const response: FinanceResponse = {
      breakdown: {
        ...breakdown,
        subscriptions: round2(breakdown.subscriptions),
        ppv: round2(breakdown.ppv),
        tips: round2(breakdown.tips),
        customs: round2(breakdown.customs),
        total: round2(breakdown.total),
      },
      expansion,
      risk,
      whales,
      aiMetrics: {
        rpm: {
          value: 0,
          deltaPct: 0,
          label: 'RPM',
          tooltip: 'Revenue Per Message = Attributed Revenue / Messages Sent (24h attribution window)',
        },
        avgResponseTime: {
          value: 0,
          deltaPct: 0,
          label: 'Avg Response Time',
          tooltip: 'Average AI response time in seconds',
        },
      },
      messaging,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching finance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finance data' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock whale (top spender) data
 */
function generateMockWhales() {
  const names = [
    'Alex Thompson',
    'Jordan Smith',
    'Casey Williams',
    'Morgan Davis',
    'Riley Johnson',
    'Taylor Brown',
    'Cameron Wilson',
    'Avery Martinez',
    'Quinn Anderson',
    'Skyler Garcia'
  ];
  
  const whales = [];
  
  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const lastPurchase = new Date();
    lastPurchase.setDate(lastPurchase.getDate() - daysAgo);
    
    whales.push({
      fanId: `fan_${i}_${Date.now()}`,
      name: names[i],
      totalSpent: Math.floor(Math.random() * 5000) + 1000,
      lastPurchaseAt: lastPurchase.toISOString(),
      isOnline: Math.random() > 0.5,
      aiPriority: (Math.random() > 0.7 ? 'high' : 'normal') as 'high' | 'normal'
    });
  }
  
  // Sort by totalSpent descending
  return whales.sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Generate mock expansion KPIs (P0 Creator-specific)
 */
function generateMockExpansionKpis(): ExpansionKpis {
  return {
    arppu: {
      value: 45.8,
      deltaPct: 8.2,
      label: 'ARPPU',
      tooltip: 'Average Revenue Per Paying User (fans who made at least 1 purchase)'
    },
    ppvAttachRate: {
      value: 18.5,
      deltaPct: 3.1,
      label: 'PPV Attach Rate',
      tooltip: '% of active fans who purchased at least 1 PPV this period'
    },
    tipConversionRate: {
      value: 12.3,
      deltaPct: -1.2,
      label: 'Tip Conversion',
      tooltip: '% of active fans who sent at least 1 tip this period'
    },
    payersRatio: {
      value: 34.5,
      deltaPct: 5.8,
      label: 'Payers Ratio',
      tooltip: '% of fans with at least 1 transaction beyond subscription'
    }
  };
}

/**
 * Generate mock risk KPIs (P0)
 */
function generateMockRiskKpis(): RiskKpis {
  const chargebackAmount = Math.floor(Math.random() * 200) + 50;
  const refundAmount = Math.floor(Math.random() * 150) + 30;
  
  return {
    chargebackRate: {
      value: 0.8,
      deltaPct: -0.3,
      label: 'Chargeback Rate',
      tooltip: '% of transactions disputed by payment provider'
    },
    chargebackAmount,
    refundAmount,
    netRevenueImpact: chargebackAmount + refundAmount
  };
}

/**
 * Generate mock messaging KPIs (P0 if monetizing via DM/PPV)
 */
function generateMockMessagingKpis(): MessagingKpis {
  return {
    broadcastOpenRate: {
      value: 42.5,
      deltaPct: 5.2,
      label: 'Open Rate',
      tooltip: '% of mass messages opened by recipients'
    },
    unlockRate: {
      value: 8.3,
      deltaPct: 1.8,
      label: 'Unlock Rate',
      tooltip: 'PPV purchases / total recipients'
    },
    revenuePerBroadcast: {
      value: 156.4,
      deltaPct: 12.5,
      label: 'Rev/Broadcast',
      tooltip: 'Average revenue generated per broadcast message'
    },
    replyRate: {
      value: 15.2,
      deltaPct: 2.1,
      label: 'Reply Rate',
      tooltip: '% of conversations with at least 1 reply'
    },
    medianResponseTime: {
      value: 4.5,
      deltaPct: -15.3,
      label: 'Response Time',
      tooltip: 'Median time to first response in minutes'
    }
  };
}
