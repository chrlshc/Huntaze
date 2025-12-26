/**
 * Mark Message as Read API Route
 * 
 * PATCH /api/messages/[threadId]/read
 * Marks a message as read for the authenticated user
 * 
 * @route PATCH /api/messages/:threadId/read
 * @access Private (requires authentication)
 * @returns {MessageReadResponse} Updated message with read status
 */

import { NextRequest, NextResponse } from 'next/server';
import { MessagesRepository, ConversationsRepository } from '@/lib/db/repositories';
import { resolveUserId } from '@/app/api/crm/_lib/auth';

// ============================================================================
// Types
// ============================================================================

interface MessageReadResponse {
  success: boolean;
  conversationId?: number;
  markedCount?: number;
  error?: string;
  correlationId?: string;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  correlationId: string;
  timestamp: string;
  statusCode: number;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return `msg-read-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  error: string,
  code: string,
  statusCode: number,
  correlationId: string
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = {
    success: false,
    error,
    code,
    correlationId,
    timestamp: new Date().toISOString(),
    statusCode,
  };

  console.error('[Messages API] Error:', {
    error,
    code,
    statusCode,
    correlationId,
  });

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Get authenticated user ID from request
 */
async function getUserId(request: NextRequest): Promise<number | null> {
  try {
    const { userId } = await resolveUserId(request);
    return userId ?? null;
  } catch (error) {
    console.error('[Messages API] Auth error:', error);
    return null;
  }
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * PATCH /api/messages/[threadId]/read
 * Mark a message as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();

  try {
    // Log request
    console.log('[Messages API] PATCH /api/messages/[threadId]/read', {
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // 1. Extract and validate params
    const { threadId } = await params;

    if (!threadId) {
      return createErrorResponse(
        'Thread ID is required',
        'MISSING_THREAD_ID',
        400,
        correlationId
      );
    }

    const conversationId = parseInt(threadId, 10);
    if (Number.isNaN(conversationId)) {
      return createErrorResponse(
        'Invalid thread ID format',
        'INVALID_THREAD_ID',
        400,
        correlationId
      );
    }

    // 2. Authenticate user
    const userId = await getUserId(request);

    if (!userId) {
      return createErrorResponse(
        'Authentication required',
        'UNAUTHORIZED',
        401,
        correlationId
      );
    }

    // 3. Mark message as read
    let markedCount = 0;
    try {
      markedCount = await MessagesRepository.markConversationRead(userId, conversationId);
      await ConversationsRepository.resetUnreadCount(userId, conversationId);
    } catch (error) {
      console.error('[Messages API] Database error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        conversationId,
        correlationId,
      });

      return createErrorResponse(
        'Failed to update messages',
        'DATABASE_ERROR',
        500,
        correlationId
      );
    }

    // 5. Success response
    const duration = Date.now() - startTime;
    const response: MessageReadResponse = {
      success: true,
      conversationId,
      markedCount,
      correlationId,
      timestamp: new Date().toISOString(),
    };

    console.log('[Messages API] Success:', {
      userId,
      conversationId,
      markedCount,
      duration,
      correlationId,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Correlation-Id': correlationId,
        'X-Response-Time': `${duration}ms`,
      },
    });

  } catch (error) {
    // Catch-all error handler
    const duration = Date.now() - startTime;
    
    console.error('[Messages API] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration,
      correlationId,
    });

    return createErrorResponse(
      'An unexpected error occurred',
      'INTERNAL_ERROR',
      500,
      correlationId
    );
  }
}

export const PUT = PATCH;
