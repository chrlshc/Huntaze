/**
 * Legacy Content Generation API - Backward Compatibility
 * 
 * Ancien endpoint /api/content/generate maintenu pour compatibilité
 * Route vers le nouveau système hybrid orchestrator
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIntegrationMiddleware } from '@/lib/services/integration-middleware';
import { z } from 'zod';

// Schema pour l'ancienne API de génération de contenu
const LegacyContentGenerationSchema = z.object({
  user_id: z.string().optional(),
  userId: z.string().optional(),
  theme: z.string().optional(),
  platform: z.string().optional(),
  platforms: z.array(z.string()).optional(),
  content_type: z.string().optional(),
  contentType: z.string().optional(),
  target_audience: z.string().optional(),
  style: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']).optional()
});

/**
 * POST /api/content/generate
 * Génération de contenu (format legacy)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const validatedData = LegacyContentGenerationSchema.parse(body);
    
    // Transformer en format moderne
    const modernRequest = {
      userId: validatedData.userId || validatedData.user_id || 'unknown',
      type: 'content_planning', // Mapper vers le nouveau type
      data: {
        theme: validatedData.theme || 'general',
        platforms: validatedData.platforms || (validatedData.platform ? [validatedData.platform] : ['instagram']),
        contentType: validatedData.contentType || validatedData.content_type || 'post',
        targetAudience: validatedData.target_audience,
        style: validatedData.style,
        length: validatedData.length || 'medium'
      },
      metadata: {
        platform: 'api',
        source: 'legacy-content-generate',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    };
    
    // Router via le middleware
    const middleware = await getIntegrationMiddleware();
    const response = await middleware.routeRequest(modernRequest);
    
    // Transformer au format legacy attendu
    const legacyResponse = {
      success: response.success,
      content: response.data?.content || response.data?.fullResult?.contents?.[0]?.text || 'Generated content',
      platform: validatedData.platform || 'instagram',
      platforms: modernRequest.data.platforms,
      metadata: {
        provider: response.metadata?.provider || 'unknown',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    };
    
    const nextResponse = NextResponse.json(legacyResponse);
    nextResponse.headers.set('X-API-Version', 'v1-content-legacy');
    nextResponse.headers.set('X-Provider', response.metadata?.provider || 'unknown');
    
    return nextResponse;
    
  } catch (error) {
    console.error('[Legacy Content Generation API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Content generation failed'
      },
      { status: 500 }
    );
  }
}