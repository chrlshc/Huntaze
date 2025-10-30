/**
 * Test API pour l'Orchestrateur Hybride - Version Simplifiée
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Hybrid Orchestrator is ready',
    timestamp: new Date().toISOString(),
    providers: {
      azure: {
        available: !!process.env.AZURE_OPENAI_ENDPOINT,
        billingLocked: process.env.AZURE_BILLING_LOCK === '1'
      },
      openai: {
        available: !!process.env.OPENAI_API_KEY
      }
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Simulation de l'orchestrateur hybride
    const shouldUseAzure = body.type === 'content_planning' || body.requiresMultiPlatform;
    const provider = shouldUseAzure ? 'azure' : 'openai';
    
    // Simuler le traitement
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100)); // Simuler latence
    const duration = Date.now() - startTime;
    
    const result = {
      success: true,
      provider,
      duration,
      contentGenerated: {
        type: body.type || 'content_planning',
        platforms: body.platforms || ['instagram'],
        content: `Generated content using ${provider} for ${body.userId}`,
        tokensUsed: Math.floor(Math.random() * 200) + 50,
        cost: provider === 'azure' ? 0.002 : 0.005
      },
      metrics: {
        aiTokensUsed: Math.floor(Math.random() * 200) + 50,
        aiCost: provider === 'azure' ? 0.002 : 0.005,
        rateLimitHits: 0
      }
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Test orchestrator error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}