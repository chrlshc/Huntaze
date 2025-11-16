/**
 * Test Environment API Route
 * 
 * Simple diagnostic endpoint to verify:
 * - API routes are working
 * - Environment variables are accessible
 * - Basic health check
 * 
 * GET /api/test-env
 * 
 * @returns {TestEnvResponse} Environment status
 * 
 * @example
 * ```bash
 * curl https://your-domain.com/api/test-env
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Types
// ============================================================================

interface EnvStatus {
  nodeEnv: string;
  hasNextAuthSecret: boolean;
  nextAuthSecretLength: number;
  hasNextAuthUrl: boolean;
  nextAuthUrl: string | undefined;
  hasDatabaseUrl: boolean;
}

interface TestEnvResponse {
  status: 'ok' | 'error';
  timestamp: string;
  correlationId: string;
  env?: EnvStatus;
  error?: string;
  duration?: number;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return `test-env-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Log request with correlation ID
 */
function logRequest(correlationId: string, message: string, meta?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [TestEnv] [${correlationId}] ${message}`, meta || {});
}

/**
 * Log error with correlation ID
 */
function logError(correlationId: string, error: Error, meta?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [TestEnv] [${correlationId}] ERROR:`, {
    message: error.message,
    stack: error.stack,
    ...meta,
  });
}

/**
 * Get environment status safely
 */
function getEnvStatus(): EnvStatus {
  return {
    nodeEnv: process.env.NODE_ENV || 'unknown',
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
  };
}

// ============================================================================
// API Handler
// ============================================================================

/**
 * GET /api/test-env
 * 
 * Returns environment status and configuration check
 */
export async function GET(request: NextRequest): Promise<NextResponse<TestEnvResponse>> {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();

  try {
    logRequest(correlationId, 'Test environment request received', {
      url: request.url,
      method: request.method,
    });

    // Get environment status
    const envStatus = getEnvStatus();

    // Validate critical environment variables
    const missingVars: string[] = [];
    if (!envStatus.hasNextAuthSecret) missingVars.push('NEXTAUTH_SECRET');
    if (!envStatus.hasNextAuthUrl) missingVars.push('NEXTAUTH_URL');
    if (!envStatus.hasDatabaseUrl) missingVars.push('DATABASE_URL');

    if (missingVars.length > 0) {
      logRequest(correlationId, 'Missing critical environment variables', {
        missing: missingVars,
      });
    }

    const duration = Date.now() - startTime;

    logRequest(correlationId, 'Test environment request successful', {
      duration,
      missingVars: missingVars.length,
    });

    const response: TestEnvResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      correlationId,
      env: envStatus,
      duration,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Correlation-Id': correlationId,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logError(
      correlationId,
      error instanceof Error ? error : new Error(errorMessage),
      { duration }
    );

    const response: TestEnvResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      correlationId,
      error: errorMessage,
      duration,
    };

    return NextResponse.json(response, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Correlation-Id': correlationId,
      },
    });
  }
}
