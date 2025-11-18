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
    const startTime = Date.now();
    
    try {
      const provider = params.provider as Provider;
      const accountId = params.accountId;
      
      // Validate provider
      if (!VALID_PROVIDERS.includes(provider)) {
        return badRequest(
          `Invalid provider: ${provider}. Must be one of: ${VALID_PROVIDERS.join(', ')}`,
          { validProviders: VALID_PROVIDERS },
          { startTime }
        );
      }

      // Validate accountId (sanitize to prevent injection)
      if (!accountId || accountId.trim() === '') {
        return badRequest(
          'Account ID is required',
          undefined,
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

      return Response.json(
        successResponse(
          {
            success: true,
            message: `Successfully disconnected ${provider} account`,
            provider,
            accountId,
          },
          { startTime }
        )
      );
    } catch (error: any) {
      console.error('[Integrations Disconnect Error]', error);
      
      if (error.code === 'ACCOUNT_NOT_FOUND') {
        return notFound(
          `Integration for ${params.provider}`,
          { startTime }
        );
      }
      
      return internalServerError(
        error.message || 'Failed to disconnect integration',
        { startTime }
      );
    }
  }),
  { limit: 20, windowMs: 60000 } // Moderate rate limit for disconnect (20 req/min)
);
