/**
 * API Endpoint - Cost Optimization Recommendations
 * 
 * Endpoints pour les recommandations d'optimisation des coûts
 * GET /api/v2/costs/optimization - Obtenir les recommandations
 * POST /api/v2/costs/optimization/apply - Appliquer une recommandation
 * 
 * @module api/v2/costs/optimization
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
    const userId = searchParams.get('userId');
    const minSavings = parseFloat(searchParams.get('minSavings') || '0');
    const maxRecommendations = parseInt(searchParams.get('limit') || '10');
    
    // Vérification des permissions
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    const targetUserId = userId || session.user.id;
    
    if (targetUserId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Obtenir les recommandations
    const recommendations = await costMonitoringService.getOptimizationRecommendations(
      targetUserId !== session.user.id ? targetUserId : undefined
    );
    
    // Filtrer par économies minimales
    const filteredRecommendations = recommendations
      .filter(rec => rec.potentialSavings >= minSavings * 100) // Convertir en centimes
      .slice(0, maxRecommendations);
    
    // Calculer les statistiques
    const totalPotentialSavings = filteredRecommendations.reduce(
      (sum, rec) => sum + rec.potentialSavings, 0
    ) / 100; // Convertir en dollars
    
    const recommendationsByType = filteredRecommendations.reduce((acc, rec) => {
      acc[rec.type] = (acc[rec.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return NextResponse.json({
      success: true,
      data: {
        recommendations: filteredRecommendations.map(rec => ({
          ...rec,
          potentialSavings: rec.potentialSavings / 100 // Convertir en dollars pour l'API
        })),
        summary: {
          total: filteredRecommendations.length,
          totalPotentialSavings,
          averageSavings: filteredRecommendations.length > 0 
            ? totalPotentialSavings / filteredRecommendations.length 
            : 0,
          byType: recommendationsByType,
          byDifficulty: {
            easy: filteredRecommendations.filter(r => r.implementation.difficulty === 'easy').length,
            medium: filteredRecommendations.filter(r => r.implementation.difficulty === 'medium').length,
            hard: filteredRecommendations.filter(r => r.implementation.difficulty === 'hard').length
          }
        }
      },
      metadata: {
        requestedBy: session.user.id,
        requestedAt: new Date().toISOString(),
        filters: { userId: targetUserId, minSavings, maxRecommendations },
        analysisBasedOnDays: 30
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
    
    // Seuls les admins peuvent appliquer des optimisations
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required to apply optimizations' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { recommendationId, confirm } = body;
    
    if (!recommendationId) {
      return NextResponse.json(
        { error: 'Missing required field: recommendationId' },
        { status: 400 }
      );
    }
    
    if (!confirm) {
      return NextResponse.json(
        { error: 'Confirmation required to apply optimization' },
        { status: 400 }
      );
    }
    
    // Obtenir la recommandation spécifique
    const recommendations = await costMonitoringService.getOptimizationRecommendations();
    const recommendation = recommendations.find(r => r.id === recommendationId);
    
    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }
    
    // Appliquer l'optimisation
    const success = await costMonitoringService.applyCostOptimization(recommendation);
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to apply optimization',
          recommendation: {
            id: recommendation.id,
            type: recommendation.type,
            description: recommendation.description
          }
        },
        { status: 500 }
      );
    }
    
    // Log de l'action pour audit
    console.log(`[API] Optimization applied by ${session.user.id}:`, {
      recommendationId,
      type: recommendation.type,
      potentialSavings: recommendation.potentialSavings / 100,
      appliedAt: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      data: {
        recommendationId,
        type: recommendation.type,
        description: recommendation.description,
        potentialSavings: recommendation.potentialSavings / 100,
        appliedAt: new Date().toISOString(),
        appliedBy: session.user.id
      },
      message: 'Optimization applied successfully'
    });
    
  } catch (error) {
    console.error('[API] Error applying optimization:', error);
    
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