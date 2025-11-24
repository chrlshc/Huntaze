/**
 * Onboarding Completion API - Beta Launch UI System
 * 
 * POST /api/onboarding/complete
 * 
 * Marks user onboarding as complete and saves onboarding data:
 * - contentTypes: Array of content types (photos, videos, stories, ppv)
 * - goal: Primary goal (grow-audience, increase-revenue, save-time, all)
 * - revenueGoal: Optional monthly revenue goal
 * - platform: Optional OnlyFans credentials (encrypted)
 * 
 * @authentication Required - Uses NextAuth session
 * @rateLimit None (single-use endpoint)
 * 
 * @requestBody
 * {
 *   contentTypes?: string[],
 *   goal?: string,
 *   revenueGoal?: number,
 *   platform?: { username: string, password: string }
 * }
 * 
 * @responseBody
 * Success: { success: true, message: string, correlationId: string }
 * Error: { error: string, correlationId: string, retryable: boolean }
 * 
 * Requirements: 5.4, 5.6, 5.9, 16.2
 * 
 * @see docs/api/onboarding-complete.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
// Session import moved to runtime for test mode support
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { encryptToken } from '@/lib/services/integrations/encryption';
import { validateCsrfToken } from '@/lib/middleware/csrf';

const logger = createLogger('onboarding-complete');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// Types & Validation
// ============================================================================

/**
 * Onboarding data request schema
 */
const OnboardingDataSchema = z.object({
  contentTypes: z.array(z.enum(['photos', 'videos', 'stories', 'ppv'])).optional(),
  goal: z.enum(['grow-audience', 'increase-revenue', 'save-time', 'all']).optional(),
  revenueGoal: z.number().min(0).max(1000000).optional(),
  platform: z.object({
    username: z.string().min(1).max(255),
    password: z.string().min(1).max(255),
  }).optional(),
});

type OnboardingData = z.infer<typeof OnboardingDataSchema>;

/**
 * Success response
 */
interface OnboardingSuccessResponse {
  success: true;
  message: string;
  user: {
    id: number;
    email: string;
    onboardingCompleted: boolean;
  };
  correlationId: string;
  duration: number;
}

/**
 * Error response
 */
interface OnboardingErrorResponse {
  error: string;
  correlationId: string;
  retryable: boolean;
  statusCode: number;
}

// ============================================================================
// Error Types
// ============================================================================

enum OnboardingErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

class OnboardingError extends Error {
  constructor(
    public type: OnboardingErrorType,
    public message: string,
    public statusCode: number,
    public retryable: boolean,
    public correlationId: string
  ) {
    super(message);
    this.name = 'OnboardingError';
  }
}

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
  retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'],
};

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  correlationId: string,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = RETRY_CONFIG.retryableErrors.some(
      (code) => error.code === code || error.message?.includes(code)
    );

    if (!isRetryable || attempt >= RETRY_CONFIG.maxRetries) {
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
      RETRY_CONFIG.maxDelay
    );

    logger.warn('Retrying onboarding completion', {
      correlationId,
      attempt,
      delay,
      error: error.message,
    });

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, correlationId, attempt + 1);
  }
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * OPTIONS /api/onboarding/complete
 * 
 * CORS preflight handler
 * Returns allowed methods and caching headers for CORS preflight requests.
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Allow': 'POST, OPTIONS',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
      },
    }
  );
}

/**
 * POST /api/onboarding/complete
 * 
 * Completes user onboarding and saves preferences
 */
