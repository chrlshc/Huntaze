/**
 * Correlation ID Middleware
 * 
 * Generates or propagates correlation IDs for distributed tracing.
 * Adds correlation ID to request context, logs, and response headers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Generate or extract correlation ID from request
 */
export function getOrGenerateCorrelationId(request: NextRequest): string {
  // Try to get from header (propagated from upstream)
  const existingId = request.headers.get(CORRELATION_ID_HEADER);
  if (existingId) {
    return existingId;
  }

  // Generate new UUID
  return randomUUID();
}

/**
 * Middleware to add correlation ID to requests
 */
export function withCorrelationId(
  handler: (request: NextRequest, correlationId: string) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const correlationId = getOrGenerateCorrelationId(request);

    // Call the handler with correlation ID
    const response = await handler(request, correlationId);

    // Add correlation ID to response headers
    response.headers.set(CORRELATION_ID_HEADER, correlationId);

    return response;
  };
}

/**
 * Add correlation ID to response
 */
export function addCorrelationIdToResponse(
  response: NextResponse,
  correlationId: string
): NextResponse {
  response.headers.set(CORRELATION_ID_HEADER, correlationId);
  return response;
}

/**
 * Create logger context with correlation ID
 */
export function createLoggerContext(correlationId: string) {
  return {
    correlationId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format log message with correlation ID
 */
export function formatLogWithCorrelation(
  message: string,
  correlationId: string,
  data?: Record<string, any>
): string {
  const logData = {
    message,
    correlationId,
    timestamp: new Date().toISOString(),
    ...data
  };
  return JSON.stringify(logData);
}

/**
 * Add correlation ID to database query comment
 */
export function addCorrelationToQuery(
  query: string,
  correlationId: string
): string {
  return `/* correlation_id: ${correlationId} */ ${query}`;
}

/**
 * Create headers for external API calls with correlation ID
 */
export function createExternalApiHeaders(
  correlationId: string,
  additionalHeaders?: Record<string, string>
): Record<string, string> {
  return {
    [CORRELATION_ID_HEADER]: correlationId,
    ...additionalHeaders
  };
}
