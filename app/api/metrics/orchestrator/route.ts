/**
 * API Endpoint - Orchestrator Metrics
 * 
 * Endpoint pour obtenir les métriques de performance de l'orchestrateur
 * GET /api/metrics/orchestrator
 * 
 * @module api/metrics/orchestrator
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

    // Seuls les admins peuvent voir les métriques globales
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h'; // 1h, 24h, 7d, 30d
    
    // Calculer la période
    const periodMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[period] || 24 * 60 * 60 * 1000;

    const startDate = new Date(Date.now() - periodMs);
    const endDate = new Date();

    // Obtenir les coûts
    const costBreakdown = await costMonitoringService.getCostBreakdown(startDate, endDate);
    const realTimeStats = await costMonitoringService.getRealTimeStats();

    // Mock des métriques de performance
    const performanceMetrics = {
      requests: {
        total: 1250,
        successful: 1180,
        failed: 70,
        successRate: 0.944
      },
      latency: {
        p50: 850, // ms
        p95: 2100,
        p99: 3500,
        avg: 1200
      },
      providers: {
        azure: {
          requests: 750,
          successRate: 0.96,
          avgLatency: 1100,
          avgCost: 0.025
        },
        openai: {
          requests: 500,
          successRate: 0.92,
          avgLatency: 1350,
          avgCost: 0.015
        }
      },
      fallbacks: {
        total: 45,
        azureToOpenai: 30,
        openaiToAzure: 15,
        fallbackRate: 0.036
      },
      rateLimiting: {
        totalChecks: 1250,
        blocked: 25,
        queued: 180,
        blockRate: 0.02
      }
    };

    // Calculer les tendances
    const trends = {
      requestVolume: '+12%', // vs période précédente
      successRate: '+2.1%',
      avgLatency: '-8%',
      totalCost: '+5%'
    };

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        performance: performanceMetrics,
        costs: {
          total: costBreakdown.totalCost,
          providers: costBreakdown.providers,
          realTime: realTimeStats
        },
        trends,
        alerts: {
          active: 2,
          critical: 0,
          warning: 2,
          info: 0
        }
      },
      metadata: {
        requestedBy: session.user.id,
        requestedAt: new Date().toISOString(),
        period
      }
    });
    
  } catch (error) {
    console.error('[API] Error getting orchestrator metrics:', error);
    
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
