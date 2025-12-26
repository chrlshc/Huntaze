import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * OnlyFans Stats Ingestion for Auto-Calibration
 * 
 * Reads creator analytics from database and returns structured KPIs
 * for the onboarding auto-calibration process.
 */
async function handler() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      // Return defaults for unauthenticated users
      return NextResponse.json(getDefaultCalibration());
    }

    const userId = parseInt(session.user.id, 10);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(getDefaultCalibration());
    }

    // Fetch real data from database
    const [transactions, subscriptions, userStats] = await Promise.all([
      prisma.transactions.findMany({
        where: {
          user_id: userId,
          platform: 'onlyfans',
          status: 'completed',
        },
        orderBy: { created_at: 'desc' },
        take: 500,
      }),
      prisma.subscriptions.findMany({
        where: {
          user_id: userId,
          platform: 'onlyfans',
        },
      }),
      prisma.user_stats.findUnique({
        where: { user_id: userId },
      }),
    ]);

    // If no data, return defaults
    if (transactions.length === 0 && subscriptions.length === 0) {
      return NextResponse.json(getDefaultCalibration());
    }

    // Calculate PPV anchor from actual PPV transactions
    const ppvTransactions = transactions.filter(t => t.type === 'ppv');
    const ppvAnchor = ppvTransactions.length > 0
      ? Math.round(ppvTransactions.reduce((sum, t) => sum + t.amount, 0) / ppvTransactions.length)
      : 20;

    // Calculate whale percentage (fans spending $500+)
    const fanSpending = new Map<string, number>();
    transactions.forEach(t => {
      const fanId = t.id.split('_')[0] || 'unknown';
      fanSpending.set(fanId, (fanSpending.get(fanId) || 0) + t.amount);
    });
    const totalFans = fanSpending.size || 1;
    const whales = Array.from(fanSpending.values()).filter(v => v >= 500).length;
    const whalePercent = whales / totalFans;

    // Determine send volume based on message stats
    const messagesPerDay = userStats?.messages_sent
      ? userStats.messages_sent / 30
      : 0;
    const sendVolume: 'low' | 'high' = messagesPerDay > 20 ? 'high' : 'low';

    // Calculate suggested whale threshold based on actual spending distribution
    const spendingValues = Array.from(fanSpending.values()).sort((a, b) => b - a);
    const top10PercentIndex = Math.floor(spendingValues.length * 0.1);
    const suggestLowerWhaleThreshold = spendingValues[top10PercentIndex] || 400;

    // Peak hours would require message timestamps - use defaults for now
    const peakHours = [
      { start: '20:00', end: '22:00', tz: 'America/New_York' },
    ];

    // Check for connected social accounts (IG/TT risk)
    const socialAccounts = await prisma.oauth_accounts.findMany({
      where: { user_id: userId },
      select: { provider: true },
    });
    const igRisk = socialAccounts.some(a => a.provider === 'instagram');
    const ttRisk = socialAccounts.some(a => a.provider === 'tiktok');

    return NextResponse.json({
      ppvAnchor,
      peakHours,
      sendVolume,
      whalePercent: Math.round(whalePercent * 100) / 100,
      suggestLowerWhaleThreshold: Math.round(suggestLowerWhaleThreshold),
      igRisk,
      ttRisk,
    });
  } catch (error) {
    console.error('[onboarding/ingest] Error:', error);
    return NextResponse.json(getDefaultCalibration());
  }
}

function getDefaultCalibration() {
  return {
    ppvAnchor: 20,
    peakHours: [
      { start: '20:00', end: '22:00', tz: 'America/New_York' },
    ],
    sendVolume: 'high' as const,
    whalePercent: 0.05,
    suggestLowerWhaleThreshold: 400,
    igRisk: false,
    ttRisk: false,
  };
}

export const GET = handler;
