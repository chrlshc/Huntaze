/**
 * API Route: AI Message Suggestions
 * Endpoint pour générer des suggestions de messages personnalisées
 * 
 * @see docs/api/onlyfans-ai-assistant-integration.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { onlyFansAIAssistantEnhanced } from '@/lib/services/onlyfans-ai-assistant-enhanced';
import { requireUser } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * TypeScript types for API requests/responses
 */
export interface SuggestionsRequest {
  fanId: string;
  creatorId: string;
  lastMessage?: string;
  messageCount?: number;
  fanValueCents?: number;
}

export interface SuggestionsResponse {
  success: boolean;
  suggestions: string[];
  metadata: {
    count: number;
    duration: number;
    correlationId: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  correlationId: string;
}

/**
 * Structured logging helper
 */
function logError(context: string, error: unknown, metadata?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[AI Suggestions API] ${context}`, {
    error: errorMessage,
    stack: errorStack,
    ...metadata
  });
}

function logInfo(context: string, metadata?: Record<string, any>) {
  console.log(`[AI Suggestions API] ${context}`, metadata);
}

/**
 * POST /api/ai/suggestions
 * 
 * Génère des suggestions de messages AI personnalisées
 * 
 * Request Body:
 * {
 *   fanId: string,           // Required
 *   creatorId: string,       // Required
 *   lastMessage?: string,    // Optional
 *   messageCount?: number,   // Optional, default: 0
 *   fanValueCents?: number   // Optional, default: 0
 * }
 * 
 * Response (200):
 * {
 *   success: true,
 *   suggestions: string[],
 *   metadata: {
 *     count: number,
 *     duration: number,
 *     correlationId: string
 *   }
 * }
 * 
 * Error Responses:
 * - 400 Bad Request: Invalid input
 * - 401 Unauthorized: User not authenticated
 * - 500 Internal Server Error: Generation failed
 */
export async function POST(request: NextRequest): Promise<NextResponse<SuggestionsResponse | ErrorResponse>> {
  const startTime = Date.now();
  const correlationId = request.headers.get('x-correlation-id') || 
    crypto.randomUUID();

  try {
    // Authentication
    const user = await requireUser();
    
    // Parse request body
    let body: SuggestionsRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      logError('Invalid JSON in request body', parseError, { correlationId });
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON in request body',
          correlationId
        },
        { status: 400 }
      );
    }

    const { fanId, creatorId, lastMessage, messageCount, fanValueCents } = body;

    // Validation
    if (!fanId || typeof fanId !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing or invalid fanId',
          message: 'fanId must be a non-empty string',
          correlationId
        },
        { status: 400 }
      );
    }

    if (!creatorId || typeof creatorId !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing or invalid creatorId',
          message: 'creatorId must be a non-empty string',
          correlationId
        },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (messageCount !== undefined && (typeof messageCount !== 'number' || messageCount < 0)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid messageCount',
          message: 'messageCount must be a non-negative number',
          correlationId
        },
        { status: 400 }
      );
    }

    if (fanValueCents !== undefined && (typeof fanValueCents !== 'number' || fanValueCents < 0)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid fanValueCents',
          message: 'fanValueCents must be a non-negative number',
          correlationId
        },
        { status: 400 }
      );
    }

    logInfo('Generating AI suggestions', {
      userId: user.id,
      fanId,
      creatorId,
      hasLastMessage: !!lastMessage,
      correlationId,
    });

    // Générer les suggestions avec retry automatique via circuit breaker
    const suggestions = await onlyFansAIAssistantEnhanced.generateResponse({
      fanId,
      creatorId,
      lastMessage,
      messageCount: messageCount || 0,
      fanValueCents: fanValueCents || 0,
      correlationId,
    });

    const duration = Date.now() - startTime;

    logInfo('Suggestions generated successfully', {
      userId: user.id,
      fanId,
      suggestionCount: suggestions.length,
      duration,
      correlationId,
    });

    // Track metrics (lazy loaded)
    try {
      const { getOrCreateHistogram, getOrCreateCounter } = await import('@/lib/metrics-registry');
      
      const durationHistogram = await getOrCreateHistogram(
        'ai_suggestions_duration_seconds',
        'AI suggestions generation duration',
        ['status']
      );
      durationHistogram.observe({ status: 'success' }, duration / 1000);

      const requestCounter = await getOrCreateCounter(
        'ai_suggestions_requests_total',
        'Total AI suggestions requests',
        ['status']
      );
      requestCounter.inc({ status: 'success' });
    } catch (metricsError) {
      // Log but don't fail the request
      logError('Failed to record metrics', metricsError, { correlationId });
    }

    return NextResponse.json(
      {
        success: true,
        suggestions,
        metadata: {
          count: suggestions.length,
          duration,
          correlationId,
        },
      },
      {
        status: 200,
        headers: {
          'X-Correlation-Id': correlationId,
          'X-Response-Time': `${duration}ms`,
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logError('Failed to generate suggestions', error, {
      duration,
      correlationId,
    });

    // Track error metrics
    try {
      const { getOrCreateHistogram, getOrCreateCounter } = await import('@/lib/metrics-registry');
      
      const durationHistogram = await getOrCreateHistogram(
        'ai_suggestions_duration_seconds',
        'AI suggestions generation duration',
        ['status']
      );
      durationHistogram.observe({ status: 'error' }, duration / 1000);

      const requestCounter = await getOrCreateCounter(
        'ai_suggestions_requests_total',
        'Total AI suggestions requests',
        ['status']
      );
      requestCounter.inc({ status: 'error' });
    } catch (metricsError) {
      // Log but don't fail the request
      logError('Failed to record error metrics', metricsError, { correlationId });
    }

    // Check for specific error types
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          correlationId,
        },
        { status: 401 }
      );
    }

    // Check for circuit breaker open
    if (error instanceof Error && error.message.includes('Circuit breaker')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service temporarily unavailable',
          message: 'AI service is experiencing high load. Please try again in a moment.',
          correlationId,
        },
        { 
          status: 503,
          headers: {
            'Retry-After': '30',
            'X-Correlation-Id': correlationId,
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate suggestions',
        message: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { 
        status: 500,
        headers: {
          'X-Correlation-Id': correlationId,
        },
      }
    );
  }
}

/**
 * GET /api/ai/suggestions
 * 
 * Health check endpoint - returns circuit breaker status
 * 
 * Response (200):
 * {
 *   status: 'healthy',
 *   circuitBreakers: {
 *     openai: { state: 'closed', failures: 0, ... },
 *     memory: { state: 'closed', failures: 0, ... }
 *   },
 *   timestamp: string
 * }
 * 
 * Response (503):
 * {
 *   status: 'unhealthy',
 *   error: string
 * }
 */
export async function GET(): Promise<NextResponse> {
  const correlationId = crypto.randomUUID();
  
  try {
    const status = onlyFansAIAssistantEnhanced.getCircuitBreakerStatus();
    
    logInfo('Health check requested', {
      circuitBreakers: Object.keys(status),
      correlationId,
    });
    
    return NextResponse.json(
      {
        status: 'healthy',
        circuitBreakers: status,
        timestamp: new Date().toISOString(),
        correlationId,
      },
      {
        headers: {
          'X-Correlation-Id': correlationId,
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    logError('Health check failed', error, { correlationId });
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { 
        status: 503,
        headers: {
          'X-Correlation-Id': correlationId,
        },
      }
    );
  }
}
