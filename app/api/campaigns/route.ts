/**
 * Legacy Campaigns API - Backward Compatibility
 * 
 * Maintient la compatibilité avec les anciennes API
 * Route automatiquement vers le nouveau système via IntegrationMiddleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIntegrationMiddleware } from '@/lib/services/integration-middleware';
import { z } from 'zod';

// Schema pour les anciennes requêtes (format legacy)
const LegacyCampaignSchema = z.object({
  user_id: z.string().optional(),
  userId: z.string().optional(),
  action: z.string(),
  payload: z.record(z.any()),
  platform: z.string().optional(),
  platforms: z.array(z.string()).optional()
});

/**
 * POST /api/campaigns
 * Endpoint legacy maintenu pour compatibilité
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // Valider le format legacy
    const legacyRequest = LegacyCampaignSchema.parse(body);
    
    // Obtenir le middleware d'intégration
    const middleware = await getIntegrationMiddleware();
    
    // Transformer la requête legacy en format moderne
    const modernRequest = middleware.transformLegacyRequest(legacyRequest);
    
    // Ajouter des métadatas pour le routing
    modernRequest.metadata = {
      platform: 'api',
      source: 'legacy-endpoint',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };
    
    // Router via le middleware (legacy ou hybrid selon feature flags)
    const response = await middleware.routeRequest(modernRequest);
    
    // Transformer la réponse au format legacy pour compatibilité
    const legacyResponse = middleware.transformToLegacyResponse(response);
    
    // Ajouter des headers de compatibilité
    const nextResponse = NextResponse.json(legacyResponse);
    nextResponse.headers.set('X-API-Version', 'v1-legacy-compatible');
    nextResponse.headers.set('X-Provider', response.metadata?.provider || 'unknown');
    nextResponse.headers.set('X-Duration', `${Date.now() - startTime}ms`);
    
    return nextResponse;
    
  } catch (error) {
    console.error('[Legacy Campaigns API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid request format',
          data: null,
          errors: error.errors
        },
        { status: 400 }
      );
    }
    
    // Format d'erreur legacy
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Internal server error',
        data: null
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/campaigns
 * Endpoint pour obtenir l'état des campagnes (legacy)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'user_id is required',
          data: null
        },
        { status: 400 }
      );
    }
    
    // Pour l'instant, retourner un état basique
    // Dans une vraie implémentation, ceci interrogerait la base de données
    const campaigns = [
      {
        id: 'campaign-1',
        userId,
        status: 'active',
        type: 'content_planning',
        createdAt: new Date().toISOString(),
        provider: 'hybrid' // Sera déterminé par le feature flag
      }
    ];
    
    return NextResponse.json({
      status: 'success',
      message: 'Campaigns retrieved successfully',
      data: campaigns
    });
    
  } catch (error) {
    console.error('[Legacy Campaigns API] Error getting campaigns:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Failed to get campaigns',
        data: null
      },
      { status: 500 }
    );
  }
}