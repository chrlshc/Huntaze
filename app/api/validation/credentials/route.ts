/**
 * Credentials Validation API Endpoint
 * 
 * POST /api/validation/credentials
 * 
 * Validates OAuth credentials for various platforms (Instagram, TikTok, Reddit)
 * with retry logic, error handling, and comprehensive logging.
 * 
 * @see docs/api/validation-health.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { ValidationOrchestrator } from '@/lib/security/validation-orchestrator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

// ============================================================================
// Types
// ============================================================================

interface ValidationRequest {
  platform: 'instagram' | 'tiktok' | 'reddit';
  credentials: {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    clientKey?: string; // TikTok
  };
}

interface ValidationResponse {
  success: boolean;
  platform: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details?: {
    timestamp: string;
    duration: number;
    cached?: boolean;
    credentialsSet?: boolean;
    formatValid?: boolean;
    apiConnectivity?: boolean;
  };
  correlationId?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  correlationId: string;
  timestamp: string;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return `val-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Log API request/response
 */
function logRequest(
  correlationId: string,
  platform: string,
  level: 'info' | 'warn' | 'error',
  message: string,
  meta?: Record<string, any>
) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    correlationId,
    platform,
    endpoint: '/api/validation/credentials',
    ...meta,
  };

  if (level === 'error') {
    console.error(`[Validation API] ${message}`, logData);
  } else if (level === 'warn') {
    console.warn(`[Validation API] ${message}`, logData);
  } else {
    console.log(`[Validation API] ${message}`, logData);
  }
}

/**
 * Validate request body
 */
function validateRequestBody(body: any): {
  valid: boolean;
  error?: string;
  data?: ValidationRequest;
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const { platform, credentials } = body;

  if (!platform) {
    return { valid: false, error: 'Missing required field: platform' };
  }

  if (!['instagram', 'tiktok', 'reddit'].includes(platform)) {
    return {
      valid: false,
      error: 'Invalid platform. Must be one of: instagram, tiktok, reddit',
    };
  }

  if (!credentials || typeof credentials !== 'object') {
    return { valid: false, error: 'Missing or invalid credentials object' };
  }

  // Platform-specific validation
  if (platform === 'instagram') {
    if (!credentials.clientId || !credentials.clientSecret) {
      return {
        valid: false,
        error: 'Instagram requires clientId and clientSecret',
      };
    }
  } else if (platform === 'tiktok') {
    if (!credentials.clientKey || !credentials.clientSecret) {
      return {
        valid: false,
        error: 'TikTok requires clientKey and clientSecret',
      };
    }
  } else if (platform === 'reddit') {
    if (!credentials.clientId || !credentials.clientSecret) {
      return {
        valid: false,
        error: 'Reddit requires clientId and clientSecret',
      };
    }
  }

  return { valid: true, data: body as ValidationRequest };
}

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 100
): Promise<T> {
  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on validation errors (400-level)
      if (error instanceof Error && error.message.includes('validation')) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  throw lastError!;
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();

  try {
    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      logRequest(correlationId, 'unknown', 'error', 'Invalid JSON body', {
        error: (error as Error).message,
      });

      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
          correlationId,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate request body
    const validation = validateRequestBody(body);
    if (!validation.valid) {
      logRequest(correlationId, body.platform || 'unknown', 'warn', 'Invalid request', {
        error: validation.error,
      });

      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Validation Error',
          message: validation.error!,
          correlationId,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const { platform, credentials } = validation.data!;

    logRequest(correlationId, platform, 'info', 'Validation request started', {
      platform,
      hasClientId: !!credentials.clientId,
      hasClientSecret: !!credentials.clientSecret,
      hasRedirectUri: !!credentials.redirectUri,
    });

    // Execute validation with retry logic
    const result = await retryWithBackoff(async () => {
      const orchestrator = new ValidationOrchestrator();
      return await orchestrator.validatePlatform(platform, credentials);
    });

    const duration = Date.now() - startTime;

    logRequest(
      correlationId,
      platform,
      result.isValid ? 'info' : 'warn',
      'Validation completed',
      {
        isValid: result.isValid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        duration,
      }
    );

    // Return success response
    return NextResponse.json<ValidationResponse>(
      {
        success: true,
        platform,
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings,
        details: {
          timestamp: new Date().toISOString(),
          duration,
          credentialsSet: result.credentialsSet,
          formatValid: result.formatValid,
          apiConnectivity: result.apiConnectivity,
        },
        correlationId,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'X-Correlation-Id': correlationId,
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logRequest(correlationId, 'unknown', 'error', 'Validation failed', {
      error: errorMessage,
      stack: errorStack,
      duration,
    });

    // Return error response
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Credential validation failed. Please try again.',
        correlationId,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'X-Correlation-Id': correlationId,
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  }
}
