/**
 * API Endpoint - Real-time Cost Statistics
 * 
 * Endpoint pour obtenir les statistiques de coûts en temps réel
 * GET /api/v2/costs/stats - Statistiques temps réel
 * 
 * @module api/v2/costs/stats
 */

import { NextRequest, NextResponse } from 'next/server';
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
    const includeUsers = searchParams.get('includeUsers') === 'true';
    
    // Seuls les admins peuvent voir les stats globales avec détails utilisateurs
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    
    if (includeUsers && !isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required to view user details' },
        { status: 403 }
      );
    }
    
    // Obtenir les statistiques temps réel
    const realTimeStats = await costMonitoringService.getRealTimeStats();
    
    // Calculer des métriques additionnelles
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyBreakdown = await costMonitoringService.getCostBreakdown(
      startOfMonth,
      now
    );
    
    // Préparer la réponse
    const response = {
      success: true,
      data: {
        realTime: {
          todayTotal: realTimeStats.todayTotal,
          thisHourTotal: realTimeStats.thisHourTotal,
          providerBreakdown: realTimeStats.providerBreakdown,
          ...(includeUsers && { topUsers: realTimeStats.topUsers })
        },
        monthly: {
          totalCost: monthlyBreakdown.totalCost,
          providers: monthlyBreakdown.providers,
          savings: monthlyBreakdown.savings,
          daysInMonth: Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24))
        },
        trends: {
          dailyAverage: monthlyBreakdown.totalCost / Math.max(1, Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24))),
          hourlyAverage: realTimeStats.todayTotal / Math.max(1, now.getHours() + 1),
          providerRatio: {
            azure: realTimeStats.providerBreakdown.azure / Math.max(0.01, realTimeStats.todayTotal),
            openai: realTimeStats.providerBreakdown.openai / Math.max(0.01, realTimeStats.todayTotal)
          }
        },
        alerts: {
          todayThresholdStatus: realTimeStats.todayTotal > 50 ? 'warning' : 'normal', // $50 threshold
          monthlyThresholdStatus: monthlyBreakdown.totalCost > 1000 ? 'critical' : monthlyBreakdown.totalCost > 500 ? 'warning' : 'normal'
        }
      },
      metadata: {
        requestedBy: session.user.id,
        requestedAt: now.toISOString(),
        includeUsers,
        refreshInterval: 60, // Recommandé: rafraîchir toutes les 60 secondes
        timezone: 'UTC'
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[API] Error getting cost stats:', error);
    
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