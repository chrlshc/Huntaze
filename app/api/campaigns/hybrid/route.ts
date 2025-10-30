/**
 * API Route pour l'Orchestrateur Hybride
 * 
 * Endpoint unifié qui route intelligemment entre Azure et OpenAI
 * 
 * @route POST /api/campaigns/hybrid
 */

import { NextRequest, NextResponse } from 'next/server';
// import { HybridOrchestrator, WorkflowIntent } from '@/src/lib/orchestration/hybrid-orchestrator';
// import { AIRouter } from '@/lib/services/ai-router';
// import { OnlyFansGateway } from '@/lib/services/onlyfans/gateway';

// Instances globales (tu peux les adapter selon ton architecture)
// const aiRouter = new AIRouter();
// const ofGateway = new OnlyFansGateway();
// const orchestrator = new HybridOrchestrator(aiRouter, ofGateway);

export async function POST(request: NextRequest) {
  // TODO: Fix AIRouter implementation - currently not a class
  return NextResponse.json(
    { error: 'Hybrid orchestrator temporarily disabled - under refactoring' },
    { status: 503 }
  );
  
  // try {
  //   const body = await request.json();
  //   
  //   // Validation des paramètres
  //   if (!body.userId) {
  //     return NextResponse.json(
  //       { error: 'userId is required' },
  //       { status: 400 }
  //     );
  //   }

  //   // Construire l'intent du workflow
  //   const intent: WorkflowIntent = {
  //     type: body.type || 'content_planning',
  //     userId: body.userId,
  //     platforms: body.platforms || ['instagram'],
  //     contentType: body.contentType || 'post',
  //     data: body.data || {},
  //     sendToOnlyFans: body.sendToOnlyFans || false,
  //     recipientId: body.recipientId,
  //     requiresMultiPlatform: body.platforms && body.platforms.length > 1,
  //     priority: body.priority || 'medium'
  //   };

  //   console.log(`[API] Executing hybrid workflow for user ${body.userId}:`, intent.type);

  //   // Exécuter le workflow
  //   const result = await orchestrator.executeWorkflow(body.userId, intent);

  //   // Log pour monitoring
  //   console.log(`[API] Workflow completed:`, {
  //     success: result.success,
  //     provider: result.provider,
  //     duration: result.duration
  //   });

  //   return NextResponse.json(result);

  // } catch (error) {
  //   console.error('[API] Hybrid workflow error:', error);
  //   
  //   return NextResponse.json(
  //     { 
  //       error: 'Internal server error',
  //       message: error.message 
  //     },
  //     { status: 500 }
  //   );
  // }
}

export async function GET(request: NextRequest) {
  // Endpoint pour vérifier le status et les métriques
  return NextResponse.json({
    status: 'disabled',
    message: 'Hybrid orchestrator temporarily disabled - under refactoring'
  });
  
  // try {
  //   const { OrchestratorMetrics } = await import('@/src/lib/orchestration/hybrid-orchestrator');
  //   
  //   return NextResponse.json({
  //     status: 'active',
  //     metrics: OrchestratorMetrics.getMetrics(),
  //     providers: {
  //       azure: {
  //         available: !!process.env.AZURE_OPENAI_ENDPOINT,
  //         billingLocked: process.env.AZURE_BILLING_LOCK === '1'
  //       },
  //       openai: {
  //         available: !!process.env.OPENAI_API_KEY
  //       }
  //     }
  //   });
  // } catch (error) {
  //   return NextResponse.json(
  //     { error: 'Failed to get status' },
  //     { status: 500 }
  //   );
  // }
}