/**
 * Production Hybrid API - Ready for Integration
 */

import { NextRequest, NextResponse } from 'next/server';
// import { productionOrchestrator } from '@/lib/services/production-hybrid-orchestrator';

export async function GET() {
  // TODO: Fix AIRouter implementation
  return NextResponse.json({
    status: 'disabled',
    message: 'Hybrid Orchestrator temporarily disabled - under refactoring',
    timestamp: new Date().toISOString()
  });
  
  // const stats = productionOrchestrator.getStats();
  // 
  // return NextResponse.json({
  //   status: 'production-ready',
  //   message: 'Hybrid Orchestrator - Azure + OpenAI + Rate Limiting',
  //   timestamp: new Date().toISOString(),
  //   stats,
  //   integration: {
  //     azure: 'Content Planning & Multi-Platform',
  //     openai: 'Message Automation & Validation',
  //     rateLimiting: 'Active Protection',
  //     onlyfans: 'Ready for Integration'
  //   }
  // });
}

export async function POST(request: NextRequest) {
  // TODO: Fix AIRouter implementation
  return NextResponse.json(
    { error: 'Hybrid orchestrator temporarily disabled - under refactoring' },
    { status: 503 }
  );
  
  // try {
  //   const body = await request.json();
  //   
  //   // Validation
  //   if (!body.userId) {
  //     return NextResponse.json(
  //       { error: 'userId is required' },
  //       { status: 400 }
  //     );
  //   }

  //   // Exécuter le workflow
  //   const result = await productionOrchestrator.execute({
  //     type: body.type || 'content_planning',
  //     userId: body.userId,
  //     platforms: body.platforms || ['instagram'],
  //     data: body.data || {},
  //     priority: body.priority || 'medium'
  //   });

  //   // Headers pour rate limiting info
  //   const headers: Record<string, string> = {};
  //   if (result.rateLimited) {
  //     headers['Retry-After'] = String(result.retryAfter || 60);
  //     headers['X-RateLimit-Limit'] = '30';
  //     headers['X-RateLimit-Remaining'] = '0';
  //   }

  //   return NextResponse.json(result, {
  //     status: result.success ? 200 : (result.rateLimited ? 429 : 500),
  //     headers
  //   });

  // } catch (error) {
  //   console.error('[Production API] Error:', error);
  //   
  //   return NextResponse.json(
  //     { 
  //       success: false,
  //       error: 'Internal server error',
  //       message: error.message 
  //     },
  //     { status: 500 }
  //   );
  // }
}