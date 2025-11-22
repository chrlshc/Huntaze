/**
 * DELETE /api/integrations/disconnect/:provider/:accountId
 * 
 * Disconnect an integration
 * Requirements: 2.3, 11.5
 */

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { successResponse, errorResponse, badRequest, notFound, internalServerError } from '@/lib/api/utils/response';
import { integrationsService } from '@/lib/services/integrations/integrations.service';
import { cacheService } from '@/lib/services/cache.service';
import { validateCsrfToken } from '@/lib/middleware/csrf';
import type { Provider } from '@/lib/services/integrations/types';

const VALID_PROVIDERS: Provider[] = ['instagram', 'tiktok', 'reddit', 'onlyfans'];

/**
 * Helper to extract client IP address
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

export const DELETE = withRateLimit(
  withAuth(async (
    req: AuthenticatedRequest,
    { params }: { params: { provider: string; accountId: string } }
  ) => {
    const correlationId = `disconnect-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();
    
    try {
      // Validate CSRF token (Requirements: 16.5)
      const csrfValidation = await validateCsrfToken(req);
      if (!csrfValidation.valid) {
        console.warn('[CSRF] Integration disconnect blocked', {
          correlationId,
          error: csrfValidation.error,
          errorCode: csrfValidation.errorCode,
          provider: params.provider,
          accountId: params.accountId,
        });
        
        return Response.json(
          errorResponse('CSRF_ERROR', csrfValidation.error || 'CSRF validation failed'),
          { 
            status: 403,
            headers: { 'X-Correlation-Id': correlationId }
          }
        );
      }
      
      const provider = params.provider as Provider;
      const accountId = params.accountId;
      
      // Validate provider
      if (!VALID_PROVIDERS.includes(provider)) {
        return Response.json(
          errorResponse('INVALID_PROVIDER', `Invalid provider: ${provider}. Must be one of: ${VALID_PROVIDERS.join(', ')}`),
          { 
            status: 400,
            headers: { 'X-Correlation-Id': correlationId }
          }
        );
      }

      // Validate accountId (sanitize to prevent injection)
      if (!accountId || accountId.trim() === '') {
        return Response.json(
          errorResponse('INVALID_ACCOUNT_ID', 'Account ID is required'),
          { 
            status: 400,
            headers: { 'X-Correlation-Id': correlationId }
          }
        );
      }

      const userId = parseInt(req.user.id);
      
      if (isNaN(userId)) {
        return Response.json(
          errorResponse('INVALID_USER_ID', 'Invalid user ID'),
          { 
            status: 400,
            headers: { 'X-Correlation-Id': correlationId }
          }
        );
      }

      // Extract client information for audit logging
      const ipAddress = getClientIp(req);
      const userAgent = req.headers.get('user-agent') || undefined;

      // Disconnect integration with audit logging
      await integrationsService.disconnectIntegration(
        userId,
        provider,
        accountId,
        ipAddress,
        userAgent
      );

      // Invalidate integration status cache (Requirements: 12.3)
      try {
        const cacheKey = `integrations:status:${userId}`;
        cacheService.invalidate(cacheKey);
        
        console.log('[Cache Invalidation] Integration disconnected', {
          provider,
          userId,
          accountId,
          cacheKey,
        });
      } catch (cacheError) {
        // Log cache error but don't fail the request
        console.warn('[Cache Invalidation Error]', cacheError);
      }

      return Response.json(
        {
          success: true,
          message: `Successfully disconnected ${provider} account`,
          provider,
          accountId,
        },
        {
          status: 200,
          headers: { 'X-Correlation-Id': correlationId }
        }
      );
    } catch (error: any) {
      console.error('[Integrations Disconnect Error]', {
        correlationId,
        error: error.message,
        code: error.code,
      });
      
      if (error.code === 'ACCOUNT_NOT_FOUND') {
        return Response.json(
          errorResponse('NOT_FOUND', `Integration for ${params.provider} not found`),
          { 
            status: 404,
            headers: { 'X-Correlation-Id': correlationId }
          }
        );
      }
      
      return Response.json(
        errorResponse('INTERNAL_ERROR', error.message || 'Failed to disconnect integration'),
        { 
          status: 500,
          headers: { 'X-Correlation-Id': correlationId }
        }
      );
    }
  }),
  { limit: 20, windowMs: 60000 } // Moderate rate limit for disconnect (20 req/min)
);