export async function POST(request: NextRequest): Promise<NextResponse<OnboardingSuccessResponse | OnboardingErrorResponse>> {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();

  try {
    // 1. CSRF Protection (Requirements: 16.5)
    const csrfValidation = await validateCsrfToken(request);
    if (!csrfValidation.valid) {
      logger.warn('Onboarding completion blocked by CSRF protection', {
        correlationId,
        error: csrfValidation.error,
        errorCode: csrfValidation.errorCode,
      });
      
      return NextResponse.json<OnboardingErrorResponse>(
        {
          error: csrfValidation.error || 'CSRF validation failed',
          correlationId,
          retryable: csrfValidation.shouldRefresh || false,
          statusCode: 403,
        },
        { status: 403 }
      );
    }
    
    // 2. Authentication (with error boundary)
    logger.info('Onboarding completion started', {
      correlationId,
      url: request.url,
      method: request.method,
    });

    // Use getSessionFromRequest to support test mode
    const { getSessionFromRequest } = await import('@/lib/auth/session');
    const session = await getSessionFromRequest(request);
    
    if (!session?.user?.id) {
      const duration = Date.now() - startTime;
      logger.warn('Onboarding completion failed: Unauthorized', {
        correlationId,
        hasSession: !!session,
        duration,
      });

      return NextResponse.json<OnboardingErrorResponse>(
        {
          error: 'Authentication required',
          correlationId,
          retryable: false,
          statusCode: 401,
        },
        {
          status: 401,
          headers: {
            'X-Correlation-Id': correlationId,
          },
        }
      );
    }

    const userId = session.user.id;

    // 3. Parse and validate request body (with error boundary)
    let json: any;
    try {
      json = await request.json();
    } catch (parseError: any) {
      throw new OnboardingError(
        OnboardingErrorType.VALIDATION_ERROR,
        'Invalid JSON in request body',
        400,
        false,
        correlationId
      );
    }

    let validatedData: OnboardingData;
    try {
      validatedData = OnboardingDataSchema.parse(json);
    } catch (validationError: any) {
      const errorMessage = validationError.errors?.[0]?.message || 'Validation failed';
      throw new OnboardingError(
        OnboardingErrorType.VALIDATION_ERROR,
        errorMessage,
        400,
        false,
        correlationId
      );
    }

    const { contentTypes, goal, revenueGoal, platform } = validatedData;

    // 4. Check if onboarding already completed
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { onboardingCompleted: true },
    });

    if (existingUser?.onboardingCompleted) {
      throw new OnboardingError(
        OnboardingErrorType.VALIDATION_ERROR,
        'Onboarding already completed',
        400,
        false,
        correlationId
      );
    }

    // 5. Update user with onboarding data (with retry logic)
    let updatedUser;
    try {
      updatedUser = await retryWithBackoff(
        async () => {
          return await prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
              onboardingCompleted: true,
              contentTypes: contentTypes || [],
              goal: goal || null,
              revenueGoal: revenueGoal || null,
            },
            select: {
              id: true,
              email: true,
              onboardingCompleted: true,
            },
          });
        },
        correlationId
      );

      logger.info('User onboarding data updated', {
        correlationId,
        userId,
        hasContentTypes: !!contentTypes?.length,
        hasGoal: !!goal,
        hasRevenueGoal: !!revenueGoal,
      });
    } catch (dbError: any) {
      throw new OnboardingError(
        OnboardingErrorType.DATABASE_ERROR,
        'Failed to update user data after retries',
        503,
        true,
        correlationId
      );
    }

    // 6. Store OnlyFans credentials if provided (with retry logic)
    if (platform?.username && platform?.password) {
      try {
        // Encrypt password
        let encryptedPassword: string;
        try {
          encryptedPassword = encryptToken(platform.password);
        } catch (encryptError: any) {
          throw new OnboardingError(
            OnboardingErrorType.ENCRYPTION_ERROR,
            'Failed to encrypt credentials',
            500,
            false,
            correlationId
          );
        }

        // Store in database with retry
        await retryWithBackoff(
          async () => {
            await prisma.oAuthAccount.upsert({
              where: {
                provider_providerAccountId: {
                  provider: 'onlyfans',
                  providerAccountId: platform.username,
                },
              },
              create: {
                userId: parseInt(userId),
                provider: 'onlyfans',
                providerAccountId: platform.username,
                accessToken: encryptedPassword,
              },
              update: {
                accessToken: encryptedPassword,
              },
            });
          },
          correlationId
        );
        
        logger.info('OnlyFans credentials stored', {
          correlationId,
          userId,
          username: platform.username,
        });
      } catch (credError: any) {
        // Log error but don't fail the request
        logger.error('Failed to store OnlyFans credentials', credError, {
          correlationId,
          userId,
          errorType: credError instanceof OnboardingError ? credError.type : 'UNKNOWN',
        });
        
        // Continue - credential storage is optional
      }
    }

    // 7. Success response
    const duration = Date.now() - startTime;

    logger.info('Onboarding completed successfully', {
      correlationId,
      userId,
      email: session.user.email,
      hasContentTypes: !!contentTypes?.length,
      hasGoal: !!goal,
      hasRevenueGoal: !!revenueGoal,
      hasPlatform: !!platform,
      duration,
    });

    return NextResponse.json<OnboardingSuccessResponse>(
      {
        success: true,
        message: 'Onboarding completed successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email || '',
          onboardingCompleted: updatedUser.onboardingCompleted ?? true,
        },
        correlationId,
        duration,
      },
      {
        status: 200,
        headers: {
          'X-Correlation-Id': correlationId,
          'X-Duration-Ms': duration.toString(),
        },
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Handle OnboardingError
    if (error instanceof OnboardingError) {
      logger.error('Onboarding completion error', error, {
        correlationId,
        type: error.type,
        statusCode: error.statusCode,
        retryable: error.retryable,
        duration,
      });

      return NextResponse.json<OnboardingErrorResponse>(
        {
          error: error.message,
          correlationId,
          retryable: error.retryable,
          statusCode: error.statusCode,
        },
        {
          status: error.statusCode,
          headers: {
            'X-Correlation-Id': correlationId,
            ...(error.retryable && { 'Retry-After': '60' }),
          },
        }
      );
    }

    // Handle unexpected errors
    logger.error('Onboarding completion unexpected error', error, {
      correlationId,
      duration,
    });

    return NextResponse.json<OnboardingErrorResponse>(
      {
        error: 'Internal server error',
        correlationId,
        retryable: true,
        statusCode: 500,
      },
      {
        status: 500,
        headers: {
          'X-Correlation-Id': correlationId,
          'Retry-After': '60',
        },
      }
    );
  }
}
