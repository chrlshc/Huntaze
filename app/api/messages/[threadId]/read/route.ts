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
import { crmData, Message } from '@/lib/services/crmData';
import { getUserFromRequest } from '@/lib/auth/request';

// ============================================================================
// Types
// ============================================================================

interface MessageReadResponse {
  success: boolean;
  message?: Message;
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
async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const user = await getUserFromRequest(request);
    return user?.userId || null;
  } catch (error) {
    console.error('[Messages API] Auth error:', error);
    return null;
  }
}

/**
 * Validate thread ID format
 */
function validateThreadId(threadId: string): boolean {
  // UUID v4 format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(threadId);
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

    if (!validateThreadId(threadId)) {
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
    let updated: Message | undefined;
    
    try {
      updated = crmData.markMessageRead(userId, threadId);
    } catch (error) {
      console.error('[Messages API] Database error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        threadId,
        correlationId,
      });

      return createErrorResponse(
        'Failed to update message',
        'DATABASE_ERROR',
        500,
        correlationId
      );
    }

    // 4. Handle not found
    if (!updated) {
      return createErrorResponse(
        'Message not found or access denied',
        'MESSAGE_NOT_FOUND',
        404,
        correlationId
      );
    }

    // 5. Success response
    const duration = Date.now() - startTime;
    const response: MessageReadResponse = {
      success: true,
      message: updated,
      correlationId,
      timestamp: new Date().toISOString(),
    };

    console.log('[Messages API] Success:', {
      userId,
      threadId,
      messageId: updated.id,
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
