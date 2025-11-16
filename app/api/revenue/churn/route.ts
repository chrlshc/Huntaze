import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';;
import type { ChurnRiskResponse } from '@/lib/services/revenue/types';

/**
 * GET /api/revenue/churn
 * 
 * Get churn risk analysis for a creator
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const riskLevel = searchParams.get('riskLevel') as 'high' | 'medium' | 'low' | null;

    if (!creatorId) {
      return Response.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    if (riskLevel && !['high', 'medium', 'low'].includes(riskLevel)) {
      return Response.json(
        { error: 'riskLevel must be "high", "medium", or "low"' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Churn risks request:', {
      creatorId,
      riskLevel: riskLevel || 'all',
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual backend service call
    // const churnRisks = await backendChurnService.getChurnRisks(creatorId, riskLevel);

    // Mock data
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

    console.log('[API] Churn risks sent:', {
      creatorId,
      totalAtRisk: churnRisks.summary.totalAtRisk,
      filtered: filteredFans.length,
    });

    return Response.json(churnRisks);
  } catch (error) {
    console.error('[API] Churn error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
