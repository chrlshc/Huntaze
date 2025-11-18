/**
 * GET /api/integrations/status
 * 
 * Get all integrations for the current user with status information.
 * 
 * @authentication Required - Uses NextAuth session via withAuth middleware
 * @rateLimit 60 requests per minute per user
 * 
 * @responseBody
 * Success: {
 *   success: true,
 *   data: {
 *     integrations: Array<{
 *       id: number,
 *       provider: string,
 *       accountId: string,
 *       accountName: string,
 *       status: 'connected' | 'expired',
 *       expiresAt: string | null,
 *       createdAt: string,
 *       updatedAt: string
 *     }>
 *   },
 *   duration: number
 * }
 * 
 * Error: {
 *   success: false,
 *   error: {
 *     code: string,
 *     message: string
 *   },
 *   duration: number
 * }
 * 
 * @example
 * GET /api/integrations/status
 * Response: {
 *   "success": true,
 *   "data": {
 *     "integrations": [
 *       {
 *         "id": 1,
 *         "provider": "instagram",
 *         "accountId": "123456",
 *         "accountName": "@creator",
 *         "status": "connected",
 *         "expiresAt": "2025-12-31T23:59:59Z",
 *         "createdAt": "2025-01-01T00:00:00Z",
 *         "updatedAt": "2025-01-15T12:00:00Z"
 *       }
 *     ]
 *   },
 *   "duration": 45
 * }
 * 
 * Requirements: 1.1, 1.2, 3.1, 3.2
 * @see .kiro/specs/integrations-management/requirements.md
 * @see .kiro/specs/integrations-management/design.md
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { successResponse, errorResponse, internalServerError } from '@/lib/api/utils/response';
import { integrationsService } from '@/lib/services/integrations/integrations.service';
import { createLogger } from '@/lib/utils/logger';
import crypto from 'crypto';

const logger = createLogger('integrations-status');

// ============================================================================
// Types
// ============================================================================

/**
 * Integration with status information
 */
interface IntegrationWithStatus {
  id: number;
  provider: string;
  accountId: string;
  accountName: string;
  status: 'connected' | 'expired';
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Success response type
 */
interface IntegrationsStatusResponse {
  success: true;
  data: {
    integrations: IntegrationWithStatus[];
  };
  duration: number;
}

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
  ],
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

    logger.warn('Retrying integrations status fetch', {
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

export const GET = withRateLimit(
  withAuth(async (req: AuthenticatedRequest) => {
    const startTime = Date.now();
    const correlationId = crypto.randomUUID();
    
    try {
      logger.info('Fetching integrations status', {
        correlationId,
        userId: req.user.id,
      });

      // Validate user ID
      const userId = parseInt(req.user.id);
      
      if (isNaN(userId)) {
        logger.warn('Invalid user ID', {
          correlationId,
          userId: req.user.id,
        });
        
        return Response.json(
          errorResponse('INVALID_USER_ID', 'Invalid user ID'),
          { 
            status: 400,
            headers: {
              'X-Correlation-Id': correlationId,
            },
          }
        );
      }

      // Get all connected integrations with retry logic
      const integrations = await retryWithBackoff(
        async () => {
          return await integrationsService.getConnectedIntegrations(userId);
        },
        correlationId
      );
      
      // Add status field based on expiry and format for response
      const integrationsWithStatus: IntegrationWithStatus[] = integrations.map(integration => {
        // Extract display name from metadata
        const username = integration.metadata?.username || 
                        integration.metadata?.displayName || 
                        integration.providerAccountId;
        
        return {
          id: integration.id!,
          provider: integration.provider,
          accountId: integration.providerAccountId,
          accountName: username,
          status: integrationsService.isTokenExpired(integration.expiresAt || null)
            ? 'expired'
            : 'connected',
          expiresAt: integration.expiresAt?.toISOString() || null,
          createdAt: integration.createdAt.toISOString(),
          updatedAt: integration.updatedAt.toISOString(),
        };
      });

      const duration = Date.now() - startTime;

      logger.info('Integrations status fetched successfully', {
        correlationId,
        userId,
        count: integrationsWithStatus.length,
        expired: integrationsWithStatus.filter(i => i.status === 'expired').length,
        duration,
      });

      return Response.json(
        successResponse(
          { integrations: integrationsWithStatus },
          { startTime }
        ),
        {
          headers: {
            'X-Correlation-Id': correlationId,
            'X-Duration-Ms': duration.toString(),
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          },
        }
      );
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      logger.error('Failed to fetch integrations status', error, {
        correlationId,
        userId: req.user.id,
        duration,
        errorMessage: error.message,
        errorStack: error.stack,
      });
      
      return Response.json(
        internalServerError(
          error.message || 'Failed to fetch integrations',
          { startTime }
        ),
        {
          status: 500,
          headers: {
            'X-Correlation-Id': correlationId,
            'Retry-After': '60',
          },
        }
      );
    }
  })
);
