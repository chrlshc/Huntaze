/**
 * API Endpoint - Cost Optimization Engine
 * 
 * Endpoints pour le moteur d'optimisation automatique des coûts
 * GET /api/v2/costs/optimize - Obtenir les recommandations
 * POST /api/v2/costs/optimize/auto - Lancer l'optimisation automatique
 * GET /api/v2/costs/optimize/stats - Statistiques d'optimisation
 * POST /api/v2/costs/optimize/strategies/:id/toggle - Activer/désactiver une stratégie
 * 
 * @module api/v2/costs/optimize
 */

import { NextRequest, NextResponse } from 'next/server';
import { costOptimizationEngine } from '@/lib/services/cost-optimization-engine';
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
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    
    // Vérification des permissions
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    const targetUserId = userId || session.user.id;
    
    if (targetUserId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Action: stats
    if (action === 'stats') {
      const stats = costOptimizationEngine.getOptimizationStats();
      
      return NextResponse.json({
        success: true,
        data: stats,
        metadata: {
          requestedBy: session.user.id,
          requestedAt: new Date().toISOString()
        }
      });
    }

    // Action: strategies
    if (action === 'strategies') {
      const strategies = costOptimizationEngine.getStrategies();
      
      return NextResponse.json({
        success: true,
        data: {
          strategies,
          summary: {
            total: strategies.length,
            enabled: strategies.filter(s => s.enabled).length,
            autoApply: strategies.filter(s => s.autoApply).length
          }
        },
        metadata: {
          requestedBy: session.user.id,
          requestedAt: new Date().toISOString()
        }
      });
    }

    // Action par défaut: recommendations
    const recommendations = await costOptimizationEngine.analyzeAndRecommend(
      targetUserId !== session.user.id ? targetUserId : undefined
    );
    
    return NextResponse.json({
      success: true,
      data: {
        recommendations: recommendations.map(rec => ({
          ...rec,
          potentialSavings: rec.potentialSavings / 100 // Convertir en dollars
        })),
        summary: {
          total: recommendations.length,
          totalPotentialSavings: recommendations.reduce((sum, r) => sum + r.potentialSavings, 0) / 100,
          byType: recommendations.reduce((acc, rec) => {
            acc[rec.type] = (acc[rec.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      },
      metadata: {
        requestedBy: session.user.id,
        requestedAt: new Date().toISOString(),
        userId: targetUserId
      }
    });
    
  } catch (error) {
    console.error('[API] Error getting optimization recommendations:', error);
    
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Seuls les admins peuvent lancer l'optimisation automatique
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required to run auto-optimization' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { action, userId, strategyId, enabled, config } = body;

    // Action: auto-optimize
    if (action === 'auto') {
      const results = await costOptimizationEngine.autoOptimize(userId);
      
      const successCount = results.filter(r => r.applied).length;
      const totalSavings = results.reduce((sum, r) => sum + r.savingsEstimate, 0);
      
      return NextResponse.json({
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: results.length - successCount,
            totalSavings,
            successRate: results.length > 0 ? successCount / results.length : 0
          }
        },
        message: `Auto-optimization completed: ${successCount}/${results.length} successful, $${totalSavings.toFixed(2)} saved`
      });
    }

    // Action: toggle strategy
    if (action === 'toggle' && strategyId !== undefined && enabled !== undefined) {
      const success = await costOptimizationEngine.toggleStrategy(strategyId, enabled);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Strategy not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: `Strategy ${strategyId} ${enabled ? 'enabled' : 'disabled'}`
      });
    }

    // Action: configure strategy
    if (action === 'configure' && strategyId && config) {
      const success = await costOptimizationEngine.configureStrategy(strategyId, config);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Strategy not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: `Strategy ${strategyId} configured successfully`
      });
    }

    // Action: A/B test
    if (action === 'ab_test' && strategyId) {
      const testDurationDays = body.testDurationDays || 7;
      const testPercentage = body.testPercentage || 0.1;
      
      const test = await costOptimizationEngine.runABTest(
        strategyId,
        testDurationDays,
        testPercentage
      );
      
      return NextResponse.json({
        success: true,
        data: test,
        message: 'A/B test started successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: auto, toggle, configure, ab_test' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('[API] Error in optimization action:', error);
    
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
