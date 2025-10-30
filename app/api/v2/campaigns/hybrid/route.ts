/**
 * API Endpoint - Hybrid Campaign Orchestration
 * 
 * Endpoint principal pour l'orchestration hybride des campagnes
 * POST /api/v2/campaigns/hybrid - Créer et exécuter une campagne
 * 
 * Intègre:
 * - ProductionHybridOrchestrator
 * - IntegrationMiddleware avec feature flags
 * - EnhancedRateLimiter pour OnlyFans
 * - CostMonitoringService
 * 
 * @module api/v2/campaigns/hybrid
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProductionOrchestrator } from '@/lib/services/production-hybrid-orchestrator-v2';
import { integrationMiddleware } from '@/lib/services/integration-middleware';
import { costMonitoringService } from '@/lib/services/cost-monitoring-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validation des paramètres requis
    const { type, platforms, contentType, data } = body;
    
    if (!type || !platforms || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, platforms, data' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur doit utiliser le système hybride
    const shouldUseHybrid = await integrationMiddleware.shouldUseHybridOrchestrator(session.user.id);
    
    if (!shouldUseHybrid) {
      // Router vers le système legacy
      return NextResponse.json({
        success: false,
        message: 'User not enrolled in hybrid orchestrator. Using legacy system.',
        legacy: true
      }, { status: 200 });
    }

    // Préparer l'intent pour l'orchestrateur
    const intent = {
      type: type as 'content_planning' | 'message_generation' | 'content_validation' | 'campaign_execution',
      userId: session.user.id,
      data,
      platforms: platforms as string[],
      contentType: contentType || 'post',
      sendToOnlyFans: body.sendToOnlyFans || false,
      recipientId: body.recipientId,
      requiresMultiPlatform: platforms.length > 1,
      forceProvider: body.forceProvider,
      priority: body.priority || 'medium'
    };

    // Obtenir l'orchestrateur
    const orchestrator = getProductionOrchestrator();
    
    // Exécuter le workflow
    const result = await orchestrator.executeWorkflow(session.user.id, intent);
    
    // Calculer les métriques
    const duration = Date.now() - startTime;
    
    // Préparer la réponse
    const response = {
      success: true,
      data: {
        workflowId: result.traceContext?.workflowId,
        content: result.content,
        provider: result.provider,
        platforms: platforms,
        status: 'completed'
      },
      metrics: {
        duration,
        provider: result.provider,
        cost: result.costInfo ? {
          tokens: result.costInfo.tokens,
          cost: result.costInfo.cost,
          duration: result.costInfo.duration
        } : undefined
      },
      metadata: {
        userId: session.user.id,
        timestamp: new Date().toISOString(),
        traceId: result.traceContext?.traceId,
        hybridOrchestrator: true
      }
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[API] Error in hybrid campaign execution:', error);
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Campaign execution failed',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error',
        metrics: {
          duration,
          failed: true
        }
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
