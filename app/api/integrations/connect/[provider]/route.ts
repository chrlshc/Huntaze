/**
 * POST /api/integrations/connect/:provider
 * 
 * Initiate OAuth flow for a provider
 * Requirements: 2.1, 5.1, 5.2, 5.3
 */

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { successResponse, errorResponse, badRequest, internalServerError } from '@/lib/api/utils/response';
import { integrationsService } from '@/lib/services/integrations/integrations.service';
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

export const POST = withRateLimit(
  withAuth(async (req: AuthenticatedRequest, { params }: { params: { provider: string } }) => {
    const startTime = Date.now();
    
    try {
      // Validate CSRF token (Requirements: 16.5)
      const csrfValidation = await validateCsrfToken(req);
      if (!csrfValidation.valid) {
        console.warn('[CSRF] Integration connect blocked', {
          error: csrfValidation.error,
          errorCode: csrfValidation.errorCode,
          provider: params.provider,
        });
        
        return Response.json(
          errorResponse('CSRF_ERROR', csrfValidation.error || 'CSRF validation failed'),
          { status: 403 }
        );
      }
      
      const provider = params.provider as Provider;
      
      // Validate provider
      if (!VALID_PROVIDERS.includes(provider)) {
        return badRequest(
          `Invalid provider: ${provider}. Must be one of: ${VALID_PROVIDERS.join(', ')}`,
          { validProviders: VALID_PROVIDERS },
          { startTime }
        );
      }

      const userId = parseInt(req.user.id);
      
      if (isNaN(userId)) {
        return Response.json(
          errorResponse('INVALID_USER_ID', 'Invalid user ID'),
          { status: 400 }
        );
      }

      // Parse request body
      let redirectUrl: string;
      try {
        const body = await req.json();
        redirectUrl = body.redirectUrl || `${process.env.NEXTAUTH_URL}/integrations`;
      } catch {
        redirectUrl = `${process.env.NEXTAUTH_URL}/integrations`;
      }

      // Extract client information for audit logging
      const ipAddress = getClientIp(req);
      const userAgent = req.headers.get('user-agent') || undefined;

      // Initiate OAuth flow with audit logging
      const result = await integrationsService.initiateOAuthFlow(
        provider,
        userId,
        redirectUrl,
        ipAddress,
        userAgent
      );

      return Response.json(
        successResponse(
          {
            authUrl: result.authUrl,
            state: result.state,
            provider,
          },
          { startTime }
        )
      );
    } catch (error: any) {
      console.error('[Integrations Connect Error]', error);
      
      if (error.code === 'INVALID_PROVIDER') {
        return badRequest(error.message, { provider: params.provider }, { startTime });
      }
      
      return internalServerError(
        error.message || 'Failed to initiate OAuth flow',
        { startTime }
      );
    }
  }),
  { limit: 10, windowMs: 60000 } // Strict rate limit for OAuth initiation (10 req/min)
);
