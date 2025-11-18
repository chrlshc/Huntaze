/**
 * POST /api/integrations/refresh/:provider/:accountId
 * 
 * Manually refresh a token
 * Requirements: 8.1, 8.2, 8.3
 */

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { successResponse, errorResponse, badRequest, notFound, internalServerError } from '@/lib/api/utils/response';
import { integrationsService } from '@/lib/services/integrations/integrations.service';
import type { Provider } from '@/lib/services/integrations/types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const VALID_PROVIDERS: Provider[] = ['instagram', 'tiktok', 'reddit', 'onlyfans'];

export const POST = withRateLimit(
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

      // Validate accountId
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

      // Verify user owns this integration
      const account = await prisma.oAuthAccount.findFirst({
        where: {
          userId,
          provider,
          providerAccountId: accountId,
        },
      });

      if (!account) {
        return notFound(
          `Integration for ${provider}`,
          { startTime }
        );
      }

      // Refresh token
      await integrationsService.refreshToken(provider, accountId);

      // Get updated account to return new expiry
      const updatedAccount = await prisma.oAuthAccount.findFirst({
        where: {
          userId,
          provider,
          providerAccountId: accountId,
        },
      });

      return Response.json(
        successResponse(
          {
            success: true,
            message: 'Token refreshed successfully',
            provider,
            accountId,
            expiresAt: updatedAccount?.expiresAt?.toISOString(),
          },
          { startTime }
        )
      );
    } catch (error: any) {
      console.error('[Integrations Refresh Error]', error);
      
      if (error.code === 'ACCOUNT_NOT_FOUND') {
        return notFound(
          `Integration for ${params.provider}`,
          { startTime }
        );
      }
      
      if (error.code === 'NO_REFRESH_TOKEN') {
        return badRequest(
          'This integration does not support token refresh',
          { provider: params.provider },
          { startTime }
        );
      }
      
      if (error.code === 'TOKEN_REFRESH_ERROR') {
        return Response.json(
          errorResponse(
            'TOKEN_REFRESH_FAILED',
            'Failed to refresh token. Please reconnect your account.',
            { provider: params.provider },
            { startTime }
          ),
          { status: 422 }
        );
      }
      
      return internalServerError(
        error.message || 'Failed to refresh token',
        { startTime }
      );
    }
  })
);
