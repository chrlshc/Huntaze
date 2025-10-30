/**
 * Legacy Message Sending API - Backward Compatibility
 * 
 * Ancien endpoint /api/messages/send maintenu pour compatibilité
 * Route vers le nouveau système avec SQS et rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIntegrationMiddleware } from '@/lib/services/integration-middleware';
import { z } from 'zod';

// Schema pour l'ancienne API d'envoi de messages
const LegacyMessageSendSchema = z.object({
  user_id: z.string().optional(),
  userId: z.string().optional(),
  recipient_id: z.string(),
  recipientId: z.string().optional(),
  message: z.string().optional(),
  content: z.string().optional(),
  message_type: z.string().optional(),
  messageType: z.string().optional(),
  platform: z.string().default('onlyfans'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  schedule_for: z.string().optional(), // ISO date string
  scheduleFor: z.string().optional()
});

/**
 * POST /api/messages/send
 * Envoi de messages (format legacy)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const validatedData = LegacyMessageSendSchema.parse(body);
    
    // Transformer en format moderne
    const modernRequest = {
      userId: validatedData.userId || validatedData.user_id || 'unknown',
      type: 'message_generation',
      data: {
        recipientId: validatedData.recipientId || validatedData.recipient_id,
        content: validatedData.content || validatedData.message,
        messageType: validatedData.messageType || validatedData.message_type || 'custom',
        platform: validatedData.platform,
        priority: validatedData.priority || 'medium',
        scheduleFor: validatedData.scheduleFor || validatedData.schedule_for,
        sendToOnlyFans: true // Toujours true pour cet endpoint
      },
      metadata: {
        platform: 'api',
        source: 'legacy-message-send',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    };
    
    // Router via le middleware
    const middleware = await getIntegrationMiddleware();
    const response = await middleware.routeRequest(modernRequest);
    
    // Transformer au format legacy attendu
    const legacyResponse = {
      success: response.success,
      message_id: response.data?.messageId || `msg_${Date.now()}`,
      recipient_id: validatedData.recipientId || validatedData.recipient_id,
      status: response.success ? 'queued' : 'failed',
      scheduled_for: validatedData.scheduleFor || validatedData.schedule_for || new Date(Date.now() + 45000).toISOString(),
      provider: response.metadata?.provider || 'unknown',
      metadata: {
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        rate_limited: false // Sera géré par le rate limiter
      }
    };
    
    // Si erreur, ajouter les détails
    if (!response.success) {
      legacyResponse.error = response.error || 'Message sending failed';
    }
    
    const nextResponse = NextResponse.json(legacyResponse);
    nextResponse.headers.set('X-API-Version', 'v1-messages-legacy');
    nextResponse.headers.set('X-Provider', response.metadata?.provider || 'unknown');
    nextResponse.headers.set('X-Rate-Limit-Remaining', '9'); // Simulé, sera réel avec le rate limiter
    
    return nextResponse;
    
  } catch (error) {
    console.error('[Legacy Message Send API] Error:', error);
    
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
    
    // Gestion spéciale des erreurs de rate limiting
    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retry_after: 45, // seconds
          message_id: null,
          status: 'rate_limited'
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '45',
            'X-Rate-Limit-Remaining': '0'
          }
        }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Message sending failed',
        message_id: null,
        status: 'failed'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/messages/send
 * Obtenir l'état des messages envoyés (legacy)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || searchParams.get('userId');
    const messageId = searchParams.get('message_id') || searchParams.get('messageId');
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'user_id is required'
        },
        { status: 400 }
      );
    }
    
    // Pour l'instant, retourner un état simulé
    // Dans une vraie implémentation, ceci interrogerait la table onlyfans_messages
    const messages = [
      {
        message_id: messageId || 'msg_123',
        user_id: userId,
        recipient_id: 'recipient_456',
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider: 'hybrid'
      }
    ];
    
    return NextResponse.json({
      success: true,
      messages: messageId ? messages.filter(m => m.message_id === messageId) : messages,
      total: messages.length
    });
    
  } catch (error) {
    console.error('[Legacy Message Send API] Error getting messages:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get messages'
      },
      { status: 500 }
    );
  }
}