import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get current period metrics
    const [
      currentRevenue,
      previousRevenue,
      currentMessages,
      previousMessages,
      activeCampaigns,
      totalCampaigns,
    ] = await Promise.all([
      // Current revenue (last 30 days)
      prisma.transaction.aggregate({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
          status: 'completed',
        },
        _sum: { amount: true },
      }),
      // Previous revenue (30-60 days ago)
      prisma.transaction.aggregate({
        where: {
          userId,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          status: 'completed',
        },
        _sum: { amount: true },
      }),
      // Current messages
      prisma.message.count({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      // Previous messages
      prisma.message.count({
        where: {
          userId,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      // Active campaigns
      prisma.campaign.count({
        where: {
          userId,
          status: 'active',
        },
      }),
      // Total campaigns
      prisma.campaign.count({
        where: { userId },
      }),
    ]);

    // Calculate changes
    const revenueChange = calculatePercentageChange(
      currentRevenue._sum.amount || 0,
      previousRevenue._sum.amount || 0
    );

    const messagesChange = calculatePercentageChange(
      currentMessages,
      previousMessages
    );

    // Calculate engagement rate (mock for now - would need actual engagement data)
    const engagementRate = 68; // Placeholder
    const engagementChange = 5.4; // Placeholder

    const metrics = {
      revenue: {
        total: currentRevenue._sum.amount || 0,
        change: revenueChange,
        changeType: revenueChange >= 0 ? 'increase' : 'decrease',
        formatted: formatCurrency(currentRevenue._sum.amount || 0),
      },
      messages: {
        sent: currentMessages,
        change: messagesChange,
        changeType: messagesChange >= 0 ? 'increase' : 'decrease',
      },
      campaigns: {
        active: activeCampaigns,
        total: totalCampaigns,
        change: 0, // Would need historical data
        changeType: 'increase',
      },
      engagement: {
        rate: engagementRate,
        change: engagementChange,
        changeType: 'increase',
      },
    };

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('[Dashboard Metrics API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch dashboard metrics',
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
