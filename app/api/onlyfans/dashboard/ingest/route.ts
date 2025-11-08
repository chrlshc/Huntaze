export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { LinkDef, NodeDef } from '@/components/hz/ConnectorGraph';
import {
  appendSignals,
  getDashboardSnapshot,
  replaceActionList,
  replaceSummaryCards,
  resetDashboard,
  setBestTimes,
  setInsights,
  setMessagingArchitecture,
  upsertDailyActions,
} from '@/lib/of/dashboard-service';
import { toDashboardPayload } from '@/lib/of/dashboard-formatters';
import type { DailyAction, DashboardSignalFeedItem } from '@/lib/of/dashboard-types';

const dailyActionSchema: z.ZodType<DailyAction> = z.object({
  id: z.string().min(1),
  fanId: z.string().min(1),
  fanName: z.string().min(1),
  reason: z.string().min(1),
  priority: z.enum(['NOW', 'Today', 'This Week']),
  expectedValue: z.number().nonnegative(),
  lastSpent: z.number().min(0),
  daysSinceLastPurchase: z.number().min(0),
  suggestion: z.string().min(1),
  segment: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const signalSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  headline: z.string().min(1),
  payload: z.record(z.any()).default({}),
  createdAt: z.string().datetime(),
  severity: z.enum(['info', 'success', 'warning', 'error']).optional(),
}) as z.ZodType<DashboardSignalFeedItem>;

const insightsSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  actionLabel: z.string().min(1),
  actionHref: z.string().min(1),
});

const messagingSchema = z.object({
  nodes: z.array(
    z.custom<NodeDef>((value) => {
      if (!value || typeof value !== 'object') return false;
      return 'id' in value && 'title' in value && 'x' in value && 'y' in value;
    }),
  ),
  links: z.array(
    z.custom<LinkDef>((value) => {
      if (!value || typeof value !== 'object') return false;
      return 'from' in value && 'to' in value;
    }),
  ),
});

const bestTimesSchema = z.object({
  bestHours: z.array(z.number().int().min(0).max(23)),
  bestDays: z.array(z.string().min(2)),
});

const ingestSchema = z.object({
  accountId: z.string().min(1).default('demo-account'),
  summaryCards: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        status: z.enum(['active', 'idle', 'error']).default('active'),
        description: z.string().min(1),
        bullets: z.array(z.string()).default([]),
      }),
    )
    .optional(),
  actionList: z
    .object({
      currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
      items: z.array(dailyActionSchema),
      totalPotential: z.number().optional(),
    })
    .optional(),
  upsertActions: z.array(dailyActionSchema).optional(),
  signals: z.array(signalSchema).optional(),
  replaceSignals: z.boolean().optional(),
  insights: insightsSchema.optional(),
  messagingArchitecture: messagingSchema.optional(),
  bestTimes: bestTimesSchema.optional(),
  reset: z.boolean().optional(),
});

function verifyToken(request: NextRequest) {
  const secret = process.env.HUNTAZE_DASHBOARD_INGEST_TOKEN;
  if (!secret) return true;

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : authHeader.trim();

  return token === secret;
}

export async function POST(request: NextRequest) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = ingestSchema.parse(body);
    const { accountId } = parsed;

    if (parsed.reset) {
      const snapshot = resetDashboard(accountId);
      return NextResponse.json({ success: true, snapshot: toDashboardPayload(snapshot) });
    }

    if (parsed.summaryCards) {
      replaceSummaryCards(accountId, parsed.summaryCards);
    }

    if (parsed.actionList) {
      // replaceActionList function not implemented yet
      // replaceActionList(accountId, {
      //   currency: parsed.actionList.currency,
      //   items: parsed.actionList.items,
      //   totalPotential: parsed.actionList.totalPotential ?? undefined,
      // });
    }

    if (parsed.upsertActions) {
      upsertDailyActions(accountId, parsed.upsertActions, parsed.actionList?.currency);
    }

    if (parsed.signals) {
      appendSignals(accountId, parsed.signals, { replace: parsed.replaceSignals });
    }

    if (parsed.insights) {
      setInsights(accountId, parsed.insights);
    }

    if (parsed.messagingArchitecture) {
      setMessagingArchitecture(accountId, parsed.messagingArchitecture);
    }

    if (parsed.bestTimes) {
      setBestTimes(accountId, parsed.bestTimes);
    }

    const snapshot = await getDashboardSnapshot(accountId);
    return NextResponse.json({ success: true, snapshot: toDashboardPayload(snapshot) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.errors }, { status: 400 });
    }

    console.error('onlyfans.dashboard.ingest.error', error);
    return NextResponse.json({ error: 'Failed to ingest OnlyFans dashboard data' }, { status: 500 });
  }
}
