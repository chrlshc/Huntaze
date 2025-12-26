import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';
import { FansRepository } from '@/lib/db/repositories';
import type { ChurnRiskResponse, ChurnRiskFan } from '@/lib/services/revenue/types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * GET /api/revenue/churn
 * 
 * Get churn risk analysis for a creator
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const riskLevel = searchParams.get('riskLevel') as 'high' | 'medium' | 'low' | null;

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    if (riskLevel && !['high', 'medium', 'low'].includes(riskLevel)) {
      return NextResponse.json(
        { error: 'riskLevel must be "high", "medium", or "low"' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Churn risks request:', {
      creatorId,
      riskLevel: riskLevel || 'all',
      correlationId,
      timestamp: new Date().toISOString(),
    });

    if (ENABLE_MOCK_DATA) {
      // Mock data (dev-only)
      const allFans = [
        {
          id: 'fan_1',
          name: 'Sarah M.',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
          churnProbability: 0.95,
          daysSinceLastActivity: 25,
          riskLevel: 'high' as const,
          lifetimeValue: 15000,
          lastMessage: 'Thanks for the content!',
        },
        {
          id: 'fan_2',
          name: 'Mike R.',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
          churnProbability: 0.72,
          daysSinceLastActivity: 15,
          riskLevel: 'medium' as const,
          lifetimeValue: 8500,
          lastMessage: 'Love your work',
        },
        {
          id: 'fan_3',
          name: 'Emma L.',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
          churnProbability: 0.35,
          daysSinceLastActivity: 5,
          riskLevel: 'low' as const,
          lifetimeValue: 3200,
        },
      ];

      const filteredFans = riskLevel
        ? allFans.filter(fan => fan.riskLevel === riskLevel)
        : allFans;

      const churnRisks = {
        summary: {
          totalAtRisk: allFans.length,
          highRisk: allFans.filter(f => f.riskLevel === 'high').length,
          mediumRisk: allFans.filter(f => f.riskLevel === 'medium').length,
          lowRisk: allFans.filter(f => f.riskLevel === 'low').length,
        },
        fans: filteredFans,
        metadata: {
          lastCalculated: new Date().toISOString(),
          modelVersion: 'v2.1',
        },
      };

      return NextResponse.json(churnRisks);
    }

    const userId = Number.parseInt(creatorId, 10);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid creatorId' }, { status: 400 });
    }

    const fans = await FansRepository.listFans(userId);

    const allFans: ChurnRiskFan[] = fans.map((fan) => {
      const lastActivity = fan.lastSeenAt || fan.updatedAt || fan.createdAt;
      const lastActivityDate = lastActivity ? new Date(lastActivity) : null;
      const daysSinceLastActivity = lastActivityDate
        ? Math.max(0, Math.floor((Date.now() - lastActivityDate.getTime()) / MS_PER_DAY))
        : 0;
      const lifetimeValue = (fan.valueCents ?? 0) / 100;
      const churnProbability = computeChurnProbability(daysSinceLastActivity, lifetimeValue);
      const risk = toRiskLevel(churnProbability);

      return {
        id: String(fan.id),
        name: fan.name || 'Unknown',
        avatar: fan.avatar || undefined,
        churnProbability,
        daysSinceLastActivity,
        riskLevel: risk,
        lifetimeValue: Math.round(lifetimeValue),
      };
    });

    const filteredFans = riskLevel
      ? allFans.filter((fan) => fan.riskLevel === riskLevel)
      : allFans;

    const churnRisks: ChurnRiskResponse = {
      summary: {
        totalAtRisk: allFans.length,
        highRisk: allFans.filter((fan) => fan.riskLevel === 'high').length,
        mediumRisk: allFans.filter((fan) => fan.riskLevel === 'medium').length,
        lowRisk: allFans.filter((fan) => fan.riskLevel === 'low').length,
      },
      fans: filteredFans,
      metadata: {
        lastCalculated: new Date().toISOString(),
        modelVersion: 'rules-v1',
      },
    };

    return NextResponse.json(churnRisks);
  } catch (error) {
    console.error('[API] Churn error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function computeChurnProbability(daysInactive: number, lifetimeValue: number): number {
  let probability = 0.15;

  if (daysInactive > 30) probability = 0.85;
  else if (daysInactive > 14) probability = 0.6;
  else if (daysInactive > 7) probability = 0.35;

  if (lifetimeValue >= 2000) probability -= 0.15;
  else if (lifetimeValue >= 500) probability -= 0.1;

  return Math.max(0, Math.min(1, probability));
}

function toRiskLevel(probability: number): 'high' | 'medium' | 'low' {
  if (probability >= 0.7) return 'high';
  if (probability >= 0.4) return 'medium';
  return 'low';
}
