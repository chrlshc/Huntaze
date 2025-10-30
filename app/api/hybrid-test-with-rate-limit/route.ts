/**
 * Test API avec Rate Limiting Intégré
 */

import { NextRequest, NextResponse } from 'next/server';
import { SimpleRateLimiter } from '@/lib/services/simple-rate-limiter';

// Instance globale du rate limiter
const rateLimiter = new SimpleRateLimiter({
  maxRequests: 10, // 10 requêtes par minute pour les tests
  windowMs: 60000
});

export async function GET() {
  const stats = rateLimiter.getStats();
  
  return NextResponse.json({
    status: 'active',
    message: 'Hybrid Orchestrator with Rate Limiting',
    timestamp: new Date().toISOString(),
    rateLimiter: {
      enabled: true,
      stats
    },
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
    const userId = body.userId || 'anonymous';
    
    // 1. Vérifier rate limit AVANT traitement
    const rateLimitCheck = await rateLimiter.checkLimit(userId, 'message');
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: rateLimitCheck.retryAfter,
          layer: rateLimitCheck.layer,
          reason: rateLimitCheck.reason
        },
        { status: 429 }
      );
    }
    
    // 2. Simuler le traitement (orchestrateur hybride)
    const shouldUseAzure = body.type === 'content_planning' || body.requiresMultiPlatform;
    const provider = body.forceProvider || (shouldUseAzure ? 'azure' : 'openai');
    
    const startTime = Date.now();
    
    // Simuler latence différente selon provider
    const latency = provider === 'azure' ? 80 : 120;
    await new Promise(resolve => setTimeout(resolve, latency));
    
    const duration = Date.now() - startTime;
    
    // 3. Enregistrer le succès pour rate limiting
    await rateLimiter.recordSuccess('message');
    
    const result = {
      success: true,
      provider,
      duration,
      rateLimitInfo: {
        layer: rateLimitCheck.layer,
        allowed: true
      },
      contentGenerated: {
        type: body.type || 'content_planning',
        platforms: body.platforms || ['instagram'],
        content: `Generated content using ${provider} for ${userId}`,
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
    // Enregistrer l'échec
    await rateLimiter.recordFailure('message', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Orchestrator error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}