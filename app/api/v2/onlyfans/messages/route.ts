/**
 * Enhanced OnlyFans Messages API
 * 
 * API pour envoyer des messages OnlyFans avec:
 * - Rate limiting intelligent
 * - Queuing prioritaire
 * - Monitoring temps réel
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnhancedOnlyFansService } from '@/lib/services/enhanced-onlyfans-service';
import { z } from 'zod';

// Schema de validation pour l'envoi de messages
const SendMessageSchema = z.object({
  userId: z.string(),
  recipientId: z.string(),
  content: z.string().min(1).max(1000),
  messageType: z.enum(['welcome', 'follow_up', 'promotional', 'custom']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  scheduleFor: z.string().datetime().optional(),
  metadata: z.object({
    workflowId: z.string().optional(),
    traceId: z.string().optional(),
    source: z.string().optional()
  }).optional()
});

const MessageStatusSchema = z.object({
  messageId: z.string()
});

/**
 * POST /api/v2/onlyfans/messages
 * Envoie un message OnlyFans avec rate limiting et queuing
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const validatedData = SendMessageSchema.parse(body);
    
    // Obtenir le service OnlyFans amélioré
    const onlyFansService = await getEnhancedOnlyFansService();
    
    // Préparer la requête
    const sendRequest = {
      userId: validatedData.userId,
      recipientId: validatedData.recipientId,
      content: validatedData.content,
      messageType: validatedData.messageType,
      priority: validatedData.priority,
      scheduleFor: validatedData.scheduleFor ? new Date(validatedData.scheduleFor) : undefined,
      metadata: validatedData.metadata
    };
    
    // Envoyer le message
    const result = await onlyFansService.sendMessage(sendRequest);
    
    // Déterminer le status code approprié
    let statusCode = 200;
    if (result.status === 'rate_limited') {
      statusCode = 429; // Too Many Requests
    } else if (result.status === 'failed') {
      statusCode = 500;
    } else if (result.status === 'queued') {
      statusCode = 202; // Accepted
    }
    
    const response = NextResponse.json({
      success: result.success,
      data: {
        messageId: result.messageId,
        status: result.status,
        rateLimitInfo: result.rateLimitInfo,
        queueInfo: result.queueInfo,
        metadata: {
          ...result.metadata,
          totalProcessingTime: Date.now() - startTime
        }
      },
      error: result.error
    }, { status: statusCode });
    
    // Ajouter des headers informatifs
    if (result.rateLimitInfo) {
      response.headers.set('X-RateLimit-Remaining', result.rateLimitInfo.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.rateLimitInfo.resetTime.toISOString());
      if (result.rateLimitInfo.retryAfter) {
        response.headers.set('Retry-After', result.rateLimitInfo.retryAfter.toString());
      }
    }
    
    response.headers.set('X-Provider', result.metadata.provider);
    response.headers.set('X-Processing-Time', `${result.metadata.processingTime}ms`);
    
    return response;
    
  } catch (error) {
    console.error('[OnlyFans Messages API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/onlyfans/messages/[messageId]
 * Obtient le statut d'un message
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    
    if (!messageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'messageId is required'
        },
        { status: 400 }
      );
    }
    
    const onlyFansService = await getEnhancedOnlyFansService();
    const status = await onlyFansService.getMessageStatus(messageId);
    
    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('[OnlyFans Messages API] Error getting status:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get message status'
      },
      { status: 500 }
    );
  }
}