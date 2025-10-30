/**
 * API Endpoint - Cost Forecasting
 * 
 * Endpoint pour obtenir les prévisions de coûts basées sur l'historique
 * GET /api/v2/costs/forecast?period=daily|weekly|monthly&userId=...
 * 
 * @module api/v2/costs/forecast
 */

import { NextRequest, NextResponse } from 'next/server';
import { costAlertManager } from '@/lib/services/cost-alert-manager';
import { costMonitoringService } from '@/lib/services/cost-monitoring-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'daily') as 'daily' | 'weekly' | 'monthly';
    const userId = searchParams.get('userId');
    
    // Validation du period
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be: daily, weekly, or monthly' },
        { status: 400 }
      );
    }
    
    // Vérification des permissions
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    const targetUserId = userId || session.user.id;
    
    if (targetUserId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Obtenir l'historique des coûts
    const daysToAnalyze = period === 'daily' ? 7 : period === 'weekly' ? 30 : 90;
    const startDate = new Date(Date.now() - daysToAnalyze * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    
    const costBreakdown = await costMonitoringService.getCostBreakdown(
      startDate,
      endDate,
      targetUserId !== session.user.id ? targetUserId : undefined
    );
    
    // Extraire les coûts quotidiens
    const dailyCosts = costBreakdown.trends.dailyCosts
      .reduce((acc, item) => {
        const existing = acc.find(a => a.date === item.date);
        if (existing) {
          existing.cost += item.cost;
        } else {
          acc.push({ date: item.date, cost: item.cost });
        }
        return acc;
      }, [] as Array<{ date: string; cost: number }>)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => item.cost);
    
    // Générer le forecast
    const forecast = await costAlertManager.generateCostForecast(
      targetUserId !== session.user.id ? targetUserId : undefined,
      period,
      dailyCosts
    );
    
    // Calculer des métriques additionnelles
    const avgDailyCost = dailyCosts.length > 0 
      ? dailyCosts.reduce((a, b) => a + b, 0) / dailyCosts.length 
      : 0;
    
    const trend = dailyCosts.length >= 2
      ? dailyCosts[dailyCosts.length - 1] - dailyCosts[0]
      : 0;
    
    const trendPercentage = dailyCosts[0] > 0
      ? ((trend / dailyCosts[0]) * 100)
      : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        forecast,
        analysis: {
          period,
          daysAnalyzed: dailyCosts.length,
          avgDailyCost,
          trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
          trendValue: trend,
          trendPercentage,
          historicalCosts: dailyCosts.slice(-30), // Derniers 30 jours max
          recommendations: this.generateForecastRecommendations(forecast, avgDailyCost)
        }
      },
      metadata: {
        requestedBy: session.user.id,
        requestedAt: new Date().toISOString(),
        period,
        userId: targetUserId,
        analysisWindow: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: daysToAnalyze
        }
      }
    });
    
  } catch (error) {
    console.error('[API] Error generating cost forecast:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Génère des recommandations basées sur le forecast
 */
function generateForecastRecommendations(
  forecast: {
    willExceedThreshold: boolean;
    thresholdValue?: number;
    daysUntilExceeded?: number;
    projectedCost: number;
    currentCost: number;
    confidence: number;
  },
  avgDailyCost: number
): string[] {
  const recommendations: string[] = [];
  
  if (forecast.willExceedThreshold) {
    recommendations.push(
      `⚠️ Warning: Projected to exceed threshold of $${forecast.thresholdValue?.toFixed(2)} ` +
      `in ${forecast.daysUntilExceeded} days`
    );
    recommendations.push('Consider implementing cost optimization measures now');
  }
  
  if (forecast.projectedCost > forecast.currentCost * 1.2) {
    recommendations.push(
      `📈 Costs are trending upward (+${((forecast.projectedCost / forecast.currentCost - 1) * 100).toFixed(1)}%)`
    );
    recommendations.push('Review recent usage patterns and optimize high-cost operations');
  }
  
  if (forecast.confidence < 0.5) {
    recommendations.push(
      '⚠️ Low forecast confidence - cost patterns are irregular'
    );
    recommendations.push('Consider setting up more granular cost tracking');
  }
  
  if (avgDailyCost > 50) {
    recommendations.push(
      '💡 High daily costs detected - review provider selection and caching strategies'
    );
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Cost trends look healthy - continue monitoring');
  }
  
  return recommendations;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
